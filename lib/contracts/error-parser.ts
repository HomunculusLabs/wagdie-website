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
      const errorName = revertError.data?.errorName
      const reason =
        (revertError as { reason?: string }).reason ??
        (error as { reason?: string }).reason
      const shortMessage =
        (revertError as { shortMessage?: string }).shortMessage ??
        (error as { shortMessage?: string }).shortMessage
      const fallback = [reason, shortMessage].find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )

      if (process.env.NODE_ENV === 'development') {
        console.error('[parseContractError] ContractFunctionRevertedError:', {
          errorName,
          reason,
          shortMessage,
          data: revertError.data,
          message: revertError.message,
          details: (revertError as { details?: unknown }).details,
          cause: (revertError as { cause?: unknown }).cause,
        })
      }

      const errorMessage = parseRevertReason(errorName || fallback || '')

      return {
        type: ContractErrorType.CONTRACT_ERROR,
        message: errorMessage,
        originalError: error,
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[parseContractError] BaseError:', {
        name: error.name,
        message: error.message,
        shortMessage: (error as { shortMessage?: string }).shortMessage,
        details: (error as { details?: unknown }).details,
        cause: (error as { cause?: unknown }).cause,
      })
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

function normalizeErrorKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function parseRevertReason(errorName: string): string {
  const defaultMessage = 'Request failed. Please try again.'
  const errorMap: Record<string, string> = {
    // Common ERC721/ERC1155 errors
    [normalizeErrorKey('ERC721: transfer caller is not owner nor approved')]:
      'You are not authorized to transfer this NFT.',
    [normalizeErrorKey('ERC721: transfer of token that is not own')]:
      'You do not own this NFT.',
    [normalizeErrorKey('ERC721: operator query for nonexistent token')]:
      'This NFT does not exist.',
    [normalizeErrorKey('ERC1155: insufficient balance for transfer')]:
      'Insufficient token balance.',
    [normalizeErrorKey('ERC1155: caller is not token owner or approved')]:
      'You are not authorized to transfer these tokens.',

    // WAGDIE-specific errors
    [normalizeErrorKey('NFT is locked')]:
      'This NFT is locked and cannot be transferred.',
    [normalizeErrorKey('NFTLocked')]:
      'This NFT is locked and cannot be transferred.',
    [normalizeErrorKey('Already seared')]:
      'This WAGDIE has already been seared.',
    [normalizeErrorKey('AlreadySeared')]:
      'This WAGDIE has already been seared.',
    [normalizeErrorKey('Already staked')]:
      'This WAGDIE is already staked.',
    [normalizeErrorKey('AlreadyStaked')]:
      'This WAGDIE is already staked.',
    [normalizeErrorKey('Not staked')]:
      'This WAGDIE is not currently staked.',
    [normalizeErrorKey('NotStaked')]:
      'This WAGDIE is not currently staked.',
    [normalizeErrorKey('Not owner')]:
      'You do not own this NFT.',
    [normalizeErrorKey('NotOwner')]:
      'You do not own this NFT.',
    [normalizeErrorKey('Blocked')]:
      'This NFT is blocked from this operation.',
    [normalizeErrorKey('Searing not enabled')]:
      'Searing is currently disabled.',
    [normalizeErrorKey('SearingNotEnabled')]:
      'Searing is currently disabled.',
    [normalizeErrorKey('Taming not enabled')]:
      'Taming is currently disabled.',
    [normalizeErrorKey('TamingNotEnabled')]:
      'Taming is currently disabled.',
    [normalizeErrorKey('Staking not enabled')]:
      'Staking is currently disabled.',
    [normalizeErrorKey('StakingNotEnabled')]:
      'Staking is currently disabled.',
    [normalizeErrorKey('Invalid location')]:
      'Invalid location ID.',
    [normalizeErrorKey('InvalidLocation')]:
      'Invalid location ID.',
    [normalizeErrorKey('Location does not exist')]:
      'This location does not exist.',
    [normalizeErrorKey('LocationDoesNotExist')]:
      'This location does not exist.',
  }

  if (!errorName || errorName.trim().length === 0) {
    return defaultMessage
  }

  const cleaned = errorName
    .replace(/^execution reverted:?/i, '')
    .replace(/^reverted:?/i, '')
    .trim()

  const key = normalizeErrorKey(cleaned)
  return errorMap[key] || (cleaned.length > 0 ? cleaned : defaultMessage)
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
