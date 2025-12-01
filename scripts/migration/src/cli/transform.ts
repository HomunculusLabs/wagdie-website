#!/usr/bin/env node
/**
 * Transform CLI Command
 *
 * Command-line interface for transforming exported Firestore data to PostgreSQL format.
 *
 * Tasks: T039, T040, T041
 * Source: specs/001-migration-plan/spec.md (User Story 2)
 *
 * Usage:
 *   npm run transform -- --input ./data/export --output ./data/transformed --timestamp 2024-01-15T10-30-00-000Z
 *   npm run transform -- --input ./data/export --output ./data/transformed --timestamp 2024-01-15T10-30-00-000Z --validate
 */

import { Command } from 'commander';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { TransformService } from '../services/transform-service.js';
import type {
  FirestoreUser,
  FirestoreCharacter,
  FirestoreTweet,
  FirestoreLocation,
  FirestoreCollectionName,
} from '../types/firestore-schema.js';
import { FIRESTORE_COLLECTIONS } from '../types/firestore-schema.js';
import type {
  PostgresUser,
  PostgresCharacter,
  PostgresTweet,
  PostgresLocation,
} from '../types/postgres-schema.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'TransformCLI' });

/**
 * CLI configuration
 */
interface CLIConfig {
  inputDir: string;
  outputDir: string;
  timestamp: string;
  validate: boolean;
}

/**
 * Transform result summary
 */
interface TransformSummary {
  timestamp: string;
  success: boolean;
  collections: Array<{
    collection: string;
    inputRecords: number;
    outputRecords: number;
    errors: number;
  }>;
  edgeCases: {
    orphanedCharacters: number;
    duplicateAddresses: number;
    burnedCharacters: number;
    invalidLocationReferences: number;
  };
  errors: Array<{
    collection: string;
    documentId: string;
    error: string;
  }>;
}

/**
 * Parse and validate CLI configuration
 */
const program = new Command();
function parseConfig(): CLIConfig {
  program
    .name('transform')
    .description('Transform exported Firestore data to PostgreSQL format')
    .requiredOption('-i, --input <dir>', 'Input directory with exported JSON files')
    .requiredOption('-o, --output <dir>', 'Output directory for transformed JSON files')
    .requiredOption('-t, --timestamp <timestamp>', 'Timestamp from export (for input file naming)')
    .option('-v, --validate', 'Validate foreign key relationships after transformation', false)
    .parse(process.argv);

  const options = program.opts();

  // Validate input directory exists
  if (!existsSync(options.input as string)) {
    log.error({ path: options.input }, 'Input directory not found');
    process.exit(1);
  }

  return {
    inputDir: options.input as string,
    outputDir: options.output as string,
    timestamp: options.timestamp as string,
    validate: options.validate as boolean,
  };
}

/**
 * Read exported collection JSON file
 */
async function readExportedCollection<T>(
  inputDir: string,
  collectionName: FirestoreCollectionName,
  timestamp: string
): Promise<Array<T & { _documentId: string }>> {
  const fileName = `${collectionName}_${timestamp}.json`;
  const filePath = join(inputDir, fileName);

  if (!existsSync(filePath)) {
    log.error({ filePath }, 'Export file not found');
    throw new Error(`Export file not found: ${filePath}`);
  }

  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as Array<T & { _documentId: string }>;
}

/**
 * Write transformed collection JSON file
 */
async function writeTransformedCollection<T>(
  outputDir: string,
  collectionName: string,
  records: T[],
  timestamp: string
): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const fileName = `${collectionName}_transformed_${timestamp}.json`;
  const filePath = join(outputDir, fileName);

  await writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');

  log.info({ filePath, recordCount: records.length }, 'Wrote transformed collection');

  return filePath;
}

/**
 * Main transform workflow
 */
async function main() {
  log.info('Starting transform workflow');

  const config = parseConfig();
  const transformService = new TransformService();
  const summary: TransformSummary = {
    timestamp: new Date().toISOString(),
    success: true,
    collections: [],
    edgeCases: {
      orphanedCharacters: 0,
      duplicateAddresses: 0,
      burnedCharacters: 0,
      invalidLocationReferences: 0,
    },
    errors: [],
  };

  try {
    // Read exported collections
    log.info('Reading exported collections');

    const firestoreUsers = await readExportedCollection<FirestoreUser>(
      config.inputDir,
      FIRESTORE_COLLECTIONS.USERS,
      config.timestamp
    );

    const firestoreCharacters = await readExportedCollection<FirestoreCharacter>(
      config.inputDir,
      FIRESTORE_COLLECTIONS.CHARACTERS,
      config.timestamp
    );

    const firestoreTweets = await readExportedCollection<FirestoreTweet>(
      config.inputDir,
      FIRESTORE_COLLECTIONS.TWEETS,
      config.timestamp
    );

    const firestoreLocations = await readExportedCollection<FirestoreLocation>(
      config.inputDir,
      FIRESTORE_COLLECTIONS.LOCATIONS,
      config.timestamp
    );

    log.info(
      {
        users: firestoreUsers.length,
        characters: firestoreCharacters.length,
        tweets: firestoreTweets.length,
        locations: firestoreLocations.length,
      },
      'Read exported collections'
    );

    // Transform collections
    log.info('Transforming collections');

    const userResult = transformService.transformUsers(firestoreUsers);
    const characterResult = transformService.transformCharacters(firestoreCharacters);
    const tweetResult = transformService.transformTweets(firestoreTweets);
    const locationResult = transformService.transformLocations(firestoreLocations);

    // T040: Collect transformation errors with document IDs
    summary.errors.push(
      ...userResult.errors.map((e) => ({
        collection: 'users',
        documentId: e.documentId,
        error: e.error,
      })),
      ...characterResult.errors.map((e) => ({
        collection: 'characters',
        documentId: e.documentId,
        error: e.error,
      })),
      ...tweetResult.errors.map((e) => ({
        collection: 'tweets',
        documentId: e.documentId,
        error: e.error,
      })),
      ...locationResult.errors.map((e) => ({
        collection: 'locations',
        documentId: e.documentId,
        error: e.error,
      }))
    );

    // Log transformation results
    summary.collections.push(
      {
        collection: 'users',
        inputRecords: firestoreUsers.length,
        outputRecords: userResult.successCount,
        errors: userResult.failureCount,
      },
      {
        collection: 'characters',
        inputRecords: firestoreCharacters.length,
        outputRecords: characterResult.successCount,
        errors: characterResult.failureCount,
      },
      {
        collection: 'tweets',
        inputRecords: firestoreTweets.length,
        outputRecords: tweetResult.successCount,
        errors: tweetResult.failureCount,
      },
      {
        collection: 'locations',
        inputRecords: firestoreLocations.length,
        outputRecords: locationResult.successCount,
        errors: locationResult.failureCount,
      }
    );

    // Handle edge cases
    log.info('Handling edge cases');

    // T035: Handle orphaned characters
    const orphanedUsers = transformService.handleOrphanedCharacters(
      characterResult.transformed,
      userResult.transformed
    );
    summary.edgeCases.orphanedCharacters = orphanedUsers.length;

    if (orphanedUsers.length > 0) {
      log.warn(
        { count: orphanedUsers.length },
        'Created synthetic user records for orphaned character owners'
      );
      userResult.transformed.push(...orphanedUsers);
    }

    // T036: Detect duplicate addresses
    const duplicateResult = transformService.detectDuplicateUserAddresses(userResult.transformed);
    summary.edgeCases.duplicateAddresses = duplicateResult.duplicates.size;

    if (duplicateResult.duplicates.size > 0) {
      log.warn(
        {
          duplicateGroups: duplicateResult.duplicates.size,
          duplicates: Array.from(duplicateResult.duplicates.entries()).map(([normalized, originals]) => ({
            normalized,
            originals,
          })),
        },
        'Duplicate user addresses detected - manual review recommended'
      );
    }

    // T037: Count burned characters
    const burnedCount = characterResult.transformed.filter((c) => c.burned).length;
    summary.edgeCases.burnedCharacters = burnedCount;

    if (burnedCount > 0) {
      log.info({ count: burnedCount }, 'Burned characters handled (owner_address set to NULL)');
    }

    // T041: Validate foreign key relationships if requested
    if (config.validate) {
      log.info('Validating foreign key relationships');

      // T038: Check for invalid location references
      const invalidLocationRefs = transformService.findInvalidLocationReferences(
        characterResult.transformed,
        locationResult.transformed
      );
      summary.edgeCases.invalidLocationReferences = invalidLocationRefs.length;

      if (invalidLocationRefs.length > 0) {
        log.error(
          {
            count: invalidLocationRefs.length,
            examples: invalidLocationRefs.slice(0, 5).map((r) => ({
              characterTokenId: r.character.token_id,
              invalidLocationId: r.invalidLocationId,
            })),
          },
          'Characters with invalid location references found'
        );

        // Add to errors
        for (const ref of invalidLocationRefs) {
          summary.errors.push({
            collection: 'characters',
            documentId: `token_${ref.character.token_id}`,
            error: `Invalid location_id: ${ref.invalidLocationId}`,
          });
        }
      }

      // Validate tweet author references (must exist in characters)
      const validCharacterIds = new Set(characterResult.transformed.map((c) => `character_${c.token_id}`));
      const invalidTweetRefs = tweetResult.transformed.filter(
        (t) => !validCharacterIds.has(t.author_id)
      );

      if (invalidTweetRefs.length > 0) {
        log.error(
          {
            count: invalidTweetRefs.length,
            examples: invalidTweetRefs.slice(0, 5).map((t) => ({
              tweetId: t.id,
              invalidAuthorId: t.author_id,
            })),
          },
          'Tweets with invalid author_id found'
        );

        // Add to errors
        for (const tweet of invalidTweetRefs) {
          summary.errors.push({
            collection: 'tweets',
            documentId: tweet.id,
            error: `Invalid author_id: ${tweet.author_id}`,
          });
        }
      }

      // Validate character owner references (must exist in users)
      const validUserAddresses = new Set(
        userResult.transformed.map((u) => u.eth_address.toLowerCase())
      );
      const invalidOwnerRefs = characterResult.transformed.filter(
        (c) =>
          c.owner_address !== null && !validUserAddresses.has(c.owner_address.toLowerCase())
      );

      if (invalidOwnerRefs.length > 0) {
        log.error(
          {
            count: invalidOwnerRefs.length,
            examples: invalidOwnerRefs.slice(0, 5).map((c) => ({
              characterTokenId: c.token_id,
              invalidOwnerAddress: c.owner_address,
            })),
          },
          'Characters with invalid owner_address found (should have been handled by orphaned character logic)'
        );
      }
    }

    // Write transformed collections
    log.info('Writing transformed collections');

    await writeTransformedCollection(
      config.outputDir,
      'users',
      userResult.transformed,
      config.timestamp
    );

    await writeTransformedCollection(
      config.outputDir,
      'characters',
      characterResult.transformed,
      config.timestamp
    );

    await writeTransformedCollection(
      config.outputDir,
      'tweets',
      tweetResult.transformed,
      config.timestamp
    );

    await writeTransformedCollection(
      config.outputDir,
      'locations',
      locationResult.transformed,
      config.timestamp
    );

    // Write transform summary
    const summaryPath = join(config.outputDir, `transform-summary_${config.timestamp}.json`);
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    log.info({ summaryPath }, 'Transform summary saved');

    // Print console summary
    console.log('\n=== Transform Summary ===');
    console.log(`Status: ${summary.errors.length === 0 ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ERRORS'}`);
    console.log('\nCollections:');
    for (const col of summary.collections) {
      const status = col.errors === 0 ? '✅' : '⚠️';
      console.log(
        `  ${status} ${col.collection}: ${col.inputRecords} → ${col.outputRecords} records${
          col.errors > 0 ? ` (${col.errors} errors)` : ''
        }`
      );
    }

    console.log('\nEdge Cases:');
    console.log(`  - Orphaned characters: ${summary.edgeCases.orphanedCharacters} synthetic users created`);
    console.log(`  - Duplicate addresses: ${summary.edgeCases.duplicateAddresses} groups found`);
    console.log(`  - Burned characters: ${summary.edgeCases.burnedCharacters} handled`);
    if (config.validate) {
      console.log(
        `  - Invalid location refs: ${summary.edgeCases.invalidLocationReferences} found`
      );
    }

    if (summary.errors.length > 0) {
      console.log(`\n⚠️  ${summary.errors.length} errors found:`);
      for (const error of summary.errors.slice(0, 10)) {
        console.log(`  - ${error.collection}/${error.documentId}: ${error.error}`);
      }
      if (summary.errors.length > 10) {
        console.log(`  ... and ${summary.errors.length - 10} more (see summary file)`);
      }
    }

    console.log(`\n📄 Transform summary saved: ${summaryPath}`);

    // Exit with error code if any errors occurred
    if (summary.errors.length > 0) {
      log.error('Transform completed with errors');
      process.exit(1);
    }

    log.info('Transform workflow completed successfully');
  } catch (error) {
    log.error({ error }, 'Transform workflow failed with unexpected error');
    console.error('\n❌ Transform failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run main workflow
main().catch((error) => {
  log.fatal({ error }, 'Unhandled error in transform workflow');
  console.error('Fatal error:', error);
  process.exit(1);
});
