/**
 * Export Service
 *
 * Handles streaming export of data from Firestore with progress tracking
 * and error handling.
 *
 * Tasks: T017, T018, T019
 * Source: specs/001-migration-plan/spec.md (User Story 1)
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { FirestoreClient } from '../data/firestore-client.js';
import type { FirestoreCollectionName, FirestoreDocument } from '../types/firestore-schema.js';
import { FIRESTORE_COLLECTIONS } from '../types/firestore-schema.js';
import type { ExportProgress, ErrorLog } from '../types/migration-report.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'ExportService' });

/**
 * Export configuration
 */
export interface ExportConfig {
  outputDir: string; // Directory to write exported JSON files
  progressInterval?: number; // Log progress every N records (default: 100)
}

/**
 * Export result for a single collection
 */
export interface CollectionExportResult {
  collection: FirestoreCollectionName;
  recordCount: number;
  filePath: string;
  errors: ErrorLog[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

/**
 * Complete export result for all collections
 */
export interface ExportResult {
  success: boolean;
  timestamp: string;
  collections: CollectionExportResult[];
  totalRecords: number;
  totalErrors: number;
  errors: ErrorLog[];
}

/**
 * ExportService: Streams data from Firestore and writes to JSON files
 */
export class ExportService {
  private readonly config: Required<ExportConfig>;
  private readonly firestoreClient: FirestoreClient;

  constructor(firestoreClient: FirestoreClient, config: ExportConfig) {
    this.firestoreClient = firestoreClient;
    this.config = {
      ...config,
      progressInterval: config.progressInterval ?? 100,
    };
  }

  /**
   * Export all collections from Firestore
   *
   * Implements T017: Streaming export for all 4 collections
   */
  async exportAll(): Promise<ExportResult> {
    log.info('Starting export of all collections');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const collections: CollectionExportResult[] = [];
    const allErrors: ErrorLog[] = [];

    // Ensure output directory exists
    await mkdir(this.config.outputDir, { recursive: true });

    // Export each collection
    for (const collectionName of Object.values(FIRESTORE_COLLECTIONS)) {
      try {
        const result = await this.exportCollection(collectionName, timestamp);
        collections.push(result);
        allErrors.push(...result.errors);
      } catch (error) {
        log.error({ collectionName, error }, 'Failed to export collection');
        allErrors.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          phase: 'export',
          entity: collectionName,
          message: `Collection export failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    const totalRecords = collections.reduce((sum, c) => sum + c.recordCount, 0);
    const success = allErrors.filter((e) => e.level === 'error').length === 0;

    const result: ExportResult = {
      success,
      timestamp,
      collections,
      totalRecords,
      totalErrors: allErrors.length,
      errors: allErrors,
    };

    log.info({ result }, 'Export completed');
    return result;
  }

  /**
   * Export a single collection with progress tracking and error handling
   *
   * Implements T017, T018, T019:
   * - T017: Streaming export logic
   * - T018: Progress tracking every 100 records
   * - T019: Error handling with document ID logging
   */
  async exportCollection(collectionName: FirestoreCollectionName, timestamp: string): Promise<CollectionExportResult> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    const collectionLog = log.child({ collection: collectionName });
    collectionLog.info('Starting collection export');

    const documents: Array<FirestoreDocument & { _documentId: string }> = [];
    const errors: ErrorLog[] = [];
    let processedCount = 0;

    try {
      // Stream documents from Firestore
      for await (const doc of this.firestoreClient.streamCollection(collectionName)) {
        documents.push(doc);
        processedCount++;

        // T018: Log progress every N records
        if (processedCount % this.config.progressInterval === 0) {
          this.logProgress(collectionName, processedCount);
        }
      }

      // Final progress log
      this.logProgress(collectionName, processedCount);

      // Write to JSON file
      const fileName = `${collectionName}_${timestamp}.json`;
      const filePath = join(this.config.outputDir, fileName);

      await writeFile(filePath, JSON.stringify(documents, null, 2), 'utf-8');

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      collectionLog.info(
        { recordCount: documents.length, filePath, durationMs },
        'Collection export completed successfully'
      );

      return {
        collection: collectionName,
        recordCount: documents.length,
        filePath,
        errors,
        startedAt,
        completedAt,
        durationMs,
      };
    } catch (error) {
      // T019: Error handling with collection context
      const errorMessage = error instanceof Error ? error.message : String(error);
      collectionLog.error({ error, processedCount }, 'Collection export failed');

      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'export',
        entity: collectionName,
        message: `Export failed after ${processedCount} records: ${errorMessage}`,
        details: { processedCount },
      };

      errors.push(errorLog);

      // Still write partial data if any was collected
      if (documents.length > 0) {
        const fileName = `${collectionName}_${timestamp}_PARTIAL.json`;
        const filePath = join(this.config.outputDir, fileName);
        await writeFile(filePath, JSON.stringify(documents, null, 2), 'utf-8');
        collectionLog.warn({ filePath, recordCount: documents.length }, 'Wrote partial export data');
      }

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      return {
        collection: collectionName,
        recordCount: documents.length,
        filePath: '', // No complete file path for failed export
        errors,
        startedAt,
        completedAt,
        durationMs,
      };
    }
  }

  /**
   * Log export progress (T018: Progress tracking)
   */
  private logProgress(collection: FirestoreCollectionName, count: number): void {
    const progress: ExportProgress = {
      collection,
      total_records: 0, // Unknown until complete
      exported_records: count,
      percentage: 0, // Unknown until complete
    };

    log.info(progress, `Exported ${count} records from ${collection}`);
  }

  /**
   * Get estimated total records for all collections
   *
   * Useful for progress reporting before export starts.
   */
  async getEstimatedTotals(): Promise<Record<FirestoreCollectionName, number>> {
    const totals: Partial<Record<FirestoreCollectionName, number>> = {};

    for (const collectionName of Object.values(FIRESTORE_COLLECTIONS)) {
      try {
        const count = await this.firestoreClient.getCollectionCount(collectionName);
        totals[collectionName] = count;
      } catch (error) {
        log.warn({ collectionName, error }, 'Failed to get collection count');
        totals[collectionName] = 0;
      }
    }

    return totals as Record<FirestoreCollectionName, number>;
  }
}
