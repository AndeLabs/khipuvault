import { KhipuApiClient } from '@khipu/web3'

const apiClient = new KhipuApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

export async function getUserPosition(address: string) {
  try {
    const positions = await apiClient.getUserPositions(address)
    return positions.find(p => p.poolType === 'individual')
  } catch (error) {
    console.error('Error fetching user position:', error)
    return null
  }
}

export async function getPoolData() {
  try {
    const pool = await apiClient.getPoolByAddress(
      process.env.NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS!
    )
    return pool
  } catch (error) {
    console.error('Error fetching pool data:', error)
    return null
  }
}

export async function getPoolAnalytics(days: number = 30) {
  try {
    const poolAddress = process.env.NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS!
    const pool = await apiClient.getPoolByAddress(poolAddress)
    return await apiClient.getPoolAnalytics(pool.id, days)
  } catch (error) {
    console.error('Error fetching pool analytics:', error)
    return []
  }
}
