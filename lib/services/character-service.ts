/**
 * Character Service
 * Domain layer - Business logic for character CRUD operations, filtering, and queries
 * Uses repository layer for data access (dependency injection)
 */

import { characterRepository, type ICharacterRepository } from '../repositories'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord } from '@/types/character'

/**
 * Character Service
 * Encapsulates business rules and orchestrates data access
 */
export class CharacterService {
  constructor(private repository: ICharacterRepository) {}

  /**
   * Get characters with filtering, pagination, and sorting
   */
  async getCharacters(filters: CharacterFilters): Promise<CharactersResponse> {
    return this.repository.findMany(filters)
  }

  /**
   * Get a single character by token ID
   */
  async getCharacter(tokenId: number): Promise<Character | null> {
    return this.repository.findById(tokenId)
  }

  /**
   * Update character data (background story, equipment)
   * Business rule: Ownership validation should be done at API route level
   */
  async updateCharacter(
    tokenId: number,
    updates: Partial<Pick<Character, 'background_story' | 'equipment'>>
  ): Promise<Character | null> {
    // Additional business logic can be added here (validation, transformation, etc.)
    return this.repository.update(tokenId, updates)
  }

  /**
   * Get concords owned by a character
   */
  async getCharacterConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>> {
    return this.repository.findConcords(tokenId)
  }

  /**
   * Check if a wallet owns a specific character
   */
  async isOwner(tokenId: number, walletAddress: string): Promise<boolean> {
    const character = await this.getCharacter(tokenId)
    if (!character) return false
    return character.owner_address.toLowerCase() === walletAddress.toLowerCase()
  }
}

// Export singleton instance
export const characterService = new CharacterService(characterRepository)

// Export individual functions for backward compatibility
export const getCharacters = (filters: CharacterFilters) => characterService.getCharacters(filters)
export const getCharacter = (tokenId: number) => characterService.getCharacter(tokenId)
export const updateCharacter = (tokenId: number, updates: Partial<Pick<Character, 'background_story' | 'equipment'>>) =>
  characterService.updateCharacter(tokenId, updates)
export const getCharacterConcords = (tokenId: number) => characterService.getCharacterConcords(tokenId)
