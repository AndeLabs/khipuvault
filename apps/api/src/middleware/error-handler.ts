import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { logger } from "../lib/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public details?: Record<string, unknown> | string | string[]
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Comprehensive error handler with support for:
 * - Zod validation errors
 * - Prisma database errors
 * - Custom application errors
 * - Unknown errors
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log error with context using structured logging
  const errorContext = {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      ...(err instanceof AppError && {
        statusCode: err.statusCode,
        details: err.details,
      }),
      ...(err instanceof ZodError && { validationErrors: err.errors }),
      ...(err instanceof Prisma.PrismaClientKnownRequestError && {
        code: err.code,
        meta: err.meta,
      }),
    },
    request: {
      method: req.method,
      path: req.path,
      url: req.url,
      requestId: req.headers["x-request-id"],
      ip: req.ip,
    },
  };

  // Log at appropriate level
  if (err instanceof AppError && err.statusCode < 500) {
    // Client errors (4xx) - log as warn
    logger.warn(errorContext, `Client error: ${err.message}`);
  } else {
    // Server errors (5xx) or unknown errors - log as error
    logger.error(errorContext, `Server error: ${err.message}`);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }

  // Prisma Known Request Errors (database constraint violations, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaKnownError(err, res);
  }

  // Prisma Validation Errors (invalid data types, etc.)
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: "Database Validation Error",
      message: "Invalid data provided to database",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Prisma Unknown Errors (database connection issues, etc.)
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return res.status(503).json({
      error: "Database Error",
      message: "An unexpected database error occurred",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Prisma Initialization Errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      error: "Database Connection Error",
      message: "Unable to connect to database",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Prisma Rust Panic Errors (critical internal errors)
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return res.status(500).json({
      error: "Critical Database Error",
      message: "A critical internal error occurred",
    });
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Unknown errors
  return res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

/**
 * Handle Prisma Known Request Errors with specific error codes
 * See: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
interface PrismaErrorMeta {
  target?: string[];
  field_name?: string;
  cause?: string;
  relation_name?: string;
  constraint?: string;
}

function handlePrismaKnownError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  const errorCode = err.code;
  const meta = err.meta as PrismaErrorMeta | undefined;

  switch (errorCode) {
    // Unique constraint violation
    case "P2002": {
      const fields = meta?.target || [];
      return res.status(409).json({
        error: "Duplicate Entry",
        message: `A record with this ${fields.join(", ")} already exists`,
        details: { fields },
      });
    }

    // Foreign key constraint violation
    case "P2003": {
      return res.status(400).json({
        error: "Invalid Reference",
        message: "The referenced record does not exist",
        details: { field: meta?.field_name },
      });
    }

    // Record not found
    case "P2025": {
      return res.status(404).json({
        error: "Not Found",
        message: meta?.cause || "Record not found",
      });
    }

    // Transaction failed
    case "P2034": {
      return res.status(409).json({
        error: "Transaction Conflict",
        message: "The operation conflicted with another transaction. Please retry.",
      });
    }

    // Required relation violation
    case "P2014": {
      return res.status(400).json({
        error: "Invalid Operation",
        message: "Cannot delete record due to existing relationships",
        details: { relation: meta?.relation_name },
      });
    }

    // Database constraint violation
    case "P2004": {
      return res.status(400).json({
        error: "Constraint Violation",
        message: "Operation violates a database constraint",
        details: { constraint: meta?.constraint },
      });
    }

    // Null constraint violation
    case "P2011": {
      return res.status(400).json({
        error: "Missing Required Field",
        message: "A required field was not provided",
        details: { constraint: meta?.constraint },
      });
    }

    // Table not found
    case "P2021": {
      return res.status(500).json({
        error: "Configuration Error",
        message: "Database schema mismatch detected",
      });
    }

    default: {
      return res.status(500).json({
        error: "Database Error",
        message: "An unexpected database error occurred",
        code: errorCode,
        details:
          process.env.NODE_ENV === "development" ? { meta, message: err.message } : undefined,
      });
    }
  }
}

/**
 * Async handler wrapper to catch promise rejections
 * Usage: asyncHandler(async (req, res, next) => { ... })
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
