/**
 * Structured Logging Utility
 *
 * Provides pino-based structured JSON logging with log levels and context.
 *
 * Source: specs/001-migration-plan/research.md (Error handling and logging decision)
 */

import pino from 'pino';

/**
 * Log level from environment or default to 'info'
 */
const LOG_LEVEL = (process.env.LOG_LEVEL as pino.Level) || 'info';

/**
 * Environment (development = pretty logs, production = JSON logs)
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create pino logger with appropriate configuration
 */
export const logger = pino({
  level: LOG_LEVEL,

  // Development: Pretty-print logs for human readability
  // Production: JSON logs for parsing/analysis
  transport:
    NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

  // Base metadata included in all logs
  base: {
    env: NODE_ENV,
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serializers for common objects
  serializers: {
    error: pino.stdSerializers.err,
  },
});

/**
 * Create a child logger with additional context
 *
 * Child loggers inherit parent configuration and add contextual fields.
 *
 * @param context - Context object (e.g., { component: 'ExportService', phase: 'export' })
 * @returns Child logger with context
 *
 * @example
 * const exportLogger = createChildLogger({ component: 'ExportService' });
 * exportLogger.info({ collection: 'users', count: 1000 }, 'Exported users');
 * // Logs: { component: 'ExportService', collection: 'users', count: 1000, msg: 'Exported users' }
 */
export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}

/**
 * Log levels:
 * - trace: Very detailed debugging (not usually needed)
 * - debug: Detailed debugging information
 * - info: General informational messages (default)
 * - warn: Warning messages (non-critical issues)
 * - error: Error messages (critical issues)
 * - fatal: Fatal errors (application crash)
 */

/**
 * Example usage:
 *
 * ```typescript
 * import { logger, createChildLogger } from './utils/logger.js';
 *
 * // Basic logging
 * logger.info('Migration started');
 * logger.error({ error }, 'Migration failed');
 *
 * // Contextual logging
 * const exportLogger = createChildLogger({ phase: 'export', collection: 'users' });
 * exportLogger.info({ count: 1000 }, 'Exported users');
 * exportLogger.warn({ documentId: '123' }, 'Invalid address format');
 * ```
 */

// Export logger as default
export default logger;
