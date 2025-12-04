import { ethers } from 'ethers'
import { prisma, Prisma } from '@khipu/database'
import { BaseEventListener } from './base'
import { getBlockTimestampCached } from '../provider'
import { retryWithBackoff, isRetryableError } from '../utils/retry'

// Maximum retries for event processing
const MAX_EVENT_RETRIES = 5
// Initial delay for retry backoff (ms)
const INITIAL_RETRY_DELAY = 1000

// V3 Event Signatures - Updated to match CooperativePoolV3.sol
const COOPERATIVE_POOL_ABI = [
  'event PoolCreated(uint256 indexed poolId, address indexed creator, string name, uint256 minContribution, uint256 maxMembers, uint256 timestamp)',
  'event MemberJoined(uint256 indexed poolId, address indexed member, uint256 btcAmount, uint256 shares, uint256 timestamp)',
  'event MemberLeft(uint256 indexed poolId, address indexed member, uint256 btcAmount, uint256 yieldAmount, uint256 timestamp)',
  'event PoolClosed(uint256 indexed poolId, uint256 finalBalance)',
  'event PoolStatusUpdated(uint256 indexed poolId, uint8 newStatus)',
  'event YieldClaimed(uint256 indexed poolId, address indexed member, uint256 grossYield, uint256 feeAmount, uint256 netYield, uint256 timestamp)',
]

export class CooperativePoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, COOPERATIVE_POOL_ABI)
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
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
              console.log(`⏭️ Skipping duplicate ${eventName} event: ${event.transactionHash}:${event.index}`)
              return false
            }
            return isRetryableError(err)
          },
          onRetry: (err, attempt) => {
            console.warn(`🔄 Retrying ${eventName} event (attempt ${attempt}): ${err.message}`)
          },
        }
      )
    } catch (error) {
      // After all retries failed, log to dead letter queue
      console.error(`❌ Failed to process ${eventName} after ${MAX_EVENT_RETRIES} retries:`, error)
      await this.logFailedEvent(eventName, event, error)
    }
  }

  /**
   * Log failed events to database for later manual processing
   */
  private async logFailedEvent(eventName: string, event: ethers.Log, error: unknown): Promise<void> {
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
          }),
          timestamp: new Date(),
        },
      })
    } catch (logError) {
      console.error('❌ Failed to log failed event:', logError)
    }
  }

  protected setupEventListeners(): void {
    // Listen to PoolCreated events (V3: includes minContribution, maxMembers, timestamp)
    this.contract.on('PoolCreated', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('PoolCreated', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing PoolCreated event:', error)
      }
    })

    // Listen to MemberJoined events (V3: btcAmount, shares, timestamp)
    this.contract.on('MemberJoined', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('MemberJoined', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing MemberJoined event:', error)
      }
    })

    // Listen to MemberLeft events (V3: btcAmount, yieldAmount, timestamp)
    this.contract.on('MemberLeft', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('MemberLeft', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing MemberLeft event:', error)
      }
    })

    // Listen to PoolClosed events (V3: finalBalance)
    this.contract.on('PoolClosed', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('PoolClosed', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing PoolClosed event:', error)
      }
    })

    // Listen to PoolStatusUpdated events (V3: newStatus)
    this.contract.on('PoolStatusUpdated', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('PoolStatusUpdated', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing PoolStatusUpdated event:', error)
      }
    })

    // Listen to YieldClaimed events (V3: grossYield, feeAmount, netYield, timestamp)
    this.contract.on('YieldClaimed', async (...args) => {
      const event = args[args.length - 1]
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEventWithRetry('YieldClaimed', event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error parsing YieldClaimed event:', error)
      }
    })

    console.log('✅ Cooperative Pool V3 event listeners active')
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber()
    const batchSize = 5000 // Smaller batches for reliability
    let processedEvents = 0
    let failedEvents = 0

    console.log(`📚 Indexing historical events from block ${fromBlock} to ${currentBlock}`)

    for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += batchSize) {
      const endBlock = Math.min(startBlock + batchSize - 1, currentBlock)

      try {
        // Retry fetching events with backoff
        const events = await retryWithBackoff(
          async () => this.contract.queryFilter('*', startBlock, endBlock),
          MAX_EVENT_RETRIES,
          INITIAL_RETRY_DELAY
        )

        // Process each event individually with retry
        for (const event of events) {
          try {
            const parsedLog = this.contract.interface.parseLog({
              topics: [...event.topics],
              data: event.data,
            })

            if (parsedLog) {
              await this.processEventWithRetry(parsedLog.name, event, parsedLog)
              processedEvents++
            }
          } catch (eventError) {
            failedEvents++
            console.error(`❌ Failed to process event in block ${event.blockNumber}:`, eventError)
          }
        }

        console.log(`✅ Indexed blocks ${startBlock}-${endBlock} (${events.length} events, ${processedEvents} processed, ${failedEvents} failed)`)
      } catch (error) {
        console.error(`❌ Error fetching events for blocks ${startBlock}-${endBlock}:`, error)
        // Continue with next batch instead of failing completely
      }
    }

    console.log(`🎉 Historical indexing complete: ${processedEvents} processed, ${failedEvents} failed`)
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name
    // Use cached timestamp for batch operations to reduce RPC calls
    const blockTimestamp = await getBlockTimestampCached(event.blockNumber)

    try {
      switch (eventName) {
        case 'PoolCreated':
          await this.handlePoolCreated(event, parsedLog, blockTimestamp)
          break
        case 'MemberJoined':
          await this.handleMemberJoined(event, parsedLog, blockTimestamp)
          break
        case 'MemberLeft':
          await this.handleMemberLeft(event, parsedLog, blockTimestamp)
          break
        case 'PoolClosed':
          await this.handlePoolClosed(event, parsedLog, blockTimestamp)
          break
        case 'PoolStatusUpdated':
          await this.handlePoolStatusUpdated(event, parsedLog, blockTimestamp)
          break
        case 'YieldClaimed':
          await this.handleYieldClaimed(event, parsedLog, blockTimestamp)
          break
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error)
    }
  }

  private async handlePoolCreated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const creator = parsedLog.args.creator.toLowerCase()
    const name = parsedLog.args.name
    const minContribution = parsedLog.args.minContribution.toString()
    const maxMembers = parsedLog.args.maxMembers.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Ensure creator user exists
      await tx.user.upsert({
        where: { address: creator },
        update: { lastActiveAt: new Date() },
        create: { address: creator },
      })

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: 'PoolCreated',
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
            minContribution,
            maxMembers,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      })
    })

    console.log(`🏊 Pool Created: ${name} (ID: ${poolId}) by ${creator}`)
  }

  private async handleMemberJoined(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const member = parsedLog.args.member.toLowerCase()
    const btcAmount = parsedLog.args.btcAmount.toString()
    const shares = parsedLog.args.shares.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
      })

      // Upsert deposit record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: 'CONFIRMED',
        },
        create: {
          userId: user.id,
          userAddress: member,
          poolAddress: event.address.toLowerCase(),
          poolType: 'COOPERATIVE',
          poolId: poolId,
          amount: btcAmount,
          type: 'DEPOSIT',
          status: 'CONFIRMED',
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { shares },
        },
      })

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: 'MemberJoined',
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
            btcAmount,
            shares,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      })
    })

    console.log(`👥 Member Joined: ${member} contributed ${btcAmount} BTC (${shares} shares) to pool ${poolId}`)
  }

  private async handleMemberLeft(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const member = parsedLog.args.member.toLowerCase()
    const btcAmount = parsedLog.args.btcAmount.toString()
    const yieldAmount = parsedLog.args.yieldAmount.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
      })

      // Upsert withdrawal record for idempotency (btcAmount is principal only)
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: 'CONFIRMED',
        },
        create: {
          userId: user.id,
          userAddress: member,
          poolAddress: event.address.toLowerCase(),
          poolType: 'COOPERATIVE',
          poolId: poolId,
          amount: btcAmount,
          type: 'WITHDRAW',
          status: 'CONFIRMED',
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { yieldAmount },
        },
      })

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: 'MemberLeft',
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
            btcAmount,
            yieldAmount,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      })
    })

    console.log(`🚪 Member Left: ${member} left pool ${poolId} with ${btcAmount} BTC + ${yieldAmount} yield`)
  }

  private async handlePoolClosed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const finalBalance = parsedLog.args.finalBalance.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: 'PoolClosed',
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          finalBalance,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`🔒 Pool Closed: Pool ${poolId} with final balance ${finalBalance}`)
  }

  private async handlePoolStatusUpdated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const newStatus = parsedLog.args.newStatus.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Upsert event log for idempotency
    await prisma.eventLog.upsert({
      where: {
        txHash_logIndex: { txHash, logIndex },
      },
      update: {
        processed: true,
      },
      create: {
        eventName: 'PoolStatusUpdated',
        contractAddress: event.address.toLowerCase(),
        txHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex,
        transactionIndex: event.transactionIndex,
        processed: true,
        args: JSON.stringify({
          poolId,
          newStatus,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`📊 Pool Status Updated: Pool ${poolId} status changed to ${newStatus}`)
  }

  private async handleYieldClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const member = parsedLog.args.member.toLowerCase()
    const grossYield = parsedLog.args.grossYield.toString()
    const feeAmount = parsedLog.args.feeAmount.toString()
    const netYield = parsedLog.args.netYield.toString()
    const txHash = event.transactionHash
    const logIndex = event.index

    // Use transaction for atomicity - all or nothing
    await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { address: member },
        update: { lastActiveAt: new Date() },
        create: { address: member },
      })

      // Upsert yield claim record for idempotency
      await tx.deposit.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          status: 'CONFIRMED',
        },
        create: {
          userId: user.id,
          userAddress: member,
          poolAddress: event.address.toLowerCase(),
          poolType: 'COOPERATIVE',
          poolId: poolId,
          amount: netYield,
          type: 'YIELD_CLAIM',
          status: 'CONFIRMED',
          txHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          logIndex,
          timestamp: new Date(blockTimestamp * 1000),
          metadata: { grossYield, feeAmount },
        },
      })

      // Upsert event log for idempotency
      await tx.eventLog.upsert({
        where: {
          txHash_logIndex: { txHash, logIndex },
        },
        update: {
          processed: true,
        },
        create: {
          eventName: 'YieldClaimed',
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
            grossYield,
            feeAmount,
            netYield,
          }),
          timestamp: new Date(blockTimestamp * 1000),
        },
      })
    })

    console.log(`🌾 Yield Claimed: ${member} claimed ${netYield} (gross: ${grossYield}, fee: ${feeAmount}) from pool ${poolId}`)
  }
}
