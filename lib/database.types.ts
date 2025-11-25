export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          eth_address: string
          created_at: string
          last_login_at: string
          login_count: number
        }
        Insert: {
          id?: string
          eth_address: string
          created_at?: string
          last_login_at?: string
          login_count?: number
        }
        Update: {
          id?: string
          eth_address?: string
          created_at?: string
          last_login_at?: string
          login_count?: number
        }
      }
      characters: {
        Row: {
          id: string
          token_id: number
          contract_address: string
          owner_address: string | null
          name: string | null
          class: string | null
          level: number
          experience: number
          str: number
          dex: number
          con: number
          int: number
          wis: number
          cha: number
          hp: number
          max_hp: number
          ac: number
          speed: number
          background_story: string | null
          equipment: Json | null
          metadata: Json | null
          burned: boolean
          infection_status: string
          staking_status: string
          image_url: string
          location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_id: number
          contract_address: string
          owner_address?: string | null
          name?: string | null
          class?: string | null
          level?: number
          experience?: number
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          hp?: number
          max_hp?: number
          ac?: number
          speed?: number
          background_story?: string | null
          equipment?: Json | null
          metadata?: Json | null
          burned?: boolean
          infection_status?: string
          staking_status?: string
          image_url?: string
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token_id?: number
          contract_address?: string
          owner_address?: string | null
          name?: string | null
          class?: string | null
          level?: number
          experience?: number
          str?: number
          dex?: number
          con?: number
          int?: number
          wis?: number
          cha?: number
          hp?: number
          max_hp?: number
          ac?: number
          speed?: number
          background_story?: string | null
          equipment?: Json | null
          metadata?: Json | null
          burned?: boolean
          infection_status?: string
          staking_status?: string
          image_url?: string
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tweets: {
        Row: {
          id: string
          author_id: string
          content: string
          media_urls: string[]
          created_at: string
          stored_at: string
        }
        Insert: {
          id: string
          author_id: string
          content: string
          media_urls?: string[]
          created_at: string
          stored_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          media_urls?: string[]
          created_at?: string
          stored_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
