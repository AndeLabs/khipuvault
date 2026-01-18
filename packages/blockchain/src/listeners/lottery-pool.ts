import { ethers } from "ethers";
import { prisma, Prisma } from "@khipu/database";
import { BaseEventListener } from "./base";
import { getBlockTimestampCached } from "../provider";
import { retryWithBackoff, isRetryableError } from "../utils/retry";

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5;
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000;

// LotteryPoolV3 Event Signatures
const LOTTERY_POOL_ABI = [
  "event RoundCreated(uint256 indexed roundId, uint256 ticketPrice, uint256 maxTickets, uint256 endTime)",
  "event TicketsPurchased(uint256 indexed roundId, address indexed participant, uint256 ticketCount, uint256 musdAmount, uint256 firstTicket, uint256 lastTicket)",
  "event CommitSubmitted(uint256 indexed roundId, bytes32 commitment)",
  "event SeedRevealed(uint256 indexed roundId, uint256 seed)",
  "event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket)",
  "event PrizeClaimed(uint256 indexed roundId, address indexed participant, uint256 amount, bool isWinner)",
  "event RoundCancelled(uint256 indexed roundId, string reason)",
  "event OperatorUpdated(address indexed oldOperator, address indexed newOperator)",
];

// Map on-chain status to DB enum
const STATUS_MAP = {
  0: "OPEN",
  1: "COMMIT",
  2: "REVEAL",
  3: "COMPLETED",
  4: "CANCELLED",
} as const;

export class LotteryPoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, LOTTERY_POOL_ABI);
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
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
    // Listen to RoundCreated events
    this.contract.on("RoundCreated", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("RoundCreated", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing RoundCreated event:", error);
      }
    });

    // Listen to TicketsPurchased events
    this.contract.on("TicketsPurchased", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("TicketsPurchased", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing TicketsPurchased event:", error);
      }
    });

    // Listen to WinnerSelected events
    this.contract.on("WinnerSelected", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("WinnerSelected", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing WinnerSelected event:", error);
      }
    });

    // Listen to PrizeClaimed events
    this.contract.on("PrizeClaimed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("PrizeClaimed", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing PrizeClaimed event:", error);
      }
    });

    // Listen to RoundCancelled events
    this.contract.on("RoundCancelled", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("RoundCancelled", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing RoundCancelled event:", error);
      }
    });

    // Listen to CommitSubmitted events (for status tracking)
    this.contract.on("CommitSubmitted", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("CommitSubmitted", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing CommitSubmitted event:", error);
      }
    });

    // Listen to SeedRevealed events (for status tracking)
    this.contract.on("SeedRevealed", async (...args) => {
      const event = args[args.length - 1];
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        });
        if (parsedLog) {
          await this.processEventWithRetry("SeedRevealed", event, parsedLog);
        }
      } catch (error) {
        console.error("❌ Error parsing SeedRevealed event:", error);
      }
    });

    console.log("✅ Lottery Pool V3 event listeners active");
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = 5000;
    let processedEvents = 0;
    let failedEvents = 0;

    console.log(
      `📚 Indexing Lottery Pool historical events from block ${fromBlock} to ${currentBlock}`
    );

    for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += batchSize) {
      const endBlock = Math.min(startBlock + batchSize - 1, currentBlock);

      try {
        const events = await retryWithBackoff(
          async () => this.contract.queryFilter("*", startBlock, endBlock),
          MAX_EVENT_RETRIES,
          INITIAL_RETRY_DELAY
        );

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
      }
    }

    console.log(
      `🎉 Lottery Pool historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`
    );
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name;
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber);

    switch (eventName) {
      case "RoundCreated":
        await this.handleRoundCreated(event, parsedLog, blockTimestamp);
        break;
      case "TicketsPurchased":
        await this.handleTicketsPurchased(event, parsedLog, blockTimestamp);
        break;
      case "WinnerSelected":
        await this.handleWinnerSelected(event, parsedLog, blockTimestamp);
        break;
      case "PrizeClaimed":
        await this.handlePrizeClaimed(event, parsedLog, blockTimestamp);
        break;
      case "RoundCancelled":
        await this.handleRoundCancelled(event, parsedLog, blockTimestamp);
        break;
      case "CommitSubmitted":
        await this.handleCommitSubmitted(event, parsedLog, blockTimestamp);
        break;
      case "SeedRevealed":
        await this.handleSeedRevealed(event, parsedLog, blockTimestamp);
        break;
    }
  }

  private async handleRoundCreated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const ticketPrice = parsedLog.args.ticketPrice.toString();
    const maxTickets = Number(parsedLog.args.maxTickets);
    const endTime = Number(parsedLog.args.endTime);
    const poolAddress = event.address.toLowerCase();
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Create or update lottery round
      await tx.lotteryRound.upsert({
        where: { roundId },
        update: {
          status: "OPEN",
        },
        create: {
          roundId,
          poolAddress,
          ticketPrice,
          maxTickets,
          startTime: new Date(blockTimestamp * 1000),
          endTime: new Date(endTime * 1000),
          status: "OPEN",
          createdTxHash: txHash,
          createdBlock: event.blockNumber,
        },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "RoundCreated",
          contractAddress: poolAddress,
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            ticketPrice,
            maxTickets,
            endTime,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`🎰 Round Created: #${roundId} - ${maxTickets} tickets @ ${ticketPrice} MUSD`);
  }

  private async handleTicketsPurchased(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const participant = parsedLog.args.participant.toLowerCase();
    const ticketCount = Number(parsedLog.args.ticketCount);
    const musdAmount = parsedLog.args.musdAmount.toString();
    const firstTicket = Number(parsedLog.args.firstTicket);
    const lastTicket = Number(parsedLog.args.lastTicket);
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      await tx.user.upsert({
        where: { address: participant },
        update: { lastActiveAt: new Date() },
        create: { address: participant },
      });

      // Create or update ticket record
      await tx.lotteryTicket.upsert({
        where: { roundId_userAddress: { roundId, userAddress: participant } },
        update: {
          ticketCount: { increment: ticketCount },
          musdContributed: musdAmount, // Will be cumulative from contract
          lastTicketIndex: lastTicket,
        },
        create: {
          roundId,
          userAddress: participant,
          ticketCount,
          musdContributed: musdAmount,
          firstTicketIndex: firstTicket,
          lastTicketIndex: lastTicket,
          txHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(blockTimestamp * 1000),
        },
      });

      // Update round stats
      await tx.lotteryRound.update({
        where: { roundId },
        data: {
          totalTicketsSold: { increment: ticketCount },
          totalMusd: musdAmount, // Will be cumulative from contract events
        },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "TicketsPurchased",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            participant,
            ticketCount,
            musdAmount,
            firstTicket,
            lastTicket,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`🎟️ Tickets Purchased: ${ticketCount} by ${participant} for round #${roundId}`);
  }

  private async handleWinnerSelected(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const winner = parsedLog.args.winner.toLowerCase();
    const prize = parsedLog.args.prize.toString();
    const winningTicket = Number(parsedLog.args.winningTicket);
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Update round with winner info
      await tx.lotteryRound.update({
        where: { roundId },
        data: {
          status: "COMPLETED",
          winnerAddress: winner,
          winnerPrize: prize,
          winningTicket,
          completedTxHash: txHash,
          completedBlock: event.blockNumber,
        },
      });

      // Mark winner's ticket
      await tx.lotteryTicket.updateMany({
        where: { roundId, userAddress: winner },
        data: { isWinner: true },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "WinnerSelected",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            winner,
            prize,
            winningTicket,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });

      // Create notification for winner
      const winnerUser = await tx.user.findUnique({
        where: { address: winner },
      });
      if (winnerUser) {
        await tx.notification.create({
          data: {
            userId: winnerUser.id,
            type: "lottery_win",
            title: "You Won the Lottery!",
            message: `Congratulations! You won ${prize} MUSD in round #${roundId}`,
            data: { roundId, prize, winningTicket },
          },
        });
      }
    });

    console.log(`🏆 Winner Selected: ${winner} won ${prize} MUSD in round #${roundId}`);
  }

  private async handlePrizeClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const participant = parsedLog.args.participant.toLowerCase();
    const amount = parsedLog.args.amount.toString();
    const isWinner = parsedLog.args.isWinner;
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Update ticket claim status
      await tx.lotteryTicket.updateMany({
        where: { roundId, userAddress: participant },
        data: {
          claimed: true,
          claimedAmount: amount,
        },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "PrizeClaimed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            participant,
            amount,
            isWinner,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`💰 Prize Claimed: ${participant} claimed ${amount} MUSD (winner: ${isWinner})`);
  }

  private async handleRoundCancelled(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const reason = parsedLog.args.reason;
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Update round status
      await tx.lotteryRound.update({
        where: { roundId },
        data: { status: "CANCELLED" },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "RoundCancelled",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({ roundId, reason }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`❌ Round Cancelled: #${roundId} - ${reason}`);
  }

  private async handleCommitSubmitted(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Update round status to COMMIT
      await tx.lotteryRound.update({
        where: { roundId },
        data: { status: "COMMIT" },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "CommitSubmitted",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            commitment: parsedLog.args.commitment,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`🔒 Commit Submitted for round #${roundId}`);
  }

  private async handleSeedRevealed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const roundId = Number(parsedLog.args.roundId);
    const txHash = event.transactionHash;
    const logIndex = event.index;

    await prisma.$transaction(async (tx) => {
      // Update round status to REVEAL
      await tx.lotteryRound.update({
        where: { roundId },
        data: { status: "REVEAL" },
      });

      // Log event
      await tx.eventLog.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        update: { processed: true },
        create: {
          eventName: "SeedRevealed",
          contractAddress: event.address.toLowerCase(),
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          transactionIndex: event.transactionIndex,
          processed: true,
          args: JSON.stringify({
            roundId,
            seed: parsedLog.args.seed.toString(),
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      });
    });

    console.log(`🔓 Seed Revealed for round #${roundId}`);
  }
}
