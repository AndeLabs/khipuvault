'use client'

import { useAccount, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { MEZO_TESTNET_ADDRESSES, INDIVIDUAL_POOL_ABI } from '@/lib/web3/contracts'
import { formatMUSD } from './use-individual-pool'

export interface Transaction {
  hash: string
  type: 'Depósito' | 'Retiro' | 'Reclamo Yield'
  amount: string
  timestamp: number
  status: 'Confirmado' | 'Pendiente' | 'Fallido'
  blockNumber: bigint
}

/**
 * Hook to fetch user's transaction history from blockchain events
 */
export function useUserTransactions() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const poolAddress = MEZO_TESTNET_ADDRESSES.individualPool as `0x${string}`

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setTransactions([])
      setIsLoading(false)
      return
    }

    async function fetchTransactions() {
      try {
        setIsLoading(true)

        // Get current block number
        const currentBlock = await publicClient!.getBlockNumber()
        
        // Mezo RPC has a limit of 10,000 blocks per query
        // We'll use a reasonable lookback window (7 days)
        const BLOCK_QUERY_LIMIT = 9000 // Safe margin from 10,000 limit
        const lookbackBlocks = BigInt(BLOCK_QUERY_LIMIT)
        const fromBlock = currentBlock > lookbackBlocks 
          ? currentBlock - lookbackBlocks 
          : BigInt(0)

        console.log(`📊 Fetching transactions from block ${fromBlock} to ${currentBlock}`)

        // Helper function to fetch logs with proper error handling
        const fetchLogs = async (eventName: string, eventInputs: any[]) => {
          try {
            return await publicClient!.getLogs({
              address: poolAddress,
              event: {
                type: 'event',
                name: eventName,
                inputs: eventInputs,
              },
              args: {
                user: address,
              },
              fromBlock,
              toBlock: 'latest',
            })
          } catch (error: any) {
            console.warn(`⚠️ Error fetching ${eventName} logs:`, error.message)
            return []
          }
        }

        // Fetch Deposit events (MUSD-only)
        const depositLogs = await fetchLogs('Deposited', [
          { type: 'address', name: 'user', indexed: true },
          { type: 'uint256', name: 'musdAmount', indexed: false },
          { type: 'uint256', name: 'timestamp', indexed: false },
        ])

        // Fetch Withdrawal events (MUSD-only)
        const withdrawalLogs = await fetchLogs('Withdrawn', [
          { type: 'address', name: 'user', indexed: true },
          { type: 'uint256', name: 'musdAmount', indexed: false },
          { type: 'uint256', name: 'yieldAmount', indexed: false },
        ])

        // Fetch YieldClaimed events
        const yieldLogs = await fetchLogs('YieldClaimed', [
          { type: 'address', name: 'user', indexed: true },
          { type: 'uint256', name: 'yieldAmount', indexed: false },
          { type: 'uint256', name: 'feeAmount', indexed: false },
        ])

        // Convert logs to transactions
        const allTransactions: Transaction[] = []

        // Cache for blocks to reduce RPC calls
        const blockCache = new Map<bigint, any>()

        const getBlockTimestamp = async (blockNumber: bigint) => {
          if (blockCache.has(blockNumber)) {
            return blockCache.get(blockNumber).timestamp
          }
          try {
            const block = await publicClient!.getBlock({ blockNumber })
            blockCache.set(blockNumber, block)
            return block.timestamp
          } catch (error) {
            console.warn(`⚠️ Error fetching block ${blockNumber}:`, error)
            return BigInt(0)
          }
        }

        // Process deposits (MUSD-only)
        console.log(`✅ Found ${depositLogs.length} deposit events`)
        for (const log of depositLogs) {
          try {
            const args = log.args as any
            const timestamp = await getBlockTimestamp(log.blockNumber)
            allTransactions.push({
              hash: log.transactionHash || '0x',
              type: 'Depósito',
              amount: `${formatMUSD(args.musdAmount)} MUSD`,
              timestamp: Number(timestamp),
              status: 'Confirmado',
              blockNumber: log.blockNumber,
            })
          } catch (error) {
            console.warn('Error processing deposit log:', error)
          }
        }

        // Process withdrawals (MUSD-only)
        console.log(`✅ Found ${withdrawalLogs.length} withdrawal events`)
        for (const log of withdrawalLogs) {
          try {
            const args = log.args as any
            const timestamp = await getBlockTimestamp(log.blockNumber)
            const totalAmount = BigInt(args.musdAmount) + BigInt(args.yieldAmount)
            allTransactions.push({
              hash: log.transactionHash || '0x',
              type: 'Retiro',
              amount: `${formatMUSD(totalAmount)} MUSD (${formatMUSD(args.musdAmount)} + ${formatMUSD(args.yieldAmount)} yield)`,
              timestamp: Number(timestamp),
              status: 'Confirmado',
              blockNumber: log.blockNumber,
            })
          } catch (error) {
            console.warn('Error processing withdrawal log:', error)
          }
        }

        // Process yield claims (MUSD-only)
        console.log(`✅ Found ${yieldLogs.length} yield claim events`)
        for (const log of yieldLogs) {
          try {
            const args = log.args as any
            const timestamp = await getBlockTimestamp(log.blockNumber)
            const netYield = BigInt(args.yieldAmount) - BigInt(args.feeAmount)
            allTransactions.push({
              hash: log.transactionHash || '0x',
              type: 'Reclamo Yield',
              amount: `${formatMUSD(netYield)} MUSD (${formatMUSD(args.yieldAmount)} - ${formatMUSD(args.feeAmount)} fee)`,
              timestamp: Number(timestamp),
              status: 'Confirmado',
              blockNumber: log.blockNumber,
            })
          } catch (error) {
            console.warn('Error processing yield log:', error)
          }
        }

        // Sort by block number (most recent first)
        allTransactions.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))

        console.log(`✅ Total transactions fetched: ${allTransactions.length}`)
        setTransactions(allTransactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [address, isConnected, publicClient, poolAddress])

  return {
    transactions,
    isLoading,
  }
}

/**
 * Format timestamp to readable date
 */
export function formatTransactionDate(timestamp: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Shorten transaction hash for display
 */
export function shortenTxHash(hash: string): string {
  if (!hash || hash === '0x') return '-'
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

/**
 * Get Mezo testnet block explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  // Mezo testnet explorer (update with actual URL when available)
  return `https://explorer.test.mezo.org/tx/${txHash}`
}
