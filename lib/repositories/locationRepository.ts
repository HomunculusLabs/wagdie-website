/**
 * Location Repository - Data Access Layer
 *
 * Handles all database operations for the locations table.
 * Follows Clean Architecture by keeping data access logic separate from business logic.
 */

import { createClient } from '@supabase/supabase-js';
import type { Location, LocationRepository as ILocationRepository, CreateLocationInput, UpdateLocationInput } from '../types/map';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use service role key for write operations if available
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;


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

  /**
   * Create a new location
   * @param id - Location slug (e.g., 'dragons_lair')
   * @param input - Location data
   * @returns Promise<Location> - Created location
   */
  async create(id: string, input: CreateLocationInput): Promise<Location> {
    try {
      const locationData = {
        id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        metadata: {
          coordinates: input.coordinates,
          bounds: [
            [input.coordinates.x - 25, input.coordinates.y - 25],
            [input.coordinates.x + 25, input.coordinates.y + 25],
          ] as [[number, number], [number, number]],
          center: [input.coordinates.x, input.coordinates.y] as [number, number],
        },
        // Note: created_at has a default value in the database
      };

      // Insert without select (Supabase returns empty on insert with RLS)
      const insertResult = await supabaseAdmin
        .from('locations')
        .insert(locationData);

      if (insertResult.error) {
        if (insertResult.error.code === '23505') {
          throw new Error(`Location with ID '${id}' already exists`);
        }
        throw new Error(`Failed to create location: ${insertResult.error.message || insertResult.error.code || 'Unknown error'}`);
      }

      // Fetch the created location
      const { data, error: fetchError } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        // Insert succeeded but fetch failed - return constructed location
        return {
          ...locationData,
          is_active: true,
          created_at: new Date().toISOString(),
          character_locations: [],
        } as Location;
      }

      return data;
    } catch (error) {
      console.error('LocationRepository.create() error:', error);
      throw error;
    }
  }

  /**
   * Update an existing location
   * @param id - Location slug
   * @param input - Fields to update
   * @returns Promise<Location> - Updated location
   */
  async update(id: string, input: UpdateLocationInput): Promise<Location> {
    try {
      // First fetch the existing location to merge metadata
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error(`Location '${id}' not found`);
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }

      if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
      }

      if (input.coordinates !== undefined) {
        // Merge new coordinates into existing metadata
        updateData.metadata = {
          ...existing.metadata,
          coordinates: input.coordinates,
          center: [input.coordinates.x, input.coordinates.y],
          bounds: [
            [input.coordinates.x - 25, input.coordinates.y - 25],
            [input.coordinates.x + 25, input.coordinates.y + 25],
          ],
        };
      }

      const { data, error } = await supabaseAdmin
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update location: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`LocationRepository.update(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param id - Location slug
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete location: ${error.message}`);
      }
    } catch (error) {
      console.error(`LocationRepository.delete(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Get count of staked characters at a location
   * @param id - Location slug
   * @returns Promise<number> - Count of staked characters
   */
  async getStakedCharacterCount(id: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('character_locations')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', id)
        .eq('status', 'confirmed');

      if (error) {
        console.error(`Failed to count staked characters: ${error.message}`);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      console.error(`LocationRepository.getStakedCharacterCount(${id}) error:`, error);
      return 0;
    }
  }

  /**
   * Check if a location ID already exists
   * @param id - Location slug to check
   * @returns Promise<boolean> - True if exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        return false;
      }

      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get all existing location IDs (for unique slug generation)
   * @returns Promise<string[]> - Array of existing IDs
   */
  async getAllIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id');

      if (error) {
        return [];
      }

      return data?.map((loc) => loc.id) ?? [];
    } catch {
      return [];
    }
  }
}
