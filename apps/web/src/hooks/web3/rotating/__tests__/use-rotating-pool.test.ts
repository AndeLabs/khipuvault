import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createWrapper } from "@/test/test-providers";

import {
  usePoolInfo,
  useMemberInfo,
  usePeriodInfo,
  usePoolMemberOrder,
  usePoolCounter,
  useRotatingPool,
  useRotatingPoolConstants,
  PoolStatus,
} from "../use-rotating-pool";

import type { Address } from "viem";

// Mock data
const MOCK_ADDRESS = "0x1234567890123456789012345678901234567890" as Address;
const MOCK_POOL_ID = BigInt(1);

// Mock useReadContract
const mockUseReadContract = vi.fn();
const mockUseAccount = vi.fn();

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
    useAccount: () => mockUseAccount(),
  };
});

describe("usePoolInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("should return pool info hook with correct configuration", () => {
    const { result } = renderHook(() => usePoolInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "pools",
        args: [MOCK_POOL_ID],
        query: expect.objectContaining({
          enabled: true,
          staleTime: 1000 * 60 * 5, // 5 min
          gcTime: 1000 * 60 * 30, // 30 min
          retry: 3,
        }),
      })
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should disable query when poolId is undefined", () => {
    renderHook(() => usePoolInfo(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: undefined,
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });

  it("should return pool data when available", () => {
    const mockPoolData = [
      BigInt(1), // poolId
      "Test Pool", // name
      MOCK_ADDRESS, // creator
      BigInt(12), // memberCount
      BigInt("10000000000000000"), // contributionAmount
      BigInt(2592000), // periodDuration (30 days)
      BigInt(5), // currentPeriod
      BigInt(12), // totalPeriods
      BigInt(1704067200), // startTime
      BigInt("120000000000000000"), // totalBtcCollected
      BigInt("120000000000"), // totalMusdMinted
      BigInt("5000000000000000"), // totalYieldGenerated
      BigInt("2000000000000000"), // yieldDistributed
      PoolStatus.ACTIVE, // status
      true, // autoAdvance
      true, // useNativeBtc
    ];

    mockUseReadContract.mockReturnValue({
      data: mockPoolData,
      isPending: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePoolInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(mockPoolData);
  });

  it("should handle loading state", () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePoolInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it("should handle error state", () => {
    const mockError = new Error("Contract read failed");
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: mockError,
    });

    const { result } = renderHook(() => usePoolInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useMemberInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue({
      address: MOCK_ADDRESS,
      isConnected: true,
    });
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("should use connected wallet address by default", () => {
    renderHook(() => useMemberInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "poolMembers",
        args: [MOCK_POOL_ID, MOCK_ADDRESS],
        query: expect.objectContaining({
          enabled: true,
          staleTime: 1000 * 60 * 2, // 2 min
          gcTime: 1000 * 60 * 15, // 15 min
        }),
      })
    );
  });

  it("should use provided member address", () => {
    const customAddress = "0xabcdef1234567890abcdef1234567890abcdef12" as Address;

    renderHook(() => useMemberInfo(MOCK_POOL_ID, customAddress), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [MOCK_POOL_ID, customAddress],
      })
    );
  });

  it("should disable query when poolId is undefined", () => {
    renderHook(() => useMemberInfo(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });

  it("should disable query when no member address", () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    renderHook(() => useMemberInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });

  it("should return member data when available", () => {
    const mockMemberData = [
      MOCK_ADDRESS, // memberAddress
      BigInt(3), // memberIndex
      BigInt(5), // contributionsMade
      BigInt("50000000000000000"), // totalContributed
      BigInt("10000000000000000"), // payoutReceived
      BigInt("500000000000000"), // yieldReceived
      true, // hasReceivedPayout
      true, // active
    ];

    mockUseReadContract.mockReturnValue({
      data: mockMemberData,
      isPending: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useMemberInfo(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(mockMemberData);
  });
});

describe("usePeriodInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("should fetch period info with correct args", () => {
    const periodNumber = BigInt(5);

    renderHook(() => usePeriodInfo(MOCK_POOL_ID, periodNumber), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "poolPeriods",
        args: [MOCK_POOL_ID, periodNumber],
        query: expect.objectContaining({
          enabled: true,
          staleTime: 1000 * 60 * 3, // 3 min
          gcTime: 1000 * 60 * 20, // 20 min
        }),
      })
    );
  });

  it("should disable when poolId is undefined", () => {
    renderHook(() => usePeriodInfo(undefined, BigInt(1)), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });

  it("should disable when periodNumber is undefined", () => {
    renderHook(() => usePeriodInfo(MOCK_POOL_ID, undefined), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });
});

describe("usePoolMemberOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("should fetch member order with correct configuration", () => {
    const memberIndex = BigInt(3);

    renderHook(() => usePoolMemberOrder(MOCK_POOL_ID, memberIndex), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "poolMemberOrder",
        args: [MOCK_POOL_ID, memberIndex],
        query: expect.objectContaining({
          enabled: true,
          staleTime: 1000 * 60 * 10, // 10 min (order doesn't change)
          gcTime: 1000 * 60 * 60, // 1 hour
        }),
      })
    );
  });

  it("should disable when poolId is undefined", () => {
    renderHook(() => usePoolMemberOrder(undefined, BigInt(0)), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });
});

describe("usePoolCounter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("should fetch pool counter with correct configuration", () => {
    renderHook(() => usePoolCounter(), {
      wrapper: createWrapper(),
    });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "poolCounter",
        query: expect.objectContaining({
          staleTime: 1000 * 30, // 30 sec (changes frequently)
          gcTime: 1000 * 60 * 5, // 5 min
          retry: 3,
        }),
      })
    );
  });

  it("should return counter data", () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(42),
      isPending: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePoolCounter(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBe(BigInt(42));
  });
});

describe("useRotatingPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue({
      address: MOCK_ADDRESS,
      isConnected: true,
    });

    // Default mock for pool info (needed to extract currentPeriod)
    mockUseReadContract.mockImplementation((config: { functionName: string }) => {
      if (config.functionName === "pools") {
        return {
          data: [
            BigInt(1),
            "Test Pool",
            MOCK_ADDRESS,
            BigInt(12),
            BigInt("10000000000000000"),
            BigInt(2592000),
            BigInt(5), // currentPeriod
            BigInt(12),
            BigInt(1704067200),
            BigInt("120000000000000000"),
            BigInt("120000000000"),
            BigInt("5000000000000000"),
            BigInt("2000000000000000"),
            PoolStatus.ACTIVE,
            true,
          ],
          isPending: false,
          isError: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      };
    });
  });

  it("should combine pool, member, and period info", () => {
    const { result } = renderHook(() => useRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.poolInfo).toBeDefined();
    expect(result.current.memberInfo).toBeDefined();
    expect(result.current.periodInfo).toBeDefined();
  });

  it("should aggregate loading states", () => {
    mockUseReadContract.mockImplementation((config: { functionName: string }) => {
      if (config.functionName === "poolMembers") {
        return {
          data: undefined,
          isPending: true, // Member info loading
          isError: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it("should aggregate error states", () => {
    const mockError = new Error("Failed to fetch");
    mockUseReadContract.mockImplementation((config: { functionName: string }) => {
      if (config.functionName === "pools") {
        return {
          data: undefined,
          isPending: false,
          isError: true,
          error: mockError,
        };
      }
      return {
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useRotatingPool(MOCK_POOL_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useRotatingPoolConstants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("should fetch all constants with Infinity staleTime", () => {
    renderHook(() => useRotatingPoolConstants(), {
      wrapper: createWrapper(),
    });

    // Should be called 6 times (one for each constant)
    expect(mockUseReadContract).toHaveBeenCalledTimes(6);

    // All should have staleTime: Infinity
    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MIN_MEMBERS",
        query: { staleTime: Infinity },
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MAX_MEMBERS",
        query: { staleTime: Infinity },
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MIN_CONTRIBUTION",
        query: { staleTime: Infinity },
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MAX_CONTRIBUTION",
        query: { staleTime: Infinity },
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MIN_PERIOD_DURATION",
        query: { staleTime: Infinity },
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "MAX_PERIOD_DURATION",
        query: { staleTime: Infinity },
      })
    );
  });

  it("should return all constant values", () => {
    mockUseReadContract.mockImplementation((config: { functionName: string }) => {
      const constantValues: Record<string, bigint> = {
        MIN_MEMBERS: BigInt(3),
        MAX_MEMBERS: BigInt(50),
        MIN_CONTRIBUTION: BigInt("1000000000000000"), // 0.001 BTC
        MAX_CONTRIBUTION: BigInt("10000000000000000000"), // 10 BTC
        MIN_PERIOD_DURATION: BigInt(86400), // 1 day
        MAX_PERIOD_DURATION: BigInt(7776000), // 90 days
      };

      return {
        data: constantValues[config.functionName],
        isPending: false,
        isError: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useRotatingPoolConstants(), {
      wrapper: createWrapper(),
    });

    expect(result.current.minMembers).toBe(BigInt(3));
    expect(result.current.maxMembers).toBe(BigInt(50));
    expect(result.current.minContribution).toBe(BigInt("1000000000000000"));
    expect(result.current.maxContribution).toBe(BigInt("10000000000000000000"));
    expect(result.current.minPeriodDuration).toBe(BigInt(86400));
    expect(result.current.maxPeriodDuration).toBe(BigInt(7776000));
  });

  it("should aggregate loading states", () => {
    mockUseReadContract.mockImplementation((config: { functionName: string }, _index: number) => {
      // Make one constant loading
      if (config.functionName === "MIN_MEMBERS") {
        return {
          data: undefined,
          isPending: true,
          isError: false,
          error: null,
        };
      }
      return {
        data: BigInt(100),
        isPending: false,
        isError: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useRotatingPoolConstants(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });
});

describe("PoolStatus enum", () => {
  it("should have correct enum values", () => {
    expect(PoolStatus.FORMING).toBe(0);
    expect(PoolStatus.ACTIVE).toBe(1);
    expect(PoolStatus.COMPLETED).toBe(2);
    expect(PoolStatus.CANCELLED).toBe(3);
  });
});
