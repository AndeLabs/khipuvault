import { ethers } from 'ethers'
import { prisma } from '@khipu/database'
import { BaseEventListener } from './base'
import { getBlockTimestamp } from '../provider'
import { retryWithBackoff } from '../utils/retry'

const INDIVIDUAL_POOL_ABI = [
  'event Deposited(address indexed user, uint256 amount, uint256 timestamp)',
  'event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)',
  'event YieldClaimed(address indexed user, uint256 amount, uint256 timestamp)',
  'event YieldDistributed(uint256 amount, uint256 timestamp)',
]

export class IndividualPoolListener extends BaseEventListener {
  constructor(contractAddress: string) {
    super(contractAddress, INDIVIDUAL_POOL_ABI)
  }

  protected setupEventListeners(): void {
    // Listen to Deposited events
    this.contract.on('Deposited', async (user, amount, timestamp, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing Deposited event:', error)
      }
    })

    // Listen to Withdrawn events
    this.contract.on('Withdrawn', async (user, amount, timestamp, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing Withdrawn event:', error)
      }
    })

    // Listen to YieldClaimed events
    this.contract.on('YieldClaimed', async (user, amount, timestamp, event) => {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: [...event.topics],
          data: event.data,
        })
        if (parsedLog) {
          await this.processEvent(event, parsedLog)
        }
      } catch (error) {
        console.error('❌ Error processing YieldClaimed event:', error)
      }
    })

    // Listen to YieldDistributed events
    this.contract.on('YieldDistributed', async (amount, timestamp, event) => {
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

    console.log('✅ Individual Pool event listeners active')
  }

  protected async indexHistoricalEvents(fromBlock: number): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber()
    const batchSize = 10000 // Process in batches to avoid RPC limits

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
        case 'Deposited':
          await this.handleDeposited(event, parsedLog, blockTimestamp)
          break
        case 'Withdrawn':
          await this.handleWithdrawn(event, parsedLog, blockTimestamp)
          break
        case 'YieldClaimed':
          await this.handleYieldClaimed(event, parsedLog, blockTimestamp)
          break
        case 'YieldDistributed':
          await this.handleYieldDistributed(event, parsedLog, blockTimestamp)
          break
      }
    } catch (error) {
      console.error(`❌ Error processing ${eventName}:`, error)
    }
  }

  private async handleDeposited(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase()
    const amount = parsedLog.args.amount.toString()

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { address: userAddress },
      update: { lastActiveAt: new Date() },
      create: { address: userAddress },
    })

    // Create deposit record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        userAddress,
        poolAddress: event.address.toLowerCase(),
        poolType: 'INDIVIDUAL',
        amount,
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
        eventName: 'Deposited',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          user: userAddress,
          amount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`💰 Deposited: ${amount} by ${userAddress}`)
  }

  private async handleWithdrawn(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase()
    const amount = parsedLog.args.amount.toString()

    // Update user activity
    const user = await prisma.user.update({
      where: { address: userAddress },
      data: { lastActiveAt: new Date() },
    })

    // Create withdrawal record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        userAddress,
        poolAddress: event.address.toLowerCase(),
        poolType: 'INDIVIDUAL',
        amount,
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
        eventName: 'Withdrawn',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          user: userAddress,
          amount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`💸 Withdrawn: ${amount} by ${userAddress}`)
  }

  private async handleYieldClaimed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const userAddress = parsedLog.args.user.toLowerCase()
    const amount = parsedLog.args.amount.toString()

    // Update user activity
    const user = await prisma.user.update({
      where: { address: userAddress },
      data: { lastActiveAt: new Date() },
    })

    // Create yield claim record
    await prisma.deposit.create({
      data: {
        userId: user.id,
        userAddress,
        poolAddress: event.address.toLowerCase(),
        poolType: 'INDIVIDUAL',
        amount,
        type: 'YIELD_CLAIM',
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
        eventName: 'YieldClaimed',
        contractAddress: event.address.toLowerCase(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        logIndex: event.index,
        transactionIndex: event.transactionIndex,
        args: JSON.stringify({
          user: userAddress,
          amount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`🌾 Yield Claimed: ${amount} by ${userAddress}`)
  }

  private async handleYieldDistributed(
    event: ethers.Log,
    parsedLog: ethers.LogDescription,
    blockTimestamp: number
  ): Promise<void> {
    const amount = parsedLog.args.amount.toString()

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
          amount,
        }),
        timestamp: new Date(blockTimestamp * 1000),
      },
    })

    console.log(`📊 Yield Distributed: ${amount}`)
  }
}
