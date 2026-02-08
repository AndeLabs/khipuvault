/**
 * @fileoverview Error handler middleware tests
 * @module __tests__/middleware/error-handler.test
 */

import { Prisma } from "@prisma/client";
import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";

import { errorHandler, AppError, asyncHandler } from "../../middleware/error-handler";
import { createMockRequest, createMockResponse, createMockNext } from "../setup";

describe("Error Handler Middleware", () => {
  describe("AppError", () => {
    it("should create an error with status code and message", () => {
      const error = new AppError(404, "Not Found");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Not Found");
      expect(error.isOperational).toBe(true);
    });

    it("should create an error with details", () => {
      const error = new AppError(400, "Validation Error", true, {
        field: "email",
      });

      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("errorHandler", () => {
    it("should handle AppError with correct status code", () => {
      const err = new AppError(404, "Resource not found");
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Resource not found",
        })
      );
    });

    it("should handle AppError with details", () => {
      const err = new AppError(400, "Bad Request", true, { field: "name" });
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Bad Request",
          details: { field: "name" },
        })
      );
    });

    it("should handle ZodError with validation details", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      let zodError: ZodError | null = null;
      try {
        schema.parse({ email: "invalid", age: 10 });
      } catch (e) {
        zodError = e as ZodError;
      }

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(zodError!, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation Error",
          message: "Invalid request data",
          details: expect.arrayContaining([expect.objectContaining({ field: expect.any(String) })]),
        })
      );
    });

    it("should handle Prisma unique constraint violation (P2002)", () => {
      const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: { target: ["email"] },
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Duplicate Entry",
        })
      );
    });

    it("should handle Prisma record not found (P2025)", () => {
      const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "5.0.0",
        meta: { cause: "Record to delete does not exist" },
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Not Found",
        })
      );
    });

    it("should handle Prisma foreign key violation (P2003)", () => {
      const err = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "5.0.0",
        meta: { field_name: "userId" },
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid Reference",
        })
      );
    });

    it("should handle unknown errors with 500 status", () => {
      const err = new Error("Something unexpected happened");
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
        })
      );
    });
  });

  describe("asyncHandler", () => {
    it("should pass through successful async functions", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    it("should catch errors and pass to next", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      const testError = new Error("Async error");

      const handler = asyncHandler(async () => {
        throw testError;
      });

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});
