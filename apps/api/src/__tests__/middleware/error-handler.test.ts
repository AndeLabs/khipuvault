import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  errorHandler,
  AppError,
  asyncHandler,
} from "../../middleware/error-handler";
import { ZodError, ZodIssue } from "zod";
import { Prisma } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

// Mock the logger
vi.mock("../../lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Error Handler Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      path: "/test",
      method: "POST",
      url: "/test",
      ip: "127.0.0.1",
      headers: {
        "x-request-id": "test-request-id",
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("AppError", () => {
    it("should create custom application error", () => {
      const error = new AppError(404, "Resource not found");

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
      expect(error.isOperational).toBe(true);
    });

    it("should support optional details field", () => {
      const error = new AppError(400, "Bad request", true, { field: "email" });

      expect(error.details).toEqual({ field: "email" });
    });

    it("should set isOperational flag", () => {
      const operationalError = new AppError(400, "Operational error", true);
      const nonOperationalError = new AppError(500, "Programming error", false);

      expect(operationalError.isOperational).toBe(true);
      expect(nonOperationalError.isOperational).toBe(false);
    });
  });

  describe("errorHandler", () => {
    it("should handle ZodError validation errors", () => {
      const zodIssues: ZodIssue[] = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
      ];

      const zodError = new ZodError(zodIssues);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Invalid request data",
        details: [
          {
            field: "email",
            message: "Expected string, received number",
            code: "invalid_type",
          },
        ],
      });
    });

    it("should handle Prisma unique constraint violations (P2002)", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "4.0.0",
          meta: { target: ["email"] },
        },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Duplicate Entry",
        message: "A record with this email already exists",
        details: { fields: ["email"] },
      });
    });

    it("should handle Prisma foreign key constraint violations (P2003)", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        {
          code: "P2003",
          clientVersion: "4.0.0",
          meta: { field_name: "userId" },
        },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid Reference",
        message: "The referenced record does not exist",
        details: { field: "userId" },
      });
    });

    it("should handle Prisma record not found errors (P2025)", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "4.0.0",
          meta: { cause: "Record to update not found." },
        },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Record to update not found.",
      });
    });

    it("should handle Prisma transaction conflicts (P2034)", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Transaction failed",
        {
          code: "P2034",
          clientVersion: "4.0.0",
          meta: {},
        },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Transaction Conflict",
        message:
          "The operation conflicted with another transaction. Please retry.",
      });
    });

    it("should handle Prisma validation errors", () => {
      const prismaError = new Prisma.PrismaClientValidationError(
        "Invalid data provided",
        { clientVersion: "4.0.0" },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database Validation Error",
          message: "Invalid data provided to database",
        }),
      );
    });

    it("should handle Prisma unknown request errors", () => {
      const prismaError = new Prisma.PrismaClientUnknownRequestError(
        "Unknown database error",
        { clientVersion: "4.0.0" },
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database Error",
          message: "An unexpected database error occurred",
        }),
      );
    });

    it("should handle Prisma initialization errors", () => {
      const prismaError = new Prisma.PrismaClientInitializationError(
        "Cannot connect to database",
        "4.0.0",
        "error-code",
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database Connection Error",
          message: "Unable to connect to database",
        }),
      );
    });

    it("should handle Prisma rust panic errors", () => {
      const prismaError = new Prisma.PrismaClientRustPanicError(
        "Rust panic occurred",
        "4.0.0",
      );

      errorHandler(
        prismaError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Critical Database Error",
        message: "A critical internal error occurred",
      });
    });

    it("should handle custom AppError", () => {
      const appError = new AppError(403, "Forbidden", true, {
        reason: "Insufficient permissions",
      });

      errorHandler(appError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Forbidden",
        details: { reason: "Insufficient permissions" },
      });
    });

    it("should handle unknown errors", () => {
      const unknownError = new Error("Something went wrong");

      errorHandler(
        unknownError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
        }),
      );
    });

    it("should include stack trace in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs).toHaveProperty("stack");
      expect(typeof callArgs.stack).toBe("string");

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include stack trace in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should log error details using logger", async () => {
      const { logger } = await import("../../lib/logger");
      const error = new Error("Test error");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("asyncHandler", () => {
    it("should handle successful async operations", async () => {
      const asyncFn = vi.fn().mockResolvedValue("success");
      const handler = asyncHandler(asyncFn);

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it("should catch and pass errors to next middleware", async () => {
      const error = new Error("Async error");
      const asyncFn = vi.fn().mockRejectedValue(error);
      const handler = asyncHandler(asyncFn);

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle AppError in async functions", async () => {
      const appError = new AppError(404, "Not found");
      const asyncFn = vi.fn().mockRejectedValue(appError);
      const handler = asyncHandler(asyncFn);

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(appError);
    });

    it("should handle synchronous errors thrown in async context", async () => {
      const error = new Error("Sync error");
      const asyncFn = vi.fn().mockImplementation(async () => {
        throw error;
      });
      const handler = asyncHandler(asyncFn);

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
