/**
 * @fileoverview Hooks for Lottery Pool (Prize Pool) interactions
 * @module hooks/web3/use-lottery-pool
 * 
 * Production-ready hooks for Prize Pool where users never lose capital
 * Yield-based lottery system on Mezo Testnet
 */

'use client'

import { useAccount, usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { LOTTERY_POOL_ABI } from '@/lib/web3/lottery-pool-abi'
import { parseEther, formatEther } from 'viem'

// Types matching SimpleLotteryPool contract
export interface LotteryRound {
  roundId: bigint
  ticketPrice: bigint
  maxTickets: bigint
  totalTicketsSold: bigint
  totalPrize: bigint
  startTime: bigint
  endTime: bigint
  winner: string
  status: number // 0=OPEN, 1=COMPLETED, 2=CANCELLED
}

export interface UserLotteryStats {
  totalInvested: bigint
  roundsPlayed: number
  totalTickets: number
  totalWinnings: bigint
}

// SimpleLotteryPool deployed on Mezo Testnet
const LOTTERY_POOL_ADDRESS = '0x3e5d272321e28731844c20e0a0c725a97301f83a' as `0x${string}`

/**
 * Hook to get current round
 */
export function useCurrentRound() {
  const { data: currentRoundId } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'currentRoundId',
  })

  const { data: roundInfo, isLoading, refetch } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'getRoundInfo',
    args: currentRoundId ? [currentRoundId] : undefined,
  })

  return {
    currentRoundId: currentRoundId as bigint | undefined,
    roundInfo: roundInfo as LotteryRound | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get all rounds
 */
export function useAllRounds() {
  const publicClient = usePublicClient()
  const [rounds, setRounds] = useState<LotteryRound[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: roundCounter } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'roundCounter',
  })

  useEffect(() => {
    if (!publicClient || !roundCounter) {
      setIsLoading(false)
      return
    }

    async function fetchRounds() {
      try {
        setIsLoading(true)
        const roundsData: LotteryRound[] = []
        const count = Number(roundCounter)

        for (let i = 1; i <= count; i++) {
          try {
            const roundInfo = await publicClient!.readContract({
              address: LOTTERY_POOL_ADDRESS,
              abi: LOTTERY_POOL_ABI,
              functionName: 'getRoundInfo',
              args: [BigInt(i)],
            }) as LotteryRound

            roundsData.push(roundInfo)
          } catch (error) {
            console.warn(`Failed to fetch round ${i}:`, error)
          }
        }

        setRounds(roundsData)
      } catch (error) {
        console.error('Error fetching rounds:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRounds()
  }, [publicClient, roundCounter])

  return { rounds, isLoading, roundCounter: Number(roundCounter || 0) }
}

/**
 * Hook to get user tickets for a round
 */
export function useUserTickets(roundId?: number, userAddress?: `0x${string}`) {
  const { address } = useAccount()
  const targetAddress = userAddress || address

  const { data: tickets, isLoading, refetch } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'getUserTickets',
    args: roundId && targetAddress ? [BigInt(roundId), targetAddress] : undefined,
  })

  // Mock return array of ticket IDs for now
  const ticketArray = tickets ? Array.from({ length: Number(tickets) }, (_, i) => i + 1) : []

  return {
    tickets: ticketArray,
    ticketCount: tickets as bigint | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get user investment for a round
 */
export function useUserInvestment(roundId?: number) {
  const { address } = useAccount()

  const { data: investment, isLoading, refetch } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'getUserInvestment',
    args: roundId && address ? [BigInt(roundId), address] : undefined,
  })

  return {
    investment: investment as bigint | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to calculate user probability
 */
export function useUserProbability(roundId?: number) {
  const { address } = useAccount()

  const { data: probability, isLoading, refetch } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'calculateUserProbability',
    args: roundId && address ? [BigInt(roundId), address] : undefined,
  })

  return {
    probability: probability as bigint | undefined, // Returns basis points (10000 = 100%)
    isLoading,
    refetch,
  }
}

/**
 * Hook to buy tickets
 */
export function useBuyTickets() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buyTickets = async (roundId: number, ticketCount: number, ticketPrice: bigint) => {
    try {
      const totalCost = ticketPrice * BigInt(ticketCount)

      writeContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: 'buyTickets',
        args: [BigInt(roundId), BigInt(ticketCount)],
        value: totalCost, // BTC is native on Mezo
      })
    } catch (err) {
      console.error('Error buying tickets:', err)
      throw err
    }
  }

  return {
    buyTickets,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook to claim prize
 */
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimPrize = async (roundId: number) => {
    try {
      writeContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: 'claimPrize',
        args: [BigInt(roundId)],
      })
    } catch (err) {
      console.error('Error claiming prize:', err)
      throw err
    }
  }

  return {
    claimPrize,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Hook to withdraw capital (for non-winners)
 */
export function useWithdrawCapital() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawCapital = async (roundId: number) => {
    try {
      writeContract({
        address: LOTTERY_POOL_ADDRESS,
        abi: LOTTERY_POOL_ABI,
        functionName: 'withdrawCapital',
        args: [BigInt(roundId)],
      })
    } catch (err) {
      console.error('Error withdrawing capital:', err)
      throw err
    }
  }

  return {
    withdrawCapital,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  }
}

/**
 * Helper: Format BTC amount
 */
export function formatBTC(amount: bigint): string {
  return formatEther(amount)
}

/**
 * Helper: Get lottery type text
 */
export function getLotteryTypeText(type: number): string {
  switch (type) {
    case 0:
      return 'Semanal'
    case 1:
      return 'Mensual'
    case 2:
      return 'Personalizado'
    default:
      return 'Desconocido'
  }
}

/**
 * Helper: Get status text
 */
export function getStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Abierto'
    case 1:
      return 'Sorteando'
    case 2:
      return 'Completado'
    case 3:
      return 'Cancelado'
    default:
      return 'Desconocido'
  }
}

/**
 * Helper: Get status color
 */
export function getStatusColor(status: number): string {
  switch (status) {
    case 0:
      return 'green'
    case 1:
      return 'yellow'
    case 2:
      return 'blue'
    case 3:
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Helper: Calculate time remaining
 */
export function getTimeRemaining(endTime: bigint): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = Math.floor(Date.now() / 1000)
  const end = Number(endTime)
  const total = Math.max(0, end - now)

  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/**
 * Helper: Format probability as percentage
 */
export function formatProbability(basisPoints: bigint): string {
  // Basis points: 10000 = 100%
  const percentage = (Number(basisPoints) / 100).toFixed(2)
  return `${percentage}%`
}

/**
 * Hook to check if lottery pool is deployed
 */
export function useLotteryPoolDeployed(): boolean {
  return LOTTERY_POOL_ADDRESS !== '0x0000000000000000000000000000000000000000'
}

/**
 * Helper: Format USD amount
 */
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
}

/**
 * Helper: Format Ethereum address
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Helper: Get round status text (SimpleLotteryPool enum)
 */
export function getRoundStatus(status: number): string {
  switch (status) {
    case 0:
      return 'Activo' // OPEN
    case 1:
      return 'Completado' // COMPLETED
    case 2:
      return 'Cancelado' // CANCELLED
    default:
      return 'Desconocido'
  }
}

/**
 * Hook to get user lottery statistics across all rounds
 */
export function useUserLotteryStats(userAddress?: `0x${string}`) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const targetAddress = userAddress || address
  
  const [stats, setStats] = useState<UserLotteryStats>({
    totalInvested: 0n,
    roundsPlayed: 0,
    totalTickets: 0,
    totalWinnings: 0n,
  })
  const [isLoading, setIsLoading] = useState(true)

  const { data: roundCounter } = useReadContract({
    address: LOTTERY_POOL_ADDRESS,
    abi: LOTTERY_POOL_ABI,
    functionName: 'roundCounter',
  })

  useEffect(() => {
    if (!publicClient || !roundCounter || !targetAddress) {
      setIsLoading(false)
      return
    }

    async function fetchUserStats() {
      try {
        setIsLoading(true)
        let totalInvested = 0n
        let roundsPlayed = 0
        let totalTickets = 0
        let totalWinnings = 0n

        const count = Number(roundCounter)

        for (let i = 1; i <= count; i++) {
          try {
            // Get user investment for this round
            const investment = await publicClient!.readContract({
              address: LOTTERY_POOL_ADDRESS,
              abi: LOTTERY_POOL_ABI,
              functionName: 'getUserInvestment',
              args: [BigInt(i), targetAddress],
            }) as bigint

            if (investment > 0n) {
              totalInvested += investment
              roundsPlayed++

              // Get user tickets
              const ticketCount = await publicClient!.readContract({
                address: LOTTERY_POOL_ADDRESS,
                abi: LOTTERY_POOL_ABI,
                functionName: 'getUserTickets',
                args: [BigInt(i), targetAddress],
              }) as bigint

              totalTickets += Number(ticketCount || 0n)

              // Check if user won this round
              const roundInfo = await publicClient!.readContract({
                address: LOTTERY_POOL_ADDRESS,
                abi: LOTTERY_POOL_ABI,
                functionName: 'getRoundInfo',
                args: [BigInt(i)],
              }) as LotteryRound

              if (roundInfo.winner.toLowerCase() === targetAddress.toLowerCase()) {
                totalWinnings += roundInfo.winnerPrize
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch user stats for round ${i}:`, error)
          }
        }

        setStats({
          totalInvested,
          roundsPlayed,
          totalTickets,
          totalWinnings,
        })
      } catch (error) {
        console.error('Error fetching user lottery stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStats()
  }, [publicClient, roundCounter, targetAddress])

  return { stats, isLoading }
}
