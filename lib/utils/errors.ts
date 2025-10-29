// Error Utilities
// Utilities for error handling and user-friendly error messages

import { ContractError, ContractErrorType } from '@/types/blockchain'

export class BlockchainError extends Error {
  public type: ContractErrorType
  public originalError?: Error

  constructor(type: ContractErrorType, message: string, originalError?: Error) {
    super(message)
    this.name = 'BlockchainError'
    this.type = type
    this.originalError = originalError
  }
}

export function createContractError(
  type: ContractErrorType,
  message: string,
  originalError?: Error
): ContractError {
  return {
    type,
    message,
    originalError,
  }
}

export function isUserRejectedError(error: unknown): boolean {
  const errorMessage = getErrorMessage(error)
  return (
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('rejected the request') ||
    errorMessage.includes('cancelled by user')
  )
}

export function isInsufficientFundsError(error: unknown): boolean {
  const errorMessage = getErrorMessage(error)
  return (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('insufficient balance') ||
    errorMessage.includes('exceeds balance')
  )
}

export function isNetworkError(error: unknown): boolean {
  const errorMessage = getErrorMessage(error)
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch failed')
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase()
  }
  if (typeof error === 'string') {
    return error.toLowerCase()
  }
  return 'an unknown error occurred'
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isUserRejectedError(error)) {
    return 'Transaction was cancelled. Please try again if you want to proceed.'
  }

  if (isInsufficientFundsError(error)) {
    return 'Insufficient funds to complete this transaction. Please check your wallet balance.'
  }

  if (isNetworkError(error)) {
    return 'Network error occurred. Please check your connection and try again.'
  }

  const errorMessage = getErrorMessage(error)

  // Contract-specific errors
  if (errorMessage.includes('nft is locked')) {
    return 'This NFT is locked in a location. Please unstake it first.'
  }

  if (errorMessage.includes('not approved')) {
    return 'Contract approval required. Please approve the contract to proceed.'
  }

  if (errorMessage.includes('already seared')) {
    return 'This WAGDIE has already been seared.'
  }

  if (errorMessage.includes('already staked')) {
    return 'This WAGDIE is already staked.'
  }

  if (errorMessage.includes('not staked')) {
    return 'This WAGDIE is not currently staked.'
  }

  if (errorMessage.includes('not owner')) {
    return 'You do not own this NFT.'
  }

  if (errorMessage.includes('blocked')) {
    return 'This NFT is blocked from this operation.'
  }

  // Generic fallback
  return 'Transaction failed. Please try again or contact support if the issue persists.'
}

export function logError(error: unknown, context?: string): void {
  const errorMessage = getErrorMessage(error)
  const contextStr = context ? `[${context}] ` : ''

  if (process.env.NODE_ENV === 'development') {
    console.error(`${contextStr}Error:`, error)
  } else {
    // In production, you might want to send to an error tracking service
    console.error(`${contextStr}${errorMessage}`)
  }
}
