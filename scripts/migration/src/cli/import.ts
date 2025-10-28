#!/usr/bin/env node
/**
 * Import CLI Command
 *
 * Command-line interface for importing transformed data to Supabase PostgreSQL.
 * Supports dry-run mode, transaction rollback, and post-import validation.
 *
 * Tasks: T049, T050, T051
 * Source: specs/001-migration-plan/spec.md (User Story 3)
 *
 * Usage:
 *   npm run import -- --input ./data/transformed --timestamp 2024-01-15T10-30-00-000Z --dry-run
 *   npm run import -- --input ./data/transformed --timestamp 2024-01-15T10-30-00-000Z --validate
 *   npm run import -- --rollback
 */

import { program } from 'commander';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { SupabasePostgresClient } from '../data/supabase-client.js';
import { ImportService } from '../services/import-service.js';
import type {
  PostgresUser,
  PostgresCharacter,
  PostgresTweet,
  PostgresLocation,
} from '../types/postgres-schema.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'ImportCLI' });

// Load environment variables
loadEnv();

/**
 * CLI configuration
 */
interface CLIConfig {
  inputDir: string;
  timestamp: string;
  dryRun: boolean;
  validate: boolean;
  rollback: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Parse and validate CLI configuration
 */
function parseConfig(): CLIConfig {
  program
    .name('import')
    .description('Import transformed data to Supabase PostgreSQL')
    .option('-i, --input <dir>', 'Input directory with transformed JSON files')
    .option('-t, --timestamp <timestamp>', 'Timestamp from transformation')
    .option('--dry-run', 'Validate without committing to database', false)
    .option('-v, --validate', 'Run post-import validation', false)
    .option('--rollback', 'Rollback previous import', false)
    .option('--supabase-url <url>', 'Supabase project URL', process.env.SUPABASE_URL)
    .option('--supabase-key <key>', 'Supabase service role key', process.env.SUPABASE_SERVICE_ROLE_KEY)
    .parse();

  const options = program.opts();

  // Validate rollback vs import mode
  if (options.rollback) {
    return {
      inputDir: '',
      timestamp: '',
      dryRun: false,
      validate: false,
      rollback: true,
      supabaseUrl: options.supabaseUrl as string | undefined,
      supabaseKey: options.supabaseKey as string | undefined,
    };
  }

  // Validate import mode requirements
  if (!options.input || !options.timestamp) {
    log.error('--input and --timestamp are required for import mode');
    process.exit(1);
  }

  if (!existsSync(options.input as string)) {
    log.error({ path: options.input }, 'Input directory not found');
    process.exit(1);
  }

  return {
    inputDir: options.input as string,
    timestamp: options.timestamp as string,
    dryRun: options.dryRun as boolean,
    validate: options.validate as boolean,
    rollback: false,
    supabaseUrl: options.supabaseUrl as string | undefined,
    supabaseKey: options.supabaseKey as string | undefined,
  };
}

/**
 * Read transformed collection JSON file
 */
async function readTransformedCollection<T>(
  inputDir: string,
  collectionName: string,
  timestamp: string
): Promise<T[]> {
  const fileName = `${collectionName}_transformed_${timestamp}.json`;
  const filePath = join(inputDir, fileName);

  if (!existsSync(filePath)) {
    log.error({ filePath }, 'Transformed file not found');
    throw new Error(`Transformed file not found: ${filePath}`);
  }

  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T[];
}

/**
 * T050: Post-import validation
 *
 * Compares record counts between transformed files and database
 */
async function validateImport(
  supabaseClient: SupabasePostgresClient,
  expectedCounts: { users: number; locations: number; characters: number; tweets: number }
): Promise<{ valid: boolean; errors: string[] }> {
  log.info('Running post-import validation');

  const errors: string[] = [];

  try {
    // Get actual counts from database
    const actualCounts = {
      users: await supabaseClient.getTableCount('users'),
      locations: await supabaseClient.getTableCount('locations'),
      characters: await supabaseClient.getTableCount('characters'),
      tweets: await supabaseClient.getTableCount('tweets'),
    };

    // Compare counts
    for (const [table, expected] of Object.entries(expectedCounts)) {
      const actual = actualCounts[table as keyof typeof actualCounts];

      if (actual !== expected) {
        errors.push(`${table}: expected ${expected} records, found ${actual} in database`);
      }
    }

    const valid = errors.length === 0;

    if (valid) {
      log.info({ actualCounts }, 'Post-import validation passed');
    } else {
      log.error({ expectedCounts, actualCounts, errors }, 'Post-import validation failed');
    }

    return { valid, errors };
  } catch (error) {
    log.error({ error }, 'Post-import validation failed with error');
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * T051: Rollback command
 *
 * Deletes all records from migration tables to restore pre-migration state
 */
async function performRollback(supabaseClient: SupabasePostgresClient): Promise<void> {
  log.warn('Starting rollback - all migration data will be deleted');

  console.log('\n⚠️  WARNING: This will delete ALL data from migration tables!');
  console.log('Tables to be cleared: users, characters, tweets, locations');

  // In production, we would want confirmation here
  // For now, we'll proceed directly

  try {
    // Delete in reverse dependency order to avoid foreign key violations
    const rollbackOrder: Array<'tweets' | 'characters' | 'locations' | 'users'> = [
      'tweets', // Depends on characters
      'characters', // Depends on users, locations
      'locations', // No dependencies
      'users', // No dependencies
    ];

    for (const table of rollbackOrder) {
      log.info({ table }, 'Deleting table data');

      // Use Supabase client to delete all records
      const { error } = await supabaseClient.client!.from(table).delete().neq('id', ''); // Delete all

      if (error) {
        log.error({ table, error }, 'Failed to delete table data');
        throw new Error(`Rollback failed at table ${table}: ${error.message}`);
      }

      log.info({ table }, 'Table data deleted');
    }

    log.info('Rollback completed successfully');
    console.log('\n✅ Rollback completed - all migration data has been removed');
  } catch (error) {
    log.error({ error }, 'Rollback failed');
    console.error('\n❌ Rollback failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Main import workflow
 */
async function main() {
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
    // T051: Handle rollback mode
    if (config.rollback) {
      await performRollback(supabaseClient);
      return;
    }

    // T049: Import mode
    log.info('Starting import workflow');

    // Read transformed data
    log.info('Reading transformed data');

    const users = await readTransformedCollection<PostgresUser>(
      config.inputDir,
      'users',
      config.timestamp
    );

    const locations = await readTransformedCollection<PostgresLocation>(
      config.inputDir,
      'locations',
      config.timestamp
    );

    const characters = await readTransformedCollection<PostgresCharacter>(
      config.inputDir,
      'characters',
      config.timestamp
    );

    const tweets = await readTransformedCollection<PostgresTweet>(
      config.inputDir,
      'tweets',
      config.timestamp
    );

    log.info(
      {
        users: users.length,
        locations: locations.length,
        characters: characters.length,
        tweets: tweets.length,
      },
      'Read transformed data'
    );

    // Initialize import service
    const importService = new ImportService(supabaseClient, {
      batchSize: 100,
      progressInterval: 100,
      dryRun: config.dryRun,
    });

    // Validate foreign keys before import
    const fkValidation = importService.validateForeignKeys({ users, locations, characters, tweets });

    if (!fkValidation.valid) {
      log.error({ errors: fkValidation.errors }, 'Foreign key validation failed');
      console.error('\n❌ Foreign key validation failed:');
      for (const error of fkValidation.errors.slice(0, 10)) {
        console.error(`  - ${error}`);
      }
      if (fkValidation.errors.length > 10) {
        console.error(`  ... and ${fkValidation.errors.length - 10} more`);
      }
      process.exit(1);
    }

    log.info('Foreign key validation passed');

    // Run import
    const importResult = await importService.importAll({ users, locations, characters, tweets });

    // Print import summary
    console.log('\n=== Import Summary ===');
    console.log(`Status: ${importResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Mode: ${importResult.dryRun ? '🔍 DRY RUN' : '💾 PRODUCTION'}`);
    console.log(`\nTotals:`);
    console.log(`  - Attempted: ${importResult.totalAttempted}`);
    console.log(`  - Inserted: ${importResult.totalInserted}`);
    console.log(`  - Failed: ${importResult.totalFailed}`);

    console.log('\nTables:');
    for (const table of importResult.tables) {
      const status = table.failed === 0 ? '✅' : '⚠️';
      console.log(
        `  ${status} ${table.table}: ${table.inserted}/${table.attempted} inserted (${table.durationMs}ms)`
      );
      if (table.failed > 0) {
        console.log(`     ⚠️  ${table.failed} records failed`);
      }
    }

    if (importResult.errors.length > 0) {
      console.log(`\n⚠️  ${importResult.errors.length} errors:`);
      for (const error of importResult.errors) {
        console.log(`  - ${error}`);
      }
    }

    // T050: Post-import validation
    if (config.validate && !config.dryRun) {
      console.log('\n=== Post-Import Validation ===');
      const validation = await validateImport(supabaseClient, {
        users: users.length,
        locations: locations.length,
        characters: characters.length,
        tweets: tweets.length,
      });

      if (validation.valid) {
        console.log('✅ Validation passed - record counts match');
      } else {
        console.log('❌ Validation failed:');
        for (const error of validation.errors) {
          console.log(`  - ${error}`);
        }
        process.exit(1);
      }
    }

    // Save import report
    const reportPath = join(config.inputDir, `import-report_${config.timestamp}.json`);
    await writeFile(reportPath, JSON.stringify(importResult, null, 2), 'utf-8');
    console.log(`\n📄 Import report saved: ${reportPath}`);

    if (!importResult.success) {
      log.error('Import failed');
      process.exit(1);
    }

    log.info('Import workflow completed successfully');
  } catch (error) {
    log.error({ error }, 'Import workflow failed');
    console.error('\n❌ Import failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await supabaseClient.disconnect();
  }
}

// Run main workflow
main().catch((error) => {
  log.fatal({ error }, 'Unhandled error in import workflow');
  console.error('Fatal error:', error);
  process.exit(1);
});
