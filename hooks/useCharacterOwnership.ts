'use client'

// useCharacterOwnership Hook
// React hook for checking character ownership

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { CharacterOwnership, ContractError } from '@/types/blockchain'
import { OwnershipService } from '@/lib/services/blockchain/ownership'
import { logError } from '@/lib/utils/errors'

interface UseCharacterOwnershipResult {
  ownership: CharacterOwnership | null
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}

export function useCharacterOwnership(tokenId: bigint | null): UseCharacterOwnershipResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [ownership, setOwnership] = useState<CharacterOwnership | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchOwnership = async () => {
    if (!tokenId || !address || !publicClient) {
      setOwnership(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new OwnershipService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.checkOwnership(tokenId, address)

      if (result.error) {
        setError(result.error)
        setOwnership(null)
      } else if (result.data) {
        setOwnership(result.data)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to check ownership',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useCharacterOwnership')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOwnership()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, address, publicClient])

  return {
    ownership,
    isLoading,
    error,
    refetch: fetchOwnership,
  }
}

// Hook for checking ownership of a specific token without wallet connection
export function useTokenOwner(tokenId: bigint | null) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [owner, setOwner] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchOwner = async () => {
    if (!tokenId || !publicClient) {
      setOwner(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new OwnershipService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getOwner(tokenId)

      if (result.error) {
        setError(result.error)
        setOwner(null)
      } else if (result.data) {
        setOwner(result.data)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to get owner',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useTokenOwner')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOwner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, publicClient])

  return {
    owner,
    isLoading,
    error,
    refetch: fetchOwner,
  }
}
