// Blockchain Validation Utilities
// Utilities for validating blockchain data and addresses

import { Address } from '@/types/blockchain'
import { isAddress, getAddress } from 'viem'

export function validateAddress(address: string): boolean {
  return isAddress(address)
}

export function normalizeAddress(address: string): Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }
  return getAddress(address) as Address
}

export function compareAddresses(address1: string, address2: string): boolean {
  try {
    return normalizeAddress(address1).toLowerCase() === normalizeAddress(address2).toLowerCase()
  } catch {
    return false
  }
}

export function validateTokenId(tokenId: bigint | number | string): boolean {
  try {
    const id = BigInt(tokenId)
    return id >= 0n
  } catch {
    return false
  }
}

export function normalizeTokenId(tokenId: bigint | number | string): bigint {
  const id = BigInt(tokenId)
  if (id < 0n) {
    throw new Error(`Invalid token ID: ${tokenId}`)
  }
  return id
}

export function validateTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

export function shortenAddress(address: string, chars = 4): string {
  if (!validateAddress(address)) {
    return address
  }
  const normalized = normalizeAddress(address)
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`
}

export function shortenTransactionHash(hash: string, chars = 6): string {
  if (!validateTransactionHash(hash)) {
    return hash
  }
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
}

export function formatTokenBalance(balance: bigint, decimals = 18, displayDecimals = 4): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = balance / divisor
  const fractionalPart = balance % divisor

  if (fractionalPart === 0n) {
    return integerPart.toString()
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmedFractional = fractionalStr.slice(0, displayDecimals).replace(/0+$/, '')

  if (trimmedFractional === '') {
    return integerPart.toString()
  }

  return `${integerPart}.${trimmedFractional}`
}

export function parseTokenAmount(amount: string, decimals = 18): bigint {
  const [integerPart, fractionalPart = ''] = amount.split('.')
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
  const combined = integerPart + paddedFractional
  return BigInt(combined)
}

export function isValidChainId(chainId: number): boolean {
  // Mainnet = 1, Sepolia = 11155111
  return chainId === 1 || chainId === 11155111
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet'
    case 11155111:
      return 'Sepolia Testnet'
    default:
      return `Unknown Chain (${chainId})`
  }
}

export function getExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'https://etherscan.io'
    case 11155111:
      return 'https://sepolia.etherscan.io'
    default:
      return 'https://etherscan.io'
  }
}

export function getTransactionUrl(chainId: number, txHash: string): string {
  const explorerUrl = getExplorerUrl(chainId)
  return `${explorerUrl}/tx/${txHash}`
}

export function getAddressUrl(chainId: number, address: string): string {
  const explorerUrl = getExplorerUrl(chainId)
  return `${explorerUrl}/address/${address}`
}

export function getTokenUrl(chainId: number, tokenAddress: string, tokenId?: bigint): string {
  const explorerUrl = getExplorerUrl(chainId)
  if (tokenId !== undefined) {
    return `${explorerUrl}/token/${tokenAddress}?a=${tokenId}`
  }
  return `${explorerUrl}/token/${tokenAddress}`
}

// Pagination helper
export function paginateArray<T>(array: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize
  return array.slice(startIndex, startIndex + pageSize)
}

// Delay helper for polling
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Retry helper with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, i)
        await delay(delayMs)
      }
    }
  }

  throw lastError
}
