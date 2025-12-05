/**
 * useBlockchainTransaction Hook Contract
 *
 * Generic blockchain transaction execution utility.
 * Handles common transaction lifecycle: pending → confirming → success/error.
 */

import type { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain';

// Configuration options
interface UseBlockchainTransactionOptions<TResult> {
  // Transaction identification
  transactionType: string;

  // Lifecycle callbacks
  onPending?: (txId: string) => void;
  onSubmitted?: (hash: TransactionHash) => void;
  onSuccess?: (hash: TransactionHash, result?: TResult) => void;
  onError?: (error: ContractError) => void;

  // Transaction store integration (optional)
  addTransaction?: (txId: string, type: string, data: any) => void;
  updateTransaction?: (txId: string, data: any) => void;
}

// Return type
interface UseBlockchainTransactionReturn<TResult> {
  // State
  isExecuting: boolean;
  status: TransactionStatus;
  txHash: TransactionHash | null;
  error: ContractError | null;

  // Execute function
  execute: <TParams>(
    params: TParams,
    executor: (params: TParams) => Promise<ExecutorResult<TResult>>
  ) => Promise<void>;

  // Reset state
  reset: () => void;
}

// Executor result shape
interface ExecutorResult<TResult> {
  hash?: TransactionHash;
  error?: ContractError;
  result?: TResult;
}

// Usage example:
// const { execute, isExecuting, status, error } = useBlockchainTransaction({
//   transactionType: 'infect-wagdie',
//   onSuccess: (hash) => showTransactionSuccessToast(hash, 'Infected!'),
//   onError: (error) => showTransactionErrorToast(error),
//   addTransaction,
//   updateTransaction,
// });
//
// await execute({ tokenId }, async ({ tokenId }) => {
//   const result = await service.infectWagdie(tokenId, address);
//   return { hash: result.hash, error: result.error };
// });
