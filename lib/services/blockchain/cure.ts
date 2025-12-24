// Cure Service
// Handles curing infected characters by burning mushroom tokens

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError, ContractErrorType } from '@/types/blockchain'
import { mushroomABI } from '@/lib/contracts/abis/mushroom'
import { getContractAddresses, TOKEN_IDS } from '@/lib/contracts/addresses'

export interface CureStatus {
  canCure: boolean
  hasEnoughMushrooms: boolean
  mushroomBalance: bigint
  mushroomsRequired: bigint
  isMintingEnabled: boolean
}

export class CureService extends BaseBlockchainService {
  private contractAddresses: ReturnType<typeof getContractAddresses>
  private readonly MUSHROOMS_PER_CURE = 1n // Number of mushrooms required per cure

  constructor(config: BaseServiceConfig) {
    super(config)
    this.contractAddresses = getContractAddresses(1)
  }

  async initialize(): Promise<void> {
    const chainId = await this.getChainId()
    this.contractAddresses = getContractAddresses(chainId)
  }

  /**
   * Get mushroom token balance
   */
  async getMushroomBalance(
    owner: Address
  ): Promise<{ data?: bigint; error?: ContractError }> {
    return this.readContract(async () => {
      const balance = (await this.publicClient.readContract({
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'balanceOf',
        args: [owner, TOKEN_IDS.mushroom],
      })) as bigint

      return balance
    }, 'getMushroomBalance')
  }

  /**
   * Check if mushroom minting/burning is enabled
   */
  async isMushroomMintingEnabled(): Promise<{
    data?: boolean
    error?: ContractError
  }> {
    return this.readContract(async () => {
      const enabled = (await this.publicClient.readContract({
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'isMintingEnabled',
      })) as boolean

      return enabled
    }, 'isMushroomMintingEnabled')
  }

  /**
   * Get cure status for a user
   */
  async getCureStatus(owner: Address): Promise<{
    data?: CureStatus
    error?: ContractError
  }> {
    const contracts = [
      {
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'balanceOf' as const,
        args: [owner, TOKEN_IDS.mushroom] as const,
      },
      {
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'isMintingEnabled' as const,
        args: [] as const,
      },
    ]

    const result = await this.multicall<[bigint, boolean]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const [mushroomBalance, isMintingEnabled] = result.data!
    const hasEnoughMushrooms = mushroomBalance >= this.MUSHROOMS_PER_CURE

    return {
      data: {
        canCure: hasEnoughMushrooms && isMintingEnabled,
        hasEnoughMushrooms,
        mushroomBalance,
        mushroomsRequired: this.MUSHROOMS_PER_CURE,
        isMintingEnabled,
      },
    }
  }

  /**
   * Check if mushroom contract is approved for burning
   */
  async isMushroomApproved(
    owner: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      // For burning own tokens, approval is typically not required
      // But we check if the contract has operator approval
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'isApprovedForAll',
        args: [owner, this.contractAddresses.mushroom],
      })) as boolean

      return approved
    }, 'isMushroomApproved')
  }

  /**
   * Burn mushroom tokens to cure a character
   * Note: This burns mushrooms. The actual cure logic (updating infection status)
   * would typically be handled by a separate contract or off-chain.
   */
  async burnMushroomsForCure(
    amount: bigint,
    account: Address
  ): Promise<{ hash?: `0x${string}`; error?: ContractError }> {
    if (!this.walletClient) {
      return {
        error: {
          type: ContractErrorType.UNKNOWN,
          message: 'Wallet client not initialized',
        },
      }
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'burn',
        args: [amount],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'burnMushroomsForCure')
  }

  /**
   * Get the required mushrooms for curing N characters
   */
  getRequiredMushrooms(characterCount: number): bigint {
    return this.MUSHROOMS_PER_CURE * BigInt(characterCount)
  }

  /**
   * Check if user can cure N characters
   */
  async canCureCharacters(
    owner: Address,
    characterCount: number
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const statusResult = await this.getCureStatus(owner)

    if (statusResult.error) {
      return { error: statusResult.error }
    }

    const status = statusResult.data!
    const required = this.getRequiredMushrooms(characterCount)

    return {
      data: status.mushroomBalance >= required && status.isMintingEnabled,
    }
  }
}
