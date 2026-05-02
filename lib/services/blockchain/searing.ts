// Searing Service
// Handles character searing and taming operations

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError, ContractErrorType } from '@/types/blockchain'
import { SearConcordsParams, SearWagdieABIParams, TameBeastsParams } from '@/types/contracts'
import { searingABI } from '@/lib/contracts/abis/searing'
import { concordABI } from '@/lib/contracts/abis/concord'
import { wagdieABI } from '@/lib/contracts/abis/wagdie'
import { getContractAddresses } from '@/lib/contracts/addresses'
import type { Abi } from 'viem'

export interface SearingStatus {
  isSeared: boolean
  searedConcordId: number | null
  isBlocked: boolean
  isSearingEnabled: boolean
  isTamingEnabled: boolean
}

export interface SearingApprovalStatus {
  isWagdieApproved: boolean
  isConcordApproved: boolean
  isFullyApproved: boolean
}

export interface SearingApprovalHashes {
  wagdie?: `0x${string}`
  concord?: `0x${string}`
}

export interface SearingApprovalOptions {
  waitForConfirmation?: boolean
  onApprovalTransaction?: (target: 'wagdie' | 'concord', hash: `0x${string}`) => void | Promise<void>
}

export interface SearingConcordBalance {
  concordId: number
  tokenId: bigint
  balance: bigint
  isOwned: boolean
  contractAddress: Address
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
   * Get the Concord token ID currently seared onto a WAGDIE.
   * The legacy ABI returns uint16 here (0 means not seared), not bool.
   */
  async getWagdieSearedConcordId(
    wagdieId: number
  ): Promise<{ data?: number; error?: ContractError }> {
    return this.readContract(async () => {
      const searedConcordId = await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'isWagdieSeared',
        args: [wagdieId],
      })

      return this.toNumber(searedConcordId)
    }, 'getWagdieSearedConcordId')
  }

  /**
   * Check if a WAGDIE is seared. Preserves the historical boolean helper.
   */
  async isWagdieSeared(
    wagdieId: number
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const result = await this.getWagdieSearedConcordId(wagdieId)

    if (result.error) {
      return { error: result.error }
    }

    return { data: (result.data ?? 0) > 0 }
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
   * Check if a Concord token ID is blocked from searing
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

    const result = await this.multicall<[number | bigint, boolean, boolean, boolean]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const [rawSearedConcordId, isBlocked, isSearingEnabled, isTamingEnabled] = result.data!
    const searedConcordId = this.toNumber(rawSearedConcordId)

    return {
      data: {
        isSeared: searedConcordId > 0,
        searedConcordId: searedConcordId > 0 ? searedConcordId : null,
        isBlocked,
        isSearingEnabled,
        isTamingEnabled,
      },
    }
  }

  /**
   * Check whether both WAGDIE (ERC721) and Concord (ERC1155) are approved for searing.
   */
  async getApprovalStatus(
    owner: Address
  ): Promise<{ data?: SearingApprovalStatus; error?: ContractError }> {
    const contracts = [
      {
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'isApprovedForAll' as const,
        args: [owner, this.contractAddresses.searing] as const,
      },
      {
        address: this.contractAddresses.tokensOfConcord,
        abi: concordABI,
        functionName: 'isApprovedForAll' as const,
        args: [owner, this.contractAddresses.searing] as const,
      },
    ]

    const result = await this.multicall<[boolean, boolean]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const [isWagdieApproved, isConcordApproved] = result.data!

    return {
      data: {
        isWagdieApproved,
        isConcordApproved,
        isFullyApproved: isWagdieApproved && isConcordApproved,
      },
    }
  }

  /**
   * Backward-compatible approval helper. Now returns full WAGDIE + Concord approval.
   */
  async isApprovedForAll(
    owner: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const result = await this.getApprovalStatus(owner)

    if (result.error) {
      return { error: result.error }
    }

    return { data: result.data?.isFullyApproved ?? false }
  }

  async isWagdieApprovedForSearing(
    owner: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'isApprovedForAll',
        args: [owner, this.contractAddresses.searing],
      })) as boolean

      return approved
    }, 'isWagdieApprovedForSearing')
  }

  async isConcordApprovedForSearing(
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
    }, 'isConcordApprovedForSearing')
  }

  /**
   * Approve WAGDIE ERC721 for searing.
   */
  async approveWagdieForSearing(owner: Address): Promise<{
    hash?: `0x${string}`
    error?: ContractError
  }> {
    if (!this.walletClient) {
      return this.walletNotInitialized()
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.wagdie,
        abi: wagdieABI,
        functionName: 'setApprovalForAll',
        args: [this.contractAddresses.searing, true],
        account: owner,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'approveWagdieForSearing')
  }

  /**
   * Approve Tokens of Concord ERC1155 for searing.
   */
  async approveConcordForSearing(owner: Address): Promise<{
    hash?: `0x${string}`
    error?: ContractError
  }> {
    if (!this.walletClient) {
      return this.walletNotInitialized()
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
    }, 'approveConcordForSearing')
  }

  /**
   * Sequentially approve WAGDIE first, then Concord, matching the legacy flow.
   */
  async approveForSearing(
    owner: Address,
    options: SearingApprovalOptions = {}
  ): Promise<{
    hash?: `0x${string}`
    hashes?: SearingApprovalHashes
    error?: ContractError
  }> {
    const hashes: SearingApprovalHashes = {}

    const approvalStatus = await this.getApprovalStatus(owner)
    if (approvalStatus.error) {
      return { error: approvalStatus.error, hashes }
    }

    if (!approvalStatus.data?.isWagdieApproved) {
      const wagdieResult = await this.approveWagdieForSearing(owner)
      if (wagdieResult.error) {
        return { error: wagdieResult.error, hashes }
      }
      hashes.wagdie = wagdieResult.hash

      if (wagdieResult.hash) {
        await options.onApprovalTransaction?.('wagdie', wagdieResult.hash)
      }

      if (wagdieResult.hash && options.waitForConfirmation) {
        const receipt = await this.waitForTransaction(wagdieResult.hash)
        if (receipt.error) {
          return { error: receipt.error, hashes }
        }
      }
    }

    if (!approvalStatus.data?.isConcordApproved) {
      const concordResult = await this.approveConcordForSearing(owner)
      if (concordResult.error) {
        return { error: concordResult.error, hashes }
      }
      hashes.concord = concordResult.hash

      if (concordResult.hash) {
        await options.onApprovalTransaction?.('concord', concordResult.hash)
      }

      if (concordResult.hash && options.waitForConfirmation) {
        const receipt = await this.waitForTransaction(concordResult.hash)
        if (receipt.error) {
          return { error: receipt.error, hashes }
        }
      }
    }

    return {
      hash: hashes.concord ?? hashes.wagdie,
      hashes,
    }
  }

  /**
   * Read a specific Concord ERC1155 token balance for searable token IDs.
   */
  async getConcordBalance(
    owner: Address,
    concordId: number
  ): Promise<{ data?: SearingConcordBalance; error?: ContractError }> {
    return this.readContract(async () => {
      const tokenId = BigInt(concordId)
      const balance = (await this.publicClient.readContract({
        address: this.contractAddresses.tokensOfConcord,
        abi: concordABI,
        functionName: 'balanceOf',
        args: [owner, tokenId],
      })) as bigint

      return {
        concordId,
        tokenId,
        balance,
        isOwned: balance > 0n,
        contractAddress: this.contractAddresses.tokensOfConcord,
      }
    }, 'getConcordBalance')
  }

  /**
   * Batch read arbitrary Concord ERC1155 balances for searable token IDs.
   */
  async getConcordBalances(
    owner: Address,
    concordIds: number[]
  ): Promise<{ data?: SearingConcordBalance[]; error?: ContractError }> {
    if (concordIds.length === 0) {
      return { data: [] }
    }

    return this.readContract(async () => {
      const tokenIds = concordIds.map((concordId) => BigInt(concordId))
      const owners = concordIds.map(() => owner)
      const balances = (await this.publicClient.readContract({
        address: this.contractAddresses.tokensOfConcord,
        abi: concordABI,
        functionName: 'balanceOfBatch',
        args: [owners, tokenIds],
      })) as readonly bigint[]

      return concordIds.map((concordId, index) => ({
        concordId,
        tokenId: tokenIds[index],
        balance: balances[index] ?? 0n,
        isOwned: (balances[index] ?? 0n) > 0n,
        contractAddress: this.contractAddresses.tokensOfConcord,
      }))
    }, 'getConcordBalances')
  }

  /**
   * Sear Concords (burn Concords to transform WAGDIE)
   */
  async searConcords(
    params: SearConcordsParams[],
    account: Address
  ): Promise<{ hash?: `0x${string}`; error?: ContractError }> {
    if (!this.walletClient) {
      return this.walletNotInitialized()
    }

    const abiParams = this.toSearWagdieABIParams(params)
    if ('error' in abiParams) {
      return { error: abiParams.error }
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.searing,
        abi: searingABI as Abi,
        functionName: 'searConcords',
        args: [abiParams.data],
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
      return this.walletNotInitialized()
    }

    const abiParams = this.toSearWagdieABIParams(params)
    if ('error' in abiParams) {
      return { error: abiParams.error }
    }

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.searing,
        abi: searingABI as Abi,
        functionName: 'tameBeasts',
        args: [abiParams.data],
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
      const maxId = await this.publicClient.readContract({
        address: this.contractAddresses.searing,
        abi: searingABI,
        functionName: 'maxBeastId',
      })

      return this.toNumber(maxId)
    }, 'getMaxBeastId')
  }

  private toSearWagdieABIParams(
    params: Array<SearConcordsParams | TameBeastsParams>
  ): { data: SearWagdieABIParams[] } | { error: ContractError } {
    for (const param of params) {
      if (!this.isUint16(param.wagdieId) || !this.isUint16(param.concordId)) {
        return {
          error: {
            type: ContractErrorType.INVALID_PARAMS,
            message: 'WAGDIE and Concord IDs must be integers between 0 and 65535',
          },
        }
      }
    }

    return {
      data: params.map(({ wagdieId, concordId }) => ({
        wagdieId,
        tokenId: concordId,
      })),
    }
  }

  private isUint16(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= 65535
  }

  private toNumber(value: unknown): number {
    return typeof value === 'bigint' ? Number(value) : Number(value)
  }

  private walletNotInitialized(): { error: ContractError } {
    return {
      error: {
        type: ContractErrorType.UNKNOWN,
        message: 'Wallet client not initialized',
      },
    }
  }
}
