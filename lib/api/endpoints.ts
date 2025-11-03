/**
 * API Endpoints
 * Type-safe API endpoint definitions and client methods
 */

import { apiClient } from './client'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord } from '@/types/character'
import type { Tweet, TweetFilters, TweetsResponse } from '@/types/tweet'
import type { UserSession } from '@/types/wallet'

/**
 * Character API endpoints
 */
export const characterApi = {
  /**
   * Get characters with filters
   */
  getCharacters: (filters: CharacterFilters) =>
    apiClient.get<CharactersResponse>('/characters', {
      params: {
        tab: filters.tab,
        sort: filters.sort,
        page: filters.page,
        perPage: filters.perPage,
        wallet: filters.wallet,
      },
    }),

  /**
   * Get single character by token ID
   */
  getCharacter: (tokenId: number) =>
    apiClient.get<Character>(`/characters/${tokenId}`),

  /**
   * Update character
   */
  updateCharacter: (tokenId: number, updates: Partial<Pick<Character, 'background_story' | 'equipment'>>) =>
    apiClient.patch<Character>(`/characters/${tokenId}`, updates),

  /**
   * Get character concords
   */
  getCharacterConcords: (tokenId: number) =>
    apiClient.get<Array<CharacterConcord & { concord: Concord }>>(`/characters/${tokenId}/concords`),
}

/**
 * Tweet API endpoints
 */
export const tweetApi = {
  /**
   * Get tweets with filters
   */
  getTweets: (filters: TweetFilters) =>
    apiClient.get<TweetsResponse>('/tweets', {
      params: {
        tab: filters.tab,
        sort: filters.sort,
        perPage: filters.perPage,
        startAt: filters.startAt,
      },
    }),
}

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Get nonce for SIWE
   */
  getNonce: (address: string) =>
    apiClient.post<{ nonce: string }>('/auth/nonce', { address }),

  /**
   * Verify SIWE signature
   */
  verify: (params: { address: string; signature: string; message: string }) =>
    apiClient.post<{ success: boolean }>('/auth/verify', params),

  /**
   * Get current session
   */
  getSession: () =>
    apiClient.get<UserSession>('/auth/me'),

  /**
   * Logout
   */
  logout: () =>
    apiClient.post<{ success: boolean }>('/auth/logout'),
}

/**
 * Export all API endpoints
 */
export const api = {
  characters: characterApi,
  tweets: tweetApi,
  auth: authApi,
}
