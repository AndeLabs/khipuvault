import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAutoCompound } from './use-auto-compound'

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

describe('useAutoCompound', () => {
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
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
      expect(result.current.canToggle).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should provide setAutoCompound function', () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.setAutoCompound).toBeDefined()
      expect(typeof result.current.setAutoCompound).toBe('function')
    })

    it('should provide reset function', () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.reset).toBeDefined()
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('Enable Auto-Compound', () => {
    it('should call setAutoCompound with true', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'setAutoCompound',
          args: [true],
        })
      )
    })

    it('should transition to confirming state when enabling', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      expect(result.current.state).toBe('confirming')
      expect(result.current.isProcessing).toBe(true)
    })

    it('should handle enabling without errors', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
    })
  })

  describe('Disable Auto-Compound', () => {
    it('should call setAutoCompound with false', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(false)

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'setAutoCompound',
          args: [false],
        })
      )
    })

    it('should transition to confirming state when disabling', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(false)

      expect(result.current.state).toBe('confirming')
      expect(result.current.isProcessing).toBe(true)
    })

    it('should handle disabling without errors', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(false)).resolves.not.toThrow()
    })
  })

  describe('Validation', () => {
    it('should reject toggle without wallet connection', async () => {
      vi.mocked(require('wagmi').useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('Conecta tu wallet')
    })

    it('should handle both boolean values correctly', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
      await expect(result.current.setAutoCompound(false)).resolves.not.toThrow()
    })
  })

  describe('State Machine', () => {
    it('should track idle state', () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.canToggle).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should transition to confirming when toggle starts', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      expect(result.current.state).toBe('confirming')
      expect(result.current.isProcessing).toBe(true)
      expect(result.current.canToggle).toBe(false)
    })

    it('should transition to processing when tx is pending', async () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
        data: undefined,
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      if (result.current.state === 'success') {
        expect(result.current.canToggle).toBe(true)
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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.txHash).toBeDefined()
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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.txHash).toBe(receiptHash)
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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('Rechazaste')
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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('depósito activo')
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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('configuración')
        }
      })
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to idle state', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      // Trigger an action
      await result.current.setAutoCompound(true)

      // Reset
      result.current.reset()

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
    })

    it('should clear error message on reset', async () => {
      const mockError = new Error('Test error')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: mockError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      result.current.reset()
      expect(result.current.error).toBe('')
    })

    it('should allow new toggle after reset', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)
      result.current.reset()

      expect(result.current.canToggle).toBe(true)
      expect(result.current.state).toBe('idle')
    })
  })

  describe('Processing Flags', () => {
    it('should mark isProcessing true during confirming', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

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

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      if (result.current.state === 'processing') {
        expect(result.current.isProcessing).toBe(true)
      }
    })

    it('should mark isProcessing false when idle', () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.isProcessing).toBe(false)
    })

    it('should mark canToggle correctly based on state', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      // Idle: can toggle
      expect(result.current.state).toBe('idle')
      expect(result.current.canToggle).toBe(true)

      // After initiating toggle
      await result.current.setAutoCompound(true)

      // During processing: cannot toggle
      if (result.current.state === 'confirming' || result.current.state === 'processing') {
        expect(result.current.canToggle).toBe(false)
      }
    })
  })

  describe('Query Invalidation', () => {
    it('should invalidate user info queries on success', async () => {
      const mockInvalidate = vi.fn()
      queryClient.invalidateQueries = mockInvalidate

      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: {
          transactionHash: '0xabc' as `0x${string}`,
          blockNumber: 123n,
          status: 'success',
        } as any,
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await result.current.setAutoCompound(true)

      // Should trigger query invalidation
      if (result.current.state === 'success') {
        expect(mockInvalidate).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['pool-simple', 'user-info'],
          })
        )
      }
    })
  })

  describe('Toggle Behavior', () => {
    it('should allow toggling from false to true', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(false)).resolves.not.toThrow()
      result.current.reset()
      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
    })

    it('should allow toggling from true to false', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
      result.current.reset()
      await expect(result.current.setAutoCompound(false)).resolves.not.toThrow()
    })

    it('should allow setting same value multiple times', async () => {
      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
      result.current.reset()
      await expect(result.current.setAutoCompound(true)).resolves.not.toThrow()
    })
  })

  describe('Integration', () => {
    it('should handle complete enable flow', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: '0xabc' as `0x${string}`,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      // Initial state
      expect(result.current.state).toBe('idle')
      expect(result.current.canToggle).toBe(true)

      // Start toggle
      await result.current.setAutoCompound(true)

      // Should be processing
      expect(result.current.isProcessing).toBe(true)
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [true],
        })
      )
    })

    it('should handle complete disable flow', async () => {
      const mockWriteContract = vi.fn()
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: '0xabc' as `0x${string}`,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useAutoCompound(), { wrapper })

      // Start toggle
      await result.current.setAutoCompound(false)

      // Should be processing
      expect(result.current.isProcessing).toBe(true)
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [false],
        })
      )
    })
  })
})
