import 'dotenv/config'
import express, { type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'
import {
  globalRateLimiter,
  speedLimiter,
  writeRateLimiter,
} from './middleware/rate-limit'
import {
  sanitizeMongoQueries,
  requestSizeLimiter,
  validateContentType,
  xssProtection,
  requestId,
  securityHeaders,
} from './middleware/security'

// Routes
import usersRouter from './routes/users'
import poolsRouter from './routes/pools'
import transactionsRouter from './routes/transactions'
import analyticsRouter from './routes/analytics'
import healthRouter from './routes/health'

const app: Application = express()
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// ===== SECURITY MIDDLEWARE (Order matters!) =====

// 1. Request tracking
app.use(requestId)

// 2. Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))
app.use(securityHeaders)

// 3. CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    if (corsOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID', 'RateLimit-Limit', 'RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
}))

// 4. Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  // Production logging format
  app.use(morgan('combined'))
}

// 5. Body parsing with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 6. Request size validation
app.use(requestSizeLimiter('10mb'))

// 7. Content-Type validation (for write operations)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return validateContentType(['application/json'])(req, res, next)
  }
  next()
})

// 8. Input sanitization
app.use(xssProtection)
app.use(sanitizeMongoQueries)

// 9. Rate limiting
app.use(globalRateLimiter) // Global rate limit
app.use(speedLimiter) // Speed limiter (gradual slowdown)
app.use(writeRateLimiter) // Extra limit for write operations

// ===== ROUTES =====

// Health check (no rate limiting)
app.use('/health', healthRouter)

// API routes
app.use('/api/users', usersRouter)
app.use('/api/pools', poolsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/analytics', analyticsRouter)

// ===== ERROR HANDLING =====

// 404 handler
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// ===== SERVER STARTUP =====

const server = app.listen(PORT, () => {
  console.log('🚀 KhipuVault API Server')
  console.log('========================')
  console.log(`📍 URL: http://localhost:${PORT}`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  console.log(`🔐 CORS origins: ${corsOrigins.join(', ')}`)
  console.log(`⚡ Rate limiting: ENABLED`)
  console.log(`🛡️  Security features: ENABLED`)
  console.log('========================')
})

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`)

  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
})

export default app
