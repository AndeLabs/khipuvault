import { ethers } from 'ethers'
import { prisma } from '@khipu/database'
import { BaseEventListener } from './base'
import { getBlockTimestamp } from '../provider'
import { retryWithBackoff } from '../utils/retry'

const COOPERATIVE_POOL_ABI = [
  'event PoolCreated(uint256 indexed poolId, address indexed creator, string name, uint256 targetAmount, uint256 deadline)',
  'event MemberJoined(uint256 indexed poolId, address indexed member, uint256 contribution)',
  'event MemberLeft(uint256 indexed poolId, address indexed member, uint256 refundAmount)',
  'event PoolActivated(uint256 indexed poolId, uint256 totalAmount)',
  'event YieldDistributed(uint256 indexed poolId, uint256 totalYield, uint256 timestamp)',
]

export class CooperativePoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, COOPERATIVE_POOL_ABI)
  }

  protected setupEventListeners(): void {
    this.contract.on('PoolCreated', async (poolId, creator, name, targetAmount, deadline, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing PoolCreated event:', error)
      }
    })

    this.contract.on('MemberJoined', async (poolId, member, contribution, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing MemberJoined event:', error)
      }
    })

    this.contract.on('MemberLeft', async (poolId, member, refundAmount, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing MemberLeft event:', error)
      }
    })

    this.contract.on('PoolActivated', async (poolId, totalAmount, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing PoolActivated event:', error)
      }
    })

    this.contract.on('YieldDistributed', async (poolId, totalYield, timestamp, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing YieldDistributed event:', error)
      }
    })

    console.log('✅ Cooperative Pool event listeners active')
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber()
    const batchSize = 10000

    console.log(`📚 Indexing historical events from block ${fromBlock} to ${currentBlock}`)

    for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += batchSize) {
      const endBlock = Math.min(startBlock + batchSize - 1, currentBlock)

      try {
        await retryWithBackoff(async () => {
          const events = await this.contract.queryFilter('*', startBlock, endBlock)

          for (const event of events) {
            const parsedLog = this.contract.interface.parseLog({
              topics: [...event.topics],
              data: event.data,
            })

            if (parsedLog) {
              await this.processEvent(event, parsedLog)
            }
          }
        })

        console.log(`✅ Indexed blocks ${startBlock} to ${endBlock}`)
      } catch (error) {
        console.error(`❌ Error indexing blocks ${startBlock} to ${endBlock}:`, error)
      }
    }

    console.log('🎉 Historical indexing complete')
  }

  protected async processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void> {
    const eventName = parsedLog.name
    const blockTimestamp = await getBlockTimestamp(event.blockNumber)

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
        case 'PoolActivated':
          await this.handlePoolActivated(event, parsedLog, blockTimestamp)
          break
        case 'YieldDistributed':
          await this.handleYieldDistributed(event, parsedLog, blockTimestamp)
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
    const targetAmount = parsedLog.args.targetAmount.toString()
    const deadline = parsedLog.args.deadline.toString()

    // Log event
    await prisma.eventLog.create({
      data: {
        eventName: 'PoolCreated',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          poolId,
          creator,
          name,
          targetAmount,
          deadline,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
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
    const contribution = parsedLog.args.contribution.toString()

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { address: member },
      update: { lastActiveAt: new Date() },
      create: { address: member },
    })

    // Create deposit record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        userAddress: member,
        poolAddress: event.address.toLowerCase(),
        poolType: 'COOPERATIVE',
        poolId: poolId,
        amount: contribution,
        type: 'DEPOSIT',
        status: 'CONFIRMED',
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    // Log event
    await prisma.eventLog.create({
      data: {
        eventName: 'MemberJoined',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          poolId,
          member,
          contribution,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`👥 Member Joined: ${member} contributed ${contribution} to pool ${poolId}`)
  }

  private async handleMemberLeft(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const member = parsedLog.args.member.toLowerCase()
    const refundAmount = parsedLog.args.refundAmount.toString()

    // Update user activity
    const user = await prisma.user.update({
      where: { address: member },
      data: { lastActiveAt: new Date() },
    })

    // Create withdrawal record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        userAddress: member,
        poolAddress: event.address.toLowerCase(),
        poolType: 'COOPERATIVE',
        poolId: poolId,
        amount: refundAmount,
        type: 'WITHDRAW',
        status: 'CONFIRMED',
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    // Log event
    await prisma.eventLog.create({
      data: {
        eventName: 'MemberLeft',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          poolId,
          member,
          refundAmount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`🚪 Member Left: ${member} left pool ${poolId} with refund ${refundAmount}`)
  }

  private async handlePoolActivated(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const totalAmount = parsedLog.args.totalAmount.toString()

    // Log event
    await prisma.eventLog.create({
      data: {
        eventName: 'PoolActivated',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          poolId,
          totalAmount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`✅ Pool Activated: Pool ${poolId} with total amount ${totalAmount}`)
  }

  private async handleYieldDistributed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const poolId = parsedLog.args.poolId.toString()
    const totalYield = parsedLog.args.totalYield.toString()

    // Log event
    await prisma.eventLog.create({
      data: {
        eventName: 'YieldDistributed',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          poolId,
          totalYield,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`📊 Yield Distributed: ${totalYield} to pool ${poolId}`)
  }
}
