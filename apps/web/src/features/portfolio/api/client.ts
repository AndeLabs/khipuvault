import { KhipuApiClient } from '@khipu/web3'

const apiClient = new KhipuApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

export async function getUserPortfolio(address: string) {
  try {
    return await apiClient.getUserPortfolio(address)
  } catch (error) {
    console.error('Error fetching user portfolio:', error)
    return null
  }
}

export async function getUserTransactions(address: string, limit = 50, offset = 0) {
  try {
    return await apiClient.getUserTransactions(address, limit, offset)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { transactions: [], pagination: { total: 0, limit, offset, hasMore: false } }
  }
}

export async function getAllPools() {
  try {
    return await apiClient.getPools()
  } catch (error) {
    console.error('Error fetching pools:', error)
    return []
  }
}
