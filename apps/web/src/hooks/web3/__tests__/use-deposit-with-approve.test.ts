import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createWrapper } from "@/test/test-providers";

import { useDepositWithApprove } from "../use-deposit-with-approve";

// Mock wagmi hooks
const mockWriteContract = vi.fn();
const mockReset = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      isConnected: true,
    })),
    useWriteContract: vi.fn(() => ({
      writeContract: mockWriteContract,
      data: undefined,
      reset: mockReset,
      isPending: false,
      error: null,
    })),
    useWaitForTransactionReceipt: vi.fn(() => ({
      isLoading: false,
      isSuccess: false,
      data: undefined,
    })),
    useConfig: vi.fn(() => ({})),
  };
});

// Mock wagmi/actions
vi.mock("wagmi/actions", () => ({
  readContract: vi.fn(() => Promise.resolve(BigInt(0))),
}));

describe("useDepositWithApprove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial idle state", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.step).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.depositHash).toBeUndefined();
    expect(result.current.approveHash).toBeUndefined();
  });

  it("should have deposit function", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.deposit).toBe("function");
  });

  it("should have reset function", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.reset).toBe("function");
  });

  it("should call reset to clear state", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.isProcessing).toBe(false);
    expect(mockReset).toHaveBeenCalled();
  });

  it("should accept string amount for deposit", async () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    // The deposit function should start processing
    await act(async () => {
      try {
        await result.current.deposit("100");
      } catch {
        // May fail due to mock limitations, that's ok for this test
      }
    });

    // Verify that deposit was called and state changed
    expect(result.current.step).not.toBe("idle");
  });

  it("should accept bigint amount for deposit", async () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    const amount = BigInt("100000000000000000000"); // 100 tokens

    await act(async () => {
      try {
        await result.current.deposit(amount);
      } catch {
        // May fail due to mock limitations
      }
    });

    // Verify processing started
    expect(result.current.isProcessing).toBe(true);
  });

  it("should prevent concurrent deposits", async () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    // Start first deposit
    await act(async () => {
      try {
        await result.current.deposit("100");
      } catch {
        // Expected
      }
    });

    // Try second deposit while first is processing
    let errorThrown = false;
    await act(async () => {
      try {
        await result.current.deposit("200");
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).toContain("already in progress");
      }
    });

    expect(errorThrown).toBe(true);
  });

  it("should expose transaction hashes", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    // Initial state should have undefined hashes
    expect(result.current.approveHash).toBeUndefined();
    expect(result.current.depositHash).toBeUndefined();
  });

  it("should expose loading states", () => {
    const { result } = renderHook(() => useDepositWithApprove(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isApproving).toBe("boolean");
    expect(typeof result.current.isDepositing).toBe("boolean");
    expect(typeof result.current.isProcessing).toBe("boolean");
    expect(typeof result.current.isSuccess).toBe("boolean");
  });
});
