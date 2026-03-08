/**
 * @fileoverview Sign-In with Ethereum (SIWE) Verification
 * @module middleware/auth/siwe-verifier
 */

import { SiweMessage } from "siwe";
import { verifyMessage } from "viem";

import { logger } from "../../lib/logger";

import { validateAndConsumeNonce, NONCE_EXPIRATION_MS } from "./nonce-manager";

import type { SiweVerificationResult } from "./types";

/**
 * Verify a SIWE (Sign-In with Ethereum) message and signature
 */
export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<SiweVerificationResult> {
  try {
    // Parse the SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify the message structure and fields
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return {
        valid: false,
        error: "Signature verification failed",
      };
    }

    // Atomically check and consume nonce
    const nonceResult = await validateAndConsumeNonce(siweMessage.nonce);
    if (!nonceResult.valid) {
      return {
        valid: false,
        error: nonceResult.error,
      };
    }

    // Verify signature using viem
    const isValidSignature = await verifyMessage({
      address: siweMessage.address as `0x${string}`,
      message: message,
      signature: signature as `0x${string}`,
    });

    if (!isValidSignature) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    // Check message expiration if set
    const now = Date.now();
    if (siweMessage.expirationTime) {
      const expirationDate = new Date(siweMessage.expirationTime);
      if (expirationDate.getTime() < now) {
        return {
          valid: false,
          error: "Message has expired",
        };
      }
    }

    // Check message not-before time if set
    if (siweMessage.notBefore) {
      const notBeforeDate = new Date(siweMessage.notBefore);
      if (notBeforeDate.getTime() > now) {
        return {
          valid: false,
          error: "Message not yet valid",
        };
      }
    }

    return {
      valid: true,
      address: siweMessage.address,
    };
  } catch (error) {
    logger.error({ error, messagePreview: message.substring(0, 100) }, "SIWE verification error");
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}
