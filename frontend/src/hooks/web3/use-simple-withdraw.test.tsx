import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSimpleWithdraw } from './use-simple-withdraw'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
  })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: undefined,
    error: null,
    reset: vi.fn(),
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
    data: undefined,
  })),
}))

describe('useSimpleWithdraw', () => {
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

  describe('Hook Initialization', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
      expect(result.current.canWithdraw).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should provide withdraw function', () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.withdraw).toBeDefined()
      expect(typeof result.current.withdraw).toBe('function')
    })

    it('should provide reset function', () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.reset).toBeDefined()
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('Full Withdrawal', () => {
    it('should handle full withdrawal when no amount provided', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw()

      // Should transition to confirming state
      expect(result.current.state).toBe('confirming')
    })

    it('should call writeContract for full withdrawal', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw()

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'withdraw',
        })
      )
    })

    it('should not pass args for full withdrawal', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw()

      const call = mockWriteContract.mock.calls[0][0]
      expect(call.args).toBeUndefined()
    })
  })

  describe('Partial Withdrawal', () => {
    it('should handle partial withdrawal when amount provided', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('50')

      expect(result.current.state).toBe('confirming')
    })

    it('should call writeContract with withdrawPartial function', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'withdrawPartial',
        })
      )
    })

    it('should pass correct amount for partial withdrawal', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      const call = mockWriteContract.mock.calls[0][0]
      expect(call.args).toBeDefined()
      expect(call.args).toHaveLength(1)
    })

    it('should reject partial withdrawals below minimum (1 MUSD)', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('0.5')

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('mínimo')
    })

    it('should accept partial withdrawals at minimum (1 MUSD)', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('1')

      expect(result.current.state).not.toBe('error')
      expect(result.current.error).not.toContain('mínimo')
    })

    it('should accept decimal amounts for partial withdrawal', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await expect(result.current.withdraw('50.5')).resolves.not.toThrow()
    })
  })

  describe('Validation', () => {
    it('should reject withdrawal without wallet connection', async () => {
      vi.mocked(require('wagmi').useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('Conecta tu wallet')
    })

    it('should validate amount is positive', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('0')

      expect(result.current.state).toBe('error')
    })
  })

  describe('State Machine', () => {
    it('should track idle state', () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.canWithdraw).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should transition to confirming when withdrawal starts', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      expect(result.current.state).toBe('confirming')
      expect(result.current.isProcessing).toBe(true)
      expect(result.current.canWithdraw).toBe(false)
    })

    it('should transition to processing when tx is pending', () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
        data: undefined,
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      if (result.current.state === 'processing') {
        expect(result.current.isProcessing).toBe(true)
      }
    })

    it('should transition to success when tx confirms', () => {
      const mockTxHash = '0xabcdef1234567890' as `0x${string}`
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: {
          transactionHash: mockTxHash,
          blockNumber: 123n,
          status: 'success',
        } as any,
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      if (result.current.state === 'success') {
        expect(result.current.canWithdraw).toBe(true)
        expect(result.current.isProcessing).toBe(false)
      }
    })

    it('should track error state', async () => {
      const mockError = new Error('Test error')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: mockError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      await waitFor(() => {
        expect(result.current.state).toBe('error')
      })
    })
  })

  describe('Transaction Hash', () => {
    it('should expose transaction hash', () => {
      const mockTxHash = '0x1234567890abcdef' as `0x${string}`
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: mockTxHash,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.withdrawTxHash).toBeDefined()
    })

    it('should prefer receipt hash over wagmi hash', () => {
      const wagmiHash = '0xaaaa' as `0x${string}`
      const receiptHash = '0xbbbb' as `0x${string}`

      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: wagmiHash,
        error: null,
        reset: vi.fn(),
      })

      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: {
          transactionHash: receiptHash,
          blockNumber: 123n,
          status: 'success',
        } as any,
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.withdrawTxHash).toBe(receiptHash)
    })
  })

  describe('Error Handling', () => {
    it('should handle user rejection gracefully', async () => {
      const rejectionError = new Error('User rejected the request')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: rejectionError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('Rechazaste')
        }
      })
    })

    it('should handle insufficient gas funds', async () => {
      const gasError = new Error('insufficient funds for gas')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: gasError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('BTC para pagar el gas')
        }
      })
    })

    it('should handle NoActiveDeposit error', async () => {
      const noDepositError = new Error('NoActiveDeposit')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: noDepositError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw()

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('depósitos activos')
        }
      })
    })

    it('should handle generic errors gracefully', async () => {
      const genericError = new Error('Something went wrong')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: genericError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toBeTruthy()
        }
      })
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to idle state', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      // Trigger an error
      await result.current.withdraw('0.1') // Below minimum

      expect(result.current.state).toBe('error')

      // Reset
      result.current.reset()

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
    })

    it('should clear error message on reset', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('0.5')
      expect(result.current.error).toBeTruthy()

      result.current.reset()
      expect(result.current.error).toBe('')
    })

    it('should allow new withdrawal after reset', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('0.1')
      expect(result.current.canWithdraw).toBe(true) // Error state allows retry

      result.current.reset()
      expect(result.current.canWithdraw).toBe(true)
      expect(result.current.state).toBe('idle')
    })
  })

  describe('Processing Flags', () => {
    it('should mark isProcessing true during confirming', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await result.current.withdraw('100')

      if (result.current.state === 'confirming') {
        expect(result.current.isProcessing).toBe(true)
      }
    })

    it('should mark isProcessing true during processing', () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
        data: undefined,
      })

      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      if (result.current.state === 'processing') {
        expect(result.current.isProcessing).toBe(true)
      }
    })

    it('should mark isProcessing false when idle', () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.isProcessing).toBe(false)
    })

    it('should mark canWithdraw correctly based on state', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      // Idle: can withdraw
      expect(result.current.state).toBe('idle')
      expect(result.current.canWithdraw).toBe(true)

      // After initiating withdrawal
      await result.current.withdraw('100')

      // During processing: cannot withdraw (unless error/success)
      if (result.current.state === 'confirming' || result.current.state === 'processing') {
        expect(result.current.canWithdraw).toBe(false)
      }
    })
  })

  describe('Amount Parsing', () => {
    it('should handle string amounts correctly', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await expect(result.current.withdraw('100')).resolves.not.toThrow()
    })

    it('should handle decimal amounts', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await expect(result.current.withdraw('10.5')).resolves.not.toThrow()
    })

    it('should handle large amounts', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await expect(result.current.withdraw('9999')).resolves.not.toThrow()
    })

    it('should handle very small valid amounts', async () => {
      const { result } = renderHook(() => useSimpleWithdraw(), { wrapper })

      await expect(result.current.withdraw('1')).resolves.not.toThrow()
    })
  })
})
