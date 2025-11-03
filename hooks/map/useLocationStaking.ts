/**
 * useLocationStaking hook
 * T033 [P] [US3] Create useLocationStaking hook
 *
 * Custom React hook for handling blockchain transactions for staking, moving, and unstaking characters
 */

'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { StakeWagdieContractParams, ChangeWagdieLocationContractParams, UnstakeWagdieContractParams } from '@/types/wagdie-world'
import { getWagdieWorldContract } from '@/lib/services/map/wagdieWorldContract'

interface LocationStakingState {
  isPending: boolean
  isSuccess: boolean
  error: Error | null
  hash: `0x${string}` | undefined
}

/**
 * Hook to handle character location staking transactions
 *
 * Features:
 * - Stake characters to locations
 * - Move characters between locations
 * - Unstake characters
 * - Transaction status tracking
 * - Error handling and user feedback
 *
 * @returns Object with stake/move/unstake functions and transaction state
 *
 * @example
 * ```tsx
 * function StakeCharacterButton({ characterId }: { characterId: string }) {
 *   const { stake, isPending, hash, error } = useLocationStaking()
 *
 *   const handleStake = () => {
 *     stake([{ wagdieId: BigInt(characterId), locationId: 1n }])
 *   }
 *
 *   return (
 *     <button onClick={handleStake} disabled={isPending}>
 *       {isPending ? 'Staking...' : 'Stake Character'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useLocationStaking() {
  const [state, setState] = useState<LocationStakingState>({
    isPending: false,
    isSuccess: false,
    error: null,
    hash: undefined,
  })

  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash })

  // Update state when wagmi state changes
  useEffect(() => {
    setState({
      isPending,
      isSuccess,
      error: error ? new Error(error.message) : null,
      hash,
    })
  }, [isPending, isSuccess, error, hash])

  const contract = getWagdieWorldContract()

  /**
   * Stake characters to one or more locations on the blockchain
   *
   * This function initiates a blockchain transaction to stake WAGDIE characters
   * to specific locations. The staking process:
   *
   * 1. Sets transaction state to pending
   * 2. Calls the 'stakeWagdies' function on the WagdieWorld contract
   * 3. Uses wagmi's writeContract for transaction execution
   * 4. Handles errors with try-catch for user feedback
   *
   * @param params - Array of staking parameters containing:
   *   - wagdieId: The WAGDIE token ID (BigInt)
   *   - locationId: The target location ID (BigInt)
   *
   * Transaction Flow:
   * - User initiates stake via UI
   * - Wallet prompts user to sign transaction
   * - Transaction submitted to Ethereum network
   * - waitForTransactionReceipt confirms completion
   * - Supabase cache updated via handleTransactionConfirmation
   *
   * @example
   * ```ts
   * // Stake character #123 to location 5
   * stake([{ wagdieId: 123n, locationId: 5n }])
   *
   * // Stake multiple characters
   * stake([
   *   { wagdieId: 123n, locationId: 5n },
   *   { wagdieId: 456n, locationId: 3n }
   * ])
   * ```
   */
  const stake = (params: StakeWagdieContractParams[]) => {
    // Reset transaction state for new transaction
    setState({
      isPending: true,
      isSuccess: false,
      error: null,
      hash: undefined,
    })

    try {
      // Initiate blockchain transaction via wagmi
      // This prompts user's wallet to sign the transaction
      writeContract({
        address: contract.address,        // WagdieWorld contract address
        abi: contract.abi,                // Contract ABI for type safety
        functionName: 'stakeWagdies',     // Contract method to call
        args: [params] as any,            // Parameters (array of staking data)
      })
      // Note: Actual transaction sending is handled by wagmi
      // State updates happen automatically via useWriteContract
    } catch (err) {
      // Handle errors during transaction initiation
      // (e.g., wallet not connected, user rejected transaction)
      setState({
        isPending: false,
        isSuccess: false,
        error: err as Error,
        hash: undefined,
      })
    }
  }

  /**
   * Move characters from current location to new location
   */
  const move = (params: ChangeWagdieLocationContractParams[]) => {
    setState({
      isPending: true,
      isSuccess: false,
      error: null,
      hash: undefined,
    })

    try {
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'changeWagdieLocations',
        args: [params] as any,
      })
    } catch (err) {
      setState({
        isPending: false,
        isSuccess: false,
        error: err as Error,
        hash: undefined,
      })
    }
  }

  /**
   * Unstake characters from their current locations
   */
  const unstake = (params: UnstakeWagdieContractParams[]) => {
    setState({
      isPending: true,
      isSuccess: false,
      error: null,
      hash: undefined,
    })

    try {
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'unstakeWagdies',
        args: [params] as any,
      })
    } catch (err) {
      setState({
        isPending: false,
        isSuccess: false,
        error: err as Error,
        hash: undefined,
      })
    }
  }

  return {
    stake,
    move,
    unstake,
    isPending: state.isPending,
    isSuccess: state.isSuccess,
    error: state.error,
    hash: state.hash,
  }
}
