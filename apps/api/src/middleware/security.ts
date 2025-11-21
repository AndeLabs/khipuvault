import { Request, Response, NextFunction } from 'express'
import mongoSanitize from 'express-mongo-sanitize'

/**
 * MongoDB query sanitization middleware
 * Prevents NoSQL injection attacks
 */
export const sanitizeMongoQueries = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn('⚠️  Sanitized potentially malicious input:', { path: req.path, key })
  },
})

/**
 * Request size limiter middleware
 * Prevents large payload attacks
 */
export function requestSizeLimiter(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length']

    if (contentLength) {
      const sizeMB = parseInt(contentLength) / (1024 * 1024)
      const maxSizeMB = parseInt(maxSize)

      if (sizeMB > maxSizeMB) {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `Request body must be less than ${maxSize}`,
        })
      }
    }

    next()
  }
}

/**
 * Content-Type validation middleware
 * Ensures requests have correct Content-Type headers
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip for GET requests
    if (req.method === 'GET') {
      return next()
    }

    const contentType = req.headers['content-type']

    if (!contentType) {
      return res.status(400).json({
        error: 'Missing Content-Type',
        message: 'Content-Type header is required',
      })
    }

    const isAllowed = allowedTypes.some(type =>
      contentType.toLowerCase().includes(type.toLowerCase())
    )

    if (!isAllowed) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      })
    }

    next()
  }
}

/**
 * Ethereum address validation middleware
 * Validates Ethereum addresses in request parameters
 */
export function validateEthAddress(param: string = 'address') {
  return (req: Request, res: Response, next: NextFunction) => {
    const address = req.params[param]

    if (!address) {
      return next()
    }

    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/

    if (!ethAddressRegex.test(address)) {
      return res.status(400).json({
        error: 'Invalid Address',
        message: 'Invalid Ethereum address format',
      })
    }

    next()
  }
}

/**
 * XSS protection middleware
 * Sanitizes user inputs to prevent XSS attacks
 */
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove dangerous characters and tags
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key])
      }
      return sanitized
    }

    return obj
  }

  if (req.body) {
    req.body = sanitize(req.body)
  }

  if (req.query) {
    req.query = sanitize(req.query)
  }

  if (req.params) {
    req.params = sanitize(req.params)
  }

  next()
}

/**
 * Request ID middleware for tracking and debugging
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] ||
             `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  req.headers['x-request-id'] = id as string
  res.setHeader('X-Request-ID', id)

  next()
}

/**
 * Security headers middleware
 * Adds additional security headers beyond helmet
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // XSS protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  next()
}

/**
 * API key validation middleware (for internal services)
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  const expectedApiKey = process.env.API_KEY

  // If no API key is configured, skip validation
  if (!expectedApiKey) {
    return next()
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
    })
  }

  next()
}
