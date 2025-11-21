export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  factor?: number
  jitter?: boolean
  onRetry?: (error: Error, attempt: number) => void
  shouldRetry?: (error: Error) => boolean
}

/**
 * Retry a function with exponential backoff and jitter
 *
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => provider.getBlockNumber(),
 *   { maxRetries: 5, jitter: true }
 * )
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  optionsOrMaxRetries?: number | RetryOptions
): Promise<T> {
  // Handle backward compatibility
  const options: RetryOptions = typeof optionsOrMaxRetries === 'number'
    ? { maxRetries: optionsOrMaxRetries }
    : optionsOrMaxRetries || {}

  const {
    maxRetries: retries = maxRetries,
    initialDelay: initDelay = initialDelay,
    maxDelay = 60000, // 1 minute max
    factor = 2,
    jitter = true,
    onRetry,
    shouldRetry = () => true,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        break
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(initDelay * Math.pow(factor, attempt), maxDelay)

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1)
      }

      console.log(`⏳ Retry attempt ${attempt + 1}/${retries} after ${Math.round(delay)}ms...`)
      console.log(`   Error: ${lastError.message}`)

      await sleep(delay)
    }
  }

  throw new Error(`Failed after ${retries} retries: ${lastError?.message}`)
}

/**
 * Check if an error is retryable (network/timeout errors)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  const retryableMessages = [
    'network',
    'timeout',
    'econnreset',
    'enotfound',
    'econnrefused',
    'etimedout',
    'socket hang up',
    'rate limit',
    'too many requests',
    'service unavailable',
    'bad gateway',
    'gateway timeout',
  ]

  return retryableMessages.some(msg => message.includes(msg))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Batch process items with concurrent limit and error handling
 *
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param concurrency - Maximum number of concurrent operations
 * @returns Promise resolving to array of results
 *
 * @example
 * const results = await batchProcess(
 *   blockNumbers,
 *   async (blockNum) => provider.getBlock(blockNum),
 *   10
 * )
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = []
  const errors: Array<{ index: number; error: Error }> = []

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex
      try {
        return await processor(item, globalIndex)
      } catch (error) {
        errors.push({ index: globalIndex, error: error as Error })
        throw error
      }
    })

    const batchResults = await Promise.allSettled(batchPromises)

    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }
  }

  // If any errors occurred, log them
  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} items failed during batch processing`)
    errors.forEach(({ index, error }) => {
      console.error(`   [${index}]: ${error.message}`)
    })
  }

  return results
}

/**
 * Process items with rate limiting
 *
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param rateLimit - Maximum operations per second
 * @returns Promise resolving to array of results
 */
export async function rateLimitedProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  rateLimit: number = 10
): Promise<R[]> {
  const results: R[] = []
  const delayBetweenItems = 1000 / rateLimit

  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      await sleep(delayBetweenItems)
    }

    try {
      const result = await processor(items[i], i)
      results.push(result)
    } catch (error) {
      console.error(`❌ Error processing item ${i}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime
      if (timeSinceLastFailure < this.timeout) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'half-open'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.threshold) {
      this.state = 'open'
      console.error(`🚨 Circuit breaker opened after ${this.failureCount} failures`)

      // Auto-reset after timeout
      setTimeout(() => {
        console.log('🔄 Circuit breaker attempting reset...')
        this.state = 'half-open'
      }, this.resetTimeout)
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failureCount = 0
    this.state = 'closed'
    this.lastFailureTime = 0
  }
}
