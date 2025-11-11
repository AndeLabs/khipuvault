import { vi } from 'vitest'

/**
 * Mock Wagmi hooks for testing
 */

export const mockUseAccount = vi.fn(() => ({
  address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
  isReconnecting: false,
  connector: undefined,
  chain: {
    id: 31611,
    name: 'Mezo Testnet',
  },
}))

export const mockUseReadContract = vi.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}))

export const mockUseWriteContract = vi.fn(() => ({
  writeContract: vi.fn(),
  writeContractAsync: vi.fn(),
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  isPending: false,
  isSuccess: false,
}))

export const mockUseWaitForTransactionReceipt = vi.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  isSuccess: false,
}))

export const mockUseBalance = vi.fn(() => ({
  data: {
    decimals: 18,
    formatted: '1.0',
    symbol: 'ETH',
    value: BigInt('1000000000000000000'),
  },
  isLoading: false,
  isError: false,
}))

// Setup mocks
export function setupWagmiMocks() {
  vi.mock('wagmi', () => ({
    useAccount: mockUseAccount,
    useReadContract: mockUseReadContract,
    useWriteContract: mockUseWriteContract,
    useWaitForTransactionReceipt: mockUseWaitForTransactionReceipt,
    useBalance: mockUseBalance,
    useConfig: vi.fn(() => ({})),
  }))
}
