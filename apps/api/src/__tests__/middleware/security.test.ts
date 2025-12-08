import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  xssProtection,
  sanitizeMongoQueries,
  requestSizeLimiter,
  validateContentType,
  validateEthAddress,
  requestId,
  securityHeaders,
  validateApiKey,
} from "../../middleware/security";
import type { Request, Response, NextFunction } from "express";

describe("Security Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;
  let setHeaderMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    setHeaderMock = vi.fn();

    mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
      method: "POST",
      path: "/test",
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
    };

    mockNext = vi.fn();
  });

  describe("xssProtection", () => {
    it("should sanitize malicious HTML in request body", () => {
      mockReq.body = {
        name: '<script>alert("XSS")</script>John',
        description: "<img src=x onerror=alert(1)>Test",
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).not.toContain("<script>");
      expect(mockReq.body.description).not.toContain("<img");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should sanitize malicious HTML in query params", () => {
      mockReq.query = {
        search: '<script>alert("XSS")</script>',
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).not.toContain("<script>");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should sanitize malicious HTML in route params", () => {
      mockReq.params = {
        id: '<script>alert("XSS")</script>',
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.params.id).not.toContain("<script>");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should preserve plain text content", () => {
      mockReq.body = {
        name: "John Doe",
        age: 30,
        active: true,
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).toBe("John Doe");
      expect(mockReq.body.age).toBe(30);
      expect(mockReq.body.active).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle nested objects", () => {
      mockReq.body = {
        user: {
          name: '<script>alert("XSS")</script>John',
          profile: {
            bio: "<img src=x onerror=alert(1)>Bio",
          },
        },
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq.body as any).user.name).not.toContain("<script>");
      expect((mockReq.body as any).user.profile.bio).not.toContain("<img");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle arrays", () => {
      mockReq.body = {
        tags: ["<script>alert(1)</script>tag1", "tag2"],
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq.body as any).tags[0]).not.toContain("<script>");
      expect((mockReq.body as any).tags[1]).toBe("tag2");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle null and undefined values", () => {
      mockReq.body = {
        name: null,
        description: undefined,
      };

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).toBeNull();
      expect(mockReq.body.description).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle empty request objects", () => {
      mockReq.body = {};
      mockReq.query = {};
      mockReq.params = {};

      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requestSizeLimiter", () => {
    it("should allow requests within size limit", () => {
      const middleware = requestSizeLimiter("10mb");

      mockReq.headers = {
        "content-length": "5242880", // 5MB
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject requests exceeding size limit", () => {
      const middleware = requestSizeLimiter("10mb");

      mockReq.headers = {
        "content-length": "20971520", // 20MB
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(413);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Payload Too Large",
        message: "Request body must be less than 10mb",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow requests without content-length header", () => {
      const middleware = requestSizeLimiter("10mb");

      mockReq.headers = {};

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should use default max size of 10mb", () => {
      const middleware = requestSizeLimiter();

      mockReq.headers = {
        "content-length": "5242880", // 5MB
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("validateContentType", () => {
    it("should allow requests with correct content type", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.headers = {
        "content-type": "application/json",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject requests with incorrect content type", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.headers = {
        "content-type": "text/plain",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(415);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Unsupported Media Type",
        message: "Content-Type must be one of: application/json",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should skip validation for GET requests", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.method = "GET";
      mockReq.headers = {};

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject requests without content-type header", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.headers = {};

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing Content-Type",
        message: "Content-Type header is required",
      });
    });

    it("should be case insensitive", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.headers = {
        "content-type": "APPLICATION/JSON",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle content-type with charset", () => {
      const middleware = validateContentType(["application/json"]);

      mockReq.headers = {
        "content-type": "application/json; charset=utf-8",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should use default allowed types", () => {
      const middleware = validateContentType();

      mockReq.headers = {
        "content-type": "application/json",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("validateEthAddress", () => {
    it("should allow valid Ethereum address", () => {
      const middleware = validateEthAddress("address");

      mockReq.params = {
        address: "0x1234567890123456789012345678901234567890",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject invalid Ethereum address format", () => {
      const middleware = validateEthAddress("address");

      mockReq.params = {
        address: "0xinvalid",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid Address",
        message: "Invalid Ethereum address format",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject address without 0x prefix", () => {
      const middleware = validateEthAddress("address");

      mockReq.params = {
        address: "1234567890123456789012345678901234567890",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should allow when address param is missing", () => {
      const middleware = validateEthAddress("address");

      mockReq.params = {};

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate custom parameter name", () => {
      const middleware = validateEthAddress("poolAddress");

      mockReq.params = {
        poolAddress: "0x1234567890123456789012345678901234567890",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default parameter name "address"', () => {
      const middleware = validateEthAddress();

      mockReq.params = {
        address: "0x1234567890123456789012345678901234567890",
      };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requestId", () => {
    it("should generate request ID when not provided", () => {
      requestId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers!["x-request-id"]).toBeTruthy();
      expect(setHeaderMock).toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should use existing request ID from header", () => {
      mockReq.headers = {
        "x-request-id": "existing-id-123",
      };

      requestId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers["x-request-id"]).toBe("existing-id-123");
      expect(setHeaderMock).toHaveBeenCalledWith(
        "X-Request-ID",
        "existing-id-123",
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("securityHeaders", () => {
    it("should set all security headers", () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(setHeaderMock).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff",
      );
      expect(setHeaderMock).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(setHeaderMock).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block",
      );
      expect(setHeaderMock).toHaveBeenCalledWith(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      expect(setHeaderMock).toHaveBeenCalledWith(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("validateApiKey", () => {
    const originalEnv = process.env.API_KEY;

    afterEach(() => {
      process.env.API_KEY = originalEnv;
    });

    it("should allow request with valid API key", () => {
      process.env.API_KEY = "secret-api-key";

      mockReq.headers = {
        "x-api-key": "secret-api-key",
      };

      validateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject request with invalid API key", () => {
      process.env.API_KEY = "secret-api-key";

      mockReq.headers = {
        "x-api-key": "wrong-api-key",
      };

      validateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Invalid or missing API key",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request without API key header", () => {
      process.env.API_KEY = "secret-api-key";

      mockReq.headers = {};

      validateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("should skip validation when API_KEY is not configured", () => {
      delete process.env.API_KEY;

      mockReq.headers = {};

      validateApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
