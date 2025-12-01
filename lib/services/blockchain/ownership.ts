// Ownership Service
// Handles NFT ownership verification

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, CharacterOwnership, ContractError, ContractErrorType } from '@/types/blockchain'
import { wagdieABI } from '@/lib/contracts/abis/wagdie'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { normalizeAddress, validateTokenId } from '@/lib/utils/blockchain'

export class OwnershipService extends BaseBlockchainService {
  private contractAddresses: ReturnType<typeof getContractAddresses>

  constructor(config: BaseServiceConfig) {
    super(config)
    // Initialize with mainnet addresses by default
    this.contractAddresses = getContractAddresses(1)
  }

  /**
   * Initialize service with correct chain
   */
  async initialize(): Promise<void> {
    const chainId = await this.getChainId()
    this.contractAddresses = getContractAddresses(chainId)
  }

  /**
   * Check if address owns a specific WAGDIE token
   */
  async checkOwnership(
    tokenId: bigint,
    address: Address
  ): Promise<{ data?: CharacterOwnership; error?: ContractError }> {
    if (!validateTokenId(tokenId)) {
      return {
        error: {
          type: 'invalid_params' as any,
          message: 'Invalid token ID',
        },
      }
    }

    const result = await this.readContract(async () => {
      const owner = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'ownerOf',
        args: [tokenId],
      })) as Address

      return {
        tokenId,
        owner: normalizeAddress(owner),
        isOwned: normalizeAddress(owner).toLowerCase() === normalizeAddress(address).toLowerCase(),
        contractAddress: this.contractAddresses.wagdie,
      } as CharacterOwnership
    }, 'checkOwnership')

    return result
  }

  /**
   * Get owner of a WAGDIE token
   */
  async getOwner(tokenId: bigint): Promise<{ data?: Address; error?: ContractError }> {
    if (!validateTokenId(tokenId)) {
      return {
        error: {
          type: 'invalid_params' as any,
          message: 'Invalid token ID',
        },
      }
    }

    const result = await this.readContract(async () => {
      const owner = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'ownerOf',
        args: [tokenId],
      })) as Address

      return normalizeAddress(owner)
    }, 'getOwner')

    return result
  }

  /**
   * Get balance of WAGDIE tokens for an address
   */
  async getBalance(address: Address): Promise<{ data?: bigint; error?: ContractError }> {
    const result = await this.readContract(async () => {
      const balance = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'balanceOf',
        args: [address],
      })) as bigint

      return balance
    }, 'getBalance')

    return result
  }

  /**
   * Check if address owns multiple WAGDIE tokens
   */
  async checkMultipleOwnership(
    tokenIds: bigint[],
    address: Address
  ): Promise<{ data?: CharacterOwnership[]; error?: ContractError }> {
    const contracts = tokenIds.map((tokenId) => ({
      address: this.contractAddresses.wagdie,
      abi: wagdieABI,
      functionName: 'ownerOf' as const,
      args: [tokenId] as const,
    }))

    const result = await this.multicall<Address[]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const ownerships: CharacterOwnership[] = tokenIds.map((tokenId, index) => ({
      tokenId,
      owner: normalizeAddress(result.data![index]),
      isOwned:
        normalizeAddress(result.data![index]).toLowerCase() ===
        normalizeAddress(address).toLowerCase(),
      contractAddress: this.contractAddresses.wagdie,
    }))

    return { data: ownerships }
  }

  /**
   * Check if operator is approved for a specific token
   */
  async isApproved(
    tokenId: bigint,
    operator: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const result = await this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'getApproved',
        args: [tokenId],
      })) as Address

      return (
        normalizeAddress(approved).toLowerCase() === normalizeAddress(operator).toLowerCase()
      )
    }, 'isApproved')

    return result
  }

  /**
   * Check if operator is approved for all tokens of an owner
   */
  async isApprovedForAll(
    owner: Address,
    operator: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const result = await this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'isApprovedForAll',
        args: [owner, operator],
      })) as boolean

      return approved
    }, 'isApprovedForAll')

    return result
  }

  /**
   * Get owners for multiple token IDs in batches using multicall
   * Returns a map of tokenId -> owner address
   * Tokens that fail to fetch (e.g., burned) will have null as owner
   */
  async getOwnersForTokenIds(
    tokenIds: bigint[],
    options: { chunkSize?: number; delayMs?: number } = {}
  ): Promise<{ data?: Map<bigint, Address | null>; error?: ContractError }> {
    const { chunkSize = 100, delayMs = 100 } = options
    const ownerMap = new Map<bigint, Address | null>()

    try {
      // Process in chunks to avoid rate limiting
      for (let i = 0; i < tokenIds.length; i += chunkSize) {
        const chunk = tokenIds.slice(i, i + chunkSize)

        const contracts = chunk.map((tokenId) => ({
          address: this.contractAddresses.wagdie,
          abi: wagdieABI,
          functionName: 'ownerOf' as const,
          args: [tokenId] as const,
        }))

        const results = await this.publicClient.multicall({
          contracts,
          allowFailure: true, // Allow individual failures (e.g., burned tokens)
        })

        // Process results
        for (let j = 0; j < chunk.length; j++) {
          const tokenId = chunk[j]
          const result = results[j]

          if (result.status === 'success') {
            ownerMap.set(tokenId, normalizeAddress(result.result as Address))
          } else {
            // Token may be burned or invalid
            ownerMap.set(tokenId, null)
          }
        }

        // Add delay between chunks to avoid rate limiting
        if (i + chunkSize < tokenIds.length && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }

      return { data: ownerMap }
    } catch (error) {
      const parsedError: ContractError = {
        type: ContractErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : String(error),
      }
      return { error: parsedError }
    }
  }

  /**
   * Get total supply of WAGDIE tokens
   */
  async getTotalSupply(): Promise<{ data?: bigint; error?: ContractError }> {
    const result = await this.readContract(async () => {
      const supply = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'totalSupply',
        args: [],
      })) as bigint

      return supply
    }, 'getTotalSupply')

    return result
  }
}
