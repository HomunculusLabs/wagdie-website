import { act, renderHook } from '@testing-library/react';

import {
  confirmContractTransaction,
  useBlockchainTransaction,
  type ConfirmableTransactionService,
  type TransactionExecutionOutcome,
} from '@/hooks/useBlockchainTransaction';
import { useTransactionStore } from '@/lib/store/transactions';
import {
  ContractErrorType,
  TransactionStatus,
  type ContractError,
  type TransactionHash,
} from '@/types/blockchain';

const hashA = `0x${'a'.repeat(64)}` as TransactionHash;
const hashB = `0x${'b'.repeat(64)}` as TransactionHash;
const hashC = `0x${'c'.repeat(64)}` as TransactionHash;

function contractError(message = 'Contract failed'): ContractError {
  return {
    type: ContractErrorType.CONTRACT_ERROR,
    message,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('confirmContractTransaction', () => {
  it('submits, marks submitted, and waits through the public confirmation helper', async () => {
    const markSubmitted = jest.fn();
    const waitForTransactionConfirmation = jest.fn().mockResolvedValue({});
    const service: ConfirmableTransactionService = { waitForTransactionConfirmation };

    const result = await confirmContractTransaction({
      transaction: async () => ({ hash: hashA }),
      service,
      context: {
        txId: 'tx-1',
        isCurrent: () => true,
        markSubmitted,
      },
      missingHashError: contractError('Missing hash'),
      confirmations: 2,
    });

    expect(result).toEqual({ hash: hashA });
    expect(markSubmitted).toHaveBeenCalledTimes(1);
    expect(markSubmitted).toHaveBeenCalledWith(hashA);
    expect(waitForTransactionConfirmation).toHaveBeenCalledWith(hashA, 2);
  });

  it('returns a structured error when confirmation fails after submission', async () => {
    const receiptError = contractError('Receipt failed');
    const markSubmitted = jest.fn();
    const waitForTransactionConfirmation = jest.fn().mockResolvedValue({ error: receiptError });

    await expect(
      confirmContractTransaction({
        transaction: async () => ({ hash: hashA }),
        service: { waitForTransactionConfirmation },
        context: {
          txId: 'tx-1',
          isCurrent: () => true,
          markSubmitted,
        },
        missingHashError: contractError('Missing hash'),
      })
    ).resolves.toEqual({ hash: hashA, error: receiptError });

    expect(markSubmitted).toHaveBeenCalledTimes(1);
    expect(markSubmitted).toHaveBeenCalledWith(hashA);
    expect(waitForTransactionConfirmation).toHaveBeenCalledWith(hashA, undefined);
  });

  it('returns a structured error when submission does not return a hash', async () => {
    const missingHashError = contractError('Missing hash');

    await expect(
      confirmContractTransaction({
        transaction: async () => ({}),
        service: { waitForTransactionConfirmation: jest.fn() },
        context: {
          txId: 'tx-1',
          isCurrent: () => true,
          markSubmitted: jest.fn(),
        },
        missingHashError,
      })
    ).resolves.toEqual({ error: missingHashError });
  });
});

describe('useBlockchainTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles success with a submitted hash and bigint-safe metadata', async () => {
    const onSubmitted = jest.fn();
    const onSuccess = jest.fn();
    const addTransaction = jest.fn();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction<string>({
        transactionType: 'test-success',
        onSubmitted,
        onSuccess,
        addTransaction,
        updateTransaction,
      })
    );

    let outcome!: TransactionExecutionOutcome<string>;
    await act(async () => {
      outcome = await result.current.execute(
        { tokenId: 12n },
        async (_params, context) => {
          context.markSubmitted(hashA, { metadata: { tokenId: 12n } });
          return { hash: hashA, result: 'done' };
        }
      );
    });

    expect(outcome).toMatchObject({ success: true, hash: hashA, result: 'done' });
    expect(result.current.status).toBe(TransactionStatus.SUCCESS);
    expect(result.current.txHash).toBe(hashA);
    expect(result.current.error).toBeNull();
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onSubmitted).toHaveBeenCalledWith(hashA);
    expect(onSuccess).toHaveBeenCalledWith(hashA, 'done');
    expect(addTransaction.mock.calls[0][2].metadata).toEqual({ tokenId: '12' });
    expect(updateTransaction.mock.calls[0][1]).toMatchObject({
      hash: hashA,
      status: TransactionStatus.CONFIRMING,
      metadata: { tokenId: '12' },
    });
  });

  it('handles success without a hash', async () => {
    const onSuccess = jest.fn();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction<string>({
        transactionType: 'test-no-hash',
        onSuccess,
        updateTransaction,
      })
    );

    let outcome!: TransactionExecutionOutcome<string>;
    await act(async () => {
      outcome = await result.current.execute({ ok: true }, async () => ({ result: 'done' }));
    });

    expect(outcome).toMatchObject({ success: true, result: 'done' });
    expect(outcome.hash).toBeUndefined();
    expect(result.current.status).toBe(TransactionStatus.SUCCESS);
    expect(result.current.txHash).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(updateTransaction).toHaveBeenCalledWith(
      expect.any(String),
      { status: TransactionStatus.SUCCESS }
    );
  });

  it('converts thrown executor errors into ContractError state', async () => {
    const onError = jest.fn();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction({
        transactionType: 'test-throw',
        onError,
        updateTransaction,
      })
    );

    let outcome!: TransactionExecutionOutcome;
    await act(async () => {
      outcome = await result.current.execute({ id: 'throw' }, async () => {
        throw new Error('Boom');
      });
    });

    expect(outcome.success).toBe(false);
    expect(outcome.error).toMatchObject({
      type: ContractErrorType.UNKNOWN,
      message: 'Boom',
    });
    expect(result.current.status).toBe(TransactionStatus.ERROR);
    expect(result.current.error).toMatchObject({ message: 'Boom' });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Boom' }));
    expect(updateTransaction).toHaveBeenCalledWith(
      expect.any(String),
      { status: TransactionStatus.ERROR, error: 'Boom' }
    );
  });

  it('preserves a submitted hash when the executor throws after submission', async () => {
    const onSubmitted = jest.fn();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction({
        transactionType: 'test-throw-after-submit',
        onSubmitted,
        updateTransaction,
      })
    );

    let outcome!: TransactionExecutionOutcome;
    await act(async () => {
      outcome = await result.current.execute({ id: 'throw-after-submit' }, async (_params, context) => {
        context.markSubmitted(hashA);
        throw new Error('Boom after submit');
      });
    });

    expect(outcome.success).toBe(false);
    expect(outcome.hash).toBe(hashA);
    expect(outcome.error).toMatchObject({ message: 'Boom after submit' });
    expect(result.current.status).toBe(TransactionStatus.ERROR);
    expect(result.current.txHash).toBe(hashA);
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenLastCalledWith(
      expect.any(String),
      { hash: hashA, status: TransactionStatus.ERROR, error: 'Boom after submit' }
    );
  });

  it('handles executor-returned ContractError with a hash', async () => {
    const error = contractError('Receipt reverted');
    const onSubmitted = jest.fn();
    const onError = jest.fn();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction({
        transactionType: 'test-error-result',
        onSubmitted,
        onError,
        updateTransaction,
      })
    );

    let outcome!: TransactionExecutionOutcome;
    await act(async () => {
      outcome = await result.current.execute(
        { id: 'receipt-error' },
        async () => ({ hash: hashA, error })
      );
    });

    expect(outcome).toMatchObject({ success: false, hash: hashA, error });
    expect(result.current.status).toBe(TransactionStatus.ERROR);
    expect(result.current.txHash).toBe(hashA);
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onSubmitted).toHaveBeenCalledWith(hashA);
    expect(onError).toHaveBeenCalledWith(error);
    expect(updateTransaction).toHaveBeenLastCalledWith(
      expect.any(String),
      { hash: hashA, status: TransactionStatus.ERROR, error: error.message }
    );
  });

  it('does not let a superseded transaction mutate final visible state', async () => {
    const first = deferred<{ hash: TransactionHash }>();
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction({
        transactionType: 'test-race',
        onSuccess,
      })
    );

    let firstOutcomePromise!: Promise<TransactionExecutionOutcome>;
    await act(async () => {
      firstOutcomePromise = result.current.execute({ id: 'first' }, async () => first.promise);
    });

    let secondOutcome!: TransactionExecutionOutcome;
    await act(async () => {
      secondOutcome = await result.current.execute({ id: 'second' }, async () => ({ hash: hashB }));
    });

    let firstOutcome!: TransactionExecutionOutcome;
    await act(async () => {
      first.resolve({ hash: hashA });
      firstOutcome = await firstOutcomePromise;
    });

    expect(secondOutcome).toMatchObject({ success: true, hash: hashB });
    expect(firstOutcome).toMatchObject({ success: false, hash: hashA, superseded: true });
    expect(result.current.status).toBe(TransactionStatus.SUCCESS);
    expect(result.current.txHash).toBe(hashB);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(hashB, undefined);
  });

  it('only fires onSubmitted once when markSubmitted is called repeatedly', async () => {
    const onSubmitted = jest.fn();

    const { result } = renderHook(() =>
      useBlockchainTransaction({
        transactionType: 'test-repeat-submit',
        onSubmitted,
      })
    );

    await act(async () => {
      await result.current.execute({ id: 'repeat' }, async (_params, context) => {
        context.markSubmitted(hashA);
        context.markSubmitted(hashC);
        return { hash: hashC };
      });
    });

    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onSubmitted).toHaveBeenCalledWith(hashA);
    expect(result.current.txHash).toBe(hashC);
    expect(result.current.status).toBe(TransactionStatus.SUCCESS);
  });
});

describe('useTransactionStore metadata persistence shape', () => {
  beforeEach(() => {
    useTransactionStore.setState({ transactions: {} });
    window.localStorage.clear();
  });

  it('normalizes bigint metadata on add and update', () => {
    const store = useTransactionStore.getState();

    store.addTransaction('tx-store', 'store-test', {
      status: TransactionStatus.PENDING,
      metadata: { amount: 1n, nested: { tokenId: 2n } },
    });

    expect(useTransactionStore.getState().transactions['tx-store'].metadata).toEqual({
      amount: '1',
      nested: { tokenId: '2' },
    });

    useTransactionStore.getState().updateTransaction('tx-store', {
      status: TransactionStatus.CONFIRMING,
      metadata: { confirmation: 3n },
    });

    expect(useTransactionStore.getState().transactions['tx-store'].metadata).toEqual({
      confirmation: '3',
    });
    expect(() => JSON.stringify(useTransactionStore.getState().transactions)).not.toThrow();
  });
});
