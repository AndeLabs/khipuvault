import { randomBytes } from "node:crypto";

import pinoHttp, { type HttpLogger } from "pino-http";

import { logger } from "../lib/logger";

import type { Request, Response } from "express";

/**
 * Generate a cryptographically secure request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${randomBytes(6).toString("hex")}`;
}

/**
 * Custom serializer for request logging
 */
function customReqSerializer(req: Request) {
  // Handle case where req might not be a proper request object
  if (!req || typeof req !== "object") {
    return { method: "???", url: "/" };
  }

  const headers = req.headers ?? {};

  return {
    id: req.id || headers["x-request-id"],
    method: req.method ?? "???",
    url: req.url ?? "/",
    path: req.path,
    query: req.query,
    params: req.params,
    // Include headers but redact sensitive ones (handled by base logger redaction)
    headers: {
      host: headers.host,
      "user-agent": headers["user-agent"],
      "content-type": headers["content-type"],
      "content-length": headers["content-length"],
      accept: headers.accept,
      origin: headers.origin,
      referer: headers.referer,
      "x-request-id": headers["x-request-id"],
      // Authorization and Cookie headers will be redacted by base logger
      authorization: headers.authorization,
      cookie: headers.cookie,
    },
    remoteAddress: req.ip || req.socket?.remoteAddress || "unknown",
    remotePort: req.socket?.remotePort,
  };
}

/**
 * Custom serializer for response logging
 * Note: pino-http may pass a ServerResponse object, not Express Response
 */
function customResSerializer(res: Response) {
  // Safely get headers - res might be ServerResponse without getHeader
  const getHeader = (name: string): unknown => {
    try {
      // Try Express Response method first
      if (res && typeof res.getHeader === "function") {
        return res.getHeader(name);
      }
    } catch {
      // Ignore errors from getHeader
    }

    try {
      // Fallback for raw ServerResponse _headers
      const headers = (res as unknown as { _headers?: Record<string, unknown> })?._headers;
      if (headers) {
        return headers[name.toLowerCase()];
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  };

  // Handle case where res might not be a proper response object
  if (!res || typeof res !== "object") {
    return { statusCode: 0, headers: {} };
  }

  return {
    statusCode: res.statusCode ?? 0,
    headers: {
      "content-type": getHeader("content-type"),
      "content-length": getHeader("content-length"),
      "x-request-id": getHeader("x-request-id"),
      "ratelimit-limit": getHeader("ratelimit-limit"),
      "ratelimit-remaining": getHeader("ratelimit-remaining"),
    },
  };
}

/**
 * Determine log level based on response status code
 */
function customLogLevel(_req: Request, res: Response, err?: Error): pino.Level {
  const statusCode = res?.statusCode ?? 200;

  if (err || statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warn";
  }

  // All other responses (success and redirects)
  return "info";
}

/**
 * Custom log message based on request and response
 */
function customSuccessMessage(req: Request, res: Response): string {
  const method = req?.method ?? "???";
  const url = req?.url ?? "/";
  const statusCode = res?.statusCode ?? 0;
  return `${method} ${url} ${statusCode}`;
}

/**
 * Pino HTTP middleware for request/response logging
 */
export const requestLogger: HttpLogger<Request, Response> = pinoHttp({
  logger,

  // Custom serializers
  serializers: {
    req: customReqSerializer,
    res: customResSerializer,
  },

  // Generate cryptographically secure request ID if not present
  genReqId: (req, res) => {
    try {
      const existingId = req?.id || req?.headers?.["x-request-id"];
      if (existingId) {
        return existingId as string;
      }

      // Generate new cryptographically secure request ID
      const id = generateRequestId();
      if (res && typeof res.setHeader === "function") {
        res.setHeader("X-Request-ID", id);
      }
      return id;
    } catch {
      return `${Date.now()}-${randomBytes(4).toString("hex")}`;
    }
  },

  // Custom log level based on status code
  customLogLevel,

  // Custom success message
  customSuccessMessage,

  // Custom error message
  customErrorMessage: (req: Request, res: Response, err: Error): string => {
    const method = req?.method ?? "???";
    const url = req?.url ?? "/";
    const statusCode = res?.statusCode ?? 0;
    const message = err?.message ?? "Unknown error";
    return `${method} ${url} ${statusCode} - ${message}`;
  },

  // Custom attribute keys
  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
    responseTime: "responseTimeMs",
  },

  // Auto-logging configuration
  autoLogging: {
    // Don't log health check requests (too noisy)
    ignore: (req: Request) => {
      const url = req?.url ?? "";
      return url === "/health" || url === "/health/ready";
    },
  },

  // Custom properties to add to each log
  customProps: (req: Request, _res: Response) => {
    try {
      return {
        userAgent: req?.headers?.["user-agent"] ?? "unknown",
        ip: req?.ip || req?.socket?.remoteAddress || "unknown",
      };
    } catch {
      return { userAgent: "unknown", ip: "unknown" };
    }
  },

  // Redact sensitive information (combined with base logger redaction)
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-api-key"]',
      "request.headers.authorization",
      "request.headers.cookie",
      'request.headers["x-api-key"]',
      'res.headers["set-cookie"]',
      'response.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },

  // Quieter logging (remove some unnecessary fields)
  quietReqLogger: true,
});

/**
 * Export pino types for use in other modules
 */
import type pino from "pino";
export type { pino };
