'use client'

// useTokenBalances Hook
// React hook for fetching ERC1155 token balances

import { useEffect, useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TokenBalance } from '@/types/blockchain'
import { BalancesService, TokenType } from '@/lib/services/blockchain/balances'
import { logError } from '@/lib/utils/errors'

interface TokenBalances {
  concord: TokenBalance | null
  corpse: TokenBalance | null
  mushroom: TokenBalance | null
}

interface UseTokenBalancesResult {
  balances: TokenBalances
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}

export function useTokenBalances(): UseTokenBalancesResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [balances, setBalances] = useState<TokenBalances>({
    concord: null,
    corpse: null,
    mushroom: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) {
      setBalances({
        concord: null,
        corpse: null,
        mushroom: null,
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new BalancesService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getAllBalances(address)

      if (result.error) {
        setError(result.error)
        setBalances({
          concord: null,
          corpse: null,
          mushroom: null,
        })
      } else if (result.data) {
        setBalances({
          concord: result.data.concord,
          corpse: result.data.corpse,
          mushroom: result.data.mushroom,
        })
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to fetch token balances',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useTokenBalances')
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient, walletClient])

  useEffect(() => {
    fetchBalances()
  }, [address, fetchBalances])

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  }
}

// Hook for fetching a single token balance
export function useSingleTokenBalance(tokenType: TokenType | null) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!address || !publicClient || !tokenType) {
      setBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new BalancesService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getTokenBalance(tokenType, address)

      if (result.error) {
        setError(result.error)
        setBalance(null)
      } else if (result.data) {
        setBalance(result.data)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to fetch token balance',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useSingleTokenBalance')
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient, walletClient, tokenType])

  useEffect(() => {
    fetchBalance()
  }, [address, tokenType, fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}
