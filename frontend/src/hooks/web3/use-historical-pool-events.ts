/**
 * @fileoverview Historical event scanning hook for Cooperative Pool
 * @module hooks/web3/use-historical-pool-events
 *
 * This hook complements useCooperativePoolEvents by scanning historical events
 * that occurred before the page was loaded.
 *
 * PROBLEM IT SOLVES:
 * - useWatchContractEvent only detects NEW events (from page load onwards)
 * - Users miss pools created by others while their page was open
 * - No way to see historical pools without full page reload
 *
 * SOLUTION:
 * - On mount: Scan historical PoolCreated events using publicClient.getContractEvents
 * - Intelligent caching: Only scan new blocks since last scan (via BlockTracker)
 * - Batch processing: Handles large block ranges efficiently
 * - Progress updates: Real-time UI feedback during scanning
 * - Error recovery: Automatic retries with exponential backoff
 *
 * ARCHITECTURE:
 * 1. BlockTracker: Manages block ranges and caching
 * 2. EventProcessor: Fetches and processes events with retry logic
 * 3. React Hook: Orchestrates scanning and integrates with TanStack Query
 *
 * @example
 * ```tsx
 * function CooperativeSavingsPage() {
 *   // Scan historical events on mount
 *   const { isScanning, progress, error } = useHistoricalPoolEvents()
 *
 *   // Listen for new events in real-time
 *   useCooperativePoolEvents()
 *
 *   // Now you have COMPLETE coverage: historical + real-time!
 * }
 * ```
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { MEZO_TESTNET_ADDRESSES } from '@/lib/web3/contracts'
import { COOPERATIVE_POOL_ABI } from '@/lib/web3/cooperative-pool-abi'
import { BlockTracker, estimateScanTime, formatBlockRange } from '@/lib/blockchain/block-tracking'
import { EventProcessor } from '@/lib/blockchain/event-processing'

/**
 * Hook state
 */
export interface HistoricalEventsState {
  /** Whether currently scanning for historical events */
  isScanning: boolean
  /** Scan progress (0-100) */
  progress: number
  /** Current status message */
  statusMessage: string
  /** Error if scan failed */
  error: string | null
  /** Number of events found */
  eventsFound: number
  /** Whether initial scan is complete */
  isInitialized: boolean
  /** Manually trigger a rescan */
  rescan: () => Promise<void>
}

/**
 * Configuration for historical event scanning
 */
export interface HistoricalEventsConfig {
  /** Enable historical scanning (default: true) */
  enabled: boolean
  /** Scan on component mount (default: true) */
  scanOnMount: boolean
  /** Maximum age for cached data in milliseconds (default: 1 hour) */
  maxCacheAge: number
  /** Enable verbose logging (default: false) */
  verbose: boolean
  /** Contract deployment block (default: auto-detect or use cached) */
  deploymentBlock?: bigint
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: HistoricalEventsConfig = {
  enabled: true,
  scanOnMount: true,
  maxCacheAge: 60 * 60 * 1000, // 1 hour
  verbose: true, // Enable in development
}

/**
 * Hook to scan historical Cooperative Pool events
 *
 * Features:
 * ✅ Automatic scanning on mount
 * ✅ Intelligent caching (only scans new blocks)
 * ✅ Progress tracking for UI feedback
 * ✅ Error handling with automatic retries
 * ✅ Integration with TanStack Query
 * ✅ Manual rescan capability
 * ✅ Prevents duplicate scans (ref-based locking)
 *
 * @param config - Optional configuration
 * @returns Hook state with scanning status and controls
 */
export function useHistoricalPoolEvents(
  config: Partial<HistoricalEventsConfig> = {}
): HistoricalEventsState {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  const poolAddress = MEZO_TESTNET_ADDRESSES.cooperativePool as `0x${string}`

  // State
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [eventsFound, setEventsFound] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs to prevent duplicate scans
  const isScanningRef = useRef(false)
  const hasScannedRef = useRef(false)

  /**
   * Main scanning function
   */
  const scanHistoricalEvents = async (force: boolean = false) => {
    // Guard: Check if already scanning
    if (isScanningRef.current) {
      log('⚠️ Scan already in progress, skipping...')
      return
    }

    // Guard: Check if already scanned (unless forced)
    if (hasScannedRef.current && !force) {
      log('ℹ️ Already scanned this session, skipping...')
      return
    }

    // Guard: Check if publicClient available
    if (!publicClient) {
      log('⚠️ PublicClient not available yet, skipping scan')
      return
    }

    // Guard: Check if enabled
    if (!fullConfig.enabled) {
      log('ℹ️ Historical scanning disabled in config')
      return
    }

    // Lock scanning
    isScanningRef.current = true
    setIsScanning(true)
    setProgress(0)
    setError(null)
    setStatusMessage('Initializing historical scan...')

    try {
      log('🚀 Starting historical event scan')

      // Step 1: Initialize BlockTracker
      setProgress(5)
      setStatusMessage('Initializing block tracker...')

      const blockTracker = new BlockTracker(
        'cooperative-pool',
        poolAddress,
        {
          // CooperativePool V3 Proxy deployed on Nov 12, 2024
          // Address: 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88
          // We use a reasonable starting block to avoid scanning the entire chain
          // The system will automatically cache and only scan new blocks
          deploymentBlock: fullConfig.deploymentBlock || 1000000n,
          enableCache: true,
        }
      )

      // Check if we need to scan
      const needsScan = force || blockTracker.needsFullScan(fullConfig.maxCacheAge)
      if (!needsScan && !force) {
        log('✅ Cache is fresh, no scan needed')
        setProgress(100)
        setStatusMessage('Cache is up to date')
        hasScannedRef.current = true
        setIsInitialized(true)
        return
      }

      // Step 2: Calculate block ranges to scan
      setProgress(10)
      setStatusMessage('Calculating block ranges...')

      const blockRanges = await blockTracker.calculateBlockRanges(publicClient)

      if (blockRanges.length === 0) {
        log('✅ No new blocks to scan')
        setProgress(100)
        setStatusMessage('Already up to date')
        hasScannedRef.current = true
        setIsInitialized(true)
        return
      }

      const totalBlocks = blockRanges.reduce(
        (sum, [from, to]) => sum + (to - from),
        0n
      )
      const estimatedTime = estimateScanTime(totalBlocks)

      log(`📊 Scanning ${blockRanges.length} ranges, ${totalBlocks} blocks (~${estimatedTime}s)`)
      setStatusMessage(
        `Scanning ${blockRanges.length} block ranges (${totalBlocks} blocks, ~${estimatedTime}s)`
      )

      // Step 3: Create EventProcessor
      setProgress(15)

      const eventProcessor = new EventProcessor(
        publicClient,
        poolAddress,
        COOPERATIVE_POOL_ABI,
        {
          maxRetries: 3,
          enableDeduplication: true,
          verbose: fullConfig.verbose,
        }
      )

      // Step 4: Process events with progress updates
      setStatusMessage('Scanning for PoolCreated events...')

      const events = await eventProcessor.processBatchedEvents(
        'PoolCreated',
        blockRanges,
        (progressPercent, message) => {
          // Map processing progress to 15-90% range
          const mappedProgress = 15 + (progressPercent / 100) * 75
          setProgress(Math.round(mappedProgress))
          setStatusMessage(message)
        }
      )

      setEventsFound(events.length)
      log(`✅ Found ${events.length} historical PoolCreated events`)

      // Step 5: Update block tracker
      setProgress(95)
      setStatusMessage('Updating cache...')

      if (blockRanges.length > 0) {
        const lastRange = blockRanges[blockRanges.length - 1]
        blockTracker.updateLastScannedBlock(lastRange[1])
      }

      // Step 6: Invalidate queries to trigger refetch with new data
      setProgress(98)
      setStatusMessage('Refreshing pool data...')

      // Invalidate pool counter first (this will trigger all-pools refetch)
      await queryClient.invalidateQueries({
        queryKey: ['cooperative-pool', 'counter'],
      })

      // Invalidate all pool-related queries
      await queryClient.invalidateQueries({
        queryKey: ['cooperative-pool'],
      })

      // Refetch only active queries
      await queryClient.refetchQueries({
        type: 'active',
      })

      // Step 7: Complete
      setProgress(100)
      setStatusMessage(`Successfully scanned ${events.length} historical events`)
      hasScannedRef.current = true
      setIsInitialized(true)

      log('✅ Historical scan complete')
      log(`📈 Stats: ${JSON.stringify(eventProcessor.getStats(), null, 2)}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      log(`❌ Historical scan failed: ${errorMessage}`)
      setError(errorMessage)
      setStatusMessage('Scan failed')
      setProgress(0)
    } finally {
      // Release lock
      isScanningRef.current = false
      setIsScanning(false)
    }
  }

  /**
   * Manual rescan function
   */
  const rescan = async () => {
    hasScannedRef.current = false
    await scanHistoricalEvents(true)
  }

  /**
   * Auto-scan on mount
   */
  useEffect(() => {
    if (fullConfig.scanOnMount && publicClient && !hasScannedRef.current) {
      // Small delay to let page settle
      const timer = setTimeout(() => {
        scanHistoricalEvents(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [publicClient, fullConfig.scanOnMount])

  /**
   * Conditional logging
   */
  const log = (message: string) => {
    if (fullConfig.verbose) {
      console.log(`[useHistoricalPoolEvents] ${message}`)
    }
  }

  return {
    isScanning,
    progress,
    statusMessage,
    error,
    eventsFound,
    isInitialized,
    rescan,
  }
}

/**
 * Export block tracker for advanced use cases
 */
export { BlockTracker } from '@/lib/blockchain/block-tracking'
