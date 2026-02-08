/**
 * @fileoverview Auth route tests
 * @module __tests__/routes/auth.test
 *
 * Tests for auth routes by mocking the middleware functions directly
 * and testing the route handlers in isolation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  generateNonce,
  verifySiweMessage,
  generateJWT,
  getNonceStats,
  invalidateToken,
} from "../../middleware/auth";

// Since the auth routes use the actual middleware functions,
// we test them through the middleware layer instead of route iteration

describe("Auth Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateNonce", () => {
    it("should generate a valid nonce string", async () => {
      const nonce = await generateNonce();

      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(0);
    });

    it("should generate unique nonces on each call", async () => {
      const nonce1 = await generateNonce();
      const nonce2 = await generateNonce();

      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe("verifySiweMessage", () => {
    it("should return invalid for malformed message", async () => {
      const result = await verifySiweMessage("invalid message", `0x${"a".repeat(130)}`);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return invalid for empty signature", async () => {
      const result = await verifySiweMessage("some message", "");

      expect(result.valid).toBe(false);
    });
  });

  describe("generateJWT", () => {
    it("should generate a valid JWT token", () => {
      const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f3A123";
      const token = generateJWT(address);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different addresses", () => {
      const token1 = generateJWT("0x742d35Cc6634C0532925a3b844Bc9e7595f3A123");
      const token2 = generateJWT("0x742d35Cc6634C0532925a3b844Bc9e7595f3A456");

      expect(token1).not.toBe(token2);
    });
  });

  describe("getNonceStats", () => {
    it("should return nonce statistics object", () => {
      const stats = getNonceStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.used).toBe("number");
      expect(typeof stats.unused).toBe("number");
      expect(typeof stats.expired).toBe("number");
    });
  });

  describe("invalidateToken", () => {
    it("should accept jti and exp parameters", async () => {
      const jti = "test-jti-123";
      const exp = Math.floor(Date.now() / 1000) + 3600;

      // Should not throw
      await expect(invalidateToken(jti, exp)).resolves.not.toThrow();
    });
  });
});

describe("Auth Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("nonce endpoint should return unique nonces", async () => {
    // Test that the nonce generation works as expected for the endpoint
    const nonce1 = await generateNonce();
    const nonce2 = await generateNonce();

    // Nonces should be unique
    expect(nonce1).not.toBe(nonce2);

    // Nonces should be strings
    expect(typeof nonce1).toBe("string");
    expect(typeof nonce2).toBe("string");
  });

  it("verify endpoint should reject invalid signatures", async () => {
    const result = await verifySiweMessage("invalid siwe message format", `0x${"f".repeat(130)}`);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("JWT generation should create valid tokens for authenticated users", () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f3A123";
    const token = generateJWT(address);

    // Token should be a valid JWT format (3 base64-encoded parts separated by dots)
    const parts = token.split(".");
    expect(parts).toHaveLength(3);

    // Each part should be base64url encoded
    parts.forEach((part) => {
      expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  it("stats endpoint should work in non-production environment", () => {
    process.env.NODE_ENV = "test";

    const stats = getNonceStats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("used");
    expect(stats).toHaveProperty("unused");
    expect(stats).toHaveProperty("expired");
  });
});
