// Spread Service
// Handles infection spreading mechanics

import { BaseBlockchainService, BaseServiceConfig } from './base'
import { Address, ContractError } from '@/types/blockchain'
import { spreadABI } from '@/lib/contracts/abis/spread'
import { getContractAddresses } from '@/lib/contracts/addresses'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { parseEther } from 'viem'

export class SpreadService extends BaseBlockchainService {
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
   * Get current infection price in ETH
   */
  async getInfectionPrice(): Promise<{ data?: bigint; error?: ContractError }> {
    return this.readContract(async () => {
      const price = (await this.publicClient.readContract({
        address: this.contractAddresses.spread,
        abi: spreadABI,
        functionName: 'infectionPrice',
      })) as bigint

      return price
    }, 'getInfectionPrice')
  }

  /**
   * Get Concord contract address from Spread contract
   */
  async getConcordAddress(): Promise<{ data?: Address; error?: ContractError }> {
    return this.readContract(async () => {
      const address = (await this.publicClient.readContract({
        address: this.contractAddresses.spread,
        abi: spreadABI,
        functionName: 'concordAddress',
      })) as Address

      return address
    }, 'getConcordAddress')
  }

  /**
   * Get WAGDIE contract address from Spread contract
   */
  async getWagdieAddress(): Promise<{ data?: Address; error?: ContractError }> {
    return this.readContract(async () => {
      const address = (await this.publicClient.readContract({
        address: this.contractAddresses.spread,
        abi: spreadABI,
        functionName: 'WAGDIE',
      })) as Address

      return address
    }, 'getWagdieAddress')
  }

  /**
   * Infect a specific WAGDIE
   */
  async infectWagdie(
    tokenId: bigint,
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

    // Get infection price
    const priceResult = await this.getInfectionPrice()
    if (priceResult.error) {
      return { error: priceResult.error }
    }

    const price = priceResult.data!

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.spread,
        abi: spreadABI,
        functionName: 'infectWagdie',
        args: [tokenId],
        account,
        value: price,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'infectWagdie')
  }

  /**
   * Spread infections (random infection)
   */
  async spreadInfections(
    quantity: bigint,
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

    // Get infection price and calculate total cost
    const priceResult = await this.getInfectionPrice()
    if (priceResult.error) {
      return { error: priceResult.error }
    }

    const price = priceResult.data!
    const totalCost = price * quantity

    return this.writeContract(async () => {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddresses.spread,
        abi: spreadABI,
        functionName: 'spreadInfections',
        args: [quantity],
        account,
        value: totalCost,
      })

      const hash = await this.walletClient!.writeContract(request)
      return hash
    }, 'spreadInfections')
  }

  /**
   * Get user's ETH balance
   */
  async getEthBalance(address: Address): Promise<{ data?: bigint; error?: ContractError }> {
    return this.readContract(async () => {
      const balance = await this.publicClient.getBalance({ address })
      return balance
    }, 'getEthBalance')
  }

  /**
   * Calculate total cost for spreading infections
   */
  async calculateTotalCost(
    quantity: bigint
  ): Promise<{ data?: bigint; error?: ContractError }> {
    const priceResult = await this.getInfectionPrice()
    if (priceResult.error) {
      return { error: priceResult.error }
    }

    return {
      data: priceResult.data! * quantity,
    }
  }
}
