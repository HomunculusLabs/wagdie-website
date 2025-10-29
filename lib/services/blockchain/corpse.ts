// Corpse Service
// Handles corpse token burning mechanics

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError } from '@/types/blockchain'
import { corpseABI } from '@/lib/contracts/abis/corpse'
import { mushroomABI } from '@/lib/contracts/abis/mushroom'
import { getContractAddresses, TOKEN_IDS } from '@/lib/contracts/addresses'

export class CorpseService extends BaseBlockchainService {
  private contractAddresses: ReturnType<typeof getContractAddresses>

  constructor(config: BaseServiceConfig) {
    super(config)
    this.contractAddresses = getContractAddresses(1)
  }

  async initialize(): Promise<void> {
    const chainId = await this.getChainId()
    this.contractAddresses = getContractAddresses(chainId)
  }

  /**
   * Get corpse token balance
   */
  async getCorpseBalance(
    owner: Address
  ): Promise<{ data?: bigint; error?: ContractError }> {
    return this.readContract(async () => {
      const balance = (await this.publicClient.readContract({
        address: this.contractAddresses.corpse,
        abi: corpseABI,
        functionName: 'balanceOf',
        args: [owner, TOKEN_IDS.corpse],
      })) as bigint

      return balance
    }, 'getCorpseBalance')
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
   * Check if corpse contract is approved for mushroom minting
   */
  async isCorpseApproved(
    owner: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.corpse,
        abi: corpseABI,
        functionName: 'isApprovedForAll',
        args: [owner, this.contractAddresses.mushroom],
      })) as boolean

      return approved
    }, 'isCorpseApproved')
  }

  /**
   * Approve corpse tokens for mushroom contract
   */
  async approveCorpseForBurning(
    owner: Address
  ): Promise<{ hash?: `0x${string}`; error?: ContractError }> {
    if (!this.walletClient) {
      return {
        error: {
          type: 'unknown' as any,
          message: 'Wallet client not initialized',
        },
      }
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.corpse,
        abi: corpseABI,
        functionName: 'setApprovalForAll',
        args: [this.contractAddresses.mushroom, true],
        account: owner,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'approveCorpseForBurning')
  }

  /**
   * Burn corpse tokens to mint mushrooms (1:1 ratio)
   */
  async burnCorpse(
    amount: bigint,
    account: Address
  ): Promise<{ hash?: `0x${string}`; error?: ContractError }> {
    if (!this.walletClient) {
      return {
        error: {
          type: 'unknown' as any,
          message: 'Wallet client not initialized',
        },
      }
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.corpse,
        abi: corpseABI,
        functionName: 'burn',
        args: [account, TOKEN_IDS.corpse, amount],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'burnCorpse')
  }

  /**
   * Check if mushroom minting is enabled
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
   * Get both corpse and mushroom balances
   */
  async getBothBalances(owner: Address): Promise<{
    data?: { corpse: bigint; mushroom: bigint }
    error?: ContractError
  }> {
    const contracts = [
      {
        address: this.contractAddresses.corpse,
        abi: corpseABI,
        functionName: 'balanceOf' as const,
        args: [owner, TOKEN_IDS.corpse] as const,
      },
      {
        address: this.contractAddresses.mushroom,
        abi: mushroomABI,
        functionName: 'balanceOf' as const,
        args: [owner, TOKEN_IDS.mushroom] as const,
      },
    ]

    const result = await this.multicall<[bigint, bigint]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const [corpse, mushroom] = result.data!

    return {
      data: {
        corpse,
        mushroom,
      },
    }
  }
}
