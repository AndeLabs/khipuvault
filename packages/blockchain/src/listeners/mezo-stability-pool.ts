import { ethers } from "ethers";

import { prisma, PrismaClientKnownRequestError, TransactionClient } from "@khipu/database";

import { BaseEventListener } from "./base";
import { getBlockTimestampCached } from "../provider";
import { retryWithBackoff, isRetryableError } from "../utils/retry";

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5;
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000;

// Mezo StabilityPool Event Signatures
const STABILITY_POOL_ABI = [
  "event UserDepositChanged(address indexed depositor, uint256 newDeposit)",
  "event CollateralGainWithdrawn(address indexed depositor, uint256 collateral, uint256 MUSDLoss)",
  "event StabilityPoolMUSDBalanceUpdated(uint256 newBalance)",
];

export class MezoStabilityPoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, STABILITY_POOL_ABI);
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
    console.log("✅ Mezo StabilityPool using polling mode");
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = 5000; // Smaller batches for reliability
    let processedEvents = 0;
    let failedEvents = 0;

    console.log(`📚 Indexing StabilityPool events from block ${fromBlock} to ${currentBlock}`);

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
      `🎉 StabilityPool historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`
    );
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name;
    // Use cached timestamp for batch operations to reduce RPC calls
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber);

    try {
      switch (eventName) {
        case "UserDepositChanged":
          await this.handleUserDepositChanged(event, parsedLog, blockTimestamp);
          break;
        case "CollateralGainWithdrawn":
          await this.handleCollateralGainWithdrawn(event, parsedLog, blockTimestamp);
          break;
        case "StabilityPoolMUSDBalanceUpdated":
          await this.handleStabilityPoolMUSDBalanceUpdated(event, parsedLog, blockTimestamp);
          break;
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error);
      throw error; // Re-throw for retry logic
    }
  }

  private async handleUserDepositChanged(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const depositorAddress = parsedLog.args.depositor.toLowerCase();
    const newDeposit = parsedLog.args.newDeposit.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Get or create stability deposit record
      const existingDeposit = await tx.mezoStabilityDeposit.findUnique({
        where: { userAddress: depositorAddress },
      });

      const isIncrease =
        !existingDeposit || BigInt(newDeposit) > BigInt(existingDeposit.compoundedDeposit);
      const transactionType = isIncrease ? "STABILITY_DEPOSIT" : "STABILITY_WITHDRAW";

      // Calculate deposit change
      const previousDeposit = existingDeposit?.compoundedDeposit || "0";
      const depositChange = (BigInt(newDeposit) - BigInt(previousDeposit)).toString();

      // Upsert stability deposit record
      const deposit = await tx.mezoStabilityDeposit.upsert({
        where: { userAddress: depositorAddress },
        update: {
          compoundedDeposit: newDeposit,
          totalDeposited: isIncrease
            ? (BigInt(existingDeposit?.totalDeposited || "0") + BigInt(depositChange)).toString()
            : existingDeposit?.totalDeposited,
          totalWithdrawn: !isIncrease
            ? (
                BigInt(existingDeposit?.totalWithdrawn || "0") + BigInt(-BigInt(depositChange))
              ).toString()
            : existingDeposit?.totalWithdrawn,
          depositCount: isIncrease
            ? (existingDeposit?.depositCount || 0) + 1
            : existingDeposit?.depositCount,
          withdrawCount: !isIncrease
            ? (existingDeposit?.withdrawCount || 0) + 1
            : existingDeposit?.withdrawCount,
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
        },
        create: {
          userAddress: depositorAddress,
          initialDeposit: newDeposit,
          compoundedDeposit: newDeposit,
          totalDeposited: newDeposit,
          totalWithdrawn: "0",
          depositCount: 1,
          withdrawCount: 0,
          firstDepositBlock: event.blockNumber,
          firstDepositAt: new Date(blockTimestamp * 1000),
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
          userAddress: depositorAddress,
          type: transactionType,
          debtChange: depositChange,
          stabilityDepositId: deposit.id,
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          status: "CONFIRMED",
          metadata: {
            newDeposit,
            previousDeposit,
            depositChange,
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
          eventName: "UserDepositChanged",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            depositor: depositorAddress,
            newDeposit,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`💰 UserDepositChanged: ${depositorAddress} - New Deposit: ${newDeposit} MUSD`);
  }

  private async handleCollateralGainWithdrawn(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const depositorAddress = parsedLog.args.depositor.toLowerCase();
    const collateral = parsedLog.args.collateral.toString();
    const musdLoss = parsedLog.args.MUSDLoss.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Get existing deposit to calculate updated total
      const existingDeposit = await tx.mezoStabilityDeposit.findUnique({
        where: { userAddress: depositorAddress },
      });

      // Update stability deposit record
      const deposit = await tx.mezoStabilityDeposit.upsert({
        where: { userAddress: depositorAddress },
        update: {
          totalBtcClaimed: (
            BigInt(existingDeposit?.totalBtcClaimed || "0") + BigInt(collateral)
          ).toString(),
          lastUpdateBlock: event.blockNumber,
          lastUpdateAt: new Date(blockTimestamp * 1000),
        },
        create: {
          userAddress: depositorAddress,
          initialDeposit: "0",
          compoundedDeposit: "0",
          totalDeposited: "0",
          totalWithdrawn: "0",
          totalBtcClaimed: collateral,
          depositCount: 0,
          withdrawCount: 0,
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
          userAddress: depositorAddress,
          type: "CLAIM_REWARDS",
          collateralChange: collateral,
          debtChange: musdLoss ? `-${musdLoss}` : null,
          stabilityDepositId: deposit.id,
          txHash,
          blockNumber: event.blockNumber,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          status: "CONFIRMED",
          metadata: {
            btcGain: collateral,
            musdLoss,
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
          eventName: "CollateralGainWithdrawn",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            depositor: depositorAddress,
            collateral,
            musdLoss,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🎁 CollateralGainWithdrawn: ${depositorAddress} - BTC: ${collateral}, MUSD Loss: ${musdLoss}`
    );
  }

  private async handleStabilityPoolMUSDBalanceUpdated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const newBalance = parsedLog.args.newBalance.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Update or create system stats with new stability pool balance
      await tx.mezoSystemStats.upsert({
        where: { blockNumber: event.blockNumber },
        update: {
          totalSpDeposits: newBalance,
          timestamp: new Date(blockTimestamp * 1000),
        },
        create: {
          totalSpDeposits: newBalance,
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
          eventName: "StabilityPoolMUSDBalanceUpdated",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            newBalance,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`📊 StabilityPool Balance Updated: ${newBalance} MUSD`);
  }
}
