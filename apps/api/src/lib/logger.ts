import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token', // Matches: token, accessToken, refreshToken, sessionToken, etc.
  'apikey', // Matches: apiKey, api_key
  'secret',
  'authorization',
  'cookie',
  'sessionid', // Matches: sessionId, session_id
  'privatekey', // Matches: privateKey, private_key
  'jwt',
  'creditcard', // Matches: creditCard, credit_card
  'cvv',
  'ssn',
]

/**
 * Redact sensitive information from objects
 */
function redactSensitiveData(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData)
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    )

    if (isSensitive) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

/**
 * Types for serializer inputs
 */
interface RequestLike {
  id?: string
  method?: string
  url?: string
  query?: Record<string, unknown>
  params?: Record<string, unknown>
  headers?: Record<string, string | string[] | undefined>
  remoteAddress?: string
  remotePort?: number
}

interface ResponseLike {
  statusCode?: number
  getHeaders?: () => Record<string, string | string[] | undefined>
}

interface ErrorLike extends Error {
  code?: string | number
  statusCode?: number
  details?: unknown
}

/**
 * Custom serializers for logging
 */
const serializers = {
  req: (req: RequestLike) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    query: redactSensitiveData(req.query),
    params: redactSensitiveData(req.params),
    // Omit authorization header but include other headers
    headers: {
      ...redactSensitiveData(req.headers) as Record<string, unknown>,
      authorization: req.headers?.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers?.cookie ? '[REDACTED]' : undefined,
    },
    remoteAddress: req.remoteAddress,
    remotePort: req.remotePort,
  }),
  res: (res: ResponseLike) => ({
    statusCode: res.statusCode,
    headers: res.getHeaders ? redactSensitiveData(res.getHeaders()) : undefined,
  }),
  err: (err: ErrorLike) => ({
    type: err.constructor.name,
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode,
    details: redactSensitiveData(err.details),
  }),
}

/**
 * Base logger configuration
 */
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  serializers,

  // Base configuration for all environments
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || undefined,
    env: process.env.NODE_ENV,
  },

  // Timestamp configuration
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Format errors properly
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
    bindings: (bindings: pino.Bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        env: bindings.env,
      }
    },
    log: (object: Record<string, unknown>) => {
      // Redact sensitive data from all log objects
      return redactSensitiveData(object) as Record<string, unknown>
    },
  },

  // Redaction rules (Pino's built-in feature)
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      'req.body.apiKey',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      '*.privateKey',
    ],
    censor: '[REDACTED]',
  },
}

/**
 * Development transport configuration (pretty printing)
 */
const developmentConfig: pino.TransportTargetOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss.l',
    ignore: 'pid,hostname',
    singleLine: false,
    messageFormat: '{levelLabel} - {msg}',
    errorLikeObjectKeys: ['err', 'error'],
    levelFirst: true,
  },
}

/**
 * Create the logger instance
 */
export const logger = pino(
  baseConfig,
  isDevelopment
    ? pino.transport(developmentConfig)
    : undefined // Production uses JSON output by default
)

/**
 * Create a child logger with additional context
 *
 * @example
 * const userLogger = createChildLogger({ module: 'user-service' })
 * userLogger.info({ userId: '123' }, 'User logged in')
 */
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(redactSensitiveData(bindings) as pino.Bindings)
}

/**
 * Log levels:
 * - fatal (60): The application is about to crash
 * - error (50): Error that needs attention
 * - warn (40): Warning message
 * - info (30): General informational message (default in production)
 * - debug (20): Debugging information (default in development)
 * - trace (10): Very detailed debugging information
 */

export default logger
