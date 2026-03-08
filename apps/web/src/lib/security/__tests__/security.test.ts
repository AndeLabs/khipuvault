import { describe, it, expect } from "vitest";

import {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeAddress,
  sanitizeNumber,
  sanitizeString,
  sanitizeId,
  sanitizeTransactionHash,
  isValidEthAddress,
  isValidAmount,
  isValidPoolId,
  isValidUrl,
  isValidTransactionHash,
  isValidBlockNumber,
  isValidEmail,
  isValidChainId,
  isValidBigInt,
  isValidPercentage,
} from "../index";

describe("Sanitization Functions", () => {
  describe("sanitizeHtml", () => {
    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("Safe content");
    });

    it("should allow safe tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = sanitizeHtml(input);
      expect(result).toContain("<strong>");
      expect(result).toContain("World");
    });

    it("should handle empty input", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("sanitizeUrl", () => {
    it("should allow https URLs", () => {
      const url = "https://example.com";
      // URL constructor adds trailing slash
      expect(sanitizeUrl(url)).toBe("https://example.com/");
    });

    it("should reject javascript: URLs", () => {
      // eslint-disable-next-line no-script-url -- Testing security sanitization
      const url = "javascript:alert(1)";
      expect(sanitizeUrl(url)).toBe("");
    });

    it("should reject data: URLs", () => {
      const url = "data:text/html,<script>alert(1)</script>";
      expect(sanitizeUrl(url)).toBe("");
    });

    it("should reject URLs with non-standard ports", () => {
      const url = "https://example.com:8080";
      expect(sanitizeUrl(url)).toBe("");
    });
  });

  describe("sanitizeAddress", () => {
    it("should accept valid Ethereum address", () => {
      const address = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      expect(sanitizeAddress(address)).toBe(address);
    });

    it("should return checksummed address", () => {
      const lowercase = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
      const checksummed = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      expect(sanitizeAddress(lowercase)).toBe(checksummed);
    });

    it("should reject invalid address", () => {
      expect(sanitizeAddress("invalid")).toBeNull();
      expect(sanitizeAddress("0x123")).toBeNull();
    });

    it("should handle empty input", () => {
      expect(sanitizeAddress("")).toBeNull();
    });
  });

  describe("sanitizeNumber", () => {
    it("should accept valid positive numbers", () => {
      expect(sanitizeNumber("123")).toBe(123);
      expect(sanitizeNumber("123.45")).toBe(123.45);
    });

    it("should reject negative numbers by default", () => {
      expect(sanitizeNumber("-123")).toBeNull();
    });

    it("should allow negative numbers when specified", () => {
      expect(sanitizeNumber("-123", { allowNegative: true })).toBe(-123);
    });

    it("should respect max constraint", () => {
      expect(sanitizeNumber("150", { max: 100 })).toBeNull();
      expect(sanitizeNumber("50", { max: 100 })).toBe(50);
    });

    it("should apply decimal precision", () => {
      expect(sanitizeNumber("123.456", { decimals: 2 })).toBe(123.46);
    });
  });

  describe("sanitizeString", () => {
    it("should remove control characters", () => {
      const input = "Hello\x00World";
      const result = sanitizeString(input);
      expect(result).toBe("HelloWorld");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      expect(sanitizeString(input)).toBe("Hello World");
    });

    it("should truncate to max length", () => {
      const input = "a".repeat(200);
      const result = sanitizeString(input, 100);
      expect(result).toHaveLength(100);
    });
  });

  describe("sanitizeId", () => {
    it("should accept alphanumeric IDs", () => {
      expect(sanitizeId("pool-123")).toBe("pool-123");
      expect(sanitizeId("abc_123")).toBe("abc_123");
    });

    it("should reject special characters", () => {
      expect(sanitizeId("<script>")).toBeNull();
      expect(sanitizeId("test@123")).toBeNull();
    });
  });

  describe("sanitizeTransactionHash", () => {
    it("should accept valid transaction hash", () => {
      const hash = `0x${"a".repeat(64)}`;
      expect(sanitizeTransactionHash(hash)).toBe(hash);
    });

    it("should reject invalid hash", () => {
      expect(sanitizeTransactionHash("0x123")).toBeNull();
      expect(sanitizeTransactionHash("invalid")).toBeNull();
    });
  });
});

describe("Validation Functions", () => {
  describe("isValidEthAddress", () => {
    it("should validate correct addresses", () => {
      // Use a known valid checksummed address
      const address = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
      expect(isValidEthAddress(address)).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidEthAddress("invalid")).toBe(false);
      expect(isValidEthAddress("0x123")).toBe(false);
      expect(isValidEthAddress("")).toBe(false);
    });

    it("should handle lowercase addresses", () => {
      // Lowercase addresses should still be valid
      const address = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
      expect(isValidEthAddress(address)).toBe(true);
    });
  });

  describe("isValidAmount", () => {
    it("should validate positive amounts", () => {
      expect(isValidAmount("1.5", 18)).toBe(true);
      expect(isValidAmount("0.001", 18)).toBe(true);
    });

    it("should reject negative amounts", () => {
      expect(isValidAmount("-1", 18)).toBe(false);
    });

    it("should reject zero by default", () => {
      expect(isValidAmount("0", 18)).toBe(false);
    });

    it("should allow zero when specified", () => {
      expect(isValidAmount("0", 18, { allowZero: true })).toBe(true);
    });

    it("should validate decimal precision", () => {
      expect(isValidAmount("1.123456789012345678", 18)).toBe(true);
      expect(isValidAmount("1.1234567890123456789", 18)).toBe(false);
    });

    it("should respect min/max constraints", () => {
      expect(isValidAmount("5", 18, { min: 1, max: 10 })).toBe(true);
      expect(isValidAmount("0.5", 18, { min: 1 })).toBe(false);
      expect(isValidAmount("15", 18, { max: 10 })).toBe(false);
    });
  });

  describe("isValidPoolId", () => {
    it("should accept valid pool IDs", () => {
      expect(isValidPoolId("pool-123")).toBe(true);
      expect(isValidPoolId("pool_abc_456")).toBe(true);
    });

    it("should reject invalid IDs", () => {
      expect(isValidPoolId("")).toBe(false);
      expect(isValidPoolId("<script>")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should accept valid https URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("should reject dangerous protocols", () => {
      // eslint-disable-next-line no-script-url -- Testing security validation
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("data:text/html,<script>")).toBe(false);
    });

    it("should check domain allowlist", () => {
      const allowed = ["example.com", "trusted.io"];
      expect(isValidUrl("https://example.com", allowed)).toBe(true);
      expect(isValidUrl("https://evil.com", allowed)).toBe(false);
    });

    it("should allow subdomains", () => {
      const allowed = ["example.com"];
      expect(isValidUrl("https://api.example.com", allowed)).toBe(true);
    });
  });

  describe("isValidTransactionHash", () => {
    it("should validate correct transaction hashes", () => {
      const hash = `0x${"a".repeat(64)}`;
      expect(isValidTransactionHash(hash)).toBe(true);
    });

    it("should reject invalid hashes", () => {
      expect(isValidTransactionHash("0x123")).toBe(false);
      expect(isValidTransactionHash("invalid")).toBe(false);
    });
  });

  describe("isValidBlockNumber", () => {
    it("should accept positive integers", () => {
      expect(isValidBlockNumber(123456)).toBe(true);
      expect(isValidBlockNumber("123456")).toBe(true);
    });

    it("should reject negative numbers", () => {
      expect(isValidBlockNumber(-1)).toBe(false);
    });

    it("should reject decimals", () => {
      expect(isValidBlockNumber(123.45)).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
    });
  });

  describe("isValidChainId", () => {
    it("should accept positive integers", () => {
      expect(isValidChainId(1)).toBe(true);
      expect(isValidChainId(11155111)).toBe(true);
    });

    it("should reject invalid chain IDs", () => {
      expect(isValidChainId(-1)).toBe(false);
      expect(isValidChainId(0)).toBe(false);
      expect(isValidChainId(1.5)).toBe(false);
    });

    it("should check against allowlist", () => {
      const allowed = [1, 11155111];
      expect(isValidChainId(1, allowed)).toBe(true);
      expect(isValidChainId(999, allowed)).toBe(false);
    });
  });

  describe("isValidBigInt", () => {
    it("should accept valid bigint values", () => {
      expect(isValidBigInt("1000000000000000000")).toBe(true);
      expect(isValidBigInt(1000n)).toBe(true);
    });

    it("should reject negative values", () => {
      expect(isValidBigInt("-100")).toBe(false);
    });

    it("should reject non-integer strings", () => {
      expect(isValidBigInt("1.5")).toBe(false);
      expect(isValidBigInt("invalid")).toBe(false);
    });
  });

  describe("isValidPercentage", () => {
    it("should accept valid percentages", () => {
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage("75")).toBe(true);
    });

    it("should reject out of range values", () => {
      expect(isValidPercentage(150)).toBe(false);
      expect(isValidPercentage(-10)).toBe(false);
    });

    it("should handle custom ranges", () => {
      expect(isValidPercentage(5, { min: 0, max: 10 })).toBe(true);
      expect(isValidPercentage(15, { min: 0, max: 10 })).toBe(false);
    });
  });
});
