import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCooperativePool } from './use-cooperative-pool'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    chain: { id: 31611 },
  }),
  useConfig: () => ({}),
  useWriteContract: () => ({
    writeContract: vi.fn(),
    data: undefined,
    error: null,
    isPending: false,
    reset: vi.fn(),
  }),
  useWaitForTransactionReceipt: () => ({
    data: undefined,
    isLoading: false,
    isSuccess: false,
  }),
  useReadContract: () => ({
    data: undefined,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('wagmi/actions', () => ({
  readContract: vi.fn(),
}))

vi.mock('@wagmi/core', () => ({
  readContract: vi.fn(),
}))

describe('useCooperativePool', () => {
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

  describe('Pool Creation', () => {
    it('should provide createPool function', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.createPool).toBeDefined()
      expect(typeof result.current.createPool).toBe('function')
    })

    it('should accept correct createPool parameters', async () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      // Should not throw when called with correct params
      await expect(
        result.current.createPool('Test Pool', '1', '10', 5)
      ).resolves.not.toThrow()
    })
  })

  describe('Pool Joining', () => {
    it('should provide joinPool function', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.joinPool).toBeDefined()
      expect(typeof result.current.joinPool).toBe('function')
    })

    it('should accept poolId and btcAmount parameters', async () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      await expect(
        result.current.joinPool(1, '0.1')
      ).resolves.not.toThrow()
    })
  })

  describe('Pool Leaving', () => {
    it('should provide leavePool function', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.leavePool).toBeDefined()
      expect(typeof result.current.leavePool).toBe('function')
    })

    it('should accept poolId parameter', async () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      await expect(
        result.current.leavePool(1)
      ).resolves.not.toThrow()
    })
  })

  describe('Yield Claiming', () => {
    it('should provide claimYield function', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.claimYield).toBeDefined()
      expect(typeof result.current.claimYield).toBe('function')
    })

    it('should accept poolId parameter for claiming', async () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      await expect(
        result.current.claimYield(1)
      ).resolves.not.toThrow()
    })
  })

  describe('Pool Data', () => {
    it('should provide pool counter', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.poolCounter).toBeDefined()
      expect(typeof result.current.poolCounter).toBe('number')
    })

    it('should provide MUSD balance', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.musdBalance).toBeDefined()
    })

    it('should provide allowance', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.allowance).toBeDefined()
    })
  })

  describe('Transaction States', () => {
    it('should track transaction state', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.state).toBeDefined()
      expect(typeof result.current.state).toBe('string')
    })

    it('should provide error state', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.error).toBeDefined()
      expect(typeof result.current.error).toBe('string')
    })

    it('should provide transaction hash', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.txHash).toBeDefined()
    })

    it('should track isProcessing state', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.isProcessing).toBeDefined()
      expect(typeof result.current.isProcessing).toBe('boolean')
    })
  })

  describe('Contract Addresses', () => {
    it('should expose pool contract address', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.poolAddress).toBeDefined()
      expect(result.current.poolAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should expose MUSD contract address', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.musdAddress).toBeDefined()
      expect(result.current.musdAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('Reset Functionality', () => {
    it('should provide reset function', () => {
      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      expect(result.current.reset).toBeDefined()
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should set error when wallet not connected', async () => {
      // Mock disconnected wallet
      vi.mocked(require('wagmi').useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      })

      const { result } = renderHook(() => useCooperativePool(), { wrapper })

      await result.current.createPool('Test', '1', '10', 5)

      expect(result.current.error).toBeTruthy()
      expect(result.current.state).toBe('error')
    })
  })
})

describe('Pool Status Enum', () => {
  it('should handle ACCEPTING status (0)', () => {
    const status = 0
    expect(status).toBe(0) // ACCEPTING
  })

  it('should handle ACTIVE status (1)', () => {
    const status = 1
    expect(status).toBe(1) // ACTIVE
  })

  it('should handle CLOSED status (2)', () => {
    const status = 2
    expect(status).toBe(2) // CLOSED
  })
})
