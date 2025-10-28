/**
 * Validation Service
 *
 * Validates exported data against Firestore schema and generates checksums
 * for data integrity verification.
 *
 * Tasks: T020, T021, T022
 * Source: specs/001-migration-plan/spec.md (User Story 1)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { FirestoreClient } from '../data/firestore-client.js';
import type {
  FirestoreCollectionName,
  FirestoreUser,
  FirestoreCharacter,
  FirestoreTweet,
  FirestoreLocation,
} from '../types/firestore-schema.js';
import { FIRESTORE_COLLECTIONS } from '../types/firestore-schema.js';
import type {
  EntityValidationResult,
  ChecksumResult,
  ValidationWarning,
} from '../types/migration-report.js';
import { checksumCollection, ENTITY_CHECKSUM_FIELDS } from '../utils/checksum.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'ValidationService' });

/**
 * Validation configuration
 */
export interface ValidationConfig {
  exportDir: string; // Directory containing exported JSON files
  timestamp: string; // Timestamp from export (for file naming)
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  success: boolean;
  timestamp: string;
  validations: EntityValidationResult[];
  checksums: ChecksumResult[];
  warnings: ValidationWarning[];
}

/**
 * ValidationService: Validates exported data and generates integrity checksums
 */
export class ValidationService {
  private readonly config: ValidationConfig;
  private readonly firestoreClient: FirestoreClient;

  constructor(firestoreClient: FirestoreClient, config: ValidationConfig) {
    this.firestoreClient = firestoreClient;
    this.config = config;
  }

  /**
   * Validate all exported collections
   *
   * Implements T020, T021, T022:
   * - T020: Schema validation for all collections
   * - T021: Record count comparison
   * - T022: Checksum generation
   */
  async validateAll(): Promise<ValidationResult> {
    log.info('Starting validation of all exported collections');

    const validations: EntityValidationResult[] = [];
    const checksums: ChecksumResult[] = [];
    const warnings: ValidationWarning[] = [];

    for (const collectionName of Object.values(FIRESTORE_COLLECTIONS)) {
      try {
        // T021: Record count validation
        const countResult = await this.validateRecordCount(collectionName);
        validations.push(countResult);

        if (countResult.warnings) {
          warnings.push(...countResult.warnings);
        }

        // T022: Checksum generation
        const checksumResult = await this.generateChecksum(collectionName);
        checksums.push(checksumResult);

        // T020: Schema validation
        await this.validateSchema(collectionName, countResult);
      } catch (error) {
        log.error({ collectionName, error }, 'Validation failed for collection');

        validations.push({
          entity: collectionName,
          exported: 0,
          source: 0,
          match: false,
          warnings: [
            {
              timestamp: new Date().toISOString(),
              level: 'error',
              phase: 'validation',
              entity: collectionName,
              message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        });
      }
    }

    const success = validations.every((v) => v.match) && warnings.filter((w) => w.level === 'error').length === 0;

    const result: ValidationResult = {
      success,
      timestamp: new Date().toISOString(),
      validations,
      checksums,
      warnings,
    };

    log.info({ result }, 'Validation completed');
    return result;
  }

  /**
   * T021: Validate record counts between exported JSON and Firestore
   */
  async validateRecordCount(collectionName: FirestoreCollectionName): Promise<EntityValidationResult> {
    const collectionLog = log.child({ collection: collectionName });
    collectionLog.info('Validating record count');

    // Read exported JSON file
    const fileName = `${collectionName}_${this.config.timestamp}.json`;
    const filePath = join(this.config.exportDir, fileName);

    let exportedRecords: unknown[];
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      exportedRecords = JSON.parse(fileContent) as unknown[];
    } catch (error) {
      collectionLog.error({ error, filePath }, 'Failed to read exported file');
      return {
        entity: collectionName,
        exported: 0,
        source: 0,
        match: false,
        warnings: [
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            phase: 'validation',
            entity: collectionName,
            message: `Failed to read exported file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

    // Get Firestore collection count
    let firestoreCount: number;
    try {
      firestoreCount = await this.firestoreClient.getCollectionCount(collectionName);
    } catch (error) {
      collectionLog.error({ error }, 'Failed to get Firestore count');
      return {
        entity: collectionName,
        exported: exportedRecords.length,
        source: 0,
        match: false,
        warnings: [
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            phase: 'validation',
            entity: collectionName,
            message: `Failed to get Firestore count: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

    const match = exportedRecords.length === firestoreCount;
    const warnings: ValidationWarning[] = [];

    if (!match) {
      warnings.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: collectionName,
        message: `Record count mismatch: exported=${exportedRecords.length}, source=${firestoreCount}`,
      });
    }

    collectionLog.info(
      { exported: exportedRecords.length, source: firestoreCount, match },
      'Record count validation completed'
    );

    return {
      entity: collectionName,
      exported: exportedRecords.length,
      source: firestoreCount,
      match,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * T022: Generate SHA-256 checksum for exported collection
   */
  async generateChecksum(collectionName: FirestoreCollectionName): Promise<ChecksumResult> {
    const collectionLog = log.child({ collection: collectionName });
    collectionLog.info('Generating checksum');

    // Read exported JSON file
    const fileName = `${collectionName}_${this.config.timestamp}.json`;
    const filePath = join(this.config.exportDir, fileName);

    let exportedRecords: Array<Record<string, unknown>>;
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      exportedRecords = JSON.parse(fileContent) as Array<Record<string, unknown>>;
    } catch (error) {
      collectionLog.error({ error, filePath }, 'Failed to read exported file for checksum');
      throw new Error(`Failed to read exported file: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get checksum fields for this entity
    const fields = ENTITY_CHECKSUM_FIELDS[collectionName];

    // Generate checksum
    const checksum = checksumCollection(exportedRecords, fields);

    collectionLog.info({ checksum, recordCount: exportedRecords.length }, 'Checksum generated');

    return {
      entity: collectionName,
      checksum,
      record_count: exportedRecords.length,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * T020: Validate schema for exported collection
   *
   * Validates that all documents in the exported JSON match the expected
   * Firestore schema for that collection.
   */
  private async validateSchema(
    collectionName: FirestoreCollectionName,
    countResult: EntityValidationResult
  ): Promise<void> {
    const collectionLog = log.child({ collection: collectionName });
    collectionLog.info('Validating schema');

    // Read exported JSON file
    const fileName = `${collectionName}_${this.config.timestamp}.json`;
    const filePath = join(this.config.exportDir, fileName);

    let exportedRecords: unknown[];
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      exportedRecords = JSON.parse(fileContent) as unknown[];
    } catch (error) {
      // Already logged in validateRecordCount
      return;
    }

    // Validate each document against schema
    const schemaErrors: ValidationWarning[] = [];

    for (let i = 0; i < exportedRecords.length; i++) {
      const record = exportedRecords[i];
      const validationError = this.validateDocumentSchema(collectionName, record, i);

      if (validationError) {
        schemaErrors.push(validationError);
      }
    }

    // Add schema errors to count result warnings
    if (schemaErrors.length > 0) {
      countResult.warnings = [...(countResult.warnings ?? []), ...schemaErrors];
      countResult.match = false;
    }

    collectionLog.info(
      { totalRecords: exportedRecords.length, schemaErrors: schemaErrors.length },
      'Schema validation completed'
    );
  }

  /**
   * Validate a single document against expected schema
   */
  private validateDocumentSchema(
    collectionName: FirestoreCollectionName,
    record: unknown,
    index: number
  ): ValidationWarning | null {
    if (!record || typeof record !== 'object') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: collectionName,
        message: `Record at index ${index} is not an object`,
        details: { index, record },
      };
    }

    const doc = record as Record<string, unknown>;

    // Validate _documentId is present
    if (!doc._documentId || typeof doc._documentId !== 'string') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: collectionName,
        message: `Record at index ${index} missing _documentId field`,
        details: { index },
      };
    }

    // Validate collection-specific schema
    switch (collectionName) {
      case FIRESTORE_COLLECTIONS.USERS:
        return this.validateUserSchema(doc, index);
      case FIRESTORE_COLLECTIONS.CHARACTERS:
        return this.validateCharacterSchema(doc, index);
      case FIRESTORE_COLLECTIONS.TWEETS:
        return this.validateTweetSchema(doc, index);
      case FIRESTORE_COLLECTIONS.LOCATIONS:
        return this.validateLocationSchema(doc, index);
      default:
        return null;
    }
  }

  /**
   * Validate user document schema
   */
  private validateUserSchema(doc: Record<string, unknown>, index: number): ValidationWarning | null {
    const requiredFields = ['ethAddress', 'createdAt', 'lastLoginAt', 'loginCount'];

    for (const field of requiredFields) {
      if (!(field in doc)) {
        return {
          timestamp: new Date().toISOString(),
          level: 'error',
          phase: 'validation',
          entity: FIRESTORE_COLLECTIONS.USERS,
          message: `User at index ${index} missing required field: ${field}`,
          details: { index, documentId: doc._documentId },
        };
      }
    }

    // Type validation
    if (typeof doc.ethAddress !== 'string') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.USERS,
        message: `User at index ${index} has invalid ethAddress type`,
        details: { index, documentId: doc._documentId },
      };
    }

    if (typeof doc.loginCount !== 'number') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.USERS,
        message: `User at index ${index} has invalid loginCount type`,
        details: { index, documentId: doc._documentId },
      };
    }

    return null;
  }

  /**
   * Validate character document schema
   */
  private validateCharacterSchema(doc: Record<string, unknown>, index: number): ValidationWarning | null {
    const requiredFields = ['tokenId', 'contractAddress', 'burned', 'infected', 'createdAt', 'updatedAt'];

    for (const field of requiredFields) {
      if (!(field in doc)) {
        return {
          timestamp: new Date().toISOString(),
          level: 'error',
          phase: 'validation',
          entity: FIRESTORE_COLLECTIONS.CHARACTERS,
          message: `Character at index ${index} missing required field: ${field}`,
          details: { index, documentId: doc._documentId },
        };
      }
    }

    // Type validation
    if (typeof doc.tokenId !== 'number') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.CHARACTERS,
        message: `Character at index ${index} has invalid tokenId type`,
        details: { index, documentId: doc._documentId },
      };
    }

    if (typeof doc.burned !== 'boolean') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.CHARACTERS,
        message: `Character at index ${index} has invalid burned type`,
        details: { index, documentId: doc._documentId },
      };
    }

    if (typeof doc.infected !== 'boolean') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.CHARACTERS,
        message: `Character at index ${index} has invalid infected type`,
        details: { index, documentId: doc._documentId },
      };
    }

    return null;
  }

  /**
   * Validate tweet document schema
   */
  private validateTweetSchema(doc: Record<string, unknown>, index: number): ValidationWarning | null {
    const requiredFields = ['authorId', 'content', 'createdAt'];

    for (const field of requiredFields) {
      if (!(field in doc)) {
        return {
          timestamp: new Date().toISOString(),
          level: 'error',
          phase: 'validation',
          entity: FIRESTORE_COLLECTIONS.TWEETS,
          message: `Tweet at index ${index} missing required field: ${field}`,
          details: { index, documentId: doc._documentId },
        };
      }
    }

    // Type validation
    if (typeof doc.authorId !== 'string') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.TWEETS,
        message: `Tweet at index ${index} has invalid authorId type`,
        details: { index, documentId: doc._documentId },
      };
    }

    if (typeof doc.content !== 'string') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.TWEETS,
        message: `Tweet at index ${index} has invalid content type`,
        details: { index, documentId: doc._documentId },
      };
    }

    return null;
  }

  /**
   * Validate location document schema
   */
  private validateLocationSchema(doc: Record<string, unknown>, index: number): ValidationWarning | null {
    const requiredFields = ['name'];

    for (const field of requiredFields) {
      if (!(field in doc)) {
        return {
          timestamp: new Date().toISOString(),
          level: 'error',
          phase: 'validation',
          entity: FIRESTORE_COLLECTIONS.LOCATIONS,
          message: `Location at index ${index} missing required field: ${field}`,
          details: { index, documentId: doc._documentId },
        };
      }
    }

    // Type validation
    if (typeof doc.name !== 'string') {
      return {
        timestamp: new Date().toISOString(),
        level: 'error',
        phase: 'validation',
        entity: FIRESTORE_COLLECTIONS.LOCATIONS,
        message: `Location at index ${index} has invalid name type`,
        details: { index, documentId: doc._documentId },
      };
    }

    return null;
  }
}
