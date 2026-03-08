/**
 * @fileoverview Auth Module Type Definitions
 * @module middleware/auth/types
 */

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        iat: number;
        exp: number;
        jti?: string; // JWT ID for blacklist
      };
      rawToken?: string; // Original token for blacklisting
    }
  }
}

export interface NonceData {
  timestamp: number;
  used: boolean;
}

export interface NonceStats {
  total: number;
  used: number;
  unused: number;
  expired: number;
  storeType: "redis" | "memory";
}

export interface SiweVerificationResult {
  valid: boolean;
  address?: string;
  error?: string;
}

export interface JWTPayload {
  address: string;
  iat: number;
  exp: number;
  jti?: string;
}
