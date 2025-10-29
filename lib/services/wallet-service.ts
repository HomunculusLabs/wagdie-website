/**
 * Wallet Service
 * Business logic for blockchain interactions (wagmi integration)
 *
 * Note: This service provides typed wrappers around wagmi hooks for:
 * - Burning corpses for mushrooms (ERC1155)
 * - Spreading infections (random)
 * - Infecting specific characters (targeted)
 * - Curing characters
 * - Searing concords (burning for permanent effects)
 */

import type { Address } from '@/types/wallet'

// Contract addresses (TODO: Move to environment variables)
export const CONTRACTS = {
  CORPSE: '0x0000000000000000000000000000000000000000' as Address, // ERC1155 corpse token
  SHROOM: '0x0000000000000000000000000000000000000000' as Address, // Mushroom/concord contract
  SPREAD: '0x0000000000000000000000000000000000000000' as Address, // Infection spread contract
  WAGDIE: '0x0000000000000000000000000000000000000000' as Address, // Main WAGDIE NFT contract
}

// These are skeleton functions that will be implemented with wagmi hooks in components
// They're documented here for reference

/**
 * Burn corpse tokens to receive Strange Mushroom concords
 *
 * @param amount - Number of corpses to burn
 * @returns Transaction hash
 *
 * Implementation: Use wagmi useContractWrite with SHROOM contract
 * ABI function: burnCorpse(uint256 amount)
 */
export type BurnCorpsesFunction = (amount: number) => Promise<string>

/**
 * Spread infections randomly using mushroom tokens
 *
 * @param mushroomCount - Number of mushrooms to use
 * @returns Transaction hash
 *
 * Implementation: Use wagmi useContractWrite with SPREAD contract
 * ABI function: spreadInfections(uint256 count)
 */
export type SpreadInfectionsFunction = (mushroomCount: number) => Promise<string>

/**
 * Infect a specific WAGDIE character (requires 0.0025 ETH + mushroom)
 *
 * @param tokenId - Target character token ID (1-6666)
 * @returns Transaction hash
 *
 * Implementation: Use wagmi useContractWrite with SPREAD contract
 * ABI function: infectWagdie(uint256 tokenId) payable
 * Value: 0.0025 ETH
 */
export type InfectWagdieFunction = (tokenId: number) => Promise<string>

/**
 * Cure an infected character
 *
 * @param tokenId - Character token ID to cure
 * @returns Transaction hash
 *
 * Implementation: Use wagmi useContractWrite with WAGDIE contract
 * ABI function: cure(uint256 tokenId)
 */
export type CureCharacterFunction = (tokenId: number) => Promise<string>

/**
 * Sear (burn) a concord for permanent effects
 *
 * @param tokenId - Character token ID
 * @param concordId - Concord ID to sear
 * @returns Transaction hash
 *
 * Implementation: Use wagmi useContractWrite with SHROOM contract
 * ABI function: searConcord(uint256 tokenId, uint256 concordId)
 */
export type SearConcordFunction = (tokenId: number, concordId: number) => Promise<string>

/**
 * Read-only functions for contract state
 */

/**
 * Get corpse balance for an address
 *
 * Implementation: Use wagmi useContractRead with CORPSE contract (ERC1155)
 * ABI function: balanceOf(address account, uint256 id)
 * ID: 1 (corpse token)
 */
export type GetCorpseBalanceFunction = (address: Address) => Promise<bigint>

/**
 * Get mushroom balance for a character
 *
 * Implementation: Query character_concords table for concord_id = 15
 */
export type GetMushroomBalanceFunction = (tokenId: number) => Promise<number>

/**
 * Get infection price (ETH required to infect)
 *
 * Implementation: Use wagmi useContractRead with SPREAD contract
 * ABI function: infectionPrice() returns (uint256)
 */
export type GetInfectionPriceFunction = () => Promise<bigint>

// Export type helpers for components
export type WalletServiceHooks = {
  burnCorpses: BurnCorpsesFunction
  spreadInfections: SpreadInfectionsFunction
  infectWagdie: InfectWagdieFunction
  cureCharacter: CureCharacterFunction
  searConcord: SearConcordFunction
  getCorpseBalance: GetCorpseBalanceFunction
  getMushroomBalance: GetMushroomBalanceFunction
  getInfectionPrice: GetInfectionPriceFunction
}
