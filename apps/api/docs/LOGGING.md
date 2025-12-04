# Logging System Documentation

This document describes the structured logging implementation in the KhipuVault API using Pino.

## Overview

The API uses [Pino](https://getpino.io/) for high-performance, structured JSON logging. Pino is one of the fastest Node.js loggers available and provides excellent features for production use.

## Key Features

- **Structured JSON Logging**: All logs are formatted as JSON for easy parsing and analysis
- **Automatic Request/Response Logging**: HTTP requests and responses are automatically logged with timing information
- **Request ID Tracking**: Every request gets a unique ID for correlation across logs
- **Sensitive Data Redaction**: Passwords, tokens, and other sensitive fields are automatically redacted
- **Environment-Based Formatting**: Pretty-printed in development, JSON in production
- **Multiple Log Levels**: trace, debug, info, warn, error, fatal
- **Performance Focused**: Minimal overhead with async logging

## Files

### Core Logger

- **`/src/lib/logger.ts`**: Main logger configuration and exports
- **`/src/lib/logger.example.ts`**: Usage examples and best practices
- **`/src/middleware/request-logger.ts`**: HTTP request/response logging middleware

## Usage

### Basic Logging

```typescript
import { logger } from '../lib/logger'

// Different log levels
logger.trace('Very detailed debugging info')
logger.debug('Debug information')
logger.info('General information')
logger.warn('Warning message')
logger.error('Error occurred')
logger.fatal('Critical failure')
```

### Structured Logging

Always use structured data instead of string concatenation:

```typescript
// ✅ GOOD - Structured logging
logger.info({
  userId: '123',
  action: 'login',
  ip: '192.168.1.1'
}, 'User logged in')

// ❌ BAD - String concatenation
logger.info('User 123 logged in from 192.168.1.1')
```

### Child Loggers

Create child loggers for specific modules or contexts:

```typescript
import { createChildLogger } from '../lib/logger'

const authLogger = createChildLogger({ module: 'auth' })
authLogger.info({ userId: '123' }, 'User authenticated')

const poolLogger = createChildLogger({
  module: 'pool-service',
  poolId: 'pool_789'
})
poolLogger.debug('Processing pool transaction')
```

### Error Logging

Log errors with full context:

```typescript
try {
  // Some operation
} catch (error) {
  logger.error({
    error, // Stack trace included automatically
    context: {
      userId: '123',
      operation: 'payment',
      retries: 3
    }
  }, 'Operation failed')
}
```

### Request Context Logging

In middleware or route handlers:

```typescript
function handleRequest(req: Request, res: Response) {
  const requestLogger = createChildLogger({
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path
  })

  requestLogger.info('Processing request')

  try {
    // Handle request
    requestLogger.info({ statusCode: 200 }, 'Request completed')
  } catch (error) {
    requestLogger.error({ error }, 'Request failed')
  }
}
```

## Log Levels

The logger uses standard Pino log levels:

| Level | Value | Description | When to Use |
|-------|-------|-------------|-------------|
| **fatal** | 60 | Application is about to crash | Critical failures that require immediate attention |
| **error** | 50 | Error that needs attention | Errors that should be investigated |
| **warn** | 40 | Warning message | Potential issues or deprecated features |
| **info** | 30 | General informational message | Important application events |
| **debug** | 20 | Debugging information | Detailed information for debugging |
| **trace** | 10 | Very detailed debugging | Step-by-step execution details |

### Default Levels by Environment

- **Development**: `debug` (shows debug, info, warn, error, fatal)
- **Production**: `info` (shows info, warn, error, fatal)

### Override Log Level

Set the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug pnpm dev
LOG_LEVEL=trace pnpm dev
```

## Sensitive Data Redaction

The following fields are automatically redacted from logs:

- `password`
- `token`, `access_token`, `refresh_token`, `session_token`
- `apiKey`, `api_key`
- `secret`
- `authorization`
- `cookie`
- `sessionId`, `session_id`
- `privateKey`, `private_key`
- `jwt`
- `creditCard`, `credit_card`, `cvv`
- `ssn`

### Example

```typescript
logger.info({
  user: {
    email: 'user@example.com',
    password: 'secret123', // Will be [REDACTED]
    apiKey: 'key_xyz'      // Will be [REDACTED]
  }
}, 'User data')

// Output:
// {
//   "user": {
//     "email": "user@example.com",
//     "password": "[REDACTED]",
//     "apiKey": "[REDACTED]"
//   },
//   "msg": "User data"
// }
```

## Request Logging

HTTP requests are automatically logged with:

- Request ID (for correlation)
- Method and URL
- Query parameters
- Request headers (sensitive ones redacted)
- Response status code
- Response time in milliseconds
- IP address and user agent

### Log Levels by Status Code

- **5xx** (Server errors): `error`
- **4xx** (Client errors): `warn`
- **3xx/2xx** (Success/Redirects): `info`

### Excluded Routes

The `/health` and `/health/ready` endpoints are not logged to reduce noise.

## Development vs Production

### Development Mode

```bash
pnpm dev
```

Logs are pretty-printed for human readability:

```
[1699564800000] INFO (12345 on hostname): KhipuVault API Server started
    port: 3001
    environment: "development"
    corsOrigins: ["localhost (dev)"]
    features: {
      "rateLimiting": true,
      "security": true,
      "logging": true
    }
```

### Development with JSON Output

```bash
pnpm dev:json
```

Logs are output as raw JSON (useful for testing log parsing):

```json
{"level":30,"timestamp":"2023-11-09T12:00:00.000Z","pid":12345,"hostname":"hostname","msg":"KhipuVault API Server started","port":3001,"environment":"development"}
```

### Production Mode

```bash
NODE_ENV=production pnpm start
```

Logs are always JSON in production for log aggregation systems:

```json
{"level":30,"timestamp":"2023-11-09T12:00:00.000Z","pid":12345,"hostname":"prod-server","msg":"KhipuVault API Server started","port":3001,"environment":"production"}
```

## Best Practices

### DO ✅

1. **Use structured data**: Always log objects with meaningful keys
   ```typescript
   logger.info({ userId, action: 'login' }, 'User logged in')
   ```

2. **Use appropriate log levels**: Use `error` for errors, `info` for important events, `debug` for debugging
   ```typescript
   logger.error({ error }, 'Database connection failed')
   logger.info({ userId }, 'User logged in')
   logger.debug({ cacheKey }, 'Cache lookup')
   ```

3. **Include context**: Add relevant information to help debugging
   ```typescript
   logger.warn({
     userId: '123',
     endpoint: '/api/users',
     rateLimit: { current: 95, max: 100 }
   }, 'Approaching rate limit')
   ```

4. **Use child loggers**: For modules or specific contexts
   ```typescript
   const moduleLogger = createChildLogger({ module: 'payment-service' })
   moduleLogger.info('Processing payment')
   ```

5. **Log errors with stack traces**: Always include the error object
   ```typescript
   logger.error({ error }, 'Operation failed')
   ```

### DON'T ❌

1. **Don't use string concatenation**
   ```typescript
   // ❌ BAD
   logger.info('User ' + userId + ' logged in')

   // ✅ GOOD
   logger.info({ userId }, 'User logged in')
   ```

2. **Don't log sensitive data directly** (even though it's redacted, be careful)
   ```typescript
   // ❌ BAD
   logger.info({ rawPassword: password }, 'Password check')

   // ✅ GOOD
   logger.info({ passwordLength: password.length }, 'Password validated')
   ```

3. **Don't use wrong log levels**
   ```typescript
   // ❌ BAD
   logger.error('User logged in') // Not an error

   // ✅ GOOD
   logger.info({ userId }, 'User logged in')
   ```

4. **Don't repeat context in every log**
   ```typescript
   // ❌ BAD
   logger.info({ module: 'payment' }, 'Processing')
   logger.info({ module: 'payment' }, 'Complete')

   // ✅ GOOD
   const paymentLogger = createChildLogger({ module: 'payment' })
   paymentLogger.info('Processing')
   paymentLogger.info('Complete')
   ```

5. **Don't use console.log/error directly**
   ```typescript
   // ❌ BAD
   console.log('Something happened')

   // ✅ GOOD
   logger.info('Something happened')
   ```

## Log Aggregation

In production, you should send logs to a log aggregation service:

- **Datadog**: Use `pino-datadog` transport
- **CloudWatch**: Use `pino-cloudwatch` transport
- **Elasticsearch**: Use `pino-elasticsearch` transport
- **Splunk**: Use `pino-splunk` transport
- **Papertrail**: Use `pino-papertrail` transport

Example configuration for production:

```typescript
// In logger.ts
const productionConfig = {
  target: 'pino-datadog',
  options: {
    apiKey: process.env.DATADOG_API_KEY,
    service: 'khipuvault-api',
    ddsource: 'nodejs',
  }
}
```

## Monitoring and Alerting

Use logs to set up monitoring and alerts:

1. **Error Rate**: Alert when error logs exceed threshold
2. **Response Time**: Track `responseTimeMs` in request logs
3. **Failed Authentications**: Monitor failed auth attempts
4. **Rate Limiting**: Track when users hit rate limits
5. **Database Errors**: Alert on Prisma errors
6. **Security Events**: Monitor sanitization warnings

## Performance Considerations

Pino is extremely fast, but follow these guidelines:

1. **Use async logging**: Pino automatically handles this
2. **Avoid excessive trace logging**: Only enable in specific debugging scenarios
3. **Don't log in tight loops**: Batch or sample if necessary
4. **Use child loggers**: They're more efficient than repeating context

## Troubleshooting

### Pretty printing not working in development

Make sure you're using the `dev` script, not `dev:json`:

```bash
pnpm dev
```

### Logs not showing up

Check your log level:

```bash
LOG_LEVEL=debug pnpm dev
```

### Too many logs

1. Increase log level to `info` or `warn`
2. Filter out noisy routes in request logger
3. Use conditional logging for expensive operations

### Sensitive data appearing in logs

1. Check the redaction configuration in `logger.ts`
2. Add new patterns to the `SENSITIVE_FIELDS` array
3. Verify field names match the redaction patterns

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Pino Best Practices](https://getpino.io/#/docs/best-practices)
- [Pino API](https://getpino.io/#/docs/api)
- [Example Usage](./src/lib/logger.example.ts)
