/**
 * Ownership Sync Service
 * Syncs NFT ownership from blockchain to database
 */

import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { OwnershipService } from '../blockchain/ownership'
import { characterRepository } from '@/lib/repositories/character-repository'
import type { SyncResult, OwnershipChange } from '@/types/sync'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SyncServiceConfig {
  chunkSize?: number
  delayMs?: number
  supabaseClient?: SupabaseClient
}

export class OwnershipSyncService {
  private ownershipService: OwnershipService
  private config: Required<Omit<SyncServiceConfig, 'supabaseClient'>> & { supabaseClient?: SupabaseClient }

  constructor(config: SyncServiceConfig = {}) {
    // Create a server-side public client for blockchain queries
    const rpcUrl =
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl, {
        batch: true,
        retryCount: 3,
      }),
    })

    this.ownershipService = new OwnershipService({ publicClient })
    this.config = {
      chunkSize: config.chunkSize ?? 100,
      delayMs: config.delayMs ?? 100,
      supabaseClient: config.supabaseClient,
    }
  }

  /**
   * Run a full ownership sync for all tokens in the database
   */
  async runFullSync(): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // 1. Get all token IDs from database
      const tokenIds = await characterRepository.getAllTokenIds()

      if (tokenIds.length === 0) {
        return {
          success: true,
          tokensProcessed: 0,
          tokensUpdated: 0,
          tokensFailed: 0,
          duration: Date.now() - startTime,
          errors: [],
          timestamp: new Date().toISOString(),
        }
      }

      // 2. Get current ownership state from database
      const dbOwnership = await characterRepository.getCurrentOwnership()

      // 3. Fetch blockchain ownership for all tokens
      const tokenIdsBigInt = tokenIds.map((id) => BigInt(id))
      const blockchainResult = await this.ownershipService.getOwnersForTokenIds(tokenIdsBigInt, {
        chunkSize: this.config.chunkSize,
        delayMs: this.config.delayMs,
      })

      if (blockchainResult.error) {
        return {
          success: false,
          tokensProcessed: 0,
          tokensUpdated: 0,
          tokensFailed: tokenIds.length,
          duration: Date.now() - startTime,
          errors: [blockchainResult.error.message],
          timestamp: new Date().toISOString(),
        }
      }

      const blockchainOwnership = blockchainResult.data!

      // 4. Calculate changes
      const changes = this.calculateChanges(dbOwnership, blockchainOwnership)

      if (changes.length === 0) {
        return {
          success: true,
          tokensProcessed: tokenIds.length,
          tokensUpdated: 0,
          tokensFailed: 0,
          duration: Date.now() - startTime,
          errors: [],
          timestamp: new Date().toISOString(),
        }
      }

      // 5. Apply changes to database
      const updates = changes.map((change) => ({
        tokenId: change.tokenId,
        ownerAddress: change.newOwner,
      }))

      const updateResult = await characterRepository.bulkUpdateOwnership(
        updates,
        this.config.supabaseClient
      )

      errors.push(...updateResult.errors.map((e) => e.message))

      return {
        success: updateResult.failed === 0,
        tokensProcessed: tokenIds.length,
        tokensUpdated: updateResult.updated,
        tokensFailed: updateResult.failed,
        duration: Date.now() - startTime,
        errors,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        tokensProcessed: 0,
        tokensUpdated: 0,
        tokensFailed: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Calculate ownership changes between database and blockchain state
   */
  private calculateChanges(
    dbOwnership: Map<number, string | null>,
    blockchainOwnership: Map<bigint, string | null>
  ): OwnershipChange[] {
    const changes: OwnershipChange[] = []

    for (const [tokenIdBigInt, blockchainOwner] of blockchainOwnership) {
      const tokenId = Number(tokenIdBigInt)
      const dbOwner = dbOwnership.get(tokenId)

      // Normalize for comparison (lowercase)
      const normalizedDbOwner = dbOwner?.toLowerCase() || null
      const normalizedBlockchainOwner = blockchainOwner?.toLowerCase() || null

      // Check if ownership has changed
      if (normalizedDbOwner !== normalizedBlockchainOwner) {
        changes.push({
          tokenId,
          previousOwner: normalizedDbOwner,
          newOwner: normalizedBlockchainOwner,
        })
      }
    }

    return changes
  }
}
