/**
 * Database table names
 *
 * This repo historically used a `characters` table, but the Supabase migrations
 * in `supabase/migrations/` create and populate `wagdie_characters`.
 *
 * Set `NEXT_PUBLIC_CHARACTERS_TABLE` (and optionally `CHARACTERS_TABLE`) to
 * override if your environment uses a different table name.
 */

export const CHARACTERS_TABLE =
  process.env.NEXT_PUBLIC_CHARACTERS_TABLE ||
  process.env.CHARACTERS_TABLE ||
  'wagdie_characters'

