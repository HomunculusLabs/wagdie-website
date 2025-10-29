// Contract Error Parser
// Parses contract errors and converts them to user-friendly messages

import { ContractError, ContractErrorType } from '@/types/blockchain'
import {
  isUserRejectedError,
  isInsufficientFundsError,
  isNetworkError,
  getUserFriendlyErrorMessage,
} from '@/lib/utils/errors'
import { BaseError, ContractFunctionRevertedError } from 'viem'

export function parseContractError(error: unknown): ContractError {
  // User rejected transaction
  if (isUserRejectedError(error)) {
    return {
      type: ContractErrorType.USER_REJECTED,
      message: getUserFriendlyErrorMessage(error),
      originalError: error instanceof Error ? error : undefined,
    }
  }

  // Insufficient funds
  if (isInsufficientFundsError(error)) {
    return {
      type: ContractErrorType.INSUFFICIENT_FUNDS,
      message: getUserFriendlyErrorMessage(error),
      originalError: error instanceof Error ? error : undefined,
    }
  }

  // Network error
  if (isNetworkError(error)) {
    return {
      type: ContractErrorType.NETWORK_ERROR,
      message: getUserFriendlyErrorMessage(error),
      originalError: error instanceof Error ? error : undefined,
    }
  }

  // Parse viem BaseError
  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError)

    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? ''
      const errorMessage = parseRevertReason(errorName)

      return {
        type: ContractErrorType.CONTRACT_ERROR,
        message: errorMessage,
        originalError: error,
      }
    }

    return {
      type: ContractErrorType.CONTRACT_ERROR,
      message: getUserFriendlyErrorMessage(error),
      originalError: error,
    }
  }

  // Invalid parameters
  if (error instanceof Error && error.message.includes('invalid')) {
    return {
      type: ContractErrorType.INVALID_PARAMS,
      message: 'Invalid parameters provided. Please check your input and try again.',
      originalError: error,
    }
  }

  // Unknown error
  return {
    type: ContractErrorType.UNKNOWN,
    message: getUserFriendlyErrorMessage(error),
    originalError: error instanceof Error ? error : undefined,
  }
}

function parseRevertReason(errorName: string): string {
  const errorMap: Record<string, string> = {
    // Common ERC721/ERC1155 errors
    'ERC721: transfer caller is not owner nor approved':
      'You are not authorized to transfer this NFT.',
    'ERC721: transfer of token that is not own': 'You do not own this NFT.',
    'ERC721: operator query for nonexistent token': 'This NFT does not exist.',
    'ERC1155: insufficient balance for transfer': 'Insufficient token balance.',
    'ERC1155: caller is not token owner or approved':
      'You are not authorized to transfer these tokens.',

    // WAGDIE-specific errors
    'NFT is locked': 'This NFT is locked and cannot be transferred.',
    'Already seared': 'This WAGDIE has already been seared.',
    'Already staked': 'This WAGDIE is already staked.',
    'Not staked': 'This WAGDIE is not currently staked.',
    'Not owner': 'You do not own this NFT.',
    'Blocked': 'This NFT is blocked from this operation.',
    'Searing not enabled': 'Searing is currently disabled.',
    'Taming not enabled': 'Taming is currently disabled.',
    'Staking not enabled': 'Staking is currently disabled.',
    'Invalid location': 'Invalid location ID.',
    'Location does not exist': 'This location does not exist.',

    // Generic fallback
    default: 'Transaction failed. Please try again.',
  }

  return errorMap[errorName] || errorMap.default
}

export function getErrorTypeIcon(type: ContractErrorType): string {
  switch (type) {
    case ContractErrorType.USER_REJECTED:
      return '🚫'
    case ContractErrorType.INSUFFICIENT_FUNDS:
      return '💰'
    case ContractErrorType.NETWORK_ERROR:
      return '🌐'
    case ContractErrorType.CONTRACT_ERROR:
      return '⚠️'
    case ContractErrorType.INVALID_PARAMS:
      return '❌'
    default:
      return '⚠️'
  }
}

export function shouldRetryError(type: ContractErrorType): boolean {
  return type === ContractErrorType.NETWORK_ERROR
}
