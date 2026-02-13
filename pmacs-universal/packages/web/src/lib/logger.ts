/**
 * Production-Grade Logging System
 * Structured logging with different severity levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error, userId, requestId } = entry;
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
      requestId && `[Request:${requestId}]`,
      userId && `[User:${userId}]`,
      message,
    ].filter(Boolean);

    let logMessage = parts.join(' ');

    if (context) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        logMessage += `\nStack: ${error.stack}`;
      }
    }

    return logMessage;
  }

  private log(level: LogLevel, message: string, data?: {
    context?: Record<string, any>;
    error?: Error;
    userId?: string;
    requestId?: string;
  }) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };

    const formattedLog = this.formatLog(entry);

    // Console output
    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }

    // In production, also send to external logging service (Sentry, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogEntry) {
    // Integration with external logging services
    // Example: Sentry, Datadog, CloudWatch, LogRocket, etc.
    if (process.env.SENTRY_DSN && entry.error) {
      // Sentry.captureException(entry.error, { contexts: { log: entry } });
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, { context });
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, { context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, { context });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, { error, context });
  }

  // Specialized logging methods
  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      userId,
      duration,
    });
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error(`API Error: ${method} ${path}`, error, {
      method,
      path,
      userId,
    });
  }

  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      this.info(`Performance: ${operation} completed in ${duration}ms`, {
        operation,
        duration,
        ...metadata,
      });
    }
  }

  securityEvent(event: string, userId?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security Event: ${event}`, {
      context: {
        event,
        severity,
        userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  databaseOperation(operation: string, table: string, duration: number, error?: Error) {
    if (error) {
      this.error(`Database operation failed: ${operation} on ${table}`, error, {
        operation,
        table,
        duration,
      });
    } else if (duration > 1000) {
      // Log slow queries
      this.warn(`Slow database operation: ${operation} on ${table} (${duration}ms)`, {
        operation,
        table,
        duration,
      });
    }
  }

  aiQuery(role: string, query: string, duration: number, success: boolean, userId?: string) {
    this.info(`AI Query: ${role}`, {
      role,
      queryLength: query.length,
      duration,
      success,
      userId,
    });
  }

  authEvent(event: 'login' | 'logout' | 'failed_login' | 'blocked', userId: string, details?: Record<string, any>) {
    const severity = event === 'failed_login' || event === 'blocked' ? 'warn' : 'info';
    this.log(severity === 'warn' ? 'warn' : 'info', `Auth Event: ${event} for user ${userId}`, {
      context: {
        event,
        userId,
        ...details,
      },
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper for request tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
