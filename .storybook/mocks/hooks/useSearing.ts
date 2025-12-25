import { TransactionStatus } from '@/types/blockchain';
import type { useSearing as useSearingHook } from '@/hooks/useSearing';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseSearingResult = ReturnType<typeof useSearingHook>;

export function useSearing(): UseSearingResult {
  return (
    useHookMock<UseSearingResult>('useSearing') ?? {
      isSearing: false,
      isApproving: false,
      error: null,
      txHash: null,
      txStatus: TransactionStatus.IDLE,
      searConcords: async (..._args: Parameters<UseSearingResult['searConcords']>) => {},
      checkApproval: async (..._args: Parameters<UseSearingResult['checkApproval']>) => false,
      approveForSearing: async (..._args: Parameters<UseSearingResult['approveForSearing']>) => {},
    }
  );
}