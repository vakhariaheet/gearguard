/**
 * Structured Logger for Lambda Functions
 * 
 * Features:
 * - Log levels: debug, info, warn, error
 * - Structured JSON output for CloudWatch Logs Insights
 * - Request context tracking (requestId, userId)
 * - Automatic timestamp and metadata
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log level priority for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  module?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Get minimum log level from environment
 */
const getMinLogLevel = (): LogLevel => {
  const level = process.env['LOG_LEVEL']?.toUpperCase();
  if (level && Object.values(LogLevel).includes(level as LogLevel)) {
    return level as LogLevel;
  }
  // Default to DEBUG in dev, INFO in prod
  return process.env['NODE_ENV'] === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
};

/**
 * Logger class with context support
 */
export class Logger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.minLevel = getMinLogLevel();
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger({
      ...this.context,
      ...additionalContext,
    });
    return childLogger;
  }

  /**
   * Set request context (call at start of Lambda handler)
   */
  setRequestContext(requestId?: string, userId?: string): void {
    if (requestId) this.context.requestId = requestId;
    if (userId) this.context.userId = userId;
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
      data: data !== undefined ? data : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Output as JSON for CloudWatch Logs Insights
    const output = JSON.stringify(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Debug level log
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level log
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning level log
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    const err = error instanceof Error ? error : undefined;
    const extraData = error instanceof Error ? data : error;
    this.log(LogLevel.ERROR, message, extraData, err);
  }

  /**
   * Log with timing - returns a function to call when done
   */
  time(label: string): () => void {
    const start = Date.now();
    this.debug(`${label} started`);
    
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { durationMs: duration });
    };
  }
}

// Default logger instance
export const logger = new Logger({
  service: process.env['SERVICE_NAME'] || 'odoo-xadani-backend',
});

/**
 * Create a module-specific logger
 */
export const createLogger = (module: string, additionalContext?: LogContext): Logger => {
  return logger.child({
    module,
    ...additionalContext,
  });
};

export default logger;
