/**
 * useBlockchainTransaction Hook Contract
 *
 * Generic blockchain transaction execution utility.
 * Handles common transaction lifecycle: pending → confirming → success/error.
 *
 * The hook is the source of truth for transaction lifecycle state and store
 * updates. Feature hooks should preserve their public APIs and delegate common
 * submit/confirm/error behavior here.
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

  // Transaction store integration (optional). Metadata must be safe to persist;
  // bigint values are normalized to strings by the implementation/store.
  addTransaction?: (txId: string, type: string, data: TransactionStoreData) => void;
  updateTransaction?: (txId: string, data: TransactionStoreData) => void;
}

interface TransactionStoreData {
  status?: TransactionStatus;
  hash?: TransactionHash;
  error?: string;
  confirmations?: number;
  metadata?: Record<string, unknown>;
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
    executor: (
      params: TParams,
      context: TransactionExecutionContext
    ) => Promise<ExecutorResult<TResult>>
  ) => Promise<TransactionExecutionOutcome<TResult>>;

  // Reset state
  reset: () => void;
}

interface TransactionExecutionContext {
  txId: string;
  isCurrent: () => boolean;
  markSubmitted: (
    hash: TransactionHash,
    update?: { metadata?: Record<string, unknown> }
  ) => void;
}

interface TransactionExecutionOutcome<TResult> {
  success: boolean;
  txId: string;
  hash?: TransactionHash;
  error?: ContractError;
  result?: TResult;
  superseded?: boolean;
}

// Executor result shape
interface ExecutorResult<TResult> {
  hash?: TransactionHash;
  error?: ContractError;
  result?: TResult;
}

interface ConfirmableTransactionService {
  waitForTransactionConfirmation: (
    hash: TransactionHash,
    confirmations?: number
  ) => Promise<{ error?: ContractError }>;
}

interface ConfirmContractTransactionOptions {
  transaction: () => Promise<{ hash?: TransactionHash; error?: ContractError }>;
  service: ConfirmableTransactionService;
  context: TransactionExecutionContext;
  missingHashError: ContractError;
  confirmations?: number;
}

// Shared helper contract:
// confirmContractTransaction submits a transaction, calls context.markSubmitted
// once a hash is available, waits through service.waitForTransactionConfirmation,
// and returns { hash } or { hash, error } without reaching into protected service
// members.

// Usage example:
// const { execute, isExecuting, status, error } = useBlockchainTransaction({
//   transactionType: 'infect-wagdie',
//   onSuccess: (hash) => showTransactionSuccessToast(hash, 'Infected!'),
//   onError: (error) => showTransactionErrorToast(error),
//   addTransaction,
//   updateTransaction,
// });
//
// const outcome = await execute({ tokenId }, async ({ tokenId }, context) => {
//   return confirmContractTransaction({
//     transaction: () => service.infectWagdie(tokenId, address),
//     service,
//     context,
//     missingHashError: {
//       type: ContractErrorType.UNKNOWN,
//       message: 'Infection transaction did not return a hash',
//     },
//   });
// });
//
// if (outcome.success && !outcome.superseded) {
//   // Run post-confirmation follow-up work.
// }
