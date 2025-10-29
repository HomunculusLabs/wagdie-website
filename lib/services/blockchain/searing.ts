// Searing Service
// Handles character searing and taming operations

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError } from '@/types/blockchain'
import { SearConcordsParams, TameBeastsParams } from '@/types/contracts'
import { searingABI } from '@/lib/contracts/abis/searing'
import { concordABI } from '@/lib/contracts/abis/concord'
import { getContractAddresses } from '@/lib/contracts/addresses'

export interface SearingStatus {
  isSeared: boolean
  isBlocked: boolean
  isSearingEnabled: boolean
  isTamingEnabled: boolean
}

export class SearingService extends BaseBlockchainService {
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
   * Check if searing is enabled globally
   */
  async isSearingEnabled(): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const enabled = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isSearingEnabled',
      })) as boolean

      return enabled
    }, 'isSearingEnabled')
  }

  /**
   * Check if taming is enabled globally
   */
  async isTamingEnabled(): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const enabled = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isTamingEnabled',
      })) as boolean

      return enabled
    }, 'isTamingEnabled')
  }

  /**
   * Check if a WAGDIE is seared
   */
  async isWagdieSeared(
    wagdieId: number
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const seared = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isWagdieSeared',
        args: [wagdieId],
      })) as boolean

      return seared
    }, 'isWagdieSeared')
  }

  /**
   * Check if a WAGDIE is blocked from searing
   */
  async isWagdieBlocked(
    wagdieId: number
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const blocked = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isWagdieBlocked',
        args: [wagdieId],
      })) as boolean

      return blocked
    }, 'isWagdieBlocked')
  }

  /**
   * Check if a Concord is blocked from searing
   */
  async isConcordBlocked(
    concordId: number
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const blocked = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isConcordBlocked',
        args: [concordId],
      })) as boolean

      return blocked
    }, 'isConcordBlocked')
  }

  /**
   * Get comprehensive searing status for a WAGDIE
   */
  async getSearingStatus(
    wagdieId: number
  ): Promise<{ data?: SearingStatus; error?: ContractError }> {
    const contracts = [
      {
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isWagdieSeared' as const,
        args: [wagdieId] as const,
      },
      {
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isWagdieBlocked' as const,
        args: [wagdieId] as const,
      },
      {
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isSearingEnabled' as const,
        args: [] as const,
      },
      {
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isTamingEnabled' as const,
        args: [] as const,
      },
    ]

    const result = await this.multicall<[boolean, boolean, boolean, boolean]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const [isSeared, isBlocked, isSearingEnabled, isTamingEnabled] = result.data!

    return {
      data: {
        isSeared,
        isBlocked,
        isSearingEnabled,
        isTamingEnabled,
      },
    }
  }

  /**
   * Check if Tokens of Concord contract is approved
   */
  async isApprovedForAll(
    owner: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.tokensOfConcord,
        abi: concordABI,
        functionName: 'isApprovedForAll',
        args: [owner, this.contractAddresses.searing],
      })) as boolean

      return approved
    }, 'isApprovedForAll')
  }

  /**
   * Approve Tokens of Concord for searing
   */
  async approveForSearing(owner: Address): Promise<{
    hash?: `0x${string}`
    error?: ContractError
  }> {
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
        address: this.contractAddresses.tokensOfConcord,
        abi: concordABI,
        functionName: 'setApprovalForAll',
        args: [this.contractAddresses.searing, true],
        account: owner,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'approveForSearing')
  }

  /**
   * Sear Concords (burn Concords to transform WAGDIE)
   */
  async searConcords(
    params: SearConcordsParams[],
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
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'searConcords',
        args: [params],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'searConcords')
  }

  /**
   * Tame Beasts (alternative searing mechanic)
   */
  async tameBeasts(
    params: TameBeastsParams[],
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
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'tameBeasts',
        args: [params],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'tameBeasts')
  }

  /**
   * Get max beast ID for taming
   */
  async getMaxBeastId(): Promise<{ data?: number; error?: ContractError }> {
    return this.readContract(async () => {
      const maxId = (await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'maxBeastId',
      })) as number

      return maxId
    }, 'getMaxBeastId')
  }
}
