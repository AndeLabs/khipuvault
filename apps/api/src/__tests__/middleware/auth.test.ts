import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateNonce,
  generateJWT,
  verifyJWT,
  verifySiweMessage,
  requireAuth,
  getNonceStats,
} from '../../middleware/auth'
import type { Request, Response, NextFunction } from 'express'

// Mock viem
vi.mock('viem', () => ({
  verifyMessage: vi.fn().mockResolvedValue(true),
}))

// Mock SIWE
vi.mock('siwe', () => ({
  SiweMessage: vi.fn().mockImplementation((message: string) => ({
    address: '0x1234567890123456789012345678901234567890',
    nonce: 'test-nonce',
    expirationTime: null,
    notBefore: null,
    verify: vi.fn().mockResolvedValue({
      success: true,
      data: {
        address: '0x1234567890123456789012345678901234567890',
      },
    }),
  })),
}))

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateNonce', () => {
    it('should generate a random nonce', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()

      expect(nonce1).toBeTruthy()
      expect(nonce2).toBeTruthy()
      expect(nonce1).not.toBe(nonce2)
    })

    it('should generate different nonces each time', () => {
      const nonces = new Set<string>()
      for (let i = 0; i < 10; i++) {
        nonces.add(generateNonce())
      }
      expect(nonces.size).toBe(10)
    })

    it('should generate nonce with base64url characters', () => {
      const nonce = generateNonce()
      expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/)
    })
  })

  describe('generateJWT', () => {
    it('should generate a valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890'

      const token = generateJWT(address)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include address in token payload', () => {
      const address = '0x1234567890123456789012345678901234567890'

      const token = generateJWT(address)
      const decoded = verifyJWT(token)

      expect(decoded).toBeTruthy()
      expect(decoded?.address).toBe(address.toLowerCase())
    })

    it('should convert address to lowercase in token', () => {
      const address = '0xABCDEF1234567890123456789012345678901234'

      const token = generateJWT(address)
      const decoded = verifyJWT(token)

      expect(decoded?.address).toBe(address.toLowerCase())
    })
  })

  describe('verifyJWT', () => {
    it('should verify a valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890'

      const token = generateJWT(address)
      const result = verifyJWT(token)

      expect(result).toBeTruthy()
      expect(result?.address).toBe(address.toLowerCase())
      expect(result?.iat).toBeTruthy()
      expect(result?.exp).toBeTruthy()
    })

    it('should return null for invalid token', () => {
      const result = verifyJWT('invalid.token.here')
      expect(result).toBeNull()
    })

    it('should return null for malformed token', () => {
      const result = verifyJWT('not-a-jwt')
      expect(result).toBeNull()
    })
  })

  describe('requireAuth middleware', () => {
    let mockReq: Partial<Request>
    let mockRes: Partial<Response>
    let mockNext: NextFunction
    let jsonMock: any
    let statusMock: any

    beforeEach(() => {
      jsonMock = vi.fn()
      statusMock = vi.fn().mockReturnValue({ json: jsonMock })

      mockReq = {
        headers: {},
      }
      mockRes = {
        status: statusMock,
        json: jsonMock,
      }
      mockNext = vi.fn()
    })

    it('should authenticate valid Bearer token', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const token = generateJWT(address)

      mockReq.headers = {
        authorization: `Bearer ${token}`,
      }

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect((mockReq as any).user).toBeTruthy()
      expect((mockReq as any).user.address).toBe(address.toLowerCase())
    })

    it('should reject request without authorization header', () => {
      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'No authorization token provided',
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject invalid authorization header format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      }

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('Invalid authorization header format'),
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject malformed Bearer token', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      }

      requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('getNonceStats', () => {
    it('should return nonce statistics', () => {
      // Generate some nonces
      generateNonce()
      generateNonce()
      generateNonce()

      const stats = getNonceStats()

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('used')
      expect(stats).toHaveProperty('unused')
      expect(stats).toHaveProperty('expired')
      expect(stats.total).toBeGreaterThanOrEqual(3)
    })
  })
})
