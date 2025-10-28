/**
 * Data Integrity Checksum Utility
 *
 * Provides SHA-256 hashing for record and collection checksums to verify
 * data integrity during migration.
 *
 * Source: specs/001-migration-plan/research.md (Data validation strategy)
 */

import { createHash } from 'crypto';
import { logger } from './logger.js';

const log = logger.child({ component: 'Checksum' });

/**
 * Calculate SHA-256 checksum for a single record based on key fields
 *
 * @param record - Record object
 * @param fields - Array of field names to include in checksum (in order)
 * @returns SHA-256 hash as hex string
 *
 * @example
 * checksumRecord({ id: '123', name: 'Alice' }, ['id', 'name'])
 * // Returns "abc123..." (SHA-256 hash of "123|Alice")
 */
export function checksumRecord(record: Record<string, unknown>, fields: string[]): string {
  // Concatenate field values with pipe delimiter
  const values = fields
    .map((field) => {
      const value = record[field];
      // Handle null/undefined as empty string
      if (value === null || value === undefined) {
        return '';
      }
      // Convert objects/arrays to JSON string
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    })
    .join('|');

  // Calculate SHA-256 hash
  return createHash('sha256').update(values, 'utf8').digest('hex');
}

/**
 * Calculate SHA-256 checksum for an entire collection/table
 *
 * This aggregates checksums of all records to produce a single collection checksum.
 * Record order does not matter (checksums are sorted before aggregation).
 *
 * @param records - Array of records
 * @param fields - Array of field names to include in per-record checksum
 * @returns SHA-256 hash as hex string
 *
 * @example
 * const users = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
 * checksumCollection(users, ['id', 'name'])
 * // Returns aggregated hash of sorted individual record hashes
 */
export function checksumCollection(records: Array<Record<string, unknown>>, fields: string[]): string {
  log.debug({ recordCount: records.length, fields }, 'Calculating collection checksum');

  // Calculate hash for each record
  const hashes = records.map((record) => checksumRecord(record, fields));

  // Sort hashes to ensure consistent ordering (record order shouldn't matter)
  hashes.sort();

  // Aggregate sorted hashes into single collection hash
  const aggregated = hashes.join('');
  const collectionHash = createHash('sha256').update(aggregated, 'utf8').digest('hex');

  log.debug({ collectionHash }, 'Collection checksum calculated');
  return collectionHash;
}

/**
 * Compare two checksums and return whether they match
 *
 * @param sourceChecksum - Checksum from source system
 * @param targetChecksum - Checksum from target system
 * @returns true if checksums match, false otherwise
 */
export function compareChecksums(sourceChecksum: string, targetChecksum: string): boolean {
  const match = sourceChecksum === targetChecksum;

  if (!match) {
    log.warn({ sourceChecksum, targetChecksum }, 'Checksum mismatch detected');
  }

  return match;
}

/**
 * Calculate checksums for multiple collections in parallel
 *
 * @param collections - Map of collection name → records
 * @param fieldsMap - Map of collection name → fields to checksum
 * @returns Map of collection name → checksum
 */
export function checksumCollections(
  collections: Map<string, Array<Record<string, unknown>>>,
  fieldsMap: Map<string, string[]>
): Map<string, string> {
  const checksums = new Map<string, string>();

  for (const [collectionName, records] of collections.entries()) {
    const fields = fieldsMap.get(collectionName);

    if (!fields) {
      log.warn({ collectionName }, 'No fields specified for collection checksum, skipping');
      continue;
    }

    const checksum = checksumCollection(records, fields);
    checksums.set(collectionName, checksum);

    log.info({ collectionName, checksum, recordCount: records.length }, 'Collection checksum complete');
  }

  return checksums;
}

/**
 * Predefined field lists for checksumming each entity type
 *
 * These are the key fields used to verify data integrity during migration.
 * Source: specs/001-migration-plan/contracts/field-mappings.md
 */
export const ENTITY_CHECKSUM_FIELDS = {
  users: ['eth_address', 'created_at', 'login_count'],
  characters: ['token_id', 'contract_address', 'owner_address', 'burned', 'infected'],
  tweets: ['id', 'author_id', 'content', 'created_at'],
  locations: ['id', 'name'],
} as const;

/**
 * Calculate checksum for a specific entity type using predefined fields
 *
 * @param entityType - Entity type (users, characters, tweets, locations)
 * @param records - Array of records
 * @returns SHA-256 checksum
 */
export function checksumEntity(entityType: keyof typeof ENTITY_CHECKSUM_FIELDS, records: Array<Record<string, unknown>>): string {
  const fields = ENTITY_CHECKSUM_FIELDS[entityType];
  return checksumCollection(records, fields);
}

/**
 * Generate a migration data integrity report
 *
 * Compares checksums between source and target for all entity types.
 *
 * @param sourceChecksums - Checksums from source system
 * @param targetChecksums - Checksums from target system
 * @returns Integrity report with pass/fail for each entity
 */
export interface IntegrityReport {
  entity: string;
  sourceChecksum: string;
  targetChecksum: string;
  match: boolean;
}

export function generateIntegrityReport(
  sourceChecksums: Map<string, string>,
  targetChecksums: Map<string, string>
): IntegrityReport[] {
  const report: IntegrityReport[] = [];

  for (const [entity, sourceChecksum] of sourceChecksums.entries()) {
    const targetChecksum = targetChecksums.get(entity) ?? '';
    const match = compareChecksums(sourceChecksum, targetChecksum);

    report.push({
      entity,
      sourceChecksum,
      targetChecksum,
      match,
    });

    if (!match) {
      log.error({ entity, sourceChecksum, targetChecksum }, 'Data integrity check failed');
    }
  }

  return report;
}
