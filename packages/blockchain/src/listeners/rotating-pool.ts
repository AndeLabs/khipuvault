import { ethers } from "ethers";
import { prisma, PrismaClient, Prisma } from "@khipu/database";
import { BaseEventListener } from "./base";
import { getBlockTimestampCached } from "../provider";
import { retryWithBackoff, isRetryableError } from "../utils/retry";

// Transaction client type for Prisma transactions
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Type guard for Prisma errors
function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5;
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000;

// RotatingPool Event Signatures - Matches RotatingPool.sol
const ROTATING_POOL_ABI = [
  "event PoolCreated(uint256 indexed poolId, address indexed creator, string name, uint256 memberCount, uint256 contributionAmount, uint256 periodDuration)",
  "event PoolStarted(uint256 indexed poolId, uint256 startTime)",
  "event MemberJoined(uint256 indexed poolId, address indexed member, uint256 memberIndex)",
  "event ContributionMade(uint256 indexed poolId, address indexed member, uint256 periodNumber, uint256 amount)",
  "event PayoutDistributed(uint256 indexed poolId, uint256 periodNumber, address indexed recipient, uint256 payoutAmount, uint256 yieldAmount)",
  "event PeriodAdvanced(uint256 indexed poolId, uint256 newPeriod)",
  "event PeriodCompleted(uint256 indexed poolId, uint256 period, uint256 totalContributions, uint256 yieldGenerated)",
  "event PoolCompleted(uint256 indexed poolId, uint256 totalYieldDistributed)",
  "event PoolCancelled(uint256 indexed poolId, string reason)",
  "event RefundClaimed(uint256 indexed poolId, address indexed member, uint256 amount)",
];

export class RotatingPoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, ROTATING_POOL_ABI);
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
            if (isPrismaError(err) && err.code === "P2002") {
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
    // Listen to PoolCreated events
    this.contract.on("PoolCreated", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PoolCreated", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PoolCreated event:", error);
      }
    });

    // Listen to PoolStarted events
    this.contract.on("PoolStarted", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PoolStarted", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PoolStarted event:", error);
      }
    });

    // Listen to MemberJoined events
    this.contract.on("MemberJoined", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("MemberJoined", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing MemberJoined event:", error);
      }
    });

    // Listen to ContributionMade events
    this.contract.on("ContributionMade", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("ContributionMade", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing ContributionMade event:", error);
      }
    });

    // Listen to PayoutDistributed events
    this.contract.on("PayoutDistributed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PayoutDistributed", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PayoutDistributed event:", error);
      }
    });

    // Listen to PeriodAdvanced events
    this.contract.on("PeriodAdvanced", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PeriodAdvanced", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PeriodAdvanced event:", error);
      }
    });

    // Listen to PeriodCompleted events
    this.contract.on("PeriodCompleted", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PeriodCompleted", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PeriodCompleted event:", error);
      }
    });

    // Listen to PoolCompleted events
    this.contract.on("PoolCompleted", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PoolCompleted", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PoolCompleted event:", error);
      }
    });

    // Listen to PoolCancelled events
    this.contract.on("PoolCancelled", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PoolCancelled", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PoolCancelled event:", error);
      }
    });

    // Listen to RefundClaimed events
    this.contract.on("RefundClaimed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("RefundClaimed", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing RefundClaimed event:", error);
      }
    });

    console.log("✅ Rotating Pool (ROSCA) event listeners active");
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = 5000; // Smaller batches for reliability
    let processedEvents = 0;
    let failedEvents = 0;

    console.log(`📚 Indexing historical events from block ${fromBlock} to ${currentBlock}`);

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
      `🎉 Historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`
    );
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name;
    // Use cached timestamp for batch operations to reduce RPC calls
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber);

    try {
      switch (eventName) {
        case "PoolCreated":
          await this.handlePoolCreated(event, parsedLog, blockTimestamp);
          break;
        case "PoolStarted":
          await this.handlePoolStarted(event, parsedLog, blockTimestamp);
          break;
        case "MemberJoined":
          await this.handleMemberJoined(event, parsedLog, blockTimestamp);
          break;
        case "ContributionMade":
          await this.handleContributionMade(event, parsedLog, blockTimestamp);
          break;
        case "PayoutDistributed":
          await this.handlePayoutDistributed(event, parsedLog, blockTimestamp);
          break;
        case "PeriodAdvanced":
          await this.handlePeriodAdvanced(event, parsedLog, blockTimestamp);
          break;
        case "PeriodCompleted":
          await this.handlePeriodCompleted(event, parsedLog, blockTimestamp);
          break;
        case "PoolCompleted":
          await this.handlePoolCompleted(event, parsedLog, blockTimestamp);
          break;
        case "PoolCancelled":
          await this.handlePoolCancelled(event, parsedLog, blockTimestamp);
          break;
        case "RefundClaimed":
          await this.handleRefundClaimed(event, parsedLog, blockTimestamp);
          break;
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error);
    }
  }

  private async handlePoolCreated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const creator = parsedLog.args.creator.toLowerCase();
    const name = parsedLog.args.name;
    const memberCount = parsedLog.args.memberCount.toString();
    const contributionAmount = parsedLog.args.contributionAmount.toString();
    const periodDuration = parsedLog.args.periodDuration.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure creator user exists
      await tx.user.upsert({
        where: { address: creator },
        update: { lastActiveAt: new Date() },
        create: { address: creator },
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
          eventName: "PoolCreated",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            poolId,
            creator,
            name,
            memberCount,
            contributionAmount,
            periodDuration,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🔄 ROSCA Created: ${name} (ID: ${poolId}) by ${creator} - ${memberCount} members, ${contributionAmount} BTC/period`
    );
  }

  private async handlePoolStarted(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const startTime = parsedLog.args.startTime.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: "PoolStarted",
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          startTime,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    });

    console.log(
      `🚀 ROSCA Started: Pool ${poolId} at ${new Date(Number(startTime) * 1000).toISOString()}`
    );
  }

  private async handleMemberJoined(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const member = parsedLog.args.member.toLowerCase();
    const memberIndex = parsedLog.args.memberIndex.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists
      await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
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
          eventName: "MemberJoined",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            poolId,
            member,
            memberIndex,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `👥 ROSCA Member Joined: ${member} joined pool ${poolId} as member #${memberIndex}`
    );
  }

  private async handleContributionMade(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const member = parsedLog.args.member.toLowerCase();
    const periodNumber = parsedLog.args.periodNumber.toString();
    const amount = parsedLog.args.amount.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
      });

      // Upsert deposit record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress: member,
          poolAddress: event.address.toLowerCase(),
          poolType: "ROTATING",
          poolId: poolId,
          amount: amount,
          type: "DEPOSIT",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { periodNumber },
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
          eventName: "ContributionMade",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            poolId,
            member,
            periodNumber,
            amount,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `💰 ROSCA Contribution: ${member} contributed ${amount} BTC to pool ${poolId} for period ${periodNumber}`
    );
  }

  private async handlePayoutDistributed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const periodNumber = parsedLog.args.periodNumber.toString();
    const recipient = parsedLog.args.recipient.toLowerCase();
    const payoutAmount = parsedLog.args.payoutAmount.toString();
    const yieldAmount = parsedLog.args.yieldAmount.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: recipient },
        update: { lastActiveAt: new Date() },
        create: { address: recipient },
      });

      // Upsert payout record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress: recipient,
          poolAddress: event.address.toLowerCase(),
          poolType: "ROTATING",
          poolId: poolId,
          amount: payoutAmount,
          type: "WITHDRAW",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { periodNumber, yieldAmount },
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
          eventName: "PayoutDistributed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            poolId,
            periodNumber,
            recipient,
            payoutAmount,
            yieldAmount,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `🎁 ROSCA Payout: ${recipient} received ${payoutAmount} BTC (+${yieldAmount} yield) from pool ${poolId} period ${periodNumber}`
    );
  }

  private async handlePeriodAdvanced(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const newPeriod = parsedLog.args.newPeriod.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: "PeriodAdvanced",
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          newPeriod,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    });

    console.log(`⏭️ ROSCA Period Advanced: Pool ${poolId} moved to period ${newPeriod}`);
  }

  private async handlePeriodCompleted(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const period = parsedLog.args.period.toString();
    const totalContributions = parsedLog.args.totalContributions.toString();
    const yieldGenerated = parsedLog.args.yieldGenerated.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: "PeriodCompleted",
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          period,
          totalContributions,
          yieldGenerated,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    });

    console.log(
      `✅ ROSCA Period Completed: Pool ${poolId} period ${period} - ${totalContributions} BTC collected, ${yieldGenerated} yield`
    );
  }

  private async handlePoolCompleted(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const totalYieldDistributed = parsedLog.args.totalYieldDistributed.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: "PoolCompleted",
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          totalYieldDistributed,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    });

    console.log(
      `🎉 ROSCA Completed: Pool ${poolId} finished with ${totalYieldDistributed} total yield distributed`
    );
  }

  private async handlePoolCancelled(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const reason = parsedLog.args.reason;
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: "PoolCancelled",
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          reason,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    });

    console.log(`❌ ROSCA Cancelled: Pool ${poolId} cancelled - ${reason}`);
  }

  private async handleRefundClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString();
    const member = parsedLog.args.member.toLowerCase();
    const amount = parsedLog.args.amount.toString();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
      });

      // Upsert refund record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: "CONFIRMED",
        },
        create: {
          userId: user.id,
          userAddress: member,
          poolAddress: event.address.toLowerCase(),
          poolType: "ROTATING",
          poolId: poolId,
          amount: amount,
          type: "WITHDRAW",
          status: "CONFIRMED",
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { reason: "Pool cancelled" },
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
          eventName: "RefundClaimed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            poolId,
            member,
            amount,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(
      `💸 ROSCA Refund Claimed: ${member} claimed ${amount} BTC refund from pool ${poolId}`
    );
  }
}
