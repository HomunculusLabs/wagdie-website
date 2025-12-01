/**
 * Character Location Repository - Data Access Layer
 *
 * Handles all database operations for the character_locations table.
 * Follows Clean Architecture by keeping data access logic separate from business logic.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CharacterLocation,
  CharacterLocationRepository as ICharacterLocationRepository,
} from '../types/map';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

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

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000);
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        throw new Error(`Failed to fetch confirmed character locations: ${error.message}`);
      }

      // If no data or missing metadata, use mock data
      if (!data || data.length === 0) {
        return this.getMockCharacterLocations();
      }

      // Check if character locations have metadata
      const hasMetadata = data.every((cl: CharacterLocation) => cl.location && cl.location.metadata && cl.location.metadata.bounds);
      if (!hasMetadata) {
        console.warn('Database character locations missing metadata, using mock data');
        return this.getMockCharacterLocations();
      }

      return data;
    } catch (error) {
      console.error('CharacterLocationRepository.getConfirmed() error:', error);
      // Return mock data when Supabase is not available
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
