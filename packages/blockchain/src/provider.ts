import { ethers } from 'ethers'
import { retryWithBackoff } from './utils/retry'

export const MEZO_TESTNET_RPC = 'https://rpc.test.mezo.org'
export const MEZO_TESTNET_CHAIN_ID = 31611

// Health check configuration
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const MAX_RETRY_ATTEMPTS = 5
const INITIAL_RETRY_DELAY = 1000 // 1 second

interface ProviderHealth {
  isHealthy: boolean
  lastCheck: Date
  lastError?: string
  consecutiveFailures: number
  blockNumber?: number
  latency?: number
}

class ResilientProvider {
  private provider: ethers.JsonRpcProvider | null = null
  private health: ProviderHealth = {
    isHealthy: true,
    lastCheck: new Date(),
    consecutiveFailures: 0,
  }
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isShuttingDown = false

  constructor(
    private rpcUrl: string = process.env.RPC_URL || MEZO_TESTNET_RPC,
    private chainId: number = MEZO_TESTNET_CHAIN_ID
  ) {
    this.initializeProvider()
    this.startHealthCheck()
  }

  private initializeProvider(): void {
    try {
      console.log('🔌 Initializing RPC provider:', this.rpcUrl)

      this.provider = new ethers.JsonRpcProvider(this.rpcUrl, {
        chainId: this.chainId,
        name: 'mezo-testnet',
      })

      // Listen to provider errors
      this.provider.on('error', (error) => {
        console.error('❌ Provider error:', error)
        this.handleProviderError(error)
      })

      // Listen to network changes
      this.provider.on('network', (newNetwork, oldNetwork) => {
        if (oldNetwork) {
          console.warn('🔄 Network changed:', {
            from: oldNetwork.chainId,
            to: newNetwork.chainId,
          })
        }
      })

      console.log('✅ Provider initialized')
    } catch (error) {
      console.error('❌ Failed to initialize provider:', error)
      this.health.isHealthy = false
      this.health.lastError = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private handleProviderError(error: Error): void {
    this.health.consecutiveFailures++
    this.health.lastError = error.message
    this.health.isHealthy = false

    console.error('🚨 Provider error detected:', {
      error: error.message,
      consecutiveFailures: this.health.consecutiveFailures,
    })

    // Attempt reconnection after multiple failures
    if (this.health.consecutiveFailures >= 3) {
      console.log('🔄 Attempting provider reconnection...')
      this.reconnect()
    }
  }

  private async reconnect(): Promise<void> {
    if (this.isShuttingDown) return

    try {
      console.log('🔄 Reconnecting to RPC provider...')

      // Remove all listeners from old provider
      if (this.provider) {
        this.provider.removeAllListeners()
        this.provider = null
      }

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, INITIAL_RETRY_DELAY))

      // Reinitialize provider
      this.initializeProvider()

      // Test connection
      await this.healthCheck()

      if (this.health.isHealthy) {
        console.log('✅ Provider reconnected successfully')
        this.health.consecutiveFailures = 0
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error)
      this.health.isHealthy = false

      // Exponential backoff for next retry
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, this.health.consecutiveFailures),
        60000 // Max 1 minute
      )

      setTimeout(() => this.reconnect(), delay)
    }
  }

  private async healthCheck(): Promise<void> {
    if (this.isShuttingDown) return

    try {
      const startTime = Date.now()
      const blockNumber = await this.provider!.getBlockNumber()
      const latency = Date.now() - startTime

      this.health = {
        isHealthy: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        blockNumber,
        latency,
      }

      if (latency > 5000) {
        console.warn('⚠️  High RPC latency detected:', latency, 'ms')
      }
    } catch (error) {
      console.error('❌ Health check failed:', error)
      this.health.consecutiveFailures++
      this.health.isHealthy = false
      this.health.lastError = error instanceof Error ? error.message : 'Health check failed'

      // Trigger reconnection if health check fails multiple times
      if (this.health.consecutiveFailures >= 3) {
        this.reconnect()
      }
    }
  }

  private startHealthCheck(): void {
    // Initial health check
    this.healthCheck()

    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck()
    }, HEALTH_CHECK_INTERVAL)

    console.log('✅ Health check monitoring started')
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  public getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    if (!this.health.isHealthy) {
      console.warn('⚠️  Provider is unhealthy, attempting to use anyway')
    }

    return this.provider
  }

  public getHealth(): ProviderHealth {
    return { ...this.health }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down provider...')
    this.isShuttingDown = true
    this.stopHealthCheck()

    if (this.provider) {
      this.provider.removeAllListeners()
      this.provider = null
    }

    console.log('✅ Provider shutdown complete')
  }
}

// Singleton instance
let resilientProvider: ResilientProvider | null = null

export function getProvider(): ethers.JsonRpcProvider {
  if (!resilientProvider) {
    resilientProvider = new ResilientProvider()
  }
  return resilientProvider.getProvider()
}

export function getProviderHealth(): ProviderHealth {
  if (!resilientProvider) {
    resilientProvider = new ResilientProvider()
  }
  return resilientProvider.getHealth()
}

export async function shutdownProvider(): Promise<void> {
  if (resilientProvider) {
    await resilientProvider.shutdown()
    resilientProvider = null
  }
}

/**
 * Get current block number with retry logic
 */
export async function getCurrentBlock(): Promise<number> {
  return retryWithBackoff(async () => {
    const provider = getProvider()
    return await provider.getBlockNumber()
  }, MAX_RETRY_ATTEMPTS)
}

/**
 * Get block timestamp with retry logic
 */
export async function getBlockTimestamp(blockNumber: number): Promise<number> {
  return retryWithBackoff(async () => {
    const provider = getProvider()
    const block = await provider.getBlock(blockNumber)
    return block ? block.timestamp : 0
  }, MAX_RETRY_ATTEMPTS)
}

/**
 * Get block with full details and retry logic
 */
export async function getBlock(blockNumber: number): Promise<ethers.Block | null> {
  return retryWithBackoff(async () => {
    const provider = getProvider()
    return await provider.getBlock(blockNumber)
  }, MAX_RETRY_ATTEMPTS)
}
