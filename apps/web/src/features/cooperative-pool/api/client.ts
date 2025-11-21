import { KhipuApiClient } from '@khipu/web3'

const apiClient = new KhipuApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

export async function getUserCooperativePosition(address: string) {
  try {
    const positions = await apiClient.getUserPositions(address)
    return positions.find(p => p.poolType === 'cooperative')
  } catch (error) {
    console.error('Error fetching cooperative position:', error)
    return null
  }
}

export async function getCooperativePoolData() {
  try {
    const pool = await apiClient.getPoolByAddress(
      process.env.NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS!
    )
    return pool
  } catch (error) {
    console.error('Error fetching cooperative pool data:', error)
    return null
  }
}

export async function getCooperativePoolUsers(poolAddress: string) {
  try {
    return await apiClient.getPoolUsers(poolAddress)
  } catch (error) {
    console.error('Error fetching pool users:', error)
    return []
  }
}
