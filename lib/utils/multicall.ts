// Multi-call Utilities
// Utilities for batching multiple contract reads into a single call

import { Address } from '@/types/blockchain'
import { PublicClient } from 'viem'

export interface MultiCallRequest {
  address: Address
  abi: readonly unknown[]
  functionName: string
  args?: readonly unknown[]
}

export interface MultiCallResult<T = unknown> {
  success: boolean
  data?: T
  error?: Error
}

/**
 * Execute multiple contract reads in a single call
 */
export async function executeMulticall<T extends readonly unknown[]>(
  publicClient: PublicClient,
  contracts: readonly MultiCallRequest[]
): Promise<MultiCallResult<T>[]> {
  try {
    const results = await publicClient.multicall({
      contracts: contracts as Parameters<typeof publicClient.multicall>[0]['contracts'],
    })

    return results.map((result) => {
      if (result.status === 'success') {
        return {
          success: true as const,
          data: result.result as T,
        }
      } else {
        return {
          success: false as const,
          error: result.error,
        }
      }
    }) as MultiCallResult<T>[]
  } catch (error) {
    // If the entire multicall fails, return error for all requests
    return contracts.map(() => ({
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }))
  }
}

/**
 * Batch contract reads by chunking them
 */
export async function batchMulticall<T extends readonly unknown[]>(
  publicClient: PublicClient,
  contracts: readonly MultiCallRequest[],
  chunkSize = 50
): Promise<MultiCallResult<T>[]> {
  const results: MultiCallResult<T>[] = []

  for (let i = 0; i < contracts.length; i += chunkSize) {
    const chunk = contracts.slice(i, i + chunkSize)
    const chunkResults = await executeMulticall<T>(publicClient, chunk)
    results.push(...chunkResults)
  }

  return results
}

/**
 * Create a multi-call request
 */
export function createMultiCallRequest(
  address: Address,
  abi: readonly unknown[],
  functionName: string,
  args?: readonly unknown[]
): MultiCallRequest {
  return {
    address,
    abi,
    functionName,
    args,
  }
}

/**
 * Filter successful results from multi-call
 */
export function getSuccessfulResults<T>(results: MultiCallResult<T>[]): T[] {
  return results.filter((r) => r.success && r.data !== undefined).map((r) => r.data!)
}

/**
 * Get failed results from multi-call
 */
export function getFailedResults<T>(results: MultiCallResult<T>[]): Error[] {
  return results.filter((r) => !r.success && r.error !== undefined).map((r) => r.error!)
}

/**
 * Check if all results succeeded
 */
export function allSucceeded<T>(results: MultiCallResult<T>[]): boolean {
  return results.every((r) => r.success)
}

/**
 * Check if any results succeeded
 */
export function anySucceeded<T>(results: MultiCallResult<T>[]): boolean {
  return results.some((r) => r.success)
}

/**
 * Combine multiple ABIs for multi-call
 */
export function combineAbis(...abis: readonly unknown[][]): readonly unknown[] {
  return abis.flat()
}
