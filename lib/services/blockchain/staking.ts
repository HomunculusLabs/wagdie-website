// Staking Service
// Handles character staking in WagdieWorld

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError, ContractErrorType, StakingStatus, LocationInfo } from '@/types/blockchain'
import {
  StakeWagdiesParams,
  UnstakeWagdiesParams,
  ChangeWagdieLocationParams,
} from '@/types/contracts'
import { wagdieWorldABI } from '@/lib/contracts/abis/wagdie-world'
import { wagdieABI } from '@/lib/contracts/abis/wagdie'
import { getContractAddresses } from '@/lib/contracts/addresses'

export class StakingService extends BaseBlockchainService {
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
   * Check if staking is enabled globally
   */
  async isStakingEnabled(): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      const enabled = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'isStakingEnabled',
      })) as boolean

      return enabled
    }, 'isStakingEnabled')
  }

  /**
   * Get staking status for a WAGDIE
   */
  async getStakingStatus(wagdieId: number): Promise<{
    data?: StakingStatus
    error?: ContractError
  }> {
    return this.readContract(async () => {
      const info = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'wagdieIdToInfo',
        args: [wagdieId],
      })) as { locationIdCur: bigint; owner: Address; emptySpace: number }

      const locationId = info.locationIdCur
      const isStaked = locationId > 0n

      // If staked, get location info
      let locationInfo: LocationInfo | undefined

      if (isStaked) {
        const locResult = await this.getLocationInfo(locationId)
        if (locResult.data) {
          locationInfo = locResult.data
        }
      }

      return {
        tokenId: BigInt(wagdieId),
        isStaked,
        locationId: isStaked ? locationId : undefined,
        locationName: locationInfo?.name,
        locationOwner: locationInfo?.owner,
        nftsLocked: locationInfo?.nftsLocked,
      } as StakingStatus
    }, 'getStakingStatus')
  }

  async getStakedLocations(
    wagdieIds: number[]
  ): Promise<{ data?: Map<number, bigint>; error?: ContractError }> {
    if (wagdieIds.length === 0) {
      return { data: new Map<number, bigint>() }
    }

    const contracts = wagdieIds.map((wagdieId) => ({
      address: this.contractAddresses.wagdieWorld,
      abi: wagdieWorldABI,
      functionName: 'wagdieIdToInfo' as const,
      args: [wagdieId] as const,
    }))

    const result = await this.multicall<
      { locationIdCur: bigint; owner: Address; emptySpace: number }[]
    >(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const locations = new Map<number, bigint>()
    const infos = result.data ?? []

    wagdieIds.forEach((wagdieId, index) => {
      const info = infos[index]
      locations.set(wagdieId, info?.locationIdCur ?? 0n)
    })

    return { data: locations }
  }

  /**
   * Get location information
   */
  async getLocationInfo(locationId: bigint): Promise<{
    data?: LocationInfo
    error?: ContractError
  }> {
    return this.readContract(async () => {
      const info = (await this.publicClient.readContract({
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'locationIdToInfo',
        args: [locationId],
      })) as {
        name: string
        locationOwner: Address
        xCoordinate: number
        yCoordinate: number
        isLocationActive: boolean
        areNftsLocked: boolean
      }

      return {
        locationId,
        name: info.name,
        owner: info.locationOwner,
        nftsLocked: info.areNftsLocked,
        exists: info.isLocationActive,
      } as LocationInfo
    }, 'getLocationInfo')
  }

  /**
   * Check if WAGDIE is approved for staking
   */
  async isApprovedForStaking(
    owner: Address,
    tokenId?: bigint
  ): Promise<{ data?: boolean; error?: ContractError }> {
    return this.readContract(async () => {
      if (tokenId) {
        // Check specific token approval
        const approved = (await this.publicClient.readContract({
          address: this.contractAddresses.wagdie,
          abi: wagdieABI,
          functionName: 'getApproved',
          args: [tokenId],
        })) as Address

        return (
          approved.toLowerCase() === this.contractAddresses.wagdieWorld.toLowerCase()
        )
      } else {
        // Check operator approval
        const approved = (await this.publicClient.readContract({
          address: this.contractAddresses.wagdie,
          abi: wagdieABI,
          functionName: 'isApprovedForAll',
          args: [owner, this.contractAddresses.wagdieWorld],
        })) as boolean

        return approved
      }
    }, 'isApprovedForStaking')
  }

  /**
   * Approve WAGDIE for staking
   */
  async approveForStaking(
    owner: Address,
    tokenId?: bigint
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
      if (tokenId) {
        // Approve specific token
        const { request } = await this.publicClient.simulateContract({
          address: this.contractAddresses.wagdie,
          abi: wagdieABI,
          functionName: 'approve',
          args: [this.contractAddresses.wagdieWorld, tokenId],
          account: owner,
        })

        const hash = await this.walletClient!.writeContract(request)
        return hash
      } else {
        // Approve all tokens (operator)
        const { request } = await this.publicClient.simulateContract({
          address: this.contractAddresses.wagdie,
          abi: wagdieABI,
          functionName: 'setApprovalForAll',
          args: [this.contractAddresses.wagdieWorld, true],
          account: owner,
        })

        const hash = await this.walletClient!.writeContract(request)
        return hash
      }
    }, 'approveForStaking')
  }

  /**
   * Stake WAGDIEs to a location
   */
  async stakeWagdies(
    params: StakeWagdiesParams[],
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
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'stakeWagdies',
        args: [params as readonly { wagdieId: number; locationId: bigint }[]],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'stakeWagdies')
  }

  /**
   * Unstake WAGDIEs
   */
  async unstakeWagdies(
    params: UnstakeWagdiesParams[],
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
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'unstakeWagdies',
        args: [params as readonly { wagdieId: number }[]],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'unstakeWagdies')
  }

  /**
   * Change WAGDIE location
   */
  async changeWagdieLocations(
    params: ChangeWagdieLocationParams[],
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
        address: this.contractAddresses.wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'changeWagdieLocations',
        args: [params as readonly { wagdieId: number; locationId: bigint }[]],
        account,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'changeWagdieLocations')
  }
}
