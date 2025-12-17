/**
 * Production-safe logger for the frontend
 * Only logs in development mode to prevent information leakage in production
 */

const isDevelopment = process.env.NODE_ENV === "development";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

function createLogger(): Logger {
  const noop = () => {};

  const createLogFn = (level: LogLevel) => {
    if (!isDevelopment && level !== "error") {
      // In production, only log errors
      return noop;
    }

    return (...args: unknown[]) => {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case "error":
          // eslint-disable-next-line no-console
          console.error(prefix, ...args);
          break;
        case "warn":
          // eslint-disable-next-line no-console
          console.warn(prefix, ...args);
          break;
        case "info":
          // eslint-disable-next-line no-console
          console.info(prefix, ...args);
          break;
        case "debug":
          // eslint-disable-next-line no-console
          console.debug(prefix, ...args);
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(prefix, ...args);
      }
    };
  };

  return {
    log: createLogFn("log"),
    info: createLogFn("info"),
    warn: createLogFn("warn"),
    error: createLogFn("error"),
    debug: createLogFn("debug"),
  };
}

export const logger = createLogger();

// Convenience exports for common patterns
export const devLog = isDevelopment
  ? // eslint-disable-next-line no-console
    (...args: unknown[]) => console.log(...args)
  : () => {};

export const devWarn = isDevelopment
  ? // eslint-disable-next-line no-console
    (...args: unknown[]) => console.warn(...args)
  : () => {};

export const devInfo = isDevelopment
  ? // eslint-disable-next-line no-console
    (...args: unknown[]) => console.info(...args)
  : () => {};
