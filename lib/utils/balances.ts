// Balance Display Utilities
// Utilities for formatting and displaying token balances

import { TokenBalance } from '@/types/blockchain'
import { formatTokenBalance } from './blockchain'

export interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  icon: string
  color: string
}

export const TOKEN_INFO: Record<'concord' | 'corpse' | 'mushroom', TokenInfo> = {
  concord: {
    name: 'Tokens of Concord',
    symbol: 'CONCORD',
    decimals: 0, // ERC1155 typically doesn't have decimals
    icon: '/images/tokens/concord.png',
    color: '#FFD700', // Gold
  },
  corpse: {
    name: 'Corpse Token',
    symbol: 'CORPSE',
    decimals: 0,
    icon: '/images/tokens/corpse.png',
    color: '#8B0000', // Dark red
  },
  mushroom: {
    name: 'Mushroom Token',
    symbol: 'MUSHROOM',
    decimals: 0,
    icon: '/images/tokens/mushroom.png',
    color: '#8B4513', // Brown
  },
}

export function formatBalance(balance: bigint, decimals = 0): string {
  if (decimals === 0) {
    return balance.toString()
  }
  return formatTokenBalance(balance, decimals, 2)
}

export function formatBalanceWithSymbol(
  tokenType: 'concord' | 'corpse' | 'mushroom',
  balance: bigint
): string {
  const info = TOKEN_INFO[tokenType]
  const formatted = formatBalance(balance, info.decimals)
  return `${formatted} ${info.symbol}`
}

export function getTokenInfo(tokenType: 'concord' | 'corpse' | 'mushroom'): TokenInfo {
  return TOKEN_INFO[tokenType]
}

export function isBalanceZero(balance: TokenBalance | null): boolean {
  return !balance || balance.balance === 0n
}

export function hasAnyBalance(
  balances: Record<'concord' | 'corpse' | 'mushroom', TokenBalance | null>
): boolean {
  return Object.values(balances).some((balance) => balance && balance.balance > 0n)
}

export function getBalanceClassName(balance: bigint): string {
  if (balance === 0n) {
    return 'text-gray-500'
  }
  if (balance < 10n) {
    return 'text-yellow-400'
  }
  return 'text-green-400'
}
