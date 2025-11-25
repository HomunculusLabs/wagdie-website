/**
 * Database schema types for WAGDIE Project
 * Generated to match existing database schema
 */

export interface Database {
  public: {
    Tables: {
      // WAGDIE Existing Schema Tables
      characters: {
        Row: {
          id: string;
          token_id: number;
          contract_address: string;
          owner_address: string | null;
          metadata: Record<string, any> | null;
          burned: boolean;
          infected: boolean;
          location_id: string | null;
          created_at: string;
          updated_at: string;
          name: string | null;
          class: string;
          level: number;
          origin: string;
          experience: number;
          str: number;
          dex: number;
          con: number;
          int: number;
          wis: number;
          cha: number;
          hp: number;
          max_hp: number;
          ac: number;
          speed: number;
          background_story: string | null;
          equipment: Record<string, any> | null;
          infection_status: string;
          staking_status: string;
          image_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['characters']['Insert']>;
      };
      users: {
        Row: {
          eth_address: string;
          created_at: string;
          login_count: number;
          id: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      tweets: {
        Row: {
          id: string;
          content: string;
          author_id: string;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tweets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tweets']['Insert']>;
      };
      locations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['locations']['Insert']>;
      };
      // Tables for migration framework
      migration_checkpoints: {
        Row: {
          id: string;
          migration_id: string;
          entity_name: string;
          last_processed_index: number;
          total_records: number;
          batch_id: string;
          created_at: string;
          completed_at: string | null;
          status: 'in_progress' | 'completed' | 'failed';
        };
        Insert: Omit<Database['public']['Tables']['migration_checkpoints']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['migration_checkpoints']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Utility types for common operations
export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];

// Specific table types for easier usage
export type Character = Row<'characters'>;
export type CharacterInsert = Insert<'characters'>;
export type User = Row<'users'>;
export type UserInsert = Insert<'users'>;
export type Tweet = Row<'tweets'>;
export type TweetInsert = Insert<'tweets'>;
export type Location = Row<'locations'>;
export type LocationInsert = Insert<'locations'>;
export type MigrationCheckpoint = Row<'migration_checkpoints'>;
export type MigrationCheckpointInsert = Insert<'migration_checkpoints'>;