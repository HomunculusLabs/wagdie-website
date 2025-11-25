/**
 * Validation and comparison types for migration framework
 */

import { ValidationError, ValidationRule } from './MigrationTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationResults {
  overallStatus: 'passed' | 'failed' | 'warning';
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  successRate: number;
  entityResults: Record<string, EntityValidation>;
  checksumMatches: boolean;
  integrityIssues: IntegrityIssue[];
}

export interface EntityValidation {
  entityName: string;
  total: number;
  valid: number;
  invalid: number;
  errors: ValidationError[];
}

export interface IntegrityIssue {
  type: 'missing_foreign_key' | 'data_corruption' | 'duplicate_record' | 'orphaned_record';
  description: string;
  affectedRecords: string[];
  severity: 'error' | 'warning';
}

export interface ComparisonResult {
  sourceCount: number;
  targetCount: number;
  countMatches: boolean;
  sampleDataMatches: boolean;
  checksumMatches: boolean;
  differences: DataDifference[];
}

export interface DataDifference {
  entity: string;
  recordId: string;
  field: string;
  sourceValue: any;
  targetValue: any;
  type: 'missing' | 'different' | 'extra';
}

export interface ValidationConfig {
  strictMode: boolean;
  maxErrorsPerEntity: number;
  validateRelationships: boolean;
  validateChecksums: boolean;
  sampleSize: number;
}

export interface ValidationReport {
  migrationId: string;
  validationResults: ValidationResults;
  validatedAt: Date;
  config: ValidationConfig;
  executionTimeMs: number;
}

// Validation rule builders
export const createRequiredRule = (
  entity: string,
  field: string,
  customMessage?: string
): ValidationRule => ({
  entity,
  field,
  type: 'required',
  validator: (value: any) => value !== null && value !== undefined && value !== '',
  errorMessage: customMessage || `${field} is required for ${entity}`
});

export const createFormatRule = (
  entity: string,
  field: string,
  pattern: RegExp,
  customMessage?: string
): ValidationRule => ({
  entity,
  field,
  type: 'format',
  validator: (value: any) => pattern.test(String(value)),
  errorMessage: customMessage || `${field} format is invalid for ${entity}`
});

export const createRangeRule = (
  entity: string,
  field: string,
  min: number,
  max: number,
  customMessage?: string
): ValidationRule => ({
  entity,
  field,
  type: 'range',
  validator: (value: any) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },
  errorMessage: customMessage || `${field} must be between ${min} and ${max} for ${entity}`
});

export const createUniqueRule = (
  entity: string,
  field: string,
  customMessage?: string
): ValidationRule => ({
  entity,
  field,
  type: 'unique',
  validator: (value: any) => {
    // This will be implemented at the service level with actual data checking
    return true; // Placeholder
  },
  errorMessage: customMessage || `${field} must be unique for ${entity}`
});