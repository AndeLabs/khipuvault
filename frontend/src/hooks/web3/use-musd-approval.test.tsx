import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMusdApprovalV2, formatMUSDFromWei, formatMUSDShort, formatMUSD } from './use-musd-approval'
import { MOCK_BALANCE } from '@/test/mocks/contracts'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    chain: { id: 31611 },
  }),
  useConfig: () => ({}),
  usePublicClient: () => ({}),
  useBlockNumber: () => ({
    data: 12345n,
  }),
  useReadContract: vi.fn((config: any) => {
    // Mock balanceOf
    if (config.functionName === 'balanceOf') {
      return {
        data: MOCK_BALANCE.musd,
        isLoading: false,
        refetch: vi.fn(),
      }
    }
    // Mock allowance
    if (config.functionName === 'allowance') {
      return {
        data: BigInt('1000000000000000000000'), // 1,000 MUSD approved
        isLoading: false,
        refetch: vi.fn(),
      }
    }
    return { data: undefined, isLoading: false, refetch: vi.fn() }
  }),
  useWriteContract: () => ({
    writeContract: vi.fn(),
    data: '0xabc123' as `0x${string}`,
    error: null,
    isPending: false,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}))

describe('useMusdApprovalV2', () => {
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

  describe('Balance Information', () => {
    it('should return MUSD balance', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.musdBalance).toBeDefined()
      expect(result.current.musdBalance).toBe(MOCK_BALANCE.musd)
    })

    it('should format balance correctly', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.balanceFormatted).toBeDefined()
      // 1,000 MUSD should be formatted as "1,000.00"
      expect(result.current.balanceFormatted).toContain('1,000')
    })

    it('should track loading state', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isLoading).toBeDefined()
      expect(typeof result.current.isLoading).toBe('boolean')
    })
  })

  describe('Allowance Information', () => {
    it('should return current allowance', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.allowance).toBeDefined()
      expect(result.current.allowance).toBe(BigInt('1000000000000000000000'))
    })

    it('should provide isApprovalNeeded function', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isApprovalNeeded).toBeDefined()
      expect(typeof result.current.isApprovalNeeded).toBe('function')
    })
  })

  describe('isApprovalNeeded Logic', () => {
    it('should return false when allowance is sufficient', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      // User has 1,000 MUSD approved, wants to deposit 100 MUSD
      const needsApproval = result.current.isApprovalNeeded(BigInt('100000000000000000000'))
      expect(needsApproval).toBe(false)
    })

    it('should return true when allowance is insufficient', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      // User has 1,000 MUSD approved, wants to deposit 2,000 MUSD
      const needsApproval = result.current.isApprovalNeeded(BigInt('2000000000000000000000'))
      expect(needsApproval).toBe(true)
    })

    it('should return true when no allowance exists', () => {
      // Mock zero allowance
      vi.mocked(vi.mocked(require('wagmi').useReadContract)).mockImplementation((config: any) => {
        if (config.functionName === 'allowance') {
          return {
            data: undefined,
            isLoading: false,
            refetch: vi.fn(),
          }
        }
        return { data: MOCK_BALANCE.musd, isLoading: false, refetch: vi.fn() }
      })

      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      const needsApproval = result.current.isApprovalNeeded(BigInt('1'))
      expect(needsApproval).toBe(true)
    })
  })

  describe('Approval Functions', () => {
    it('should provide approveUnlimited function', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.approveUnlimited).toBeDefined()
      expect(typeof result.current.approveUnlimited).toBe('function')
    })

    it('should provide approveAmount function', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.approveAmount).toBeDefined()
      expect(typeof result.current.approveAmount).toBe('function')
    })

    it('should call approveUnlimited without errors', async () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      await expect(result.current.approveUnlimited()).resolves.not.toThrow()
    })

    it('should accept string amount in approveAmount', async () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      await expect(result.current.approveAmount('100')).resolves.not.toThrow()
    })

    it('should accept bigint amount in approveAmount', async () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      await expect(
        result.current.approveAmount(BigInt('100000000000000000000'))
      ).resolves.not.toThrow()
    })
  })

  describe('Transaction States', () => {
    it('should track isApproving state', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isApproving).toBeDefined()
      expect(typeof result.current.isApproving).toBe('boolean')
    })

    it('should track isApproveConfirming state', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isApproveConfirming).toBeDefined()
      expect(typeof result.current.isApproveConfirming).toBe('boolean')
    })

    it('should track isApprovalConfirmed state', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isApprovalConfirmed).toBeDefined()
      expect(typeof result.current.isApprovalConfirmed).toBe('boolean')
    })

    it('should combine pending states in isApprovePending', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isApprovePending).toBeDefined()
      expect(typeof result.current.isApprovePending).toBe('boolean')
      // Should be false when neither isApproving nor isApproveConfirming is true
      expect(result.current.isApprovePending).toBe(false)
    })
  })

  describe('Connection State', () => {
    it('should track wallet connection', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isConnected).toBeDefined()
      expect(typeof result.current.isConnected).toBe('boolean')
      expect(result.current.isConnected).toBe(true)
    })

    it('should handle disconnected wallet', () => {
      // Mock disconnected state
      vi.mocked(require('wagmi').useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      })

      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should expose error state', () => {
      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.error).toBeNull()
    })

    it('should handle approval errors gracefully', () => {
      // Mock error state
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: new Error('User rejected transaction'),
        isPending: false,
      })

      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      expect(result.current.error).toBe('User rejected transaction')
    })

    it('should throw error when approving without wallet', async () => {
      // Mock disconnected wallet
      vi.mocked(require('wagmi').useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      })

      const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

      await expect(result.current.approveUnlimited()).rejects.toThrow('Wallet not connected')
    })
  })

  describe('Auto-Refetch Behavior', () => {
    it('should refetch allowance when approval is confirmed', async () => {
      const mockRefetch = vi.fn()

      vi.mocked(require('wagmi').useReadContract).mockImplementation((config: any) => {
        if (config.functionName === 'allowance') {
          return {
            data: BigInt('1000000000000000000000'),
            isLoading: false,
            refetch: mockRefetch,
          }
        }
        return { data: MOCK_BALANCE.musd, isLoading: false, refetch: vi.fn() }
      })

      // Mock confirmed approval
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
      })

      renderHook(() => useMusdApprovalV2(), { wrapper })

      // Should trigger refetch after approval confirmation
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })
})

describe('Formatting Helpers', () => {
  describe('formatMUSDFromWei', () => {
    it('should format zero correctly', () => {
      expect(formatMUSDFromWei(BigInt(0))).toBe('0.00')
    })

    it('should format MUSD with two decimals', () => {
      const amount = BigInt('123456789012345678901') // 123.456... MUSD
      const formatted = formatMUSDFromWei(amount)
      expect(formatted).toContain('123')
      expect(formatted).toMatch(/\.\d{2}$/) // Should end with .XX
    })

    it('should format large amounts with commas', () => {
      const amount = BigInt('10000000000000000000000') // 10,000 MUSD
      const formatted = formatMUSDFromWei(amount)
      expect(formatted).toContain(',')
    })

    it('should handle undefined gracefully', () => {
      expect(formatMUSDFromWei(undefined)).toBe('0.00')
    })
  })

  describe('formatMUSDShort', () => {
    it('should format small amounts without suffix', () => {
      const amount = BigInt('500000000000000000000') // 500 MUSD
      const formatted = formatMUSDShort(amount)
      expect(formatted).toBe('500')
    })

    it('should format thousands with K suffix', () => {
      const amount = BigInt('5000000000000000000000') // 5,000 MUSD
      const formatted = formatMUSDShort(amount)
      expect(formatted).toContain('k')
      expect(formatted).toContain('5')
    })

    it('should format very large numbers correctly', () => {
      const amount = BigInt('12500000000000000000000') // 12,500 MUSD
      const formatted = formatMUSDShort(amount)
      expect(formatted).toContain('k')
    })

    it('should handle zero', () => {
      expect(formatMUSDShort(BigInt(0))).toBe('0')
    })

    it('should handle undefined', () => {
      expect(formatMUSDShort(undefined)).toBe('0')
    })
  })

  describe('formatMUSD', () => {
    it('should include MUSD suffix', () => {
      const amount = BigInt('100000000000000000000') // 100 MUSD
      const formatted = formatMUSD(amount)
      expect(formatted).toContain('MUSD')
      expect(formatted).toContain('100')
    })

    it('should format zero with MUSD suffix', () => {
      expect(formatMUSD(BigInt(0))).toBe('0.00 MUSD')
    })

    it('should handle undefined', () => {
      expect(formatMUSD(undefined)).toBe('0.00 MUSD')
    })

    it('should format with proper decimals and currency', () => {
      const amount = BigInt('1234567890123456789012') // 1,234.567... MUSD
      const formatted = formatMUSD(amount)
      expect(formatted).toContain('1,234')
      expect(formatted).toContain('MUSD')
      expect(formatted).toMatch(/\d+\.\d{2} MUSD/)
    })
  })
})

describe('Edge Cases', () => {
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

  it('should handle very large approval amounts', () => {
    const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    expect(() => result.current.isApprovalNeeded(maxUint256)).not.toThrow()
  })

  it('should handle exactly equal allowance and amount', () => {
    const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

    // Current allowance is 1,000 MUSD, check if 1,000 MUSD needs approval
    const needsApproval = result.current.isApprovalNeeded(BigInt('1000000000000000000000'))
    expect(needsApproval).toBe(false) // Equal amounts don't need approval
  })

  it('should handle allowance one wei less than amount', () => {
    const { result } = renderHook(() => useMusdApprovalV2(), { wrapper })

    // Current allowance is 1,000 MUSD, check if 1,000 MUSD + 1 wei needs approval
    const needsApproval = result.current.isApprovalNeeded(BigInt('1000000000000000000001'))
    expect(needsApproval).toBe(true) // Should need approval for even 1 wei more
  })
})
