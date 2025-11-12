/**
 * @fileoverview Event processing utilities for historical blockchain events
 * @module lib/blockchain/event-processing
 *
 * Provides robust event fetching, parsing, and processing with:
 * - Batch processing for large event sets
 * - Error handling and retry logic
 * - Event deduplication
 * - Progress tracking
 *
 * @example
 * ```ts
 * const processor = new EventProcessor(publicClient, poolAddress, COOPERATIVE_POOL_ABI)
 * const events = await processor.fetchHistoricalEvents('PoolCreated', [fromBlock, toBlock])
 * ```
 */

import { PublicClient, Log, Abi, Address } from 'viem'
import { formatBlockRange } from './block-tracking'

/**
 * Event fetch result with metadata
 */
export interface EventFetchResult<T = any> {
  events: T[]
  fromBlock: bigint
  toBlock: bigint
  eventCount: number
  fetchTimeMs: number
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  totalEvents: number
  uniqueEvents: number
  duplicatesRemoved: number
  processingTimeMs: number
  blockRangesScanned: number
}

/**
 * Event processor configuration
 */
export interface EventProcessorConfig {
  /** Maximum retry attempts for failed fetches */
  maxRetries: number
  /** Retry delay in milliseconds */
  retryDelayMs: number
  /** Enable event deduplication */
  enableDeduplication: boolean
  /** Log verbose output */
  verbose: boolean
}

/**
 * Default event processor configuration
 */
export const DEFAULT_EVENT_CONFIG: EventProcessorConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  enableDeduplication: true,
  verbose: false,
}

/**
 * EventProcessor - Robust historical event fetching and processing
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Batch processing for large ranges
 * - Event deduplication by transaction hash + log index
 * - Progress callbacks for UI updates
 * - Comprehensive error handling
 */
export class EventProcessor {
  private readonly publicClient: PublicClient
  private readonly contractAddress: Address
  private readonly abi: Abi
  private readonly config: EventProcessorConfig
  private stats: ProcessingStats

  constructor(
    publicClient: PublicClient,
    contractAddress: Address,
    abi: Abi,
    config: Partial<EventProcessorConfig> = {}
  ) {
    this.publicClient = publicClient
    this.contractAddress = contractAddress
    this.abi = abi
    this.config = { ...DEFAULT_EVENT_CONFIG, ...config }
    this.stats = this.resetStats()
  }

  /**
   * Reset processing statistics
   */
  private resetStats(): ProcessingStats {
    return {
      totalEvents: 0,
      uniqueEvents: 0,
      duplicatesRemoved: 0,
      processingTimeMs: 0,
      blockRangesScanned: 0,
    }
  }

  /**
   * Fetch historical events for a specific event name
   *
   * @param eventName - Name of the event to fetch (e.g., 'PoolCreated')
   * @param blockRange - Tuple of [fromBlock, toBlock]
   * @param onProgress - Optional callback for progress updates
   * @returns Event fetch result with parsed events
   */
  async fetchHistoricalEvents<T = any>(
    eventName: string,
    blockRange: [bigint, bigint],
    onProgress?: (progress: number, message: string) => void
  ): Promise<EventFetchResult<T>> {
    const [fromBlock, toBlock] = blockRange
    const startTime = Date.now()

    this.log(`📡 Fetching ${eventName} events: ${formatBlockRange(fromBlock, toBlock)}`)
    onProgress?.(0, `Scanning ${eventName} events...`)

    let lastError: Error | null = null

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const logs = await this.publicClient.getContractEvents({
          address: this.contractAddress,
          abi: this.abi,
          eventName,
          fromBlock,
          toBlock,
        })

        const fetchTimeMs = Date.now() - startTime
        const events = logs as T[]

        this.log(
          `✅ Fetched ${events.length} ${eventName} events in ${fetchTimeMs}ms (attempt ${attempt}/${this.config.maxRetries})`
        )
        onProgress?.(100, `Found ${events.length} ${eventName} events`)

        return {
          events,
          fromBlock,
          toBlock,
          eventCount: events.length,
          fetchTimeMs,
        }
      } catch (error) {
        lastError = error as Error
        this.log(
          `⚠️ Attempt ${attempt}/${this.config.maxRetries} failed: ${lastError.message}`
        )

        if (attempt < this.config.maxRetries) {
          const delayMs = this.config.retryDelayMs * Math.pow(2, attempt - 1)
          this.log(`⏳ Retrying in ${delayMs}ms...`)
          onProgress?.(
            (attempt / this.config.maxRetries) * 50,
            `Retry ${attempt}/${this.config.maxRetries}...`
          )
          await this.sleep(delayMs)
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to fetch ${eventName} events after ${this.config.maxRetries} attempts: ${lastError?.message}`
    )
  }

  /**
   * Fetch multiple event types in parallel
   *
   * @param eventNames - Array of event names to fetch
   * @param blockRange - Tuple of [fromBlock, toBlock]
   * @returns Map of eventName -> events
   */
  async fetchMultipleEvents(
    eventNames: string[],
    blockRange: [bigint, bigint]
  ): Promise<Map<string, EventFetchResult>> {
    this.log(`📡 Fetching ${eventNames.length} event types in parallel`)

    const promises = eventNames.map((eventName) =>
      this.fetchHistoricalEvents(eventName, blockRange).then((result) => ({
        eventName,
        result,
      }))
    )

    const results = await Promise.allSettled(promises)
    const eventsMap = new Map<string, EventFetchResult>()

    for (const result of results) {
      if (result.status === 'fulfilled') {
        eventsMap.set(result.value.eventName, result.value.result)
      } else {
        this.log(`❌ Failed to fetch event: ${result.reason}`)
      }
    }

    return eventsMap
  }

  /**
   * Process events in batches across multiple block ranges
   *
   * @param eventName - Name of the event to fetch
   * @param blockRanges - Array of [fromBlock, toBlock] tuples
   * @param onProgress - Optional callback for progress updates
   * @returns All events with deduplication applied
   */
  async processBatchedEvents<T = any>(
    eventName: string,
    blockRanges: Array<[bigint, bigint]>,
    onProgress?: (progress: number, message: string) => void
  ): Promise<T[]> {
    if (blockRanges.length === 0) {
      this.log('ℹ️ No block ranges to process')
      return []
    }

    this.log(`🔄 Processing ${blockRanges.length} block ranges for ${eventName}`)
    const startTime = Date.now()
    this.stats = this.resetStats()

    const allEvents: T[] = []
    const seenEvents = new Set<string>()

    for (let i = 0; i < blockRanges.length; i++) {
      const range = blockRanges[i]
      const progress = ((i + 1) / blockRanges.length) * 100

      onProgress?.(
        progress,
        `Processing range ${i + 1}/${blockRanges.length}: ${formatBlockRange(range[0], range[1])}`
      )

      try {
        const result = await this.fetchHistoricalEvents<T>(eventName, range)
        this.stats.blockRangesScanned++
        this.stats.totalEvents += result.eventCount

        // Deduplicate events
        if (this.config.enableDeduplication) {
          for (const event of result.events) {
            const eventId = this.getEventId(event as any)
            if (!seenEvents.has(eventId)) {
              seenEvents.add(eventId)
              allEvents.push(event)
              this.stats.uniqueEvents++
            } else {
              this.stats.duplicatesRemoved++
            }
          }
        } else {
          allEvents.push(...result.events)
          this.stats.uniqueEvents += result.eventCount
        }
      } catch (error) {
        this.log(`❌ Failed to process range ${formatBlockRange(range[0], range[1])}: ${error}`)
        // Continue processing other ranges
      }
    }

    this.stats.processingTimeMs = Date.now() - startTime

    this.log(`✅ Processing complete:`)
    this.log(`   - Total events: ${this.stats.totalEvents}`)
    this.log(`   - Unique events: ${this.stats.uniqueEvents}`)
    this.log(`   - Duplicates removed: ${this.stats.duplicatesRemoved}`)
    this.log(`   - Processing time: ${this.stats.processingTimeMs}ms`)
    this.log(`   - Block ranges scanned: ${this.stats.blockRangesScanned}`)

    onProgress?.(100, `Processed ${this.stats.uniqueEvents} unique events`)

    return allEvents
  }

  /**
   * Generate unique event ID for deduplication
   * Uses transaction hash + log index
   */
  private getEventId(log: Log): string {
    return `${log.transactionHash}-${log.logIndex}`
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Conditional logging based on verbose config
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[EventProcessor] ${message}`)
    }
  }
}

/**
 * Utility: Extract pool ID from PoolCreated event
 */
export function extractPoolIdFromEvent(event: any): number | null {
  try {
    // PoolCreated event structure: { poolId, creator, name, minContribution, maxMembers }
    const poolId = event.args?.poolId
    return poolId ? Number(poolId) : null
  } catch (error) {
    console.warn('Failed to extract poolId from event:', error)
    return null
  }
}

/**
 * Utility: Group events by pool ID
 */
export function groupEventsByPoolId<T extends { args: { poolId: bigint } }>(
  events: T[]
): Map<number, T[]> {
  const grouped = new Map<number, T[]>()

  for (const event of events) {
    const poolId = Number(event.args.poolId)
    if (!grouped.has(poolId)) {
      grouped.set(poolId, [])
    }
    grouped.get(poolId)!.push(event)
  }

  return grouped
}
