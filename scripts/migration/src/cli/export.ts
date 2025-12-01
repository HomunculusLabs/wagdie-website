#!/usr/bin/env node
/**
 * Export CLI Command
 *
 * Command-line interface for exporting data from Firestore.
 *
 * Task: T023
 * Source: specs/001-migration-plan/spec.md (User Story 1)
 *
 * Usage:
 *   npm run export -- --output ./data/export
 *   npm run export -- --output ./data/export --validate
 */

import { Command } from 'commander';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { FirestoreClient } from '../data/firestore-client.js';
import { ExportService } from '../services/export-service.js';
import { ValidationService } from '../services/validation-service.js';
import { logger } from '../utils/logger.js';
import type { ExportResult } from '../services/export-service.js';
import type { ValidationResult } from '../services/validation-service.js';

const log = logger.child({ component: 'ExportCLI' });

/**
 * CLI configuration from environment and arguments
 */
interface CLIConfig {
  projectId: string;
  credentialsPath: string;
  outputDir: string;
  validate: boolean;
  progressInterval: number;
}

/**
 * Parse and validate CLI configuration
 */
function parseConfig(): CLIConfig {
  const program = new Command();
  program
    .name('export')
    .description('Export data from Firestore to JSON files')
    .requiredOption('-o, --output <dir>', 'Output directory for exported JSON files')
    .option('-v, --validate', 'Run validation after export', false)
    .option('-p, --progress-interval <number>', 'Log progress every N records', '100')
    .option('-s, --service-account <path>', 'Path to Firebase service account JSON', process.env.FIREBASE_SERVICE_ACCOUNT)
    .parse(process.argv);

  const options = program.opts();

  // Validate service account path
  const serviceAccountPath = options.serviceAccount as string | undefined;
  if (!serviceAccountPath) {
    log.error('Firebase service account path not provided. Use --service-account or set FIREBASE_SERVICE_ACCOUNT env var.');
    process.exit(1);
  }

  if (!existsSync(serviceAccountPath)) {
    log.error({ path: serviceAccountPath }, 'Firebase service account file not found');
    process.exit(1);
  }

  return {
    projectId: 'wagdie-mainnet', // Default project ID
    credentialsPath: serviceAccountPath,
    outputDir: options.output as string,
    validate: options.validate as boolean,
    progressInterval: parseInt(options.progressInterval as string, 10),
  };
}

/**
 * Main export workflow
 */
async function main() {
  log.info('Starting export workflow');

  const config = parseConfig();

  // Initialize Firestore client
  log.info({ credentialsPath: config.credentialsPath }, 'Initializing Firestore client');
  const firestoreClient = new FirestoreClient({
    projectId: config.projectId,
    credentialsPath: config.credentialsPath,
    batchSize: 500,
  });

  await firestoreClient.connect();

  try {
    // Run export
    log.info({ outputDir: config.outputDir }, 'Starting export');
    const exportService = new ExportService(firestoreClient, {
      outputDir: config.outputDir,
      progressInterval: config.progressInterval,
    });

    const exportResult: ExportResult = await exportService.exportAll();

    // Log export results
    log.info(
      {
        success: exportResult.success,
        totalRecords: exportResult.totalRecords,
        totalErrors: exportResult.totalErrors,
        collections: exportResult.collections.map((c) => ({
          collection: c.collection,
          recordCount: c.recordCount,
          durationMs: c.durationMs,
        })),
      },
      'Export completed'
    );

    // Print summary to console
    console.log('\n=== Export Summary ===');
    console.log(`Status: ${exportResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Total Records: ${exportResult.totalRecords}`);
    console.log(`Total Errors: ${exportResult.totalErrors}`);
    console.log('\nCollections:');
    for (const collection of exportResult.collections) {
      console.log(`  - ${collection.collection}: ${collection.recordCount} records (${collection.durationMs}ms)`);
      if (collection.errors.length > 0) {
        console.log(`    ⚠️  ${collection.errors.length} errors`);
      }
    }

    // Run validation if requested
    if (config.validate) {
      log.info('Starting validation');
      const validationService = new ValidationService(firestoreClient, {
        exportDir: config.outputDir,
        timestamp: exportResult.timestamp,
      });

      const validationResult: ValidationResult = await validationService.validateAll();

      // Log validation results
      log.info(
        {
          success: validationResult.success,
          validations: validationResult.validations,
          checksums: validationResult.checksums.map((c) => ({
            entity: c.entity,
            source_checksum: c.source_checksum,
            match: c.match,
          })),
        },
        'Validation completed'
      );

      // Print validation summary
      console.log('\n=== Validation Summary ===');
      console.log(`Status: ${validationResult.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log('\nRecord Counts:');
      for (const validation of validationResult.validations) {
        const status = validation.checksum_match ? '✅' : '❌';
        console.log(`  ${status} ${validation.entity}: exported=${validation.record_counts.exported}`);
        if (validation.warnings && validation.warnings.length > 0) {
          for (const warning of validation.warnings) {
            console.log(`     ⚠️  ${warning.message}`);
          }
        }
      }

      console.log('\nChecksums:');
      for (const checksum of validationResult.checksums) {
        console.log(`  - ${checksum.entity}: ${checksum.source_checksum} (match: ${checksum.match})`);
      }

      if (validationResult.warnings.length > 0) {
        console.log(`\n⚠️  ${validationResult.warnings.length} warnings found`);
      }

      // T024: Generate validation report file
      const reportFileName = `validation-report_${exportResult.timestamp}.json`;
      const reportFilePath = join(config.outputDir, reportFileName);

      const validationReport = {
        export: {
          timestamp: exportResult.timestamp,
          success: exportResult.success,
          totalRecords: exportResult.totalRecords,
          totalErrors: exportResult.totalErrors,
          collections: exportResult.collections.map((c) => ({
            collection: c.collection,
            recordCount: c.recordCount,
            filePath: c.filePath,
            durationMs: c.durationMs,
            errors: c.errors,
          })),
        },
        validation: {
          timestamp: validationResult.timestamp,
          success: validationResult.success,
          recordCounts: validationResult.validations,
          checksums: validationResult.checksums,
          warnings: validationResult.warnings,
        },
        summary: {
          allChecksPass: exportResult.success && validationResult.success,
          missingRecords: validationResult.validations
            .filter((v) => !v.checksum_match)
            .map((v) => ({
              entity: v.entity,
              recordCount: v.record_counts.exported,
            })),
          corruptedRecords: validationResult.warnings.filter((w) => w.level === 'error'),
          totalWarnings: validationResult.warnings.length,
          totalErrors: exportResult.totalErrors + validationResult.warnings.filter((w) => w.level === 'error').length,
        },
      };

      await writeFile(reportFilePath, JSON.stringify(validationReport, null, 2), 'utf-8');
      log.info({ reportFilePath }, 'Validation report saved');
      console.log(`\n📄 Validation report saved: ${reportFilePath}`);

      // Exit with error code if validation failed
      if (!validationResult.success) {
        log.error('Validation failed');
        process.exit(1);
      }
    }

    // Exit with error code if export failed
    if (!exportResult.success) {
      log.error('Export failed');
      process.exit(1);
    }

    log.info('Export workflow completed successfully');
  } catch (error) {
    log.error({ error }, 'Export workflow failed with unexpected error');
    console.error('\n❌ Export failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await firestoreClient.disconnect();
  }
}

// Run main workflow
main().catch((error) => {
  log.fatal({ error }, 'Unhandled error in export workflow');
  console.error('Fatal error:', error);
  process.exit(1);
});
