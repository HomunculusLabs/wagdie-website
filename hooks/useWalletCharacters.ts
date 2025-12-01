'use client'

// useWalletCharacters Hook
// React hook for fetching all characters owned by a wallet

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError } from '@/types/blockchain'
import { OwnershipService } from '@/lib/services/blockchain/ownership'
import { logError } from '@/lib/utils/errors'

interface WalletCharacter {
  tokenId: bigint
  isOwned: boolean
}

interface UseWalletCharactersResult {
  characters: WalletCharacter[]
  totalBalance: bigint
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}

export function useWalletCharacters(): UseWalletCharactersResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [characters, setCharacters] = useState<WalletCharacter[]>([])
  const [totalBalance, setTotalBalance] = useState<bigint>(0n)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchCharacters = useCallback(async () => {
    if (!address || !publicClient) {
      setCharacters([])
      setTotalBalance(0n)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new OwnershipService({ publicClient, walletClient })
      await service.initialize()

      const balanceResult = await service.getBalance(address)

      if (balanceResult.error) {
        setError(balanceResult.error)
        setCharacters([])
        setTotalBalance(0n)
        return
      }

      if (balanceResult.data) {
        setTotalBalance(balanceResult.data)

        // Note: We only have the balance count, not the actual token IDs
        // To get the actual token IDs, we would need to:
        // 1. Use an indexer/subgraph to query Transfer events
        // 2. Iterate through all possible token IDs (expensive)
        // 3. Use a backend API that tracks ownership

        // For now, we just store the balance count
        // In a real implementation, you'd fetch the actual token IDs here
        setCharacters([])
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to fetch wallet characters',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useWalletCharacters')
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient, walletClient])

  useEffect(() => {
    fetchCharacters()
  }, [address, publicClient, fetchCharacters])

  return {
    characters,
    totalBalance,
    isLoading,
    error,
    refetch: fetchCharacters,
  }
}

// Hook for checking ownership of multiple specific token IDs
export function useMultipleOwnership(tokenIds: bigint[]) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [ownerships, setOwnerships] = useState<WalletCharacter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchOwnerships = useCallback(async () => {
    if (!address || !publicClient || tokenIds.length === 0) {
      setOwnerships([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new OwnershipService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.checkMultipleOwnership(tokenIds, address)

      if (result.error) {
        setError(result.error)
        setOwnerships([])
      } else if (result.data) {
        const ownedCharacters = result.data.map((ownership) => ({
          tokenId: ownership.tokenId,
          isOwned: ownership.isOwned,
        }))
        setOwnerships(ownedCharacters)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to check multiple ownerships',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useMultipleOwnership')
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient, walletClient, tokenIds])

  useEffect(() => {
    fetchOwnerships()
  }, [address, fetchOwnerships])

  return {
    ownerships,
    isLoading,
    error,
    refetch: fetchOwnerships,
  }
}
