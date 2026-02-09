import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createWrapper } from "@/test/test-providers";

import {
  useJoinRotatingPool,
  useContributeToPool,
  useClaimPayout,
} from "../use-join-rotating-pool";

// Mock data
const MOCK_POOL_ID = BigInt(1);
const MOCK_CONTRIBUTION_AMOUNT = BigInt("10000000000000000"); // 0.01 BTC

// Mock wagmi hooks
const mockWriteContract = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseWriteContract = vi.fn();
const mockUseWaitForTransactionReceipt = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useWriteContract: () => mockUseWriteContract(),
    useWaitForTransactionReceipt: (args: unknown) => mockUseWaitForTransactionReceipt(args),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      invalidateQueries: mockInvalidateQueries,
    })),
  };
});

describe("useJoinRotatingPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.hash).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isWritePending).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isConfirmed).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should have joinPool function", () => {
    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.joinPool).toBe("function");
  });

  it("should call writeContract with correct parameters", () => {
    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.joinPool();
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: "joinPool",
      args: [MOCK_POOL_ID],
    });
  });

  it("should throw error if poolId is undefined", () => {
    const { result } = renderHook(() => useJoinRotatingPool(undefined), {
      wrapper: createWrapper(),
    });

    expect(() => {
      act(() => {
        result.current.joinPool();
      });
    }).toThrow("Pool ID is required");
  });

  it("should handle write pending state", () => {
    mockUseWriteContract.mockReturnValue({
      data: "0x123abc",
      isPending: true,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isWritePending).toBe(true);
  });

  it("should handle confirming state", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
      error: null,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isConfirming).toBe(true);
  });

  it("should handle confirmed state", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });

  it("should return transaction hash", () => {
    const mockHash = "0x123abc456def";
    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.hash).toBe(mockHash);
  });

  it("should handle write errors", () => {
    const mockError = new Error("User rejected transaction");
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: mockError,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should handle confirmation errors", () => {
    const mockError = new Error("Transaction reverted");
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: mockError,
    });

    const { result } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should invalidate queries on success", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    // Should invalidate pool info, member info, and pools list
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-member", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pools"],
    });
  });

  it("should not invalidate queries when poolId is undefined", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useJoinRotatingPool(undefined), {
      wrapper: createWrapper(),
    });

    // Should not call invalidateQueries with undefined poolId
    expect(mockInvalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["rotating-pool", undefined],
    });
  });
});

describe("useContributeToPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.hash).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isWritePending).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isConfirmed).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should have contribute function", () => {
    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.contribute).toBe("function");
  });

  it("should call writeContract with correct parameters including value", () => {
    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.contribute(MOCK_CONTRIBUTION_AMOUNT);
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: "contribute",
      args: [MOCK_POOL_ID],
      value: MOCK_CONTRIBUTION_AMOUNT,
    });
  });

  it("should throw error if poolId is undefined", () => {
    const { result } = renderHook(() => useContributeToPool(undefined), {
      wrapper: createWrapper(),
    });

    expect(() => {
      act(() => {
        result.current.contribute(MOCK_CONTRIBUTION_AMOUNT);
      });
    }).toThrow("Pool ID is required");
  });

  it("should accept different contribution amounts", () => {
    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    const amounts = [
      BigInt("1000000000000000"), // 0.001 BTC
      BigInt("10000000000000000"), // 0.01 BTC
      BigInt("100000000000000000"), // 0.1 BTC
      BigInt("1000000000000000000"), // 1 BTC
    ];

    amounts.forEach((amount) => {
      act(() => {
        result.current.contribute(amount);
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          value: amount,
        })
      );
    });
  });

  it("should handle write pending state", () => {
    mockUseWriteContract.mockReturnValue({
      data: "0x123abc",
      isPending: true,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isWritePending).toBe(true);
  });

  it("should handle confirmed state", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });

  it("should invalidate queries on success", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    // Should invalidate pool info, member info, and period info
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-member", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-period", MOCK_POOL_ID],
    });
  });

  it("should handle errors", () => {
    const mockError = new Error("Insufficient funds");
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: mockError,
    });

    const { result } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });
});

describe("useClaimPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.hash).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isWritePending).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isConfirmed).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should have claimPayout function", () => {
    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.claimPayout).toBe("function");
  });

  it("should call writeContract with correct parameters", () => {
    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.claimPayout();
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: expect.any(String),
      abi: expect.any(Array),
      functionName: "claimPayout",
      args: [MOCK_POOL_ID],
    });
  });

  it("should throw error if poolId is undefined", () => {
    const { result } = renderHook(() => useClaimPayout(undefined), {
      wrapper: createWrapper(),
    });

    expect(() => {
      act(() => {
        result.current.claimPayout();
      });
    }).toThrow("Pool ID is required");
  });

  it("should handle write pending state", () => {
    mockUseWriteContract.mockReturnValue({
      data: "0x123abc",
      isPending: true,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isWritePending).toBe(true);
  });

  it("should handle confirming state", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
      error: null,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isConfirming).toBe(true);
  });

  it("should handle confirmed state", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });

  it("should return transaction hash", () => {
    const mockHash = "0xabcdef123456";
    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.hash).toBe(mockHash);
  });

  it("should handle write errors", () => {
    const mockError = new Error("Not eligible for payout");
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: mockError,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should handle confirmation errors", () => {
    const mockError = new Error("Transaction failed");
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: mockError,
    });

    const { result } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should invalidate queries on success", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    // Should invalidate pool info, member info, and period info
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-member", MOCK_POOL_ID],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-period", MOCK_POOL_ID],
    });
  });

  it("should not invalidate queries when poolId is undefined", () => {
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useClaimPayout(undefined), {
      wrapper: createWrapper(),
    });

    // Should not call invalidateQueries with undefined poolId
    expect(mockInvalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["rotating-pool", undefined],
    });
  });
});

describe("All hooks integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      isPending: false,
      writeContract: mockWriteContract,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: null,
    });
  });

  it("should follow typical ROSCA lifecycle", () => {
    // 1. Join pool
    const { result: joinResult } = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      joinResult.current.joinPool();
    });

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "joinPool",
      })
    );

    // 2. Contribute to pool
    const { result: contributeResult } = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      contributeResult.current.contribute(MOCK_CONTRIBUTION_AMOUNT);
    });

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "contribute",
        value: MOCK_CONTRIBUTION_AMOUNT,
      })
    );

    // 3. Claim payout when eligible
    const { result: claimResult } = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      claimResult.current.claimPayout();
    });

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "claimPayout",
      })
    );
  });

  it("all hooks should have consistent return structure", () => {
    const joinHook = renderHook(() => useJoinRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });
    const contributeHook = renderHook(() => useContributeToPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });
    const claimHook = renderHook(() => useClaimPayout(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    const commonKeys = [
      "hash",
      "isPending",
      "isWritePending",
      "isConfirming",
      "isConfirmed",
      "isSuccess",
      "error",
    ];

    commonKeys.forEach((key) => {
      expect(joinHook.result.current).toHaveProperty(key);
      expect(contributeHook.result.current).toHaveProperty(key);
      expect(claimHook.result.current).toHaveProperty(key);
    });
  });
});
