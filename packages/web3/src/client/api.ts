import type { UserPortfolio, Pool, Transaction } from '@khipu/shared'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

/**
 * API Client for KhipuVault backend
 */
export class KhipuApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // User endpoints
  async getUserPortfolio(address: string): Promise<UserPortfolio> {
    return this.fetch(`/users/${address}/portfolio`)
  }

  async getUserTransactions(address: string): Promise<Transaction[]> {
    return this.fetch(`/users/${address}/transactions`)
  }

  // Pool endpoints
  async getPools(): Promise<Pool[]> {
    return this.fetch('/pools')
  }

  async getPool(poolId: string): Promise<Pool> {
    return this.fetch(`/pools/${poolId}`)
  }

  async getPoolAnalytics(poolId: string) {
    return this.fetch(`/analytics/pools/${poolId}`)
  }

  // Analytics endpoints
  async getGlobalAnalytics() {
    return this.fetch('/analytics/global')
  }
}

// Export singleton instance
export const khipuApi = new KhipuApiClient()
