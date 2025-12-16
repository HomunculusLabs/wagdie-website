// Balances Service
// Handles ERC1155 token balance queries

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, TokenBalance, ContractError } from '@/types/blockchain'
import { concordABI } from '@/lib/contracts/abis/concord'
import { corpseABI } from '@/lib/contracts/abis/corpse'
import { mushroomABI } from '@/lib/contracts/abis/mushroom'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { TOKEN_IDS } from '@/lib/contracts/addresses'

export type TokenType = 'concord' | 'corpse' | 'mushroom'

export class BalancesService extends BaseBlockchainService {
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
   * Get balance of a specific ERC1155 token
   */
  async getTokenBalance(
    tokenType: TokenType,
    address: Address
  ): Promise<{ data?: TokenBalance; error?: ContractError }> {
    const { contractAddress, abi, tokenId } = this.getTokenConfig(tokenType)

    const result = await this.readContract(async () => {
      const balance = (await this.publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'balanceOf',
        args: [address, tokenId],
      })) as bigint

      return {
        tokenId,
        balance,
        contractAddress,
        tokenType: 'ERC1155',
      } as TokenBalance
    }, `getTokenBalance-${tokenType}`)

    return result
  }

  /**
   * Get balances of all token types for an address
   */
  async getAllBalances(
    address: Address
  ): Promise<{ data?: Record<TokenType, TokenBalance>; error?: ContractError }> {
    const tokenTypes: TokenType[] = ['concord', 'corpse', 'mushroom']

    const contracts = tokenTypes.map((tokenType) => {
      const { contractAddress, abi, tokenId } = this.getTokenConfig(tokenType)
      return {
        address: contractAddress,
        abi,
        functionName: 'balanceOf' as const,
        args: [address, tokenId] as const,
      }
    })

    const result = await this.multicall<bigint[]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const balances: Record<TokenType, TokenBalance> = {} as any

    tokenTypes.forEach((tokenType, index) => {
      const { contractAddress, tokenId } = this.getTokenConfig(tokenType)
      balances[tokenType] = {
        tokenId,
        balance: result.data![index],
        contractAddress,
        tokenType: 'ERC1155',
      }
    })

    return { data: balances }
  }

  /**
   * Get balances for multiple addresses
   */
  async getMultipleBalances(
    tokenType: TokenType,
    addresses: Address[]
  ): Promise<{ data?: TokenBalance[]; error?: ContractError }> {
    const { contractAddress, abi, tokenId } = this.getTokenConfig(tokenType)

    const contracts = addresses.map((address) => ({
      address: contractAddress,
      abi,
      functionName: 'balanceOf' as const,
      args: [address, tokenId] as const,
    }))

    const result = await this.multicall<bigint[]>(contracts)

    if (result.error) {
      return { error: result.error }
    }

    const balances: TokenBalance[] = addresses.map((address, index) => ({
      tokenId,
      balance: result.data![index],
      contractAddress,
      tokenType: 'ERC1155',
    }))

    return { data: balances }
  }

  /**
   * Check if operator is approved to transfer tokens
   */
  async isApprovedForAll(
    tokenType: TokenType,
    owner: Address,
    operator: Address
  ): Promise<{ data?: boolean; error?: ContractError }> {
    const { contractAddress, abi } = this.getTokenConfig(tokenType)

    const result = await this.readContract(async () => {
      const approved = (await this.publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'isApprovedForAll',
        args: [owner, operator],
      })) as boolean

      return approved
    }, `isApprovedForAll-${tokenType}`)

    return result
  }

  /**
   * Get token configuration by type
   */
  private getTokenConfig(tokenType: TokenType): {
    contractAddress: Address
    abi: any
    tokenId: bigint
  } {
    switch (tokenType) {
      case 'concord':
        return {
          contractAddress: this.contractAddresses.tokensOfConcord,
          abi: concordABI,
          tokenId: TOKEN_IDS.concord,
        }
      case 'corpse':
        return {
          contractAddress: this.contractAddresses.corpse,
          abi: corpseABI,
          tokenId: TOKEN_IDS.corpse,
        }
      case 'mushroom':
        return {
          contractAddress: this.contractAddresses.mushroom,
          abi: mushroomABI,
          tokenId: TOKEN_IDS.mushroom,
        }
    }
  }

  /**
   * Get contract address by token type
   */
  getContractAddress(tokenType: TokenType): Address {
    return this.getTokenConfig(tokenType).contractAddress
  }

  /**
   * Get token ID by token type
   */
  getTokenId(tokenType: TokenType): bigint {
    return this.getTokenConfig(tokenType).tokenId
  }
}
