import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PoolStatus } from "@/hooks/web3/rotating";
import { TestProviders } from "@/test/test-providers";

import { RoscaCard } from "../rosca-card";

import type { Address } from "viem";

// Mock usePoolInfo hook
const mockUsePoolInfo = vi.fn();

vi.mock("@/hooks/web3/rotating", async () => {
  const actual = await vi.importActual("@/hooks/web3/rotating");
  return {
    ...actual,
    usePoolInfo: (...args: unknown[]) => mockUsePoolInfo(...args),
  };
});

// Mock data
const MOCK_ADDRESS = "0x1234567890123456789012345678901234567890" as Address;

const createMockPoolData = (overrides: Record<number, any> = {}) => {
  const base = [
    BigInt(1), // 0: id
    "Test ROSCA Pool", // 1: name
    MOCK_ADDRESS, // 2: creator
    BigInt(12), // 3: memberCount
    BigInt("10000000000000000"), // 4: contributionAmount (0.01 BTC)
    BigInt(2592000), // 5: periodDuration (30 days)
    BigInt(5), // 6: currentPeriod
    BigInt(12), // 7: totalPeriods
    BigInt(1704067200), // 8: startTime
    BigInt("120000000000000000"), // 9: totalBtcCollected
    BigInt("120000000000"), // 10: totalMusdMinted
    BigInt("5000000000000000"), // 11: totalYieldGenerated
    BigInt("2000000000000000"), // 12: yieldDistributed
    PoolStatus.ACTIVE, // 13: status
    true, // 14: autoAdvance
  ];

  // Apply overrides by index
  Object.keys(overrides).forEach((key) => {
    const index = parseInt(key);
    if (!isNaN(index) && index >= 0 && index < base.length) {
      base[index] = overrides[index];
    }
  });

  return base;
};

describe("RoscaCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton when isPending is true", () => {
      mockUsePoolInfo.mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Should have animate-pulse class
      const card = container.querySelector(".animate-pulse");
      expect(card).not.toBeNull();

      // Should have skeleton elements
      const skeletons = container.querySelectorAll(".bg-muted");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("No Data State", () => {
    it("should return null when no pool data", () => {
      mockUsePoolInfo.mockReturnValue({
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("FORMING Status", () => {
    it("should render forming pool correctly", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.FORMING });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Pool name
      expect(screen.getByText("Test ROSCA Pool")).toBeInTheDocument();

      // Status badge
      expect(screen.getByText("Forming")).toBeInTheDocument();

      // Join button
      expect(screen.getByText("Join Pool")).toBeInTheDocument();
    });

    it("should show warning border for forming pool", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.FORMING });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      const card = container.querySelector(".border-warning\\/50");
      expect(card).not.toBeNull();
    });
  });

  describe("ACTIVE Status", () => {
    it("should render active pool correctly", () => {
      const poolData = createMockPoolData();

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Pool name
      expect(screen.getByText("Test ROSCA Pool")).toBeInTheDocument();

      // Status badge
      expect(screen.getByText("Active")).toBeInTheDocument();

      // View Details button
      expect(screen.getByText("View Details")).toBeInTheDocument();
    });

    it("should show progress bar for active pool", () => {
      const poolData = createMockPoolData({
        6: BigInt(5), // currentPeriod
        7: BigInt(12), // totalPeriods
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Should show progress text
      expect(screen.getByText("Progress:")).toBeInTheDocument();
      expect(screen.getByText("Period 6 / 12")).toBeInTheDocument();
    });

    it("should calculate progress percentage correctly", () => {
      const poolData = createMockPoolData({
        6: BigInt(5), // currentPeriod (6th period, index 5)
        7: BigInt(12), // totalPeriods
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Progress should be (6/12) * 100 = 50%
      const progressBar = container.querySelector(".bg-primary");
      expect(progressBar).toHaveStyle({ width: "50%" });
    });

    it("should show success border for active pool", () => {
      const poolData = createMockPoolData();

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      const card = container.querySelector(".border-success\\/50");
      expect(card).not.toBeNull();
    });
  });

  describe("COMPLETED Status", () => {
    it("should render completed pool correctly", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.COMPLETED });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Status badge - should appear twice (badge and button)
      const completedElements = screen.getAllByText("Completed");
      expect(completedElements.length).toBeGreaterThanOrEqual(1);

      // Button should be disabled
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not show progress bar for completed pool", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.COMPLETED });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.queryByText("Progress:")).not.toBeInTheDocument();
    });
  });

  describe("CANCELLED Status", () => {
    it("should render cancelled pool correctly", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.CANCELLED });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Status badge - should appear twice (badge and button)
      const cancelledElements = screen.getAllByText("Cancelled");
      expect(cancelledElements.length).toBeGreaterThanOrEqual(1);

      // Button should be disabled with "Cancelled" text
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Cancelled");
    });

    it("should show error border for cancelled pool", () => {
      const poolData = createMockPoolData({ 13: PoolStatus.CANCELLED });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      const card = container.querySelector(".border-error\\/50");
      expect(card).not.toBeNull();
    });
  });

  describe("Pool Details", () => {
    it("should display member count correctly", () => {
      const poolData = createMockPoolData({ 3: BigInt(24) });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("24 members")).toBeInTheDocument();
    });

    it("should format contribution amount correctly", () => {
      const poolData = createMockPoolData({
        4: BigInt("50000000000000000"), // 0.05 BTC
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("0.0500 BTC")).toBeInTheDocument();
    });

    it("should display period duration in days", () => {
      const poolData = createMockPoolData({
        5: BigInt(86400), // 1 day
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("Every 1 day")).toBeInTheDocument();
    });

    it("should use plural 'days' for multiple days", () => {
      const poolData = createMockPoolData({
        5: BigInt(604800), // 7 days
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("Every 7 days")).toBeInTheDocument();
    });

    it("should show yield when totalYieldGenerated > 0", () => {
      const poolData = createMockPoolData({
        11: BigInt("8500000000000000"), // 0.0085 BTC yield
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("Total Yield:")).toBeInTheDocument();
      expect(screen.getByText(/\+0\.008500 MUSD/)).toBeInTheDocument();
    });

    it("should not show yield section when totalYieldGenerated is 0", () => {
      const poolData = createMockPoolData({
        11: BigInt(0), // No yield
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.queryByText("Total Yield:")).not.toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("should render all icons correctly", () => {
      const poolData = createMockPoolData();

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      // Should have Users, Coins, and Calendar icons
      expect(screen.getByText("Members:")).toBeInTheDocument();
      expect(screen.getByText("Contribution:")).toBeInTheDocument();
      expect(screen.getByText("Period:")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large member count", () => {
      const poolData = createMockPoolData({ 3: BigInt(500) });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("500 members")).toBeInTheDocument();
    });

    it("should handle very small contribution amounts", () => {
      const poolData = createMockPoolData({
        4: BigInt("1000000000000"), // 0.000001 BTC
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("0.0000 BTC")).toBeInTheDocument();
    });

    it("should handle very large contribution amounts", () => {
      const poolData = createMockPoolData({
        4: BigInt("10000000000000000000"), // 10 BTC
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("10.0000 BTC")).toBeInTheDocument();
    });

    it("should handle first period (currentPeriod = 0)", () => {
      const poolData = createMockPoolData({
        6: BigInt(0), // First period
        7: BigInt(12),
        13: PoolStatus.ACTIVE,
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("Period 1 / 12")).toBeInTheDocument();
    });

    it("should handle last period", () => {
      const poolData = createMockPoolData({
        6: BigInt(11), // Last period (0-indexed)
        7: BigInt(12),
        13: PoolStatus.ACTIVE,
      });

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={BigInt(1)} />
        </TestProviders>
      );

      expect(screen.getByText("Period 12 / 12")).toBeInTheDocument();

      // Progress bar should be 100%
      const progressBar = container.querySelector(".bg-primary");
      expect(progressBar).toHaveStyle({ width: "100%" });
    });
  });

  describe("Hook Integration", () => {
    it("should call usePoolInfo with correct poolId", () => {
      const poolId = BigInt(42);
      const poolData = createMockPoolData();

      mockUsePoolInfo.mockReturnValue({
        data: poolData,
        isPending: false,
        isError: false,
        error: null,
      });

      const { container } = render(
        <TestProviders>
          <RoscaCard poolId={poolId} />
        </TestProviders>
      );

      expect(mockUsePoolInfo).toHaveBeenCalledWith(poolId);
    });
  });
});
