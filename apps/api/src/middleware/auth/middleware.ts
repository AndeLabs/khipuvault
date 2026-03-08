/**
 * @fileoverview Express Authentication Middleware
 * @module middleware/auth/middleware
 */

import { Request, Response, NextFunction } from "express";

import { tokenBlacklist } from "../../lib/cache";
import { logger } from "../../lib/logger";

import { verifyJWT } from "./jwt-manager";

// Import types to extend Express.Request
import "./types";

/**
 * Express middleware to require authentication
 * Validates JWT token from Authorization header
 * Checks token blacklist for revoked tokens
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No authorization token provided",
      });
      return;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header format. Use: Bearer <token>",
      });
      return;
    }

    const token = parts[1];
    const decoded = verifyJWT(token);

    if (!decoded) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    // Check if token is blacklisted (revoked on logout)
    if (decoded.jti) {
      const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
      if (isRevoked) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Token has been revoked. Please log in again.",
        });
        return;
      }
    }

    // Attach user data and raw token to request
    req.user = decoded;
    req.rawToken = token;

    next();
  } catch (error) {
    logger.error({ error, path: req.path, method: req.method }, "Auth middleware error");
    res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for routes that have different behavior for authenticated users
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(" ");

    if (parts.length === 2 && parts[0] === "Bearer") {
      const token = parts[1];
      const decoded = verifyJWT(token);

      if (decoded) {
        if (decoded.jti) {
          const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
          if (!isRevoked) {
            req.user = decoded;
            req.rawToken = token;
          }
        } else {
          req.user = decoded;
          req.rawToken = token;
        }
      }
    }

    next();
  } catch (error) {
    logger.warn(
      { error, path: req.path },
      "Optional auth failed - continuing without authentication"
    );
    next();
  }
}
