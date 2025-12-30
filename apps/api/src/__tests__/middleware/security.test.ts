/**
 * @fileoverview Security middleware tests
 * @module __tests__/middleware/security.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  requestSizeLimiter,
  validateContentType,
  validateEthAddress,
  xssProtection,
  requestId,
  securityHeaders,
  validateApiKey,
} from "../../middleware/security";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  fixtures,
} from "../setup";

describe("Security Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestSizeLimiter", () => {
    it("should allow requests under size limit", () => {
      const middleware = requestSizeLimiter("10mb");
      const req = createMockRequest({
        headers: { "content-length": "1000" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject requests over size limit", () => {
      const middleware = requestSizeLimiter("1kb"); // 1KB = 1024 bytes
      const req = createMockRequest({
        headers: { "content-length": "2000" }, // 2000 bytes > 1KB
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Payload Too Large",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow requests without content-length header", () => {
      const middleware = requestSizeLimiter("10mb");
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("validateContentType", () => {
    it("should skip validation for GET requests", () => {
      const middleware = validateContentType();
      const req = createMockRequest({ method: "GET" });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should require content-type for POST requests", () => {
      const middleware = validateContentType();
      const req = createMockRequest({ method: "POST" });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Missing Content-Type",
        }),
      );
    });

    it("should accept valid content-type", () => {
      const middleware = validateContentType();
      const req = createMockRequest({
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject unsupported content-type", () => {
      const middleware = validateContentType();
      const req = createMockRequest({
        method: "POST",
        headers: { "content-type": "text/plain" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Unsupported Media Type",
        }),
      );
    });
  });

  describe("validateEthAddress", () => {
    it("should call next for valid Ethereum address", () => {
      const middleware = validateEthAddress();
      const req = createMockRequest({
        params: { address: fixtures.validAddress },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid Ethereum address", () => {
      const middleware = validateEthAddress();
      const req = createMockRequest({
        params: { address: fixtures.invalidAddress },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid Address",
        }),
      );
    });

    it("should reject short address", () => {
      const middleware = validateEthAddress();
      const req = createMockRequest({
        params: { address: fixtures.shortAddress },
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should call next when no address param", () => {
      const middleware = validateEthAddress();
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("xssProtection", () => {
    it("should sanitize string inputs in body", () => {
      const req = createMockRequest({
        body: {
          name: '<script>alert("xss")</script>Test',
          email: "test@example.com",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.name).not.toContain("<script>");
      expect(req.body.email).toBe("test@example.com");
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize nested objects", () => {
      const req = createMockRequest({
        body: {
          user: {
            name: '<img src=x onerror="alert(1)">',
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.user.name).not.toContain("<img");
      expect(req.body.user.name).not.toContain("onerror");
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize arrays", () => {
      const req = createMockRequest({
        body: {
          items: ["<script>bad</script>", "normal"],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.items[0]).not.toContain("<script>");
      expect(req.body.items[1]).toBe("normal");
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize query params", () => {
      const req = createMockRequest({
        query: {
          search: '<script>alert("xss")</script>',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.query.search).not.toContain("<script>");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("requestId", () => {
    it("should generate request ID if not provided", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requestId(req, res, next);

      expect(req.headers["x-request-id"]).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );
      expect(next).toHaveBeenCalled();
    });

    it("should use existing request ID if provided", () => {
      const existingId = "test-request-id-123";
      const req = createMockRequest({
        headers: { "x-request-id": existingId },
      });
      const res = createMockResponse();
      const next = createMockNext();

      requestId(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-Request-ID", existingId);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("securityHeaders", () => {
    it("should set all security headers", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff",
      );
      expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block",
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Permissions-Policy",
        expect.any(String),
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("validateApiKey", () => {
    it("should skip validation when no API_KEY configured", () => {
      const originalApiKey = process.env.API_KEY;
      delete process.env.API_KEY;

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      validateApiKey(req, res, next);

      expect(next).toHaveBeenCalled();

      // Restore
      if (originalApiKey) process.env.API_KEY = originalApiKey;
    });

    it("should reject missing API key when configured", () => {
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = "test-api-key-12345";

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      validateApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Unauthorized",
        }),
      );

      // Restore
      if (originalApiKey) {
        process.env.API_KEY = originalApiKey;
      } else {
        delete process.env.API_KEY;
      }
    });

    it("should accept valid API key", () => {
      const testApiKey = "test-api-key-12345";
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = testApiKey;

      const req = createMockRequest({
        headers: { "x-api-key": testApiKey },
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateApiKey(req, res, next);

      expect(next).toHaveBeenCalled();

      // Restore
      if (originalApiKey) {
        process.env.API_KEY = originalApiKey;
      } else {
        delete process.env.API_KEY;
      }
    });
  });
});
