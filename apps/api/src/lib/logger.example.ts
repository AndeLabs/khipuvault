/**
 * Logger Usage Examples
 *
 * This file demonstrates how to use the structured logger in different scenarios.
 * DO NOT import this file in production code - it's for reference only.
 */

import { logger, createChildLogger } from './logger'

// ============================================
// BASIC LOGGING LEVELS
// ============================================

// Fatal - Application is about to crash
logger.fatal('Database connection lost, cannot continue')
logger.fatal({ error: new Error('Critical failure') }, 'Critical system error')

// Error - Something went wrong that needs attention
logger.error('Failed to process payment')
logger.error({ userId: '123', orderId: '456' }, 'Order processing failed')

// Warn - Warning message
logger.warn('API rate limit approaching')
logger.warn({ remaining: 10, limit: 100 }, 'Rate limit threshold reached')

// Info - General informational message (default in production)
logger.info('User logged in successfully')
logger.info({ userId: '123', ip: '192.168.1.1' }, 'User authentication successful')

// Debug - Debugging information (default in development)
logger.debug('Cache hit for user profile')
logger.debug({ cacheKey: 'user:123', ttl: 3600 }, 'Cache operation')

// Trace - Very detailed debugging
logger.trace('Entering function processPayment')
logger.trace({ params: { amount: 100, currency: 'USD' } }, 'Function call details')

// ============================================
// STRUCTURED LOGGING WITH CONTEXT
// ============================================

// Log with structured data
logger.info({
  user: {
    id: '123',
    email: 'user@example.com',
  },
  action: 'login',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
}, 'User login event')

// Log with multiple data points
logger.info({
  transaction: {
    id: 'tx_123',
    amount: 1000,
    currency: 'USD',
    status: 'completed',
  },
  pool: {
    id: 'pool_456',
    name: 'Main Pool',
  },
  timestamp: new Date().toISOString(),
}, 'Transaction completed')

// ============================================
// CHILD LOGGERS (Context-Specific Logging)
// ============================================

// Create a child logger for a specific module/service
const authLogger = createChildLogger({ module: 'auth' })
authLogger.info({ userId: '123' }, 'User authenticated')

const poolLogger = createChildLogger({ module: 'pool-service', poolId: 'pool_789' })
poolLogger.debug('Processing pool transaction')

const userServiceLogger = createChildLogger({
  module: 'user-service',
  service: 'api',
  version: '1.0.0',
})
userServiceLogger.info({ action: 'create_user' }, 'Creating new user')

// ============================================
// ERROR LOGGING WITH STACK TRACES
// ============================================

try {
  throw new Error('Something went wrong')
} catch (error) {
  logger.error({ error }, 'Error processing request')
  // Stack trace is automatically included in development
}

// Custom error with additional context
try {
  throw new Error('Payment processing failed')
} catch (error) {
  logger.error({
    error,
    context: {
      userId: '123',
      paymentId: 'pay_456',
      amount: 100,
      retries: 3,
    },
  }, 'Payment error with retry context')
}

// ============================================
// SENSITIVE DATA HANDLING
// ============================================

// These fields are automatically redacted
logger.info({
  user: {
    email: 'user@example.com',
    password: 'secret123', // WILL BE REDACTED
    apiKey: 'key_xyz', // WILL BE REDACTED
  },
  auth: {
    token: 'jwt_token', // WILL BE REDACTED
    refreshToken: 'refresh_token', // WILL BE REDACTED
  },
}, 'User data (sensitive fields redacted)')

// Output will show:
// password: '[REDACTED]'
// apiKey: '[REDACTED]'
// token: '[REDACTED]'
// refreshToken: '[REDACTED]'

// ============================================
// REQUEST CONTEXT LOGGING
// ============================================

// Typically used in middleware/route handlers
function handleRequest(req: any, res: any) {
  const requestLogger = createChildLogger({
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
  })

  requestLogger.info('Processing request')

  try {
    // Process request...
    requestLogger.info({ statusCode: 200 }, 'Request completed successfully')
  } catch (error) {
    requestLogger.error({ error, statusCode: 500 }, 'Request failed')
  }
}

// ============================================
// PERFORMANCE LOGGING
// ============================================

// Measure operation duration
async function processExpensiveOperation() {
  const start = Date.now()
  const opLogger = createChildLogger({ operation: 'expensive_calculation' })

  try {
    // Perform operation...
    await new Promise(resolve => setTimeout(resolve, 1000))

    const duration = Date.now() - start
    opLogger.info({ duration, unit: 'ms' }, 'Operation completed')
  } catch (error) {
    const duration = Date.now() - start
    opLogger.error({ error, duration, unit: 'ms' }, 'Operation failed')
  }
}

// ============================================
// BUSINESS LOGIC LOGGING
// ============================================

// Log important business events
logger.info({
  event: 'pool_created',
  pool: {
    id: 'pool_123',
    name: 'Community Pool',
    initialDeposit: 1000,
    currency: 'USD',
  },
  creator: {
    id: 'user_456',
    role: 'admin',
  },
}, 'New pool created')

logger.info({
  event: 'transaction_completed',
  transaction: {
    id: 'tx_789',
    type: 'deposit',
    amount: 500,
    from: 'user_123',
    to: 'pool_456',
  },
  blockchain: {
    network: 'ethereum',
    blockNumber: 12345678,
    txHash: '0x...',
  },
}, 'Blockchain transaction completed')

// ============================================
// CONDITIONAL LOGGING
// ============================================

const isDebugEnabled = process.env.LOG_LEVEL === 'debug'

if (isDebugEnabled) {
  logger.debug({ expensive: 'data' }, 'Debug information')
}

// Or use log level check
if (logger.isLevelEnabled('trace')) {
  logger.trace({ veryExpensive: 'computation' }, 'Trace information')
}

// ============================================
// BEST PRACTICES
// ============================================

// ✅ DO: Use structured data
logger.info({ userId: '123', action: 'login' }, 'User logged in')

// ❌ DON'T: Use string concatenation
// logger.info('User 123 logged in')

// ✅ DO: Use appropriate log levels
logger.error({ error: new Error() }, 'Database connection failed')
logger.info({ userId: '123' }, 'User profile updated')
logger.debug({ cacheHit: true }, 'Cache lookup')

// ❌ DON'T: Use wrong log levels
// logger.error('User logged in') // Not an error
// logger.info(criticalError) // Should be error or fatal

// ✅ DO: Include context
logger.warn({
  user: '123',
  endpoint: '/api/users',
  rateLimit: { current: 95, max: 100 },
}, 'Approaching rate limit')

// ❌ DON'T: Log without context
// logger.warn('Approaching rate limit')

// ✅ DO: Use child loggers for modules
const moduleLogger = createChildLogger({ module: 'payment-service' })
moduleLogger.info('Processing payment')

// ❌ DON'T: Repeat context in every log
// logger.info({ module: 'payment-service' }, 'Processing payment')
// logger.info({ module: 'payment-service' }, 'Payment complete')

export {}
