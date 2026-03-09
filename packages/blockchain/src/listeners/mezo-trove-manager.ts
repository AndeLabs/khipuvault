import { ethers } from "ethers";

import { prisma, PrismaClientKnownRequestError, TransactionClient } from "@khipu/database";

import { BaseEventListener } from "./base";
import { getBlockTimestampCached } from "../provider";
import { retryWithBackoff, isRetryableError } from "../utils/retry";

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5;
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000;

// Mezo TroveManager Event Signatures
const TROVE_MANAGER_ABI = [
  "event TroveUpdated(address indexed owner, uint256 debt, uint256 coll, uint256 stake, uint8 operation)",
  "event TroveLiquidated(address indexed owner, uint256 debt, uint256 coll, uint256 collGasCompensation, uint256 musdGasCompensation)",
  "event Redemption(uint256 attemptedMUSDAmount, uint256 actualMUSDAmount, uint256 BTCSent, uint256 BTCFee)",
];

// TroveManager Operation enum
enum TroveOperation {
  OPEN = 0,
  CLOSE = 1,
  ADJUST = 2,
}

export class MezoTroveManagerListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, TROVE_MANAGER_ABI);
  }

  /**
   * Wrap event processing with retry logic and error handling
   */
  private async processEventWithRetry(
    eventName: string,
    event: ethers.Log,
    parsedLog: ethers.LogDescription
  ): Promise<void> {
    try {
      await retryWithBackoff(
        async () => this.processEvent(event, parsedLog),
        MAX_EVENT_RETRIES,
        INITIAL_RETRY_DELAY,
        {
          shouldRetry: (err) => {
            // Don't retry if it's a duplicate key error - that's expected for idempotency
            if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
              console.log(
                `⏭️ Skipping duplicate ${eventName} event: ${event.transactionHash}:${event.index}`
              );
              return false;
            }
            return isRetryableError(err);
          },
          onRetry: (err, attempt) => {
            console.warn(`🔄 Retrying ${eventName} event (attempt ${attempt}): ${err.message}`);
          },
        }
      );
    } catch (error) {
      // After all retries failed, log to dead letter queue
      console.error(`❌ Failed to process ${eventName} after ${MAX_EVENT_RETRIES} retries:`, error);
      await this.logFailedEvent(eventName, event, error);
    }
  }

  /**
   * Log failed events to database for later manual processing
   */
  private async logFailedEvent(
    eventName: string,
    event: ethers.Log,
    error: unknown
  ): Promise<void> {
    try {
      await prisma.eventLog.upsert({
        where: {
          txHash_logIndex: {
            txHash: event.transactionHash,
            logIndex: event.index,
          },
        },
        update: {
          processed: false,
          args: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: new Date().toISOString(),
          }),
        },
        create: {
          eventName: `FAILED_${eventName}`,
          contractAddress: event.address.toLowerCase(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex: event.index,
          transactionIndex: event.transactionIndex,
          processed: false,
          args: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: new Date().toISOString(),
          }),
          timestamp: new Date(),
        },
      });
    } catch (logError) {
      console.error("❌ Failed to log failed event:", logError);
    }
  }

  protected setupEventListeners(): void {
    // DEPRECATED: Filter-based listeners replaced by polling in base class
    // Polling mode (eth_getLogs) is more reliable with Mezo RPC
    console.log("✅ Mezo TroveManager using polling mode");
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = 5000; // Smaller batches for reliability
    let processedEvents = 0;
    let failedEvents = 0;

    console.log(`📚 Indexing TroveManager events from block ${fromBlock} to ${currentBlock}`);

    for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += batchSize) {
      const endBlock = Math.min(startBlock + batchSize - 1, currentBlock);

      try {
        // Retry fetching events with backoff
        const events = await retryWithBackoff(
          async () => this.contract.queryFilter("*", startBlock, endBlock),
          MAX_EVENT_RETRIES,
          INITIAL_RETRY_DELAY
        );

        // Process each event individually with retry
        for (const event of events) {
          try {
            const parsedLog = this.contract.interface.parseLog({
              topics: [...event.topics],
              data: event.data,
            });

            if (parsedLog) {
              await this.processEventWithRetry(parsedLog.name, event, parsedLog);
              processedEvents++;
            }
          } catch (eventError) {
            failedEvents++;
            console.error(`❌ Failed to process event in block ${event.blockNumber}:`, eventError);
          }
        }

        console.log(
          `✅ Indexed blocks ${startBlock}-${endBlock} (${events.length} events, ${processedEvents} processed, ${failedEvents} failed)`
        );
      } catch (error) {
        console.error(`❌ Error fetching events for blocks ${startBlock}-${endBlock}:`, error);
        // Continue with next batch instead of failing completely
      }
    }

    console.log(
      `🎉 TroveManager historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`
    );
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name;
    // Use cached timestamp for batch operations to reduce RPC calls
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber);

    try {
      switch (eventName) {
        case "TroveUpdated":
          await this.handleTroveUpdated(event, parsedLog, blockTimestamp);
          break;
        case "TroveLiquidated":
          await this.handleTroveLiquidated(event, parsedLog, blockTimestamp);
          break;
        case "Redemption":
          await this.handleRedemption(event, parsedLog, blockTimestamp);
          break;
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error);
      throw error; // Re-throw for retry logic
    }
  }

  private async handleTroveUpdated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const ownerAddress = parsedLog.args.owner.toLowerCase();
    const debt = parsedLog.args.debt.toString();
    const coll = parsedLog.args.coll.toString();
    const stake = parsedLog.args.stake.toString();
    const operation = parsedLog.args.operation as number;
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Calculate collateral ratio if debt > 0
    let collateralRatio: number | null = null;
    if (BigInt(debt) > 0n && BigInt(coll) > 0n) {
      // CR = (coll / debt) * 100
      collateralRatio = Number((BigInt(coll) * 10000n) / BigInt(debt)) / 100;
    }

    // Determine trove status and transaction type
    let troveStatus: string;
    let transactionType: string;

    if (operation === TroveOperation.OPEN) {
      troveStatus = "ACTIVE";
      transactionType = "OPEN_TROVE";
    } else if (operation === TroveOperation.CLOSE) {
      troveStatus = "CLOSED_BY_OWNER";
      transactionType = "CLOSE_TROVE";
    } else {
      troveStatus = "ACTIVE";
      transactionType = "ADJUST_TROVE";
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Upsert trove record
      const trove = await tx.mezoTrove.upsert({
        where: { ownerAddress },
        update: {
          status: troveStatus as any,
          collateral: coll,
          debt,
          stake,
          collateralRatio: collateralRatio,
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
          ...(operation === TroveOperation.OPEN && {
            openedTxHash: txHash,
            openedBlock: event.blockNumber,
            openedAt: new Date(blockTimestamp * 1000),
          }),
          ...(operation === TroveOperation.CLOSE && {
            closedTxHash: txHash,
            closedBlock: event.blockNumber,
            closedAt: new Date(blockTimestamp * 1000),
          }),
        },
        create: {
          ownerAddress,
          status: troveStatus as any,
          collateral: coll,
          debt,
          stake,
          collateralRatio: collateralRatio,
          openedTxHash: operation === TroveOperation.OPEN ? txHash : undefined,
          openedBlock: operation === TroveOperation.OPEN ? event.blockNumber : undefined,
          openedAt: operation === TroveOperation.OPEN ? new Date(blockTimestamp * 1000) : undefined,
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
        },
      });

      // Create transaction record
      await tx.mezoTransaction.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userAddress: ownerAddress,
          type: transactionType as any,
          collateralChange: coll,
          debtChange: debt,
          troveId: trove.id,
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          status: "CONFIRMED",
          metadata: {
            operation,
            stake,
          },
        },
      });

      // Create snapshot for historical tracking
      await tx.mezoTroveSnapshot.create({
        data: {
          troveId: trove.id,
          collateral: coll,
          debt,
          collateralRatio: collateralRatio,
          btcPrice: "0", // TODO: Fetch from price feed if available
          eventType: "TroveUpdated",
          txHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(blockTimestamp * 1000),
        },
      });

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: "TroveUpdated",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            owner: ownerAddress,
            debt,
            coll,
            stake,
            operation,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    const operationName =
      operation === TroveOperation.OPEN
        ? "OPEN"
        : operation === TroveOperation.CLOSE
          ? "CLOSE"
          : "ADJUST";
    console.log(
      `🏦 TroveUpdated: ${ownerAddress} ${operationName} - Debt: ${debt}, Coll: ${coll}, CR: ${collateralRatio?.toFixed(2)}%`
    );
  }

  private async handleTroveLiquidated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const ownerAddress = parsedLog.args.owner.toLowerCase();
    const debt = parsedLog.args.debt.toString();
    const coll = parsedLog.args.coll.toString();
    const collGasCompensation = parsedLog.args.collGasCompensation.toString();
    const musdGasCompensation = parsedLog.args.musdGasCompensation.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Update trove status to liquidated
      const trove = await tx.mezoTrove.upsert({
        where: { ownerAddress },
        update: {
          status: "CLOSED_BY_LIQUIDATION",
          collateral: "0",
          debt: "0",
          stake: "0",
          collateralRatio: null,
          closedTxHash: txHash,
          closedBlock: event.blockNumber,
          closedAt: new Date(blockTimestamp * 1000),
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
        },
        create: {
          ownerAddress,
          status: "CLOSED_BY_LIQUIDATION",
          collateral: "0",
          debt: "0",
          stake: "0",
          closedTxHash: txHash,
          closedBlock: event.blockNumber,
          closedAt: new Date(blockTimestamp * 1000),
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
        },
      });

      // Create liquidation record
      await tx.mezoLiquidation.upsert({
        where: { txHash },
        update: {},
        create: {
          liquidatedAddress: ownerAddress,
          liquidatedDebt: debt,
          liquidatedColl: coll,
          collGasCompensation,
          musdGasCompensation,
          btcPrice: "0", // TODO: Fetch from price feed if available
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
        },
      });

      // Create transaction record
      await tx.mezoTransaction.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userAddress: ownerAddress,
          type: "LIQUIDATION",
          collateralChange: `-${coll}`,
          debtChange: `-${debt}`,
          troveId: trove.id,
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          status: "CONFIRMED",
          metadata: {
            collGasCompensation,
            musdGasCompensation,
          },
        },
      });

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: "TroveLiquidated",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            owner: ownerAddress,
            debt,
            coll,
            collGasCompensation,
            musdGasCompensation,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `⚡ TroveLiquidated: ${ownerAddress} - Debt: ${debt}, Coll: ${coll}, Gas Comp: ${collGasCompensation}`
    );
  }

  private async handleRedemption(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const attemptedMUSDAmount = parsedLog.args.attemptedMUSDAmount.toString();
    const actualMUSDAmount = parsedLog.args.actualMUSDAmount.toString();
    const btcSent = parsedLog.args.BTCSent.toString();
    const btcFee = parsedLog.args.BTCFee.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Get transaction to identify the redeemer
    const tx = await this.provider.getTransaction(txHash);
    const redeemerAddress = tx?.from.toLowerCase() || "0x0000000000000000000000000000000000000000";

    // Use transaction for atomicity
    await prisma.$transaction(async (prismaClient) => {
      // Create transaction record for redemption
      await prismaClient.mezoTransaction.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userAddress: redeemerAddress,
          type: "REDEMPTION",
          collateralChange: btcSent,
          debtChange: `-${actualMUSDAmount}`,
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          status: "CONFIRMED",
          metadata: {
            attemptedMUSDAmount,
            actualMUSDAmount,
            btcSent,
            btcFee,
          },
        },
      });

      // Upsert event log for idempotency
      await prismaClient.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: "Redemption",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            attemptedMUSDAmount,
            actualMUSDAmount,
            btcSent,
            btcFee,
            redeemer: redeemerAddress,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `💱 Redemption: ${redeemerAddress} - Redeemed ${actualMUSDAmount} MUSD for ${btcSent} BTC (fee: ${btcFee})`
    );
  }
}
