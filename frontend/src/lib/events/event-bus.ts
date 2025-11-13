/**
 * @fileoverview Unified Event Bus for Cross-Feature Communication
 * @module lib/events/event-bus
 *
 * Global event system enabling communication between all features:
 * - Cooperative Pool
 * - Individual Savings
 * - Lottery Pool
 * - Rotating Pool (future)
 *
 * Benefits:
 * - Decoupled architecture
 * - Event history tracking
 * - Advanced filtering
 * - Performance monitoring
 * - Debug tools
 *
 * @example
 * ```ts
 * const bus = EventBus.getInstance()
 *
 * // Subscribe to multiple events
 * const unsubscribe = bus.subscribe(['PoolCreated', 'DepositMade'], (event) => {
 *   console.log('Event:', event)
 * })
 *
 * // Emit event
 * bus.emit({
 *   type: 'PoolCreated',
 *   source: 'cooperative-pool',
 *   data: { poolId: 1, name: 'Savings 2025' },
 *   timestamp: Date.now(),
 * })
 *
 * // Get history
 * const recent = bus.getHistory({ limit: 10 })
 * ```
 */

/**
 * Event sources (features)
 */
export type EventSource = 'cooperative-pool' | 'individual-savings' | 'lottery-pool' | 'rotating-pool' | 'system'

/**
 * Event types across all features
 */
export type EventType =
  // Cooperative Pool
  | 'PoolCreated'
  | 'PoolClosed'
  | 'MemberJoined'
  | 'MemberLeft'
  | 'YieldClaimed'
  // Individual Savings
  | 'DepositMade'
  | 'WithdrawalMade'
  | 'YieldClaimedIndividual'
  | 'AutoCompoundExecuted'
  | 'ReferralRewardClaimed'
  // Lottery Pool
  | 'TicketPurchased'
  | 'DrawExecuted'
  | 'WinnerDeclared'
  | 'PrizeClaimed'
  | 'LotteryPoolCreated'
  // System
  | 'ConnectionEstablished'
  | 'ConnectionLost'
  | 'Error'

/**
 * Base application event
 */
export interface AppEvent<T = any> {
  /** Unique event ID */
  id: string
  /** Event type */
  type: EventType
  /** Source feature */
  source: EventSource
  /** Event data (specific to each type) */
  data: T
  /** Unix timestamp */
  timestamp: number
  /** Block number (if applicable) */
  blockNumber?: bigint
  /** Transaction hash (if applicable) */
  txHash?: string
  /** User address (if applicable) */
  user?: string
}

/**
 * Event filter criteria
 */
export interface EventFilter {
  /** Filter by event types */
  types?: EventType[]
  /** Filter by sources */
  sources?: EventSource[]
  /** Filter by time range */
  timeRange?: {
    from: number
    to: number
  }
  /** Filter by user */
  user?: string
  /** Maximum results */
  limit?: number
}

/**
 * Event subscriber callback
 */
export type EventCallback = (event: AppEvent) => void

/**
 * Unsubscribe function
 */
export type Unsubscribe = () => void

/**
 * Event bus statistics
 */
export interface EventBusStats {
  totalEventsEmitted: number
  totalSubscribers: number
  subscribersByType: Map<EventType, number>
  eventsBySource: Map<EventSource, number>
  averageLatency: number
  lastEventAt: number | null
}

/**
 * EventBus - Unified event system for entire application
 *
 * Features:
 * ✅ Singleton pattern (global instance)
 * ✅ Type-safe event system
 * ✅ Event history (configurable size)
 * ✅ Advanced filtering
 * ✅ Performance monitoring
 * ✅ Debug logging
 * ✅ Memory leak prevention
 *
 * Architecture:
 * 1. Publisher-Subscriber pattern
 * 2. Event history buffer (circular)
 * 3. Performance tracking
 * 4. Type-safe generics
 *
 * @example
 * ```typescript
 * const bus = EventBus.getInstance()
 *
 * // Subscribe to specific events
 * bus.subscribe(['PoolCreated', 'DepositMade'], (event) => {
 *   if (event.type === 'PoolCreated') {
 *     console.log('New pool:', event.data.name)
 *   }
 * })
 *
 * // Emit event
 * bus.emit({
 *   type: 'PoolCreated',
 *   source: 'cooperative-pool',
 *   data: { poolId: 1, name: 'Family Savings' },
 *   timestamp: Date.now(),
 * })
 *
 * // Get filtered history
 * const deposits = bus.getHistory({
 *   types: ['DepositMade'],
 *   limit: 20,
 * })
 * ```
 */
export class EventBus {
  private static instance: EventBus | null = null

  private subscribers: Map<string, Set<EventCallback>> = new Map()
  private history: AppEvent[] = []
  private maxHistorySize: number = 100
  private stats: EventBusStats
  private verbose: boolean = false

  private constructor(config?: { maxHistorySize?: number; verbose?: boolean }) {
    this.maxHistorySize = config?.maxHistorySize || 100
    this.verbose = config?.verbose || false
    this.stats = {
      totalEventsEmitted: 0,
      totalSubscribers: 0,
      subscribersByType: new Map(),
      eventsBySource: new Map(),
      averageLatency: 0,
      lastEventAt: null,
    }

    this.log('📡 EventBus initialized')
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: { maxHistorySize?: number; verbose?: boolean }): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config)
    }
    return EventBus.instance
  }

  /**
   * Subscribe to one or more event types
   *
   * @param types - Event types to subscribe to
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribe(types: EventType | EventType[], callback: EventCallback): Unsubscribe {
    const eventTypes = Array.isArray(types) ? types : [types]

    for (const type of eventTypes) {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set())
      }

      this.subscribers.get(type)!.add(callback)

      // Update stats
      this.stats.subscribersByType.set(type, this.subscribers.get(type)!.size)
      this.stats.totalSubscribers = Array.from(this.subscribers.values()).reduce(
        (sum, set) => sum + set.size,
        0
      )
    }

    this.log(`📡 Subscribed to [${eventTypes.join(', ')}] (${this.stats.totalSubscribers} total subscribers)`)

    // Return unsubscribe function
    return () => {
      for (const type of eventTypes) {
        const subs = this.subscribers.get(type)
        if (subs) {
          subs.delete(callback)
          if (subs.size === 0) {
            this.subscribers.delete(type)
            this.stats.subscribersByType.delete(type)
          } else {
            this.stats.subscribersByType.set(type, subs.size)
          }
        }
      }

      this.stats.totalSubscribers = Array.from(this.subscribers.values()).reduce(
        (sum, set) => sum + set.size,
        0
      )

      this.log(`📡 Unsubscribed from [${eventTypes.join(', ')}]`)
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * @param event - Event to emit (without ID, will be generated)
   */
  emit<T = any>(event: Omit<AppEvent<T>, 'id'>): void {
    const startTime = performance.now()

    // Generate unique ID
    const fullEvent: AppEvent<T> = {
      ...event,
      id: this.generateEventId(),
    }

    // Add to history
    this.addToHistory(fullEvent)

    // Update stats
    this.stats.totalEventsEmitted++
    this.stats.lastEventAt = event.timestamp
    const sourceCount = this.stats.eventsBySource.get(event.source) || 0
    this.stats.eventsBySource.set(event.source, sourceCount + 1)

    // Notify subscribers
    const subscribers = this.subscribers.get(event.type)
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((callback) => {
        try {
          callback(fullEvent)
        } catch (error) {
          console.error(`❌ Error in event subscriber for ${event.type}:`, error)
        }
      })

      const latency = performance.now() - startTime
      this.updateAverageLatency(latency)

      this.log(
        `📤 Emitted ${event.type} from ${event.source} (${subscribers.size} subscribers, ${latency.toFixed(2)}ms)`
      )
    } else {
      this.log(`📤 Emitted ${event.type} from ${event.source} (no subscribers)`)
    }
  }

  /**
   * Get event history with optional filtering
   *
   * @param filter - Filter criteria
   * @returns Filtered events
   */
  getHistory(filter?: EventFilter): AppEvent[] {
    let events = [...this.history]

    if (filter) {
      // Filter by types
      if (filter.types && filter.types.length > 0) {
        events = events.filter((e) => filter.types!.includes(e.type))
      }

      // Filter by sources
      if (filter.sources && filter.sources.length > 0) {
        events = events.filter((e) => filter.sources!.includes(e.source))
      }

      // Filter by time range
      if (filter.timeRange) {
        events = events.filter(
          (e) => e.timestamp >= filter.timeRange!.from && e.timestamp <= filter.timeRange!.to
        )
      }

      // Filter by user
      if (filter.user) {
        events = events.filter((e) => e.user === filter.user)
      }

      // Limit results
      if (filter.limit) {
        events = events.slice(0, filter.limit)
      }
    }

    return events
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = []
    this.log('🗑️ Event history cleared')
  }

  /**
   * Get event bus statistics
   */
  getStats(): EventBusStats {
    return { ...this.stats }
  }

  /**
   * Enable/disable verbose logging
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose
  }

  /**
   * Clear all subscribers (useful for testing)
   */
  clearSubscribers(): void {
    this.subscribers.clear()
    this.stats.totalSubscribers = 0
    this.stats.subscribersByType.clear()
    this.log('🗑️ All subscribers cleared')
  }

  /**
   * Destroy singleton instance (useful for testing)
   */
  static destroy(): void {
    if (EventBus.instance) {
      EventBus.instance.clearSubscribers()
      EventBus.instance.clearHistory()
      EventBus.instance = null
    }
  }

  /**
   * Add event to history (circular buffer)
   */
  private addToHistory(event: AppEvent): void {
    this.history.unshift(event) // Add to beginning

    // Maintain max history size (circular buffer)
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Update average latency (exponential moving average)
   */
  private updateAverageLatency(latency: number): void {
    if (this.stats.averageLatency === 0) {
      this.stats.averageLatency = latency
    } else {
      // EMA with alpha = 0.2 (gives more weight to recent values)
      this.stats.averageLatency = 0.2 * latency + 0.8 * this.stats.averageLatency
    }
  }

  /**
   * Conditional logging
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[EventBus] ${message}`)
    }
  }
}

/**
 * React hook for EventBus
 *
 * @example
 * ```tsx
 * function Component() {
 *   useEventBus(['PoolCreated', 'DepositMade'], (event) => {
 *     console.log('Event received:', event)
 *   })
 * }
 * ```
 */
export function useEventBus(types: EventType | EventType[], callback: EventCallback): void {
  // This will be implemented in a separate hook file
  // Placeholder for now
}
