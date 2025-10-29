// Ownership Service
// Handles NFT ownership verification

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, CharacterOwnership, ContractError } from '@/types/blockchain'
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
}
