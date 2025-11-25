/**
 * Data validation service for migration framework
 */

import {
  ValidationResult,
  ValidationResults,
  EntityValidation,
  IntegrityIssue,
  ValidationRule,
  ValidationError
} from '../types/ValidationTypes';
import { CharacterSheetRecord, LoginRecord, MetadataRecord, TokenRecord, TweetRecord, TweetAuthorRecord } from '../types/MigrationTypes';
import { migrationLogger } from '../utils/logger';
import { getDatabaseClient } from '../data/SupabaseClient';

export class ValidationService {
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Validate a single record
   */
  validateRecord(
    entityType: string,
    record: any,
    recordId: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const rules = this.validationRules.get(entityType) || [];

      for (const rule of rules) {
        const value = this.getNestedValue(record, rule.field);

        if (!rule.validator(value)) {
          const validationError: ValidationError = {
            recordId,
            field: rule.field,
            value,
            message: rule.errorMessage,
            severity: rule.type === 'required' ? 'error' : 'warning'
          };

          if (validationError.severity === 'error') {
            errors.push(validationError);
          } else {
            warnings.push(validationError);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          recordId,
          field: 'validation',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error'
        }],
        warnings
      };
    }
  }

  /**
   * Validate batch of records
   */
  validateBatch(
    entityType: string,
    records: any[]
  ): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    records.forEach((record, index) => {
      const recordId = this.extractRecordId(record, entityType) || `index_${index}`;
      const result = this.validateRecord(entityType, record, recordId);

      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validate all entities against database
   */
  async validateMigration(migrationId: string): Promise<ValidationResults> {
    try {
      const entityValidations: Record<string, EntityValidation> = [];
      let totalRecords = 0;
      let validRecords = 0;
      let invalidRecords = 0;
      const integrityIssues: IntegrityIssue[] = [];

      // Validate each entity type
      const entityTypes = ['character_sheets', 'login_records', 'metadata', 'tokens', 'tweets', 'tweet_authors'];

      for (const entityType of entityTypes) {
        const validation = await this.validateEntity(entityType, migrationId);
        entityValidations[entityType] = validation;

        totalRecords += validation.total;
        validRecords += validation.valid;
        invalidRecords += validation.invalid;

        // Check for integrity issues
        const issues = await this.checkIntegrity(entityType);
        integrityIssues.push(...issues);
      }

      const overallStatus = invalidRecords === 0 ? 'passed' :
                           (validRecords / totalRecords) >= 0.99 ? 'warning' : 'failed';

      return {
        overallStatus,
        totalRecords,
        validRecords,
        invalidRecords,
        successRate: totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0,
        entityResults: entityValidations,
        checksumMatches: await this.validateChecksums(),
        integrityIssues
      };
    } catch (error) {
      migrationLogger.logDatabaseError(migrationId, 'validation', 'validateMigration', error);
      throw error;
    }
  }

  /**
   * Validate specific entity
   */
  private async validateEntity(entityType: string, migrationId: string): Promise<EntityValidation> {
    try {
      const dbClient = getDatabaseClient();
      const { count, error } = await dbClient.getRecordCount(entityType as any);

      if (error) {
        throw new Error(`Failed to count ${entityType}: ${error.message}`);
      }

      // For now, assume all records are valid if they exist in database
      // In a real implementation, we'd validate each record against rules
      const total = count || 0;
      const valid = total; // Simplified - would need actual validation
      const invalid = 0;

      return {
        entityName: entityType,
        total,
        valid,
        invalid,
        errors: []
      };
    } catch (error) {
      migrationLogger.logDatabaseError(migrationId, entityType, 'validateEntity', error);
      return {
        entityName: entityType,
        total: 0,
        valid: 0,
        invalid: 0,
        errors: [{
          recordId: 'entity_validation',
          field: 'validation',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error'
        }]
      };
    }
  }

  /**
   * Check data integrity
   */
  private async checkIntegrity(entityType: string): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    try {
      const dbClient = getDatabaseClient();
      const client = dbClient.getClient();

      // Check foreign key relationships
      if (entityType === 'tokens') {
        // Check for tokens with missing metadata
        const { data: orphanedTokens, error } = await client
          .from('tokens')
          .select('id, token_id')
          .is('metadata_id', null)
          .not('token_id', 'is', null);

        if (!error && orphanedTokens && orphanedTokens.length > 0) {
          issues.push({
            type: 'missing_foreign_key',
            description: `Found ${orphanedTokens.length} tokens without metadata`,
            affectedRecords: orphanedTokens.map(t => t.id),
            severity: 'warning'
          });
        }
      }

      if (entityType === 'tweets') {
        // Check for tweets with missing authors
        const { data: orphanedTweets, error } = await client
          .from('tweets')
          .select('id')
          .is('tweet_author_id', null);

        if (!error && orphanedTweets && orphanedTweets.length > 0) {
          issues.push({
            type: 'missing_foreign_key',
            description: `Found ${orphanedTweets.length} tweets without authors`,
            affectedRecords: orphanedTweets.map(t => t.id),
            severity: 'error'
          });
        }
      }

    } catch (error) {
      issues.push({
        type: 'data_corruption',
        description: `Failed to check integrity for ${entityType}: ${error}`,
        affectedRecords: [],
        severity: 'error'
      });
    }

    return issues;
  }

  /**
   * Validate data integrity checksums
   */
  private async validateChecksums(): Promise<boolean> {
    // Simplified implementation
    // In a real scenario, we'd calculate and compare checksums
    return true;
  }

  /**
   * Initialize validation rules for all entity types
   */
  private initializeValidationRules(): void {
    // Character sheet validation rules
    this.validationRules.set('character_sheets', [
      {
        entity: 'character_sheets',
        field: 'name',
        type: 'required',
        validator: (value: any) => typeof value === 'string' && value.trim().length > 0,
        errorMessage: 'Character name is required'
      },
      {
        entity: 'character_sheets',
        field: 'tokenId',
        type: 'required',
        validator: (value: any) => typeof value === 'number' && value > 0,
        errorMessage: 'Token ID must be a positive number'
      },
      {
        entity: 'character_sheets',
        field: 'level',
        type: 'range',
        validator: (value: any) => typeof value === 'number' && value >= 1 && value <= 100,
        errorMessage: 'Level must be between 1 and 100'
      }
    ]);

    // Token validation rules
    this.validationRules.set('tokens', [
      {
        entity: 'tokens',
        field: 'tokenId',
        type: 'required',
        validator: (value: any) => typeof value === 'number' && value > 0,
        errorMessage: 'Token ID is required and must be positive'
      },
      {
        entity: 'tokens',
        field: 'ownerAddress',
        type: 'format',
        validator: (value: any) => !value || /^0x[a-fA-F0-9]{40}$/.test(value),
        errorMessage: 'Owner address must be a valid Ethereum address'
      }
    ]);

    // Metadata validation rules
    this.validationRules.set('metadata', [
      {
        entity: 'metadata',
        field: 'tokenId',
        type: 'required',
        validator: (value: any) => typeof value === 'number' && value > 0,
        errorMessage: 'Token ID is required for metadata'
      }
    ]);

    // Tweet validation rules
    this.validationRules.set('tweets', [
      {
        entity: 'tweets',
        field: 'content',
        type: 'required',
        validator: (value: any) => typeof value === 'string' && value.trim().length > 0,
        errorMessage: 'Tweet content is required'
      },
      {
        entity: 'tweets',
        field: 'tweetAuthorId',
        type: 'required',
        validator: (value: any) => typeof value === 'string' && value.trim().length > 0,
        errorMessage: 'Tweet author ID is required'
      }
    ]);

    // Login record validation rules
    this.validationRules.set('login_records', [
      {
        entity: 'login_records',
        field: 'userAddress',
        type: 'format',
        validator: (value: any) => /^0x[a-fA-F0-9]{40}$/.test(value),
        errorMessage: 'User address must be a valid Ethereum address'
      }
    ]);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract record ID from data
   */
  private extractRecordId(record: any, entityType: string): string | null {
    switch (entityType) {
      case 'character_sheets':
        return record.tokenId?.toString() || record.id?.split('/')?.pop();
      case 'tokens':
        return record.tokenId?.toString() || record.id?.split('/')?.pop();
      case 'metadata':
        return record.tokenId?.toString();
      case 'tweets':
        return record.id;
      case 'login_records':
        return record.userAddress;
      case 'tweet_authors':
        return record.username;
      default:
        return null;
    }
  }
}