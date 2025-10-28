/**
 * Migration Report Type Definitions
 *
 * These types define the structure of migration reports, validation results,
 * and error logs generated during the migration process.
 */

/**
 * Status of a migration phase
 */
export type MigrationStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';

/**
 * Collection/table record counts
 */
export interface RecordCounts {
  exported: number; // Records exported from Firestore
  transformed?: number; // Records after transformation
  imported?: number; // Records imported to PostgreSQL
  validated?: number; // Records validated
}

/**
 * Validation result for a single entity type
 */
export interface EntityValidationResult {
  entity: string; // Entity name (users, characters, tweets, locations)
  record_counts: RecordCounts; // Record counts at each phase
  checksum_match: boolean; // Whether source and target checksums match
  spot_check_passed: boolean; // Whether random spot checks passed
  errors: ErrorLog[]; // List of validation errors
  warnings: ErrorLog[]; // List of warnings (non-critical issues)
}

/**
 * Error or warning log entry
 */
export interface ErrorLog {
  timestamp: string; // ISO 8601 timestamp
  level: 'error' | 'warning' | 'info'; // Severity level
  phase: 'export' | 'transform' | 'import' | 'verify'; // Migration phase
  entity: string; // Entity type
  document_id?: string; // Source document ID (if applicable)
  field?: string; // Specific field with issue (if applicable)
  message: string; // Error/warning message
  details?: Record<string, unknown>; // Additional context
}

/**
 * Phase timing information
 */
export interface PhaseTimings {
  export_ms?: number; // Time spent in export phase (milliseconds)
  transform_ms?: number; // Time spent in transformation phase
  import_ms?: number; // Time spent in import phase
  verify_ms?: number; // Time spent in verification phase
  total_ms: number; // Total migration time
}

/**
 * Checksum information for data integrity verification
 */
export interface ChecksumResult {
  entity: string; // Entity name
  source_checksum: string; // SHA-256 checksum of source data
  target_checksum?: string; // SHA-256 checksum of target data
  match: boolean; // Whether checksums match
}

/**
 * Comprehensive migration report
 */
export interface MigrationReport {
  // Report metadata
  report_id: string; // Unique report ID
  generated_at: string; // ISO 8601 timestamp
  migration_type: 'full' | 'incremental' | 'dry-run'; // Type of migration

  // Overall status
  status: MigrationStatus; // Overall migration status
  success: boolean; // Whether migration was successful

  // Phase results
  phases: {
    export: { status: MigrationStatus; completed_at?: string };
    transform: { status: MigrationStatus; completed_at?: string };
    import: { status: MigrationStatus; completed_at?: string };
    verify: { status: MigrationStatus; completed_at?: string };
  };

  // Validation results per entity
  validation: EntityValidationResult[];

  // Checksums
  checksums: ChecksumResult[];

  // Timing information
  timings: PhaseTimings;

  // Error and warning summary
  errors: ErrorLog[]; // All errors encountered
  warnings: ErrorLog[]; // All warnings encountered
  error_count: number; // Total error count
  warning_count: number; // Total warning count

  // Statistics
  total_records_exported: number;
  total_records_transformed: number;
  total_records_imported: number;
  total_records_validated: number;

  // Rollback information (if applicable)
  rollback?: {
    triggered: boolean;
    reason?: string;
    completed_at?: string;
  };

  // Recommendations
  recommendations?: string[]; // Suggested actions based on results
}

/**
 * Validation options for spot-check sampling
 */
export interface ValidationOptions {
  sample_size: number; // Number of records to spot-check (e.g., 1% or 100 records)
  verify_checksums: boolean; // Whether to verify SHA-256 checksums
  verify_counts: boolean; // Whether to verify record counts
  verify_foreign_keys: boolean; // Whether to verify foreign key relationships
}

/**
 * Export progress tracker
 */
export interface ExportProgress {
  collection: string; // Collection being exported
  total_records: number; // Total records in collection
  exported_records: number; // Records exported so far
  percentage: number; // Progress percentage (0-100)
  estimated_remaining_ms?: number; // Estimated time remaining
}

/**
 * Import progress tracker
 */
export interface ImportProgress {
  table: string; // Table being imported
  total_records: number; // Total records to import
  imported_records: number; // Records imported so far
  percentage: number; // Progress percentage (0-100)
  estimated_remaining_ms?: number; // Estimated time remaining
}
