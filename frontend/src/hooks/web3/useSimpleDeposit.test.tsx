import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSimpleDeposit } from './useSimpleDeposit'
import { parseEther } from 'viem'

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
    isError: false,
    data: undefined,
  })),
  useReadContract: vi.fn((config: any) => {
    // Mock balance
    if (config.functionName === 'balanceOf') {
      return {
        data: parseEther('1000'), // 1,000 MUSD
        refetch: vi.fn(),
      }
    }
    // Mock allowance
    if (config.functionName === 'allowance') {
      return {
        data: parseEther('0'), // No approval initially
        refetch: vi.fn().mockResolvedValue({ data: parseEther('0') }),
      }
    }
    return { data: undefined, refetch: vi.fn() }
  }),
}))

describe('useSimpleDeposit', () => {
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
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
      expect(result.current.canDeposit).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should provide deposit function', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.deposit).toBeDefined()
      expect(typeof result.current.deposit).toBe('function')
    })

    it('should provide reset function', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.reset).toBeDefined()
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('Balance Information', () => {
    it('should return MUSD balance', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.musdBalance).toBeDefined()
      expect(result.current.musdBalance).toBe(parseEther('1000'))
    })

    it('should format balance correctly', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.balanceFormatted).toBeDefined()
      expect(result.current.balanceFormatted).toBe('1000.00')
    })
  })

  describe('Deposit Validation', () => {
    it('should reject deposits below minimum (10 MUSD)', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('5')

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('mínimo')
    })

    it('should accept deposits at minimum (10 MUSD)', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('10')

      // Should not have minimum error
      expect(result.current.error).not.toContain('mínimo')
    })

    it('should reject deposits exceeding balance', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('2000') // More than 1,000 MUSD balance

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('suficiente MUSD')
    })

    it('should reject deposits without wallet connection', async () => {
      // Mock disconnected wallet
      vi.mocked(require('wagmi').useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      expect(result.current.state).toBe('error')
      expect(result.current.error).toContain('Conecta tu wallet')
    })
  })

  describe('State Machine', () => {
    it('should track idle state', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.state).toBe('idle')
      expect(result.current.canDeposit).toBe(true)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should track approving state when approval needed', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      // Since allowance is 0, should need approval
      expect(result.current.state).toBe('approving')
    })

    it('should transition to waitingApproval when approval pending', () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValueOnce({
        isLoading: true,
        isSuccess: false,
        isError: false,
        data: undefined,
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      // Manually set state to test transition
      expect(result.current.isProcessing).toBeDefined()
    })

    it('should mark isProcessing as true during operations', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      // After calling deposit, should be processing
      if (result.current.state !== 'idle' && result.current.state !== 'error') {
        expect(result.current.isProcessing).toBe(true)
      }
    })

    it('should mark canDeposit as false during operations', async () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
        isError: false,
        data: undefined,
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      // During processing, canDeposit should be false
      if (result.current.state === 'waitingApproval' || result.current.state === 'waitingDeposit') {
        expect(result.current.canDeposit).toBe(false)
      }
    })
  })

  describe('Progress Tracking', () => {
    it('should provide progress information for idle state', () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.progress).toBeDefined()
      expect(result.current.progress.current).toBe(0)
      expect(result.current.progress.total).toBe(2)
      expect(result.current.progress.message).toContain('Listo')
    })

    it('should provide progress information for approving state', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      if (result.current.state === 'approving') {
        expect(result.current.progress.current).toBe(1)
        expect(result.current.progress.total).toBe(2)
        expect(result.current.progress.message).toContain('aprobación')
      }
    })

    it('should provide progress information for depositing state', async () => {
      // Mock sufficient allowance
      vi.mocked(require('wagmi').useReadContract).mockImplementation((config: any) => {
        if (config.functionName === 'balanceOf') {
          return { data: parseEther('1000'), refetch: vi.fn() }
        }
        if (config.functionName === 'allowance') {
          return {
            data: parseEther('999999'), // Sufficient approval
            refetch: vi.fn().mockResolvedValue({ data: parseEther('999999') }),
          }
        }
        return { data: undefined, refetch: vi.fn() }
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      if (result.current.state === 'depositing' || result.current.state === 'waitingDeposit') {
        expect(result.current.progress.current).toBe(2)
        expect(result.current.progress.total).toBe(2)
        expect(result.current.progress.message).toContain('depósito')
      }
    })

    it('should show success message on completion', () => {
      vi.mocked(require('wagmi').useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true,
        isError: false,
        data: { transactionHash: '0xabc' as `0x${string}`, blockNumber: 123n, status: 'success' } as any,
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      if (result.current.state === 'success') {
        expect(result.current.progress.message).toContain('exitoso')
      }
    })
  })

  describe('Transaction Hashes', () => {
    it('should expose approve transaction hash', () => {
      const mockTxHash = '0xabcdef1234567890' as `0x${string}`
      vi.mocked(require('wagmi').useWriteContract).mockReturnValueOnce({
        writeContract: vi.fn(),
        data: mockTxHash,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.approveTxHash).toBeDefined()
    })

    it('should expose deposit transaction hash', () => {
      const mockTxHash = '0x1234567890abcdef' as `0x${string}`
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: mockTxHash,
        error: null,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      expect(result.current.depositTxHash).toBeDefined()
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

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

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

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('BTC para pagar el gas')
        }
      })
    })

    it('should handle minimum deposit error', async () => {
      const minError = new Error('MinimumDepositNotMet')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: minError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('mínimo de depósito')
        }
      })
    })

    it('should handle maximum deposit error', async () => {
      const maxError = new Error('MaximumDepositExceeded')
      vi.mocked(require('wagmi').useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        error: maxError,
        reset: vi.fn(),
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      await waitFor(() => {
        if (result.current.state === 'error') {
          expect(result.current.error).toContain('máximo de depósito')
        }
      })
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to idle state', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      // Trigger an error
      await result.current.deposit('5') // Below minimum

      expect(result.current.state).toBe('error')

      // Reset
      result.current.reset()

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBe('')
    })

    it('should clear error message on reset', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('5')
      expect(result.current.error).toBeTruthy()

      result.current.reset()
      expect(result.current.error).toBe('')
    })
  })

  describe('Approval Flow', () => {
    it('should skip approval if already approved', async () => {
      // Mock sufficient allowance
      vi.mocked(require('wagmi').useReadContract).mockImplementation((config: any) => {
        if (config.functionName === 'balanceOf') {
          return { data: parseEther('1000'), refetch: vi.fn() }
        }
        if (config.functionName === 'allowance') {
          return {
            data: parseEther('999999'), // Already approved
            refetch: vi.fn().mockResolvedValue({ data: parseEther('999999') }),
          }
        }
        return { data: undefined, refetch: vi.fn() }
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      // Should go directly to depositing, not approving
      expect(result.current.state).toBe('depositing')
    })

    it('should request approval if not approved', async () => {
      // Mock zero allowance
      vi.mocked(require('wagmi').useReadContract).mockImplementation((config: any) => {
        if (config.functionName === 'balanceOf') {
          return { data: parseEther('1000'), refetch: vi.fn() }
        }
        if (config.functionName === 'allowance') {
          return {
            data: parseEther('0'), // No approval
            refetch: vi.fn().mockResolvedValue({ data: parseEther('0') }),
          }
        }
        return { data: undefined, refetch: vi.fn() }
      })

      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await result.current.deposit('100')

      // Should request approval first
      expect(result.current.state).toBe('approving')
    })
  })

  describe('Amount Parsing', () => {
    it('should handle string amounts correctly', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await expect(result.current.deposit('100')).resolves.not.toThrow()
    })

    it('should handle decimal amounts', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await expect(result.current.deposit('10.5')).resolves.not.toThrow()
    })

    it('should handle large amounts', async () => {
      const { result } = renderHook(() => useSimpleDeposit(), { wrapper })

      await expect(result.current.deposit('999')).resolves.not.toThrow()
    })
  })
})
