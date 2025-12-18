/**
 * Character Location Repository - Data Access Layer
 *
 * Handles all database operations for the `character_locations` table.
 * This table stores staking transaction history (confirmed/pending/failed).
 *
 * NOTE: For current character location display on the map, use `character-repository.ts`
 * which queries `wagdie_characters.location_id` directly. This repository is for:
 * - Historical staking transactions
 * - Pending/failed staking attempts
 * - Wallet-based location queries
 *
 * Follows Clean Architecture by keeping data access logic separate from business logic.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CharacterLocation,
  CharacterLocationRepository as ICharacterLocationRepository,
} from '../types/map';
import { normalizeLocationMetadata } from '@/lib/domain/location/metadata';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Dedupe character locations by token id, keeping the first (newest) entry.
 * Results are already sorted by updated_at desc, so first = newest.
 */
function dedupeByTokenId(rows: CharacterLocation[]): CharacterLocation[] {
  const seen = new Set<number>();
  const out: CharacterLocation[] = [];
  for (const row of rows) {
    const tokenId = row.character_token_id;
    if (seen.has(tokenId)) continue;
    seen.add(tokenId);
    out.push(row);
  }
  return out;
}

/**
 * Normalize the joined location metadata to ensure center is derived from bounds if missing.
 */
function normalizeCharacterLocation(row: CharacterLocation): CharacterLocation {
  if (!row.location) return row;

  return {
    ...row,
    location: {
      ...row.location,
      metadata: normalizeLocationMetadata(row.location.metadata) as typeof row.location.metadata,
    },
  };
}

/**
 * Repository implementation for accessing character location data from Supabase
 */
export class CharacterLocationRepository implements ICharacterLocationRepository {
  /**
   * Fetch all character locations from Supabase
   * @returns Promise<CharacterLocation[]> - Array of all character locations
   */
  async getAll(): Promise<CharacterLocation[]> {
    try {
      const { data, error } = await supabase
        .from('character_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch character locations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('CharacterLocationRepository.getAll() error:', error);
      throw error;
    }
  }

  /**
   * Fetch character location by token ID
   * @param tokenId - WAGDIE token ID
   * @returns Promise<CharacterLocation | null> - Character location or null
   */
  async getByTokenId(tokenId: number): Promise<CharacterLocation | null> {
    try {
      const { data, error } = await supabase
        .from('character_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('character_token_id', tokenId)
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch character location: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error(`CharacterLocationRepository.getByTokenId(${tokenId}) error:`, error);
      throw error;
    }
  }

  /**
   * Fetch all character locations for a specific wallet
   * @param address - Wallet address
   * @returns Promise<CharacterLocation[]> - Array of character's locations
   */
  async getByWalletAddress(address: string): Promise<CharacterLocation[]> {
    try {
      const { data, error } = await supabase
        .from('character_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('wallet_address', address)
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch wallet character locations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(`CharacterLocationRepository.getByWalletAddress(${address}) error:`, error);
      throw error;
    }
  }

  /**
   * Fetch all character locations at a specific location
   * @param locationId - Location UUID
   * @returns Promise<CharacterLocation[]> - Array of character locations
   */
  async getByLocationId(locationId: string): Promise<CharacterLocation[]> {
    try {
      const { data, error } = await supabase
        .from('character_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('location_id', locationId)
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch location character locations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(`CharacterLocationRepository.getByLocationId(${locationId}) error:`, error);
      throw error;
    }
  }

  /**
   * Fetch all confirmed character locations only
   * Used for map display (ignore pending/failed transactions)
   * @returns Promise<CharacterLocation[]> - Array of confirmed character locations
   */
  async getConfirmed(): Promise<CharacterLocation[]> {
    try {
      // Add timeout to prevent hanging
      const fetchPromise = supabase
        .from('character_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000);
      });

      const result = (await Promise.race([fetchPromise, timeoutPromise])) as any;
      const data = result?.data;
      const error = result?.error;

      if (error) {
        const message = typeof error?.message === 'string' ? error.message : String(error);
        throw new Error(`Failed to fetch confirmed character locations: ${message}`);
      }

      const rows: CharacterLocation[] = Array.isArray(data) ? (data as CharacterLocation[]) : [];

      // Empty is a valid state (do not replace with mocks)
      if (rows.length === 0) {
        return [];
      }

      // Normalize joined location metadata so center can be derived from bounds if missing
      const normalized = rows.map(normalizeCharacterLocation);

      // Dedupe by token id (keep newest because rows are sorted by updated_at desc)
      const deduped = dedupeByTokenId(normalized);

      // Filter out rows with missing joined location (can't be placed on map)
      const cleaned: CharacterLocation[] = [];
      for (const row of deduped) {
        if (!row.location) {
          console.warn(
            `Character location ${row.id} (token ${row.character_token_id}) missing joined location; skipping`
          );
          continue;
        }
        cleaned.push(row);
      }

      return cleaned;
    } catch (error) {
      console.error('CharacterLocationRepository.getConfirmed() error:', error);
      // Return mock data when Supabase is not available (timeout/failure)
      return this.getMockCharacterLocations();
    }
  }

  /**
   * Get mock character location data for development/testing
   * @returns CharacterLocation[] - Array of mock character locations
   */
  getMockCharacterLocations(): CharacterLocation[] {
    return [
      {
        id: 'cl-1',
        character_token_id: 1,
        wallet_address: '0x1234567890123456789012345678901234567890',
        location_id: 'loc-1',
        status: 'confirmed',
        transaction_hash: '0xabcdef123456789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location: {
          id: 'loc-1',
          name: 'The Abyss',
          description: 'A dark and treacherous realm',
          metadata: {
            bounds: [[0, 0], [250, 250]],
            center: [125, 125],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'cl-2',
        character_token_id: 2,
        wallet_address: '0x2345678901234567890123456789012345678901',
        location_id: 'loc-2',
        status: 'confirmed',
        transaction_hash: '0xdef123456789abc',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location: {
          id: 'loc-2',
          name: 'Eternal Flames',
          description: 'A burning wasteland of perpetual fire',
          metadata: {
            bounds: [[250, 0], [500, 250]],
            center: [375, 125],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];
  }
}
