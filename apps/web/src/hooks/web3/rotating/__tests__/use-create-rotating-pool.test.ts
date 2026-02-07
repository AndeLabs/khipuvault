import { renderHook, act } from "@testing-library/react";
import { parseEther } from "viem";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createWrapper } from "@/test/test-providers";

import {
  useCreateRotatingPool,
  parseContribution,
  daysToSeconds,
  weeksToSeconds,
  monthsToSeconds,
  type CreatePoolParams,
} from "../use-create-rotating-pool";

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

describe("useCreateRotatingPool", () => {
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
    const { result } = renderHook(() => useCreateRotatingPool(), {
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

  it("should have createPool function", () => {
    const { result } = renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createPool).toBe("function");
  });

  it("should call writeContract with correct parameters", () => {
    const { result } = renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    const params: CreatePoolParams = {
      name: "Test ROSCA",
      memberCount: BigInt(12),
      contributionAmount: parseEther("0.01"),
      periodDuration: BigInt(2592000), // 30 days
      autoAdvance: true,
    };

    act(() => {
      result.current.createPool(params);
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: "0x0000000000000000000000000000000000000000",
      abi: expect.any(Array),
      functionName: "createPool",
      args: [
        params.name,
        params.memberCount,
        params.contributionAmount,
        params.periodDuration,
        params.autoAdvance,
      ],
    });
  });

  it("should handle write pending state", () => {
    mockUseWriteContract.mockReturnValue({
      data: "0x123abc",
      isPending: true,
      writeContract: mockWriteContract,
      error: null,
    });

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    const { result } = renderHook(() => useCreateRotatingPool(), {
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

    renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    // Should invalidate pool counter and pools list
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pool-counter"],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["rotating-pools"],
    });
  });

  it("should accept all CreatePoolParams properties", () => {
    const { result } = renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    const params: CreatePoolParams = {
      name: "Community Savings",
      memberCount: BigInt(24),
      contributionAmount: BigInt("5000000000000000000"),
      periodDuration: BigInt(604800), // 1 week
      autoAdvance: false,
    };

    act(() => {
      result.current.createPool(params);
    });

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [
          "Community Savings",
          BigInt(24),
          BigInt("5000000000000000000"),
          BigInt(604800),
          false,
        ],
      })
    );
  });

  it("should handle minimum valid values", () => {
    const { result } = renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    const params: CreatePoolParams = {
      name: "Min",
      memberCount: BigInt(3),
      contributionAmount: BigInt("1000000000000000"), // 0.001 BTC
      periodDuration: BigInt(86400), // 1 day
      autoAdvance: true,
    };

    act(() => {
      result.current.createPool(params);
    });

    expect(mockWriteContract).toHaveBeenCalled();
  });

  it("should handle maximum valid values", () => {
    const { result } = renderHook(() => useCreateRotatingPool(), {
      wrapper: createWrapper(),
    });

    const params: CreatePoolParams = {
      name: "Maximum Pool with Very Long Name for Testing",
      memberCount: BigInt(50),
      contributionAmount: BigInt("10000000000000000000"), // 10 BTC
      periodDuration: BigInt(7776000), // 90 days
      autoAdvance: false,
    };

    act(() => {
      result.current.createPool(params);
    });

    expect(mockWriteContract).toHaveBeenCalled();
  });
});

describe("parseContribution", () => {
  it("should convert ETH string to wei correctly", () => {
    expect(parseContribution("1")).toBe(parseEther("1"));
    expect(parseContribution("0.1")).toBe(parseEther("0.1"));
    expect(parseContribution("0.01")).toBe(parseEther("0.01"));
    expect(parseContribution("0.001")).toBe(parseEther("0.001"));
  });

  it("should handle decimal values", () => {
    const result = parseContribution("1.5");
    expect(result).toBe(BigInt("1500000000000000000"));
  });

  it("should handle very small values", () => {
    const result = parseContribution("0.000001");
    expect(result).toBe(BigInt("1000000000000"));
  });

  it("should handle large values", () => {
    const result = parseContribution("100");
    expect(result).toBe(BigInt("100000000000000000000"));
  });

  it("should return parseEther result", () => {
    const amount = "2.5";
    expect(parseContribution(amount)).toEqual(parseEther(amount));
  });
});

describe("daysToSeconds", () => {
  it("should convert 1 day to seconds", () => {
    expect(daysToSeconds(1)).toBe(BigInt(86400));
  });

  it("should convert 7 days to seconds", () => {
    expect(daysToSeconds(7)).toBe(BigInt(604800));
  });

  it("should convert 30 days to seconds", () => {
    expect(daysToSeconds(30)).toBe(BigInt(2592000));
  });

  it("should convert 90 days to seconds", () => {
    expect(daysToSeconds(90)).toBe(BigInt(7776000));
  });

  it("should handle 0 days", () => {
    expect(daysToSeconds(0)).toBe(BigInt(0));
  });

  it("should use correct calculation (24 * 60 * 60)", () => {
    const days = 5;
    const expected = BigInt(days * 24 * 60 * 60);
    expect(daysToSeconds(days)).toBe(expected);
  });
});

describe("weeksToSeconds", () => {
  it("should convert 1 week to seconds", () => {
    expect(weeksToSeconds(1)).toBe(BigInt(604800));
  });

  it("should convert 2 weeks to seconds", () => {
    expect(weeksToSeconds(2)).toBe(BigInt(1209600));
  });

  it("should convert 4 weeks to seconds", () => {
    expect(weeksToSeconds(4)).toBe(BigInt(2419200));
  });

  it("should handle 0 weeks", () => {
    expect(weeksToSeconds(0)).toBe(BigInt(0));
  });

  it("should use correct calculation (7 * 24 * 60 * 60)", () => {
    const weeks = 3;
    const expected = BigInt(weeks * 7 * 24 * 60 * 60);
    expect(weeksToSeconds(weeks)).toBe(expected);
  });
});

describe("monthsToSeconds", () => {
  it("should convert 1 month to seconds (30 days)", () => {
    expect(monthsToSeconds(1)).toBe(BigInt(2592000));
  });

  it("should convert 2 months to seconds", () => {
    expect(monthsToSeconds(2)).toBe(BigInt(5184000));
  });

  it("should convert 3 months to seconds", () => {
    expect(monthsToSeconds(3)).toBe(BigInt(7776000));
  });

  it("should convert 6 months to seconds", () => {
    expect(monthsToSeconds(6)).toBe(BigInt(15552000));
  });

  it("should handle 0 months", () => {
    expect(monthsToSeconds(0)).toBe(BigInt(0));
  });

  it("should use 30-day approximation", () => {
    const months = 1;
    const expected = BigInt(months * 30 * 24 * 60 * 60);
    expect(monthsToSeconds(months)).toBe(expected);
  });

  it("should be consistent with 30 days calculation", () => {
    expect(monthsToSeconds(1)).toBe(daysToSeconds(30));
    expect(monthsToSeconds(2)).toBe(daysToSeconds(60));
    expect(monthsToSeconds(3)).toBe(daysToSeconds(90));
  });
});

describe("utility functions integration", () => {
  it("should allow combining different time units", () => {
    const days15 = daysToSeconds(15);
    const weeks2 = weeksToSeconds(2);
    const months1 = monthsToSeconds(1);

    expect(days15).toBe(BigInt(1296000));
    expect(weeks2).toBe(BigInt(1209600));
    expect(months1).toBe(BigInt(2592000));
  });

  it("should match expected durations for common periods", () => {
    // Daily pool
    expect(daysToSeconds(1)).toBe(BigInt(86400));

    // Weekly pool
    expect(weeksToSeconds(1)).toBe(BigInt(604800));

    // Monthly pool
    expect(monthsToSeconds(1)).toBe(BigInt(2592000));
  });
});
