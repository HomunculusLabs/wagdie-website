// Base Blockchain Service
// Core functionality for blockchain interactions

import { Address, ContractError } from '@/types/blockchain'
import { parseContractError } from '@/lib/contracts/error-parser'
import { logError } from '@/lib/utils/errors'
import { PublicClient, WalletClient, TransactionReceipt } from 'viem'

export interface BaseServiceConfig {
  publicClient: PublicClient
  walletClient?: WalletClient
}

export abstract class BaseBlockchainService {
  protected publicClient: PublicClient
  protected walletClient?: WalletClient

  constructor(config: BaseServiceConfig) {
    this.publicClient = config.publicClient
    this.walletClient = config.walletClient
  }

  /**
   * Execute a read-only contract call with error handling
   */
  protected async readContract<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: ContractError }> {
    try {
      const data = await fn()
      return { data }
    } catch (error) {
      const parsedError = parseContractError(error)
      logError(error, context)
      return { error: parsedError }
    }
  }

  /**
   * Execute a write contract call with error handling
   */
  protected async writeContract(
    fn: () => Promise<`0x${string}`>,
    context?: string
  ): Promise<{ hash?: `0x${string}`; error?: ContractError }> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized')
      }

      const hash = await fn()
      return { hash }
    } catch (error) {
      const parsedError = parseContractError(error)
      logError(error, context)
      return { error: parsedError }
    }
  }

  /**
   * Wait for transaction confirmation
   */
  protected async waitForTransaction(
    hash: `0x${string}`,
    confirmations = 1
  ): Promise<{ receipt?: TransactionReceipt; error?: ContractError }> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      })
      return { receipt }
    } catch (error) {
      const parsedError = parseContractError(error)
      logError(error, 'waitForTransaction')
      return { error: parsedError }
    }
  }

  /**
   * Get current chain ID
   */
  protected async getChainId(): Promise<number> {
    return this.publicClient.getChainId()
  }

  /**
   * Get current block number
   */
  protected async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber()
  }

  /**
   * Check if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  /**
   * Batch multiple read calls using multicall
   */
  protected async multicall<T extends readonly unknown[]>(
    contracts: readonly {
      address: Address
      abi: readonly unknown[]
      functionName: string
      args?: readonly unknown[]
    }[]
  ): Promise<{ data?: T; error?: ContractError }> {
    try {
      const results = await this.publicClient.multicall({
        contracts: contracts as Parameters<typeof this.publicClient.multicall>[0]['contracts'],
      })

      const data = results.map((result) => {
        if (result.status === 'failure') {
          throw result.error
        }
        return result.result
      }) as unknown as T

      return { data }
    } catch (error) {
      const parsedError = parseContractError(error)
      logError(error, 'multicall')
      return { error: parsedError }
    }
  }
}
