/**
 * Chat entity types
 * Real-time location-based chat using Firebase
 */

export interface ChatMessage {
  message_id: string
  sender_token_id: number
  sender_name: string
  sender_class: string
  sender_level: number
  text: string
  timestamp: number
  location_id: string
}

export type PresenceStatus = 'online' | 'away' | 'offline'

export interface UserPresence {
  token_id: number
  status: PresenceStatus
  location_id: string | null
  last_active: number
}

export interface Location {
  location_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface OnlineUser {
  token_id: number
  name: string
  class: string
  level: number
  status: PresenceStatus
  location_id: string
}
