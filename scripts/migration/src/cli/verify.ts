#!/usr/bin/env node
/**
 * Verify CLI Command
 *
 * Command-line interface for comprehensive verification of migrated data.
 *
 * Tasks: T059, T060
 * Source: specs/001-migration-plan/spec.md (User Story 4)
 *
 * Usage:
 *   npm run verify -- --export-dir ./data/export --timestamp 2024-01-15T10-30-00-000Z
 */

import { program } from 'commander';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { SupabasePostgresClient } from '../data/supabase-client.js';
import { VerificationService } from '../services/verification-service.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'VerifyCLI' });

// Load environment variables
loadEnv();

/**
 * CLI configuration
 */
interface CLIConfig {
  exportDir: string;
  timestamp: string;
  spotCheckPercentage: number;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Parse and validate CLI configuration
 */
function parseConfig(): CLIConfig {
  program
    .name('verify')
    .description('Verify migrated data integrity and completeness')
    .requiredOption('-e, --export-dir <dir>', 'Directory with exported JSON files')
    .requiredOption('-t, --timestamp <timestamp>', 'Timestamp from export')
    .option('-s, --spot-check <percentage>', 'Percentage of records to spot-check', '1')
    .option('--supabase-url <url>', 'Supabase project URL', process.env.SUPABASE_URL)
    .option('--supabase-key <key>', 'Supabase service role key', process.env.SUPABASE_SERVICE_ROLE_KEY)
    .parse();

  const options = program.opts();

  // Validate export directory exists
  if (!existsSync(options.exportDir as string)) {
    log.error({ path: options.exportDir }, 'Export directory not found');
    process.exit(1);
  }

  return {
    exportDir: options.exportDir as string,
    timestamp: options.timestamp as string,
    spotCheckPercentage: parseFloat(options.spotCheck as string),
    supabaseUrl: options.supabaseUrl as string | undefined,
    supabaseKey: options.supabaseKey as string | undefined,
  };
}

/**
 * Main verify workflow
 */
async function main() {
  log.info('Starting verification workflow');

  const config = parseConfig();

  // Initialize Supabase client
  if (!config.supabaseUrl || !config.supabaseKey) {
    log.error('Supabase URL and service role key are required');
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  log.info({ supabaseUrl: config.supabaseUrl }, 'Initializing Supabase client');
  const supabaseClient = new SupabasePostgresClient({
    supabaseUrl: config.supabaseUrl,
    supabaseKey: config.supabaseKey,
    batchSize: 100,
  });

  await supabaseClient.connect();

  try {
    // Initialize verification service
    const verificationService = new VerificationService(supabaseClient, {
      exportDir: config.exportDir,
      timestamp: config.timestamp,
      spotCheckPercentage: config.spotCheckPercentage,
    });

    // Run comprehensive verification
    console.log('\n🔍 Running comprehensive verification...\n');

    const result = await verificationService.verifyAll();

    // Print verification results
    console.log('=== Verification Results ===');
    console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\nSummary:`);
    console.log(`  - Total records verified: ${result.summary.totalRecordsVerified}`);
    console.log(`  - Critical issues: ${result.summary.criticalIssues}`);
    console.log(`  - Warnings: ${result.summary.warnings}`);
    console.log(`  - Total discrepancies: ${result.summary.totalDiscrepancies}`);

    // Record counts
    console.log('\n=== Record Count Validation ===');
    for (const count of result.recordCounts) {
      const status = count.match ? '✅' : '❌';
      console.log(
        `${status} ${count.entity}: export=${count.exportCount}, database=${count.databaseCount}${
          !count.match ? ` (diff: ${count.difference > 0 ? '+' : ''}${count.difference})` : ''
        }`
      );
    }

    // Checksums
    console.log('\n=== Checksum Validation ===');
    for (const checksum of result.checksums) {
      const status = checksum.match ? '✅' : '❌';
      console.log(`${status} ${checksum.entity}:`);
      console.log(`     Export:   ${checksum.exportChecksum}`);
      console.log(`     Database: ${checksum.databaseChecksum}`);
    }

    // Foreign keys
    console.log('\n=== Foreign Key Validation ===');
    if (result.foreignKeys.valid) {
      console.log('✅ All foreign key relationships valid');
    } else {
      console.log(`❌ ${result.foreignKeys.violations.length} foreign key violations found:`);
      for (const violation of result.foreignKeys.violations.slice(0, 10)) {
        console.log(
          `  - ${violation.table}.${violation.foreignKey} (${violation.recordId}): ${violation.invalidValue} not found`
        );
      }
      if (result.foreignKeys.violations.length > 10) {
        console.log(`  ... and ${result.foreignKeys.violations.length - 10} more`);
      }
    }

    // Data types
    console.log('\n=== Data Type Validation ===');
    if (result.dataTypes.valid) {
      console.log('✅ All data types valid');
    } else {
      console.log(`⚠️  ${result.dataTypes.violations.length} data type warnings:`);
      for (const violation of result.dataTypes.violations.slice(0, 10)) {
        console.log(
          `  - ${violation.table}.${violation.field} (${violation.recordId}): ${violation.issue}`
        );
      }
      if (result.dataTypes.violations.length > 10) {
        console.log(`  ... and ${result.dataTypes.violations.length - 10} more`);
      }
    }

    // Spot checks (if any)
    if (result.spotChecks.length > 0) {
      console.log('\n=== Spot-Check Sampling ===');
      console.log(`Sampled ${result.spotChecks.length} records for detailed validation`);
      const failed = result.spotChecks.filter((s) => !s.match);
      if (failed.length > 0) {
        console.log(`⚠️  ${failed.length} discrepancies found in spot-checks`);
      } else {
        console.log('✅ All spot-checks passed');
      }
    }

    // T060: Generate verification report
    const reportPath = join(config.exportDir, `verification-report_${config.timestamp}.json`);
    await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf-8');
    log.info({ reportPath }, 'Verification report saved');
    console.log(`\n📄 Verification report saved: ${reportPath}`);

    // Exit with error code if verification failed
    if (!result.success) {
      log.error('Verification failed');
      console.log('\n❌ Verification failed - migration data integrity issues detected');
      console.log('Review the verification report for details.');
      process.exit(1);
    }

    log.info('Verification completed successfully');
    console.log('\n✅ Verification passed - migration data integrity confirmed');
  } catch (error) {
    log.error({ error }, 'Verification workflow failed');
    console.error('\n❌ Verification failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await supabaseClient.disconnect();
  }
}

// Run main workflow
main().catch((error) => {
  log.fatal({ error }, 'Unhandled error in verification workflow');
  console.error('Fatal error:', error);
  process.exit(1);
});
