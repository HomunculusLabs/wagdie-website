import { TransactionStatus } from '@/types/blockchain';
import type { useCure as useCureHook } from '@/hooks/useCure';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseCureResult = ReturnType<typeof useCureHook>;

export function useCure(): UseCureResult {
  return (
    useHookMock<UseCureResult>('useCure') ?? {
      isCuring: false,
      error: null,
      txHash: null,
      txStatus: TransactionStatus.IDLE,
      cureStatus: null,
      cureCharacter: async (..._args: Parameters<UseCureResult['cureCharacter']>) => {},
      fetchCureStatus: async (..._args: Parameters<UseCureResult['fetchCureStatus']>) => {},
    }
  );
}