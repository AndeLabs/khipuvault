/**
 * Production-safe logging utility
 *
 * Only logs debug messages in development mode.
 * Always preserves error and warning messages for production monitoring.
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.log('Debug info');  // Only in development
 * logger.error('Error!');    // Always logged
 * logger.warn('Warning!');   // Always logged
 * ```
 */

type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

interface LoggerConfig {
  enabledInProduction: LogLevel[];
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.config = {
      enabledInProduction: ['error', 'warn'],
      ...config,
    };
  }

  /**
   * Log debug information (development only)
   */
  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...args);
    }
  }

  /**
   * Log warnings (always logged, even in production)
   */
  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  /**
   * Log errors (always logged, even in production)
   */
  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...args);
    }
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (this.isDevelopment && console.group) {
      console.group(label);
    }
  }

  /**
   * End log group (development only)
   */
  groupEnd(): void {
    if (this.isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log table data (development only)
   */
  table(data: any): void {
    if (this.isDevelopment && console.table) {
      console.table(data);
    }
  }

  /**
   * Start performance timing (development only)
   */
  time(label: string): void {
    if (this.isDevelopment && console.time) {
      console.time(label);
    }
  }

  /**
   * End performance timing (development only)
   */
  timeEnd(label: string): void {
    if (this.isDevelopment && console.timeEnd) {
      console.timeEnd(label);
    }
  }

  /**
   * Determine if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true;
    }
    return this.config.enabledInProduction.includes(level);
  }
}

/**
 * Default logger instance
 *
 * In production:
 * - log(), info(), debug() are suppressed
 * - warn() and error() are always shown
 *
 * In development:
 * - All methods are active
 */
export const logger = new Logger();

/**
 * Create a namespaced logger with prefix
 *
 * @example
 * ```typescript
 * const log = createLogger('MyComponent');
 * log.log('Hello'); // Outputs: [MyComponent] Hello
 * ```
 */
export function createLogger(namespace: string): Logger {
  const namespacedLogger = new Logger();

  // Wrap methods to add namespace prefix
  const originalLog = namespacedLogger.log.bind(namespacedLogger);
  const originalInfo = namespacedLogger.info.bind(namespacedLogger);
  const originalDebug = namespacedLogger.debug.bind(namespacedLogger);
  const originalWarn = namespacedLogger.warn.bind(namespacedLogger);
  const originalError = namespacedLogger.error.bind(namespacedLogger);

  namespacedLogger.log = (...args: any[]) => originalLog(`[${namespace}]`, ...args);
  namespacedLogger.info = (...args: any[]) => originalInfo(`[${namespace}]`, ...args);
  namespacedLogger.debug = (...args: any[]) => originalDebug(`[${namespace}]`, ...args);
  namespacedLogger.warn = (...args: any[]) => originalWarn(`[${namespace}]`, ...args);
  namespacedLogger.error = (...args: any[]) => originalError(`[${namespace}]`, ...args);

  return namespacedLogger;
}

/**
 * Conditional logger for specific environments
 *
 * @example
 * ```typescript
 * const verboseLog = conditionalLogger(['development', 'staging']);
 * verboseLog('This only shows in dev and staging');
 * ```
 */
export function conditionalLogger(
  allowedEnvironments: string[] = ['development']
): (...args: any[]) => void {
  return (...args: any[]) => {
    const currentEnv = process.env.NODE_ENV || 'development';
    if (allowedEnvironments.includes(currentEnv)) {
      console.log(...args);
    }
  };
}
