/**
 * Transform Service
 *
 * Transforms Firestore documents to PostgreSQL schema format.
 * Handles address normalization, timestamp conversion, and metadata consolidation.
 *
 * Tasks: T031, T032, T033, T034
 * Source: specs/001-migration-plan/contracts/field-mappings.md
 */

import type { Timestamp } from 'firebase-admin/firestore';
import type {
  FirestoreUser,
  FirestoreCharacter,
  FirestoreTweet,
  FirestoreLocation,
} from '../types/firestore-schema.js';
import type {
  PostgresUser,
  PostgresCharacter,
  PostgresTweet,
  PostgresLocation,
} from '../types/postgres-schema.js';
import { normalizeAddress, normalizeOwnerAddress, detectDuplicateAddresses } from '../utils/address-normalizer.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'TransformService' });

/**
 * Transformation result for a collection
 */
export interface TransformResult<T> {
  entity: string;
  transformed: T[];
  errors: TransformError[];
  successCount: number;
  failureCount: number;
}

/**
 * Transformation error
 */
export interface TransformError {
  documentId: string;
  entity: string;
  error: string;
  field?: string;
}

/**
 * TransformService: Transforms Firestore documents to PostgreSQL format
 */
export class TransformService {
  /**
   * T031: Transform Firestore User to PostgreSQL User
   *
   * Field Mappings (from field-mappings.md):
   * - ethAddress → eth_address (EIP-55 checksummed)
   * - createdAt → created_at (ISO 8601)
   * - lastLoginAt → last_login_at (ISO 8601)
   * - loginCount → login_count
   * - preferences → NOT MIGRATED
   */
  transformUser(firestoreUser: FirestoreUser & { _documentId: string }): PostgresUser {
    try {
      // Normalize Ethereum address to EIP-55 checksum
      const ethAddress = normalizeAddress(firestoreUser.ethAddress);

      // Convert Firestore Timestamps to ISO 8601
      const createdAt = this.convertTimestamp(firestoreUser.createdAt);
      const lastLoginAt = this.convertTimestamp(firestoreUser.lastLoginAt);

      return {
        eth_address: ethAddress,
        created_at: createdAt,
        last_login_at: lastLoginAt,
        login_count: firestoreUser.loginCount,
        // preferences NOT included (not in PostgreSQL schema)
      };
    } catch (error) {
      log.error(
        { documentId: firestoreUser._documentId, error },
        'Failed to transform user'
      );
      throw new Error(
        `User transformation failed for ${firestoreUser._documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * T032: Transform Firestore Character to PostgreSQL Character
   *
   * Field Mappings (from field-mappings.md):
   * - tokenId → token_id
   * - contractAddress → contract_address (EIP-55 checksummed)
   * - ownerAddress → owner_address (EIP-55 checksummed, NULL if burned)
   * - burned → burned
   * - infected → infected
   * - locationId → location_id
   * - name, imageUrl, attributes → metadata JSONB (consolidated)
   * - createdAt → created_at (ISO 8601)
   * - updatedAt → updated_at (ISO 8601)
   */
  transformCharacter(
    firestoreCharacter: FirestoreCharacter & { _documentId: string }
  ): PostgresCharacter {
    try {
      // Normalize contract address to EIP-55
      const contractAddress = normalizeAddress(firestoreCharacter.contractAddress);

      // Normalize owner address (NULL if burned)
      const ownerAddress = normalizeOwnerAddress(
        firestoreCharacter.ownerAddress,
        firestoreCharacter.burned
      );

      // Convert timestamps
      const createdAt = this.convertTimestamp(firestoreCharacter.createdAt);
      const updatedAt = this.convertTimestamp(firestoreCharacter.updatedAt);

      // Consolidate metadata fields into JSONB
      const metadata = this.consolidateCharacterMetadata(firestoreCharacter);

      return {
        token_id: firestoreCharacter.tokenId,
        contract_address: contractAddress,
        owner_address: ownerAddress,
        burned: firestoreCharacter.burned,
        infected: firestoreCharacter.infected,
        location_id: firestoreCharacter.locationId ?? null,
        metadata,
        created_at: createdAt,
        updated_at: updatedAt,
      };
    } catch (error) {
      log.error(
        { documentId: firestoreCharacter._documentId, error },
        'Failed to transform character'
      );
      throw new Error(
        `Character transformation failed for ${firestoreCharacter._documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * T033: Transform Firestore Tweet to PostgreSQL Tweet
   *
   * Field Mappings (from field-mappings.md):
   * - _documentId → id
   * - authorId → author_id
   * - content → content
   * - createdAt → created_at (ISO 8601)
   * - updatedAt → updated_at (ISO 8601)
   */
  transformTweet(firestoreTweet: FirestoreTweet & { _documentId: string }): PostgresTweet {
    try {
      // Convert timestamps
      const createdAt = this.convertTimestamp(firestoreTweet.createdAt);
      const updatedAt = this.convertTimestamp(firestoreTweet.updatedAt);

      return {
        id: firestoreTweet._documentId,
        author_id: firestoreTweet.authorId,
        content: firestoreTweet.content,
        created_at: createdAt,
        updated_at: updatedAt,
      };
    } catch (error) {
      log.error(
        { documentId: firestoreTweet._documentId, error },
        'Failed to transform tweet'
      );
      throw new Error(
        `Tweet transformation failed for ${firestoreTweet._documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * T034: Transform Firestore Location to PostgreSQL Location
   *
   * Field Mappings (from field-mappings.md):
   * - _documentId → id
   * - name → name
   * - description, capacity, imageUrl → metadata JSONB (consolidated)
   *
   * NOTE: capacity moves from top-level field to metadata.capacity
   */
  transformLocation(
    firestoreLocation: FirestoreLocation & { _documentId: string }
  ): PostgresLocation {
    try {
      // Consolidate metadata fields into JSONB
      const metadata = this.consolidateLocationMetadata(firestoreLocation);

      return {
        id: firestoreLocation._documentId,
        name: firestoreLocation.name,
        metadata,
      };
    } catch (error) {
      log.error(
        { documentId: firestoreLocation._documentId, error },
        'Failed to transform location'
      );
      throw new Error(
        `Location transformation failed for ${firestoreLocation._documentId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Batch transform users
   */
  transformUsers(
    firestoreUsers: Array<FirestoreUser & { _documentId: string }>
  ): TransformResult<PostgresUser> {
    return this.batchTransform('users', firestoreUsers, (user) => this.transformUser(user));
  }

  /**
   * Batch transform characters
   */
  transformCharacters(
    firestoreCharacters: Array<FirestoreCharacter & { _documentId: string }>
  ): TransformResult<PostgresCharacter> {
    return this.batchTransform('characters', firestoreCharacters, (character) =>
      this.transformCharacter(character)
    );
  }

  /**
   * Batch transform tweets
   */
  transformTweets(
    firestoreTweets: Array<FirestoreTweet & { _documentId: string }>
  ): TransformResult<PostgresTweet> {
    return this.batchTransform('tweets', firestoreTweets, (tweet) => this.transformTweet(tweet));
  }

  /**
   * Batch transform locations
   */
  transformLocations(
    firestoreLocations: Array<FirestoreLocation & { _documentId: string }>
  ): TransformResult<PostgresLocation> {
    return this.batchTransform('locations', firestoreLocations, (location) =>
      this.transformLocation(location)
    );
  }

  /**
   * Generic batch transformation with error handling
   */
  private batchTransform<TSource, TTarget>(
    entity: string,
    sourceRecords: Array<TSource & { _documentId: string }>,
    transformFn: (source: TSource & { _documentId: string }) => TTarget
  ): TransformResult<TTarget> {
    const transformed: TTarget[] = [];
    const errors: TransformError[] = [];

    for (const record of sourceRecords) {
      try {
        const result = transformFn(record);
        transformed.push(result);
      } catch (error) {
        errors.push({
          documentId: record._documentId,
          entity,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log.info(
      {
        entity,
        total: sourceRecords.length,
        success: transformed.length,
        failures: errors.length,
      },
      'Batch transformation completed'
    );

    return {
      entity,
      transformed,
      errors,
      successCount: transformed.length,
      failureCount: errors.length,
    };
  }

  /**
   * Convert Firestore Timestamp to ISO 8601 string
   */
  private convertTimestamp(timestamp: Timestamp): string {
    return timestamp.toDate().toISOString();
  }

  /**
   * T032: Consolidate character metadata fields into JSONB
   *
   * Consolidates: name, imageUrl, attributes → metadata JSONB
   */
  private consolidateCharacterMetadata(
    character: FirestoreCharacter
  ): Record<string, unknown> | null {
    const metadata: Record<string, unknown> = {};

    // Add name if present
    if (character.name !== undefined && character.name !== null) {
      metadata.name = character.name;
    }

    // Add imageUrl if present (map to image_url)
    if (character.imageUrl !== undefined && character.imageUrl !== null) {
      metadata.image_url = character.imageUrl;
    }

    // Add attributes if present
    if (character.attributes !== undefined && character.attributes !== null) {
      metadata.attributes = character.attributes;
    }

    // Return null if no metadata fields present
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  /**
   * T034: Consolidate location metadata fields into JSONB
   *
   * Consolidates: description, capacity, imageUrl → metadata JSONB
   * NOTE: capacity moves from top-level to metadata.capacity
   */
  private consolidateLocationMetadata(
    location: FirestoreLocation
  ): Record<string, unknown> | null {
    const metadata: Record<string, unknown> = {};

    // Add description if present
    if (location.description !== undefined && location.description !== null) {
      metadata.description = location.description;
    }

    // Add capacity if present (moved from top-level field)
    if (location.capacity !== undefined && location.capacity !== null) {
      metadata.capacity = location.capacity;
    }

    // Add imageUrl if present (map to image_url)
    if (location.imageUrl !== undefined && location.imageUrl !== null) {
      metadata.image_url = location.imageUrl;
    }

    // Return null if no metadata fields present
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  /**
   * T035: Handle orphaned characters (create user records for missing owners)
   *
   * Identifies characters with owner addresses that don't exist in the users collection
   * and creates synthetic user records for them.
   *
   * @param characters Transformed character records
   * @param existingUsers Transformed user records
   * @returns Additional user records to create for orphaned character owners
   */
  handleOrphanedCharacters(
    characters: PostgresCharacter[],
    existingUsers: PostgresUser[]
  ): PostgresUser[] {
    log.info('Checking for orphaned characters');

    // Build set of existing user addresses (normalized)
    const existingAddresses = new Set(existingUsers.map((u) => u.eth_address.toLowerCase()));

    // Find unique owner addresses from characters that don't exist in users
    const orphanedAddresses = new Set<string>();

    for (const character of characters) {
      // Skip if no owner (burned character)
      if (!character.owner_address) continue;

      const normalizedOwner = character.owner_address.toLowerCase();

      // Check if owner exists in users
      if (!existingAddresses.has(normalizedOwner)) {
        orphanedAddresses.add(character.owner_address); // Use checksummed version
      }
    }

    if (orphanedAddresses.size === 0) {
      log.info('No orphaned characters found');
      return [];
    }

    // Create synthetic user records for orphaned owners
    const syntheticUsers: PostgresUser[] = [];
    const now = new Date().toISOString();

    for (const address of orphanedAddresses) {
      syntheticUsers.push({
        eth_address: address, // Already normalized/checksummed
        created_at: now,
        last_login_at: now,
        login_count: 0, // Synthetic user, never logged in
      });
    }

    log.warn(
      { orphanedCount: syntheticUsers.length, addresses: Array.from(orphanedAddresses) },
      'Created synthetic user records for orphaned character owners'
    );

    return syntheticUsers;
  }

  /**
   * T036: Handle duplicate addresses (normalize and merge)
   *
   * Detects addresses with different casing that normalize to the same EIP-55 address
   * and provides a mapping from the original addresses to the canonical normalized form.
   *
   * This is primarily a detection/reporting function. Actual merging would require
   * business logic decisions (which user record to keep, how to merge login counts, etc.)
   *
   * @param users Transformed user records
   * @returns Report of duplicate addresses found
   */
  detectDuplicateUserAddresses(users: PostgresUser[]): {
    duplicates: Map<string, string[]>;
    canonicalMapping: Map<string, string>;
  } {
    log.info('Checking for duplicate user addresses');

    // Extract all addresses
    const addresses = users.map((u) => u.eth_address);

    // Detect duplicates using address normalizer utility
    const duplicates = detectDuplicateAddresses(addresses);

    if (duplicates.size === 0) {
      log.info('No duplicate addresses found');
      return { duplicates, canonicalMapping: new Map() };
    }

    // Build canonical mapping (original → normalized)
    const canonicalMapping = new Map<string, string>();

    for (const [normalized, originals] of duplicates.entries()) {
      for (const original of originals) {
        canonicalMapping.set(original, normalized);
      }
    }

    log.warn(
      {
        duplicateGroups: duplicates.size,
        totalDuplicates: Array.from(duplicates.values()).reduce((sum, arr) => sum + arr.length, 0),
      },
      'Duplicate addresses detected - manual review recommended'
    );

    return { duplicates, canonicalMapping };
  }

  /**
   * T037: Handle burned characters (set owner_address to NULL)
   *
   * NOTE: This is already handled in transformCharacter() via normalizeOwnerAddress().
   * This method exists for explicit validation/testing purposes.
   *
   * @param character Character to check
   * @returns True if character is burned and owner_address is NULL
   */
  validateBurnedCharacter(character: PostgresCharacter): boolean {
    if (character.burned) {
      return character.owner_address === null;
    }
    return true; // Not burned, validation passes
  }

  /**
   * T038: Handle missing location references (set location_id to NULL)
   *
   * NOTE: This is already handled in transformCharacter() via null coalescing.
   * This method exists for explicit validation/verification purposes.
   *
   * @param character Character to check
   * @param validLocationIds Set of valid location IDs
   * @returns True if location_id is valid (exists in locations) or NULL
   */
  validateLocationReferences(character: PostgresCharacter, validLocationIds: Set<string>): boolean {
    // NULL is valid (no location)
    if (character.location_id === null) {
      return true;
    }

    // Check if location exists
    return validLocationIds.has(character.location_id);
  }

  /**
   * Validate all location references in characters
   *
   * Identifies characters with invalid location references and returns them.
   *
   * @param characters All transformed characters
   * @param locations All transformed locations
   * @returns Characters with invalid location references
   */
  findInvalidLocationReferences(
    characters: PostgresCharacter[],
    locations: PostgresLocation[]
  ): Array<{ character: PostgresCharacter; invalidLocationId: string }> {
    const validLocationIds = new Set(locations.map((l) => l.id));
    const invalid: Array<{ character: PostgresCharacter; invalidLocationId: string }> = [];

    for (const character of characters) {
      if (character.location_id && !validLocationIds.has(character.location_id)) {
        invalid.push({
          character,
          invalidLocationId: character.location_id,
        });
      }
    }

    if (invalid.length > 0) {
      log.warn(
        { count: invalid.length },
        'Characters with invalid location references found'
      );
    }

    return invalid;
  }
}
