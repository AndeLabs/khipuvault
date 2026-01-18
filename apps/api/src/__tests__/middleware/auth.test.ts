/**
 * @fileoverview Authentication middleware tests
 * @module __tests__/middleware/auth.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  generateNonce,
  generateJWT,
  verifyJWT,
  requireAuth,
  optionalAuth,
  getNonceStats,
} from "../../middleware/auth";
import { createMockRequest, createMockResponse, createMockNext, fixtures } from "../setup";

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateNonce", () => {
    it("should generate a unique nonce string", async () => {
      const nonce1 = await generateNonce();
      const nonce2 = await generateNonce();

      expect(nonce1).toBeDefined();
      expect(typeof nonce1).toBe("string");
      expect(nonce1.length).toBeGreaterThan(0);
      expect(nonce1).not.toBe(nonce2);
    });

    it("should track nonces in store", async () => {
      await generateNonce();
      const stats = getNonceStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.unused).toBeGreaterThan(0);
    });
  });

  describe("generateJWT", () => {
    it("should generate a valid JWT token for an address", () => {
      const token = generateJWT(fixtures.validAddress);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should normalize address to lowercase", () => {
      const token = generateJWT(fixtures.validAddress);
      const decoded = verifyJWT(token);

      expect(decoded?.address).toBe(fixtures.validAddressLower);
    });
  });

  describe("verifyJWT", () => {
    it("should verify a valid token", () => {
      const token = generateJWT(fixtures.validAddress);
      const decoded = verifyJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.address).toBe(fixtures.validAddressLower);
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it("should return null for invalid token", () => {
      const decoded = verifyJWT("invalid-token");

      expect(decoded).toBeNull();
    });

    it("should return null for malformed token", () => {
      const decoded = verifyJWT("a.b.c");

      expect(decoded).toBeNull();
    });
  });

  describe("requireAuth middleware", () => {
    it("should return 401 when no authorization header", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Unauthorized",
          message: "No authorization token provided",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header format is invalid", async () => {
      const req = createMockRequest({
        headers: { authorization: "InvalidFormat token123" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid authorization header"),
        })
      );
    });

    it("should return 401 when token is invalid", async () => {
      const req = createMockRequest({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid or expired token",
        })
      );
    });

    it("should call next and attach user when token is valid", async () => {
      const token = generateJWT(fixtures.validAddress);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.address).toBe(fixtures.validAddressLower);
      expect(req.rawToken).toBe(token);
    });
  });

  describe("optionalAuth middleware", () => {
    it("should call next when no authorization header", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it("should call next without user when token is invalid", async () => {
      const req = createMockRequest({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it("should attach user and call next when token is valid", async () => {
      const token = generateJWT(fixtures.validAddress);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.address).toBe(fixtures.validAddressLower);
    });
  });

  describe("getNonceStats", () => {
    it("should return nonce statistics", async () => {
      // Generate some nonces
      await generateNonce();
      await generateNonce();

      const stats = getNonceStats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("used");
      expect(stats).toHaveProperty("unused");
      expect(stats).toHaveProperty("expired");
      expect(typeof stats.total).toBe("number");
    });
  });
});
