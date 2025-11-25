/**
 * Structured Logging Utility
 *
 * Provides pino-based structured JSON logging with log levels and context.
 * Enhanced for migration framework with migration-specific logging methods.
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

/**
 * Migration-specific logger enhancements
 */
export class MigrationLogger {
  private logBuffer: any[] = [];
  private maxBufferSize = 1000;

  /**
   * Log migration start
   */
  logMigrationStart(migrationId: string, sourceFile: string, entityCount: number): void {
    logger.info({
      migrationId,
      sourceFile,
      entityCount,
      event: 'migration_started'
    }, `🚀 Migration started: ${migrationId}`);

    this.addToBuffer({
      timestamp: new Date(),
      level: 'info',
      message: `Migration started: ${migrationId}`,
      details: { migrationId, sourceFile, entityCount }
    });
  }

  /**
   * Log migration status change
   */
  logStatusChange(migrationId: string, oldStatus: string, newStatus: string): void {
    logger.info({
      migrationId,
      oldStatus,
      newStatus,
      event: 'status_changed'
    }, `📊 Status changed: ${oldStatus} → ${newStatus}`);

    this.addToBuffer({
      timestamp: new Date(),
      level: 'info',
      message: `Status changed: ${oldStatus} → ${newStatus}`,
      details: { migrationId, oldStatus, newStatus }
    });
  }

  /**
   * Log entity processing progress
   */
  logEntityProgress(
    migrationId: string,
    entityName: string,
    processed: number,
    total: number,
    percentage: number,
    recordsPerSecond: number
  ): void {
    logger.info({
      migrationId,
      entityName,
      processed,
      total,
      percentage: Math.round(percentage),
      recordsPerSecond: Math.round(recordsPerSecond),
      event: 'entity_progress'
    }, `📈 ${entityName}: ${processed}/${total} (${Math.round(percentage)}%) - ${Math.round(recordsPerSecond)} rec/s`);

    this.addToBuffer({
      timestamp: new Date(),
      level: 'info',
      message: `${entityName}: ${processed}/${total} (${Math.round(percentage)}%)`,
      entity: entityName,
      details: { migrationId, processed, total, percentage, recordsPerSecond }
    });
  }

  /**
   * Log batch processing
   */
  logBatchProcessing(
    migrationId: string,
    entityName: string,
    batchId: string,
    batchSize: number,
    processingTime: number,
    successCount: number,
    errorCount: number
  ): void {
    const successRate = Math.round((successCount / batchSize) * 100);

    if (errorCount > 0) {
      logger.warn({
        migrationId,
        entityName,
        batchId,
        batchSize,
        processingTime,
        successCount,
        errorCount,
        successRate,
        event: 'batch_completed_with_errors'
      }, `⚠️  Batch ${batchId} completed with errors: ${successRate}% success (${errorCount} failures)`);
    } else {
      logger.info({
        migrationId,
        entityName,
        batchId,
        batchSize,
        processingTime,
        successCount,
        successRate,
        event: 'batch_completed'
      }, `✅ Batch ${batchId} completed: ${batchSize} records in ${processingTime}ms`);
    }

    this.addToBuffer({
      timestamp: new Date(),
      level: errorCount > 0 ? 'warn' : 'info',
      message: `Batch ${batchId}: ${successCount}/${batchSize} successful`,
      entity: entityName,
      details: { migrationId, batchId, batchSize, processingTime, successCount, errorCount }
    });
  }

  /**
   * Log validation errors
   */
  logValidationError(
    migrationId: string,
    entityName: string,
    recordId: string,
    field: string,
    error: string,
    value?: any
  ): void {
    logger.warn({
      migrationId,
      entityName,
      recordId,
      field,
      error,
      value,
      event: 'validation_error'
    }, `❌ Validation error in ${entityName}:${recordId} - ${field}: ${error}`);

    this.addToBuffer({
      timestamp: new Date(),
      level: 'warn',
      message: `Validation error: ${entityName}:${recordId} - ${field}`,
      entity: entityName,
      recordId,
      details: { migrationId, field, error, value }
    });
  }

  /**
   * Log database errors
   */
  logDatabaseError(
    migrationId: string,
    entityName: string,
    operation: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;

    logger.error({
      migrationId,
      entityName,
      operation,
      error: errorMessage,
      context,
      event: 'database_error'
    }, `🔥 Database error in ${entityName} during ${operation}: ${errorMessage}`);

    this.addToBuffer({
      timestamp: new Date(),
      level: 'error',
      message: `Database error: ${operation} failed for ${entityName}`,
      entity: entityName,
      details: { migrationId, operation, error: errorMessage, context }
    });
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(limit: number = 100): any[] {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Get logs by migration ID
   */
  getLogsByMigration(migrationId: string): any[] {
    return this.logBuffer.filter(log =>
      log.details?.migrationId === migrationId ||
      log.message.includes(migrationId)
    );
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  private addToBuffer(entry: any): void {
    this.logBuffer.push(entry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }
}

// Export migration logger instance
export const migrationLogger = new MigrationLogger();

// Export logger as default
export default logger;
