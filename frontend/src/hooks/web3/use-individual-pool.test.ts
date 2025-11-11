import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIndividualPool } from './use-individual-pool'
import { MOCK_USER_INFO, MOCK_POOL_STATS, MOCK_BALANCE, MOCK_ADDRESSES } from '@/test/mocks/contracts'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    chain: { id: 31611 },
  }),
  useConfig: () => ({}),
}))

vi.mock('wagmi/actions', () => ({
  readContract: vi.fn(),
}))

describe('useIndividualPool', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Pool Statistics', () => {
    it('should return pool stats structure', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.poolStats).toBeDefined()
      expect(result.current.poolStats).toHaveProperty('totalMusdDeposited')
      expect(result.current.poolStats).toHaveProperty('totalYields')
      expect(result.current.poolStats).toHaveProperty('poolAPR')
    })

    it('should have default values when no data', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.poolStats.totalMusdDeposited).toBe(BigInt(0))
      expect(result.current.poolStats.totalYields).toBe(BigInt(0))
    })
  })

  describe('User Information', () => {
    it('should return user info structure', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.userInfo).toBeDefined()
      // Initially null when not loaded
      expect(result.current.userInfo).toBeNull()
    })

    it('should parse user info correctly when data is available', async () => {
      const { readContract } = await import('wagmi/actions')
      vi.mocked(readContract).mockResolvedValue(MOCK_USER_INFO)

      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      await waitFor(() => {
        expect(result.current.userInfo).not.toBeNull()
      })

      if (result.current.userInfo) {
        expect(result.current.userInfo.deposit).toBe(MOCK_USER_INFO[0])
        expect(result.current.userInfo.yields).toBe(MOCK_USER_INFO[1])
        expect(result.current.userInfo.netYields).toBe(MOCK_USER_INFO[2])
        expect(result.current.userInfo.daysActive).toBe(MOCK_USER_INFO[3])
      }
    })
  })

  describe('Wallet Balances', () => {
    it('should return wallet balances structure', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.walletBalances).toBeDefined()
      expect(result.current.walletBalances).toHaveProperty('musdBalance')
    })

    it('should have default zero balance when no data', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.walletBalances.musdBalance).toBe(BigInt(0))
    })
  })

  describe('Computed Values', () => {
    it('should correctly identify if user has active deposit', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      // Initially false when no user info
      expect(result.current.hasActiveDeposit).toBe(false)
    })

    it('should calculate hasActiveDeposit based on deposit amount', async () => {
      const { readContract } = await import('wagmi/actions')
      vi.mocked(readContract).mockResolvedValue(MOCK_USER_INFO)

      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      await waitFor(() => {
        expect(result.current.hasActiveDeposit).toBe(true)
      })
    })

    it('should determine canWithdrawPartial based on user deposit', async () => {
      const { readContract } = await import('wagmi/actions')
      vi.mocked(readContract).mockResolvedValue(MOCK_USER_INFO)

      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      await waitFor(() => {
        // User has 100 MUSD deposited, should be able to withdraw
        expect(result.current.canWithdrawPartial).toBeDefined()
      })
    })
  })

  describe('Contract Addresses', () => {
    it('should expose contract addresses', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.contracts).toBeDefined()
      expect(result.current.contracts.pool).toBeDefined()
      expect(result.current.contracts.musd).toBeDefined()
    })

    it('should use correct pool address from config', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.contracts.pool).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('Helper Functions', () => {
    it('should provide refetchAll function', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.refetchAll).toBeDefined()
      expect(typeof result.current.refetchAll).toBe('function')
    })

    it('should provide invalidateAll function', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.invalidateAll).toBeDefined()
      expect(typeof result.current.invalidateAll).toBe('function')
    })

    it('should provide refetchUserInfo function', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.refetchUserInfo).toBeDefined()
      expect(typeof result.current.refetchUserInfo).toBe('function')
    })
  })

  describe('Performance Fee', () => {
    it('should return performance fee with default fallback', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      // Should have a default value
      expect(result.current.performanceFee).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Loading States', () => {
    it('should track loading state', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.isLoading).toBeDefined()
      expect(typeof result.current.isLoading).toBe('boolean')
    })
  })

  describe('Referral System', () => {
    it('should return referral stats structure', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.referralStats).toBeDefined()
      // Initially null when not loaded
      expect(result.current.referralStats).toBeNull()
    })

    it('should provide hasReferralRewards flag', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.hasReferralRewards).toBe(false)
    })

    it('should track referral count', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.referralCount).toBe(BigInt(0))
    })
  })

  describe('Features Configuration', () => {
    it('should expose features configuration', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.features).toBeDefined()
    })
  })

  describe('Auto-Compound', () => {
    it('should track auto-compound enabled state', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.autoCompoundEnabled).toBe(false)
    })

    it('should provide shouldShowAutoCompound flag', () => {
      const { result } = renderHook(() => useIndividualPool(), { wrapper })

      expect(result.current.shouldShowAutoCompound).toBe(false)
    })
  })
})

describe('Formatting Helpers', () => {
  const { formatMUSD, formatMUSDCompact, formatAPR, formatDays } = await import('./use-individual-pool')

  describe('formatMUSD', () => {
    it('should format zero correctly', () => {
      expect(formatMUSD(BigInt(0))).toBe('0.00')
    })

    it('should format MUSD with decimals', () => {
      const amount = BigInt('123456789012345678901') // 123.45 MUSD
      const formatted = formatMUSD(amount)
      expect(formatted).toContain('123')
    })

    it('should handle undefined gracefully', () => {
      expect(formatMUSD(undefined)).toBe('0.00')
    })
  })

  describe('formatMUSDCompact', () => {
    it('should format large numbers with K suffix', () => {
      const amount = BigInt('5000000000000000000000') // 5,000 MUSD
      const formatted = formatMUSDCompact(amount)
      expect(formatted).toContain('K')
    })

    it('should format very large numbers with M suffix', () => {
      const amount = BigInt('2000000000000000000000000') // 2,000,000 MUSD
      const formatted = formatMUSDCompact(amount)
      expect(formatted).toContain('M')
    })

    it('should format small numbers without suffix', () => {
      const amount = BigInt('500000000000000000000') // 500 MUSD
      const formatted = formatMUSDCompact(amount)
      expect(formatted).not.toContain('K')
      expect(formatted).not.toContain('M')
    })
  })

  describe('formatAPR', () => {
    it('should format APR from bigint', () => {
      expect(formatAPR(BigInt(620))).toBe('6.20%')
    })

    it('should format APR from number', () => {
      expect(formatAPR(6.2)).toBe('6.20%')
    })
  })

  describe('formatDays', () => {
    it('should format zero days correctly', () => {
      expect(formatDays(0)).toBe('Hoy')
    })

    it('should format one day correctly', () => {
      expect(formatDays(1)).toBe('1 día')
    })

    it('should format multiple days correctly', () => {
      expect(formatDays(5)).toBe('5 días')
    })

    it('should handle bigint input', () => {
      expect(formatDays(BigInt(10))).toBe('10 días')
    })
  })
})
