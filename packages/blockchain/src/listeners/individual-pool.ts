import { ethers } from "ethers";
import { prisma, Prisma } from "@khipu/database";
import { BaseEventListener } from "./base";
import { getBlockTimestamp, getBlockTimestampCached } from "../provider";
import { retryWithBackoff, isRetryableError } from "../utils/retry";

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5;
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000;

// V3 Event Signatures - Updated to match IndividualPoolV3.sol
const INDIVIDUAL_POOL_ABI = [
  "event Deposited(address indexed user, uint256 musdAmount, uint256 totalDeposit, address indexed referrer, uint256 timestamp)",
  "event PartialWithdrawn(address indexed user, uint256 musdAmount, uint256 remainingDeposit, uint256 timestamp)",
  "event FullWithdrawal(address indexed user, uint256 principal, uint256 netYield, uint256 timestamp)",
  "event YieldClaimed(address indexed user, uint256 grossYield, uint256 feeAmount, uint256 netYield, uint256 timestamp)",
  "event AutoCompounded(address indexed user, uint256 amount, uint256 newTotal, uint256 timestamp)",
  "event ReferralRecorded(address indexed user, address indexed referrer, uint256 bonus)",
  "event ReferralRewardsClaimed(address indexed referrer, uint256 amount)",
];

export class IndividualPoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, INDIVIDUAL_POOL_ABI);
  }

  /**
   * Wrap event processing with retry logic and error handling
   */
  private async processEventWithRetry(
    eventName: string,
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
  ): Promise<void> {
    try {
      await retryWithBackoff(
        async () => this.processEvent(event, parsedLog),
        MAX_EVENT_RETRIES,
        INITIAL_RETRY_DELAY,
        {
          shouldRetry: (err) => {
            // Don't retry if it's a duplicate key error - that's expected for idempotency
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              console.log(
                `⏭️ Skipping duplicate ${eventName} event: ${event.transactionHash}:${event.index}`,
              );
              return false;
            }
            return isRetryableError(err);
          },
          onRetry: (err, attempt) => {
            console.warn(
              `🔄 Retrying ${eventName} event (attempt ${attempt}): ${err.message}`,
            );
          },
        },
      );
    } catch (error) {
      // After all retries failed, log to dead letter queue
      console.error(
        `❌ Failed to process ${eventName} after ${MAX_EVENT_RETRIES} retries:`,
        error,
      );
      await this.logFailedEvent(eventName, event, error);
    }
  }

  /**
   * Log failed events to database for later manual processing
   */
  private async logFailedEvent(
    eventName: string,
    event: ethers.Log,
    error: unknown,
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
    // Listen to Deposited events (V3: includes referrer and totalDeposit)
    this.contract.on("Deposited", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("Deposited", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing Deposited event:", error);
      }
    });

    // Listen to PartialWithdrawn events (V3: replaced Withdrawn)
    this.contract.on("PartialWithdrawn", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry(
            "PartialWithdrawn",
            event,
            parsedLog,
          );
        }
      } catch (error) {
        console.error("❌ Error parsing PartialWithdrawn event:", error);
      }
    });

    // Listen to FullWithdrawal events (V3: new event for full withdrawals)
    this.contract.on("FullWithdrawal", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("FullWithdrawal", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing FullWithdrawal event:", error);
      }
    });

    // Listen to YieldClaimed events (V3: includes fee breakdown)
    this.contract.on("YieldClaimed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("YieldClaimed", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing YieldClaimed event:", error);
      }
    });

    // Listen to AutoCompounded events (V3: new feature)
    this.contract.on("AutoCompounded", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("AutoCompounded", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing AutoCompounded event:", error);
      }
    });

    // Listen to ReferralRewardsClaimed events (V3: new feature)
    this.contract.on("ReferralRewardsClaimed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry(
            "ReferralRewardsClaimed",
            event,
            parsedLog,
          );
        }
      } catch (error) {
        console.error("❌ Error parsing ReferralRewardsClaimed event:", error);
      }
    });

    console.log("✅ Individual Pool V3 event listeners active");
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = 5000; // Smaller batches for reliability
    let processedEvents = 0;
    let failedEvents = 0;

    console.log(
      `📚 Indexing historical events from block ${fromBlock} to ${currentBlock}`,
    );

    for (
      let startBlock = fromBlock;
      startBlock <= currentBlock;
      startBlock += batchSize
    ) {
      const endBlock = Math.min(startBlock + batchSize - 1, currentBlock);

      try {
        // Retry fetching events with backoff
        const events = await retryWithBackoff(
          async () => this.contract.queryFilter("*", startBlock, endBlock),
          MAX_EVENT_RETRIES,
          INITIAL_RETRY_DELAY,
        );

        // Process each event individually with retry
        for (const event of events) {
          try {
            const parsedLog = this.contract.interface.parseLog({
              topics: [...event.topics],
              data: event.data,
            });

            if (parsedLog) {
              await this.processEventWithRetry(
                parsedLog.name,
                event,
                parsedLog,
              );
              processedEvents++;
            }
          } catch (eventError) {
            failedEvents++;
            console.error(
              `❌ Failed to process event in block ${event.blockNumber}:`,
              eventError,
            );
          }
        }

        console.log(
          `✅ Indexed blocks ${startBlock}-${endBlock} (${events.length} events, ${processedEvents} processed, ${failedEvents} failed)`,
        );
      } catch (error) {
        console.error(
          `❌ Error fetching events for blocks ${startBlock}-${endBlock}:`,
          error,
        );
        // Continue with next batch instead of failing completely
      }
    }

    console.log(
      `🎉 Historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`,
    );
  }

  protected async processEvent(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
  ): Promise<void> {
    const eventName = parsedLog.name;
    // Use cached timestamp for batch operations to reduce RPC calls
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber);

    try {
      switch (eventName) {
        case "Deposited":
          await this.handleDeposited(event, parsedLog, blockTimestamp);
          break;
        case "PartialWithdrawn":
          await this.handlePartialWithdrawn(event, parsedLog, blockTimestamp);
          break;
        case "FullWithdrawal":
          await this.handleFullWithdrawal(event, parsedLog, blockTimestamp);
          break;
        case "YieldClaimed":
          await this.handleYieldClaimed(event, parsedLog, blockTimestamp);
          break;
        case "AutoCompounded":
          await this.handleAutoCompounded(event, parsedLog, blockTimestamp);
          break;
        case "ReferralRewardsClaimed":
          await this.handleReferralRewardsClaimed(
            event,
            parsedLog,
            blockTimestamp,
          );
          break;
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error);
    }
  }

  private async handleDeposited(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase();
    const amount = parsedLog.args.musdAmount.toString(); // V3: musdAmount instead of amount
    const totalDeposit = parsedLog.args.totalDeposit.toString();
    const referrer = parsedLog.args.referrer?.toLowerCase() || null;
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: userAddress },
        update: { lastActiveAt: new Date() },
        create: { address: userAddress },
      });

      // Upsert deposit record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          // Update only if reprocessing (e.g., after reorg)
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress,
          poolAddress: event.address.toLowerCase(),
          poolType: "INDIVIDUAL",
          amount,
          type: "DEPOSIT",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
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
          eventName: "Deposited",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            user: userAddress,
            musdAmount: amount,
            totalDeposit,
            referrer,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `💰 Deposited: ${amount} MUSD by ${userAddress}${referrer ? ` (referred by ${referrer})` : ""}`,
    );
  }

  private async handlePartialWithdrawn(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase();
    const amount = parsedLog.args.musdAmount.toString(); // V3: musdAmount
    const remainingDeposit = parsedLog.args.remainingDeposit.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: userAddress },
        update: { lastActiveAt: new Date() },
        create: { address: userAddress },
      });

      // Upsert withdrawal record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress,
          poolAddress: event.address.toLowerCase(),
          poolType: "INDIVIDUAL",
          amount,
          type: "WITHDRAW",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
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
          eventName: "PartialWithdrawn",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            user: userAddress,
            musdAmount: amount,
            remainingDeposit,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `💸 Partial Withdraw: ${amount} MUSD by ${userAddress} (remaining: ${remainingDeposit})`,
    );
  }

  private async handleFullWithdrawal(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase();
    const principal = parsedLog.args.principal.toString();
    const netYield = parsedLog.args.netYield.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: userAddress },
        update: { lastActiveAt: new Date() },
        create: { address: userAddress },
      });

      // Store ONLY principal as WITHDRAW - yield is profit, not a withdrawal of deposited funds
      // Balance formula: deposited - withdrawn = remaining principal
      // If we stored principal+yield as WITHDRAW, balance would go negative
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress,
          poolAddress: event.address.toLowerCase(),
          poolType: "INDIVIDUAL",
          amount: principal, // Only principal, NOT principal+yield
          type: "WITHDRAW",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: {
            isFullWithdrawal: true,
            principal,
            netYield, // Track yield separately in metadata for reporting
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
          eventName: "FullWithdrawal",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            user: userAddress,
            principal,
            netYield,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🏦 Full Withdrawal: ${principal} MUSD + ${netYield} yield by ${userAddress}`,
    );
  }

  private async handleYieldClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase();
    const grossYield = parsedLog.args.grossYield.toString(); // V3: grossYield
    const feeAmount = parsedLog.args.feeAmount.toString(); // V3: feeAmount
    const netYield = parsedLog.args.netYield.toString(); // V3: netYield
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: userAddress },
        update: { lastActiveAt: new Date() },
        create: { address: userAddress },
      });

      // Upsert yield claim record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress,
          poolAddress: event.address.toLowerCase(),
          poolType: "INDIVIDUAL",
          amount: netYield,
          type: "YIELD_CLAIM",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: {
            grossYield,
            feeAmount,
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
          eventName: "YieldClaimed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            user: userAddress,
            grossYield,
            feeAmount,
            netYield,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🌾 Yield Claimed: ${netYield} MUSD (gross: ${grossYield}, fee: ${feeAmount}) by ${userAddress}`,
    );
  }

  private async handleAutoCompounded(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase();
    const amount = parsedLog.args.amount.toString();
    const newTotal = parsedLog.args.newTotal.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Ensure user exists and update activity
      await tx.user.upsert({
        where: { address: userAddress },
        update: { lastActiveAt: new Date() },
        create: { address: userAddress },
      });

      // Upsert event log for idempotency
      // Auto-compound doesn't create a new deposit record,
      // it just increases the existing deposit - tracked via event log
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: "AutoCompounded",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            user: userAddress,
            amount,
            newTotal,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🔄 Auto Compounded: ${amount} MUSD for ${userAddress} (new total: ${newTotal})`,
    );
  }

  private async handleReferralRewardsClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number,
  ): Promise<void> {
    const referrerAddress = parsedLog.args.referrer.toLowerCase();
    const amount = parsedLog.args.amount.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: referrerAddress },
        update: { lastActiveAt: new Date() },
        create: { address: referrerAddress },
      });

      // Upsert referral reward claim record for idempotency
      // Use YIELD_CLAIM type as referral rewards are a form of yield earnings
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress: referrerAddress,
          poolAddress: event.address.toLowerCase(),
          poolType: "INDIVIDUAL",
          amount,
          type: "YIELD_CLAIM",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: {
            isReferralReward: true,
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
          eventName: "ReferralRewardsClaimed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            referrer: referrerAddress,
            amount,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🎁 Referral Rewards Claimed: ${amount} MUSD by ${referrerAddress}`,
    );
  }
}
