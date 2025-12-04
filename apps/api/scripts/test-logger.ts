/**
 * Logger Test Script
 *
 * Run this script to see the logger in action:
 * pnpm tsx scripts/test-logger.ts
 */

import { logger, createChildLogger } from '../src/lib/logger'

console.log('\n=== Testing Pino Structured Logger ===\n')

// Wait a bit to make output readable
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function testLogger() {
  // 1. Basic log levels
  console.log('1. Testing different log levels:')
  logger.trace('This is a TRACE message (very detailed)')
  logger.debug('This is a DEBUG message')
  logger.info('This is an INFO message')
  logger.warn('This is a WARN message')
  logger.error('This is an ERROR message')
  // logger.fatal('This is a FATAL message') // Skipping as it may exit process

  await wait(100)

  // 2. Structured logging
  console.log('\n2. Testing structured logging:')
  logger.info({
    user: {
      id: '123',
      email: 'user@example.com',
    },
    action: 'login',
    ip: '192.168.1.1',
    timestamp: new Date().toISOString(),
  }, 'User login event')

  await wait(100)

  // 3. Sensitive data redaction
  console.log('\n3. Testing sensitive data redaction:')
  logger.info({
    user: {
      email: 'user@example.com',
      password: 'secret123', // Will be redacted
      apiKey: 'sk_live_123456', // Will be redacted
    },
    auth: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Will be redacted
      refreshToken: 'refresh_123', // Will be redacted
    },
    publicData: 'This will be visible',
  }, 'Sensitive data test (password, apiKey, tokens should be [REDACTED])')

  await wait(100)

  // 4. Child loggers
  console.log('\n4. Testing child loggers:')
  const authLogger = createChildLogger({ module: 'auth' })
  authLogger.info({ userId: '456' }, 'User authenticated')

  const poolLogger = createChildLogger({
    module: 'pool-service',
    poolId: 'pool_789',
  })
  poolLogger.debug('Processing pool transaction')

  await wait(100)

  // 5. Error logging
  console.log('\n5. Testing error logging:')
  try {
    throw new Error('Something went wrong!')
  } catch (error) {
    logger.error({
      error,
      context: {
        userId: '123',
        operation: 'payment',
        amount: 100,
        retries: 3,
      },
    }, 'Error processing payment')
  }

  await wait(100)

  // 6. Performance logging
  console.log('\n6. Testing performance logging:')
  const start = Date.now()
  await wait(150) // Simulate operation
  const duration = Date.now() - start

  logger.info({
    operation: 'database_query',
    duration,
    unit: 'ms',
    query: 'SELECT * FROM users WHERE id = ?',
    recordsReturned: 1,
  }, 'Database query completed')

  await wait(100)

  // 7. Business events
  console.log('\n7. Testing business event logging:')
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
    blockchain: {
      network: 'ethereum',
      blockNumber: 12345678,
    },
  }, 'New pool created')

  await wait(100)

  // 8. Different contexts with child loggers
  console.log('\n8. Testing multiple contexts:')
  const requestLogger = createChildLogger({
    requestId: 'req_abc123',
    method: 'POST',
    path: '/api/pools',
  })

  requestLogger.info('Processing request')
  requestLogger.info({ statusCode: 201 }, 'Request completed successfully')

  await wait(100)

  // 9. Warning with context
  console.log('\n9. Testing warnings with context:')
  logger.warn({
    userId: '123',
    endpoint: '/api/users',
    rateLimit: {
      current: 95,
      max: 100,
      remaining: 5,
    },
  }, 'Approaching rate limit threshold')

  await wait(100)

  console.log('\n=== Logger Test Complete ===\n')
  console.log('Note: password, apiKey, token, and refreshToken should appear as [REDACTED]')
  console.log('Run with LOG_LEVEL=trace to see trace messages')
  console.log('Run with LOG_LEVEL=error to see only errors and fatals')
}

testLogger().catch(error => {
  logger.fatal({ error }, 'Logger test failed')
  process.exit(1)
})
