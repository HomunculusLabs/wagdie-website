/**
 * PostgreSQL Row Type Definitions
 *
 * These types represent the structure of rows in the target Supabase PostgreSQL database.
 * Source: specs/001-migration-plan/data-model.md
 * Schema: supabase/migrations/20250101000000_initial_schema.sql
 */

/**
 * User row in PostgreSQL `public.users` table
 */
export interface PostgresUser {
  id?: string; // UUID, auto-generated (omit during insert)
  eth_address: string; // Normalized checksummed Ethereum address (UNIQUE)
  created_at: string; // ISO 8601 timestamp (TIMESTAMPTZ)
  last_login_at: string; // ISO 8601 timestamp (TIMESTAMPTZ)
  login_count: number; // Total login count (INTEGER)
}

/**
 * Character row in PostgreSQL `public.characters` table
 */
export interface PostgresCharacter {
  id?: string; // UUID, auto-generated (omit during insert)
  token_id: number; // NFT token ID (INTEGER, NOT NULL)
  contract_address: string; // NFT contract address (TEXT, NOT NULL, checksummed)
  owner_address: string | null; // Current owner address (TEXT, NULL if burned, checksummed)
  metadata: Record<string, unknown> | null; // JSONB, consolidated metadata
  burned: boolean; // Burn status (BOOLEAN, NOT NULL)
  infected: boolean; // Game infection status (BOOLEAN, NOT NULL)
  location_id: string | null; // Foreign key to locations (TEXT, NULL)
  created_at: string; // ISO 8601 timestamp (TIMESTAMPTZ, NOT NULL)
  updated_at: string; // ISO 8601 timestamp (TIMESTAMPTZ, NOT NULL)
}

/**
 * Tweet row in PostgreSQL `public.tweets` table
 */
export interface PostgresTweet {
  id: string; // Twitter/X tweet ID (TEXT, PRIMARY KEY)
  author_id: string; // Twitter/X user ID (TEXT, NOT NULL)
  content: string; // Tweet text content (TEXT, NOT NULL)
  media_urls: string[] | null; // Array of media URLs (TEXT[], NULL)
  created_at: string; // ISO 8601 timestamp (TIMESTAMPTZ, NOT NULL)
  stored_at?: string; // ISO 8601 timestamp (TIMESTAMPTZ, auto-generated)
}

/**
 * Location row in PostgreSQL `public.locations` table
 */
export interface PostgresLocation {
  id: string; // Location identifier (TEXT, PRIMARY KEY)
  name: string; // Display name (TEXT, NOT NULL)
  description: string | null; // Flavor text (TEXT, NULL)
  metadata: Record<string, unknown> | null; // JSONB, additional data (NULL)
}

/**
 * Union type for all PostgreSQL rows
 */
export type PostgresRow =
  | PostgresUser
  | PostgresCharacter
  | PostgresTweet
  | PostgresLocation;

/**
 * Table names in PostgreSQL
 */
export const POSTGRES_TABLES = {
  USERS: 'users',
  CHARACTERS: 'characters',
  TWEETS: 'tweets',
  LOCATIONS: 'locations',
} as const;

export type PostgresTableName = typeof POSTGRES_TABLES[keyof typeof POSTGRES_TABLES];

/**
 * Batch insert payload for PostgreSQL stored procedure
 */
export interface MigrationBatchPayload {
  users: PostgresUser[];
  characters: PostgresCharacter[];
  tweets: PostgresTweet[];
  locations: PostgresLocation[];
}
