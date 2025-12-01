/**
 * Location Repository - Data Access Layer
 *
 * Handles all database operations for the locations table.
 * Follows Clean Architecture by keeping data access logic separate from business logic.
 */

import { createClient } from '@supabase/supabase-js';
import type { Location, LocationRepository as ILocationRepository } from '../types/map';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Repository implementation for accessing location data from Supabase
 */
export class LocationRepository implements ILocationRepository {
  /**
   * Fetch all available locations from Supabase
   * @returns Promise<Location[]> - Array of all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      // Add timeout to prevent hanging
      const fetchPromise = supabase
        .from('locations')
        .select('*')
        .order('name');

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000);
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        throw new Error(`Failed to fetch locations: ${error.message}`);
      }

      // If no data or missing metadata, use mock data
      if (!data || data.length === 0) {
        return this.getMockLocations();
      }

      // Check if locations have metadata
      const hasMetadata = data.every((loc: Location) => loc.metadata && loc.metadata.bounds);
      if (!hasMetadata) {
        console.warn('Database locations missing metadata, using mock data');
        return this.getMockLocations();
      }

      return data;
    } catch (error) {
      console.error('LocationRepository.getAll() error:', error);
      // Return mock data when Supabase is not available
      return this.getMockLocations();
    }
  }

  /**
   * Get mock location data for development/testing
   * @returns Location[] - Array of mock locations
   */
  getMockLocations(): Location[] {
    return [
      {
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
      {
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
      {
        id: 'loc-3',
        name: 'Shadow Grove',
        description: 'A mysterious forest shrouded in darkness',
        metadata: {
          bounds: [[500, 0], [750, 250]],
          center: [625, 125],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Fetch a single location by ID
   * @param id - Location UUID
   * @returns Promise<Location | null> - Location or null if not found
   */
  async getById(id: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      // PGRST116 is the error code for "no rows returned" which is expected
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch location: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error(`LocationRepository.getById(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Fetch a location with its associated character count
   * @param id - Location UUID
   * @returns Promise<Location | null> - Location with eager-loaded character count
   */
  async getWithCharacters(id: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          character_locations (
            character_token_id,
            wallet_address,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch location with characters: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error(`LocationRepository.getWithCharacters(${id}) error:`, error);
      throw error;
    }
  }
}
