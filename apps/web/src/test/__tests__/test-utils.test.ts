/**
 * @fileoverview Tests for Testing Utilities
 * @module test/__tests__/test-utils.test
 *
 * Meta-tests to verify our testing utilities work correctly
 */

import { describe, it, expect } from "vitest";

import {
  createMockPool,
  createMockUser,
  createMockTransaction,
  createMockPosition,
  createMockPoolData,
  getMockAddress,
  formatBtcForTest,
  parseBtcForTest,
} from "../test-utils";

describe("Test Utils - Factory Functions", () => {
  describe("createMockPool", () => {
    it("creates pool with defaults", () => {
      const pool = createMockPool();

      expect(pool).toMatchObject({
        id: "pool-1",
        poolType: "individual",
        name: "Test Pool",
        status: "active",
      });
      expect(pool.contractAddress).toBeTruthy();
    });

    it("overrides default values", () => {
      const pool = createMockPool({
        name: "Custom Pool",
        tvl: "999999",
        apr: 10.5,
      });

      expect(pool.name).toBe("Custom Pool");
      expect(pool.tvl).toBe("999999");
      expect(pool.apr).toBe(10.5);
    });
  });

  describe("createMockUser", () => {
    it("creates user with defaults", () => {
      const user = createMockUser();

      expect(user.userId).toBeTruthy();
      expect(user.positions).toHaveLength(2);
      expect(user.totalDeposited).toBeTruthy();
    });

    it("overrides positions", () => {
      const customPosition = createMockPosition({ poolType: "lottery" });
      const user = createMockUser({ positions: [customPosition] });

      expect(user.positions).toHaveLength(1);
      expect(user.positions[0]?.poolType).toBe("lottery");
    });
  });

  describe("createMockTransaction", () => {
    it("creates transaction with defaults", () => {
      const tx = createMockTransaction();

      expect(tx).toMatchObject({
        type: "deposit",
        status: "confirmed",
      });
      expect(tx.txHash).toBeTruthy();
    });

    it("creates different transaction types", () => {
      const deposit = createMockTransaction({ type: "deposit" });
      const withdraw = createMockTransaction({ type: "withdraw" });
      const claim = createMockTransaction({ type: "claim_yield" });

      expect(deposit.type).toBe("deposit");
      expect(withdraw.type).toBe("withdraw");
      expect(claim.type).toBe("claim_yield");
    });
  });

  describe("createMockPoolData", () => {
    it("creates pool data array with defaults", () => {
      const poolData = createMockPoolData();

      expect(poolData).toHaveLength(16);
      expect(poolData[0]).toBe(BigInt(1)); // id
      expect(poolData[1]).toBe("Test ROSCA Pool"); // name
    });

    it("allows overriding by index", () => {
      const poolData = createMockPoolData({
        1: "Custom Name",
        3: BigInt(24), // memberCount
      });

      expect(poolData[1]).toBe("Custom Name");
      expect(poolData[3]).toBe(BigInt(24));
    });
  });
});

describe("Test Utils - Helper Functions", () => {
  describe("getMockAddress", () => {
    it("returns valid addresses", () => {
      const addr1 = getMockAddress(0);
      const addr2 = getMockAddress(1);

      expect(addr1).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addr2).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addr1).not.toBe(addr2);
    });

    it("is deterministic for same seed", () => {
      const addr1 = getMockAddress(0);
      const addr2 = getMockAddress(0);

      expect(addr1).toBe(addr2);
    });
  });

  describe("formatBtcForTest", () => {
    it("formats 1 BTC correctly", () => {
      const formatted = formatBtcForTest(BigInt("1000000000000000000"));
      expect(formatted).toBe("1.0000");
    });

    it("formats 0.5 BTC correctly", () => {
      const formatted = formatBtcForTest(BigInt("500000000000000000"));
      expect(formatted).toBe("0.5000");
    });

    it("formats 0.0001 BTC correctly", () => {
      const formatted = formatBtcForTest(BigInt("100000000000000"));
      expect(formatted).toBe("0.0001");
    });
  });

  describe("parseBtcForTest", () => {
    it("parses 1 BTC correctly", () => {
      const parsed = parseBtcForTest("1");
      expect(parsed).toBe(BigInt("1000000000000000000"));
    });

    it("parses 1.5 BTC correctly", () => {
      const parsed = parseBtcForTest("1.5");
      expect(parsed).toBe(BigInt("1500000000000000000"));
    });

    it("parses 0.123 BTC correctly", () => {
      const parsed = parseBtcForTest("0.123");
      expect(parsed).toBe(BigInt("123000000000000000"));
    });
  });

  describe("roundtrip formatting", () => {
    it("formats and parses back to same value", () => {
      const original = BigInt("1500000000000000000");
      const formatted = formatBtcForTest(original);
      const parsed = parseBtcForTest(formatted);

      // Note: formatting truncates to 4 decimals
      expect(parsed).toBe(BigInt("1500000000000000000"));
    });
  });
});
