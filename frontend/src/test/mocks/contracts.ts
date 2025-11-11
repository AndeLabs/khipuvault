/**
 * Mock contract data for testing
 */

export const MOCK_ADDRESSES = {
  individualPool: '0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393' as `0x${string}`,
  cooperativePool: '0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88' as `0x${string}`,
  musd: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
  yieldAggregator: '0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6' as `0x${string}`,
} as const

export const MOCK_USER_DEPOSIT = {
  musdAmount: BigInt('100000000000000000000'), // 100 MUSD
  yieldAccrued: BigInt('5000000000000000000'), // 5 MUSD
  depositTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
  lastYieldUpdate: BigInt(Math.floor(Date.now() / 1000)),
  active: true,
}

export const MOCK_POOL_STATS = {
  totalMusdDeposited: BigInt('10000000000000000000000'), // 10,000 MUSD
  totalYields: BigInt('500000000000000000000'), // 500 MUSD
  totalReferralRewards: BigInt('10000000000000000000'), // 10 MUSD
  poolAPR: 620, // 6.2%
  emergencyMode: false,
}

export const MOCK_USER_INFO = [
  BigInt('100000000000000000000'), // deposit - 100 MUSD
  BigInt('5000000000000000000'),  // yields - 5 MUSD
  BigInt('4950000000000000000'),  // netYields - 4.95 MUSD (after 1% fee)
  BigInt(1),                       // daysActive
  BigInt(620),                     // estimatedAPR - 6.2%
  false,                           // autoCompoundEnabled
] as const

export const MOCK_BALANCE = {
  musd: BigInt('1000000000000000000000'), // 1,000 MUSD
}
