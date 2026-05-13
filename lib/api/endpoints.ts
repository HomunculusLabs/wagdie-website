/**
 * API Endpoints
 * Type-safe API endpoint definitions and client methods
 */

import { apiClient } from './client'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord, OriginsResponse, AlignmentsResponse, TraitCountsResponse } from '@/types/character'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Tweet, TweetFilters, TweetsResponse } from '@/types/tweet'
import type { UserSession } from '@/types/wallet'

/**
 * Character API endpoints
 */
export const characterApi = {
  /**
   * Get characters with filters
   */
  getCharacters: async (params: CharacterFilters): Promise<CharactersResponse> => {
    const searchParams = new URLSearchParams()
    searchParams.set('tab', params.tab)
    searchParams.set('sort', params.sort)
    searchParams.set('page', params.page.toString())
    searchParams.set('perPage', params.perPage.toString())
    if (params.wallet) searchParams.set('wallet', params.wallet)
    if (params.search) searchParams.set('search', params.search)
    // Trait filters
    if (params.hasSheet) searchParams.set('hasSheet', 'true')
    if (params.hasElizaProfile) searchParams.set('hasElizaProfile', 'true')
    if (params.origin) searchParams.set('origin', params.origin)
    if (params.alignment) searchParams.set('alignment', params.alignment)
    if (params.the17) searchParams.set('the17', params.the17)
    // Equipment filters
    if (params.armor) searchParams.set('armor', params.armor)
    if (params.back) searchParams.set('back', params.back)
    if (params.mask) searchParams.set('mask', params.mask)

    const url = `/api/characters?${searchParams}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch characters')
    }

    return response.json() as Promise<CharactersResponse>
  },

  /**
   * Get available origins with counts
   */
  getOrigins: async (): Promise<OriginsResponse> => {
    const response = await fetch('/api/characters/origins')
    if (!response.ok) {
      throw new Error('Failed to fetch origins')
    }
    return response.json()
  },

  /**
   * Get available alignments with counts
   */
  getAlignments: async (): Promise<AlignmentsResponse> => {
    const response = await fetch('/api/characters/alignments')
    if (!response.ok) {
      throw new Error('Failed to fetch alignments')
    }
    return response.json()
  },

  /**
   * Get trait counts for a specific trait type (e.g., Armor, Back, Mask)
   */
  getTraitCounts: async (traitType: string): Promise<TraitCountsResponse> => {
    const response = await fetch(`/api/characters/traits/${encodeURIComponent(traitType)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${traitType} trait counts`)
    }
    return response.json()
  },

  /**
   * Get single character by token ID
   */
  getCharacter: (tokenId: number) =>
    apiClient.get<Character>(`/api/characters/${tokenId}`),

  /**
   * Update character
   */
  updateCharacter: (tokenId: number, updates: Partial<Pick<Character, 'background_story' | 'equipment'>>) =>
    apiClient.patch<Character>(`/api/characters/${tokenId}`, updates),

  /**
   * Get character concords
   */
  getCharacterConcords: (tokenId: number) =>
    apiClient.get<Array<CharacterConcord & { concord: Concord }>>(`/api/characters/${tokenId}/concords`),
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
    apiClient.post<{ nonce: string }>('/api/auth/nonce', { address }),

  /**
   * Verify SIWE signature
   */
  verify: (params: { address: string; signature: string; message: string }) =>
    apiClient.post<{ success: boolean }>('/api/auth/verify', params),

  /**
   * Get current session
   */
  getSession: () =>
    apiClient.get<UserSession>('/api/auth/me'),

  /**
   * Logout
   */
  logout: () =>
    apiClient.post<{ success: boolean }>('/api/auth/logout'),
}

/**
 * Export all API endpoints
 */
export const api = {
  characters: characterApi,
  tweets: tweetApi,
  auth: authApi,
}
