import type { Request, Response } from "express";
import pinoHttp, { type HttpLogger } from "pino-http";

import { logger } from "../lib/logger";

/**
 * Custom serializer for request logging
 */
function customReqSerializer(req: Request) {
  return {
    id: req.id || req.headers["x-request-id"],
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    // Include headers but redact sensitive ones (handled by base logger redaction)
    headers: {
      host: req.headers.host,
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
      accept: req.headers.accept,
      origin: req.headers.origin,
      referer: req.headers.referer,
      "x-request-id": req.headers["x-request-id"],
      // Authorization and Cookie headers will be redacted by base logger
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
    },
    remoteAddress: req.ip || req.socket?.remoteAddress || "unknown",
    remotePort: req.socket?.remotePort,
  };
}

/**
 * Custom serializer for response logging
 */
function customResSerializer(res: Response) {
  return {
    statusCode: res.statusCode,
    headers: {
      "content-type": res.getHeader("content-type"),
      "content-length": res.getHeader("content-length"),
      "x-request-id": res.getHeader("x-request-id"),
      "ratelimit-limit": res.getHeader("ratelimit-limit"),
      "ratelimit-remaining": res.getHeader("ratelimit-remaining"),
      // Set-Cookie will be redacted by base logger
    },
  };
}

/**
 * Determine log level based on response status code
 */
function customLogLevel(req: Request, res: Response, err?: Error): pino.Level {
  if (err || res.statusCode >= 500) {
    return "error";
  }

  if (res.statusCode >= 400) {
    return "warn";
  }

  if (res.statusCode >= 300) {
    return "info";
  }

  // Success responses
  return "info";
}

/**
 * Custom log message based on request and response
 */
function customSuccessMessage(req: Request, res: Response): string {
  const { method, url } = req;
  const { statusCode } = res;
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

  // Generate request ID if not present
  genReqId: (req, res) => {
    const existingId = req.id || req.headers["x-request-id"];
    if (existingId) {
      return existingId as string;
    }

    // Generate new request ID
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader("X-Request-ID", id);
    return id;
  },

  // Custom log level based on status code
  customLogLevel,

  // Custom success message
  customSuccessMessage,

  // Custom error message
  customErrorMessage: (req: Request, res: Response, err: Error): string => {
    const { method, url } = req;
    const { statusCode } = res;
    return `${method} ${url} ${statusCode} - ${err.message}`;
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
      return req.url === "/health" || req.url === "/health/ready";
    },
  },

  // Custom properties to add to each log
  customProps: (req: Request, res: Response) => {
    return {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.socket?.remoteAddress || "unknown",
    };
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
