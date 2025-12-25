import { TransactionStatus } from '@/types/blockchain';
import type { useCorpseBurning as useCorpseBurningHook } from '@/hooks/useCorpseBurning';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseCorpseBurningResult = ReturnType<typeof useCorpseBurningHook>;

export function useCorpseBurning(): UseCorpseBurningResult {
  return (
    useHookMock<UseCorpseBurningResult>('useCorpseBurning') ?? {
      isBurning: false,
      isApproving: false,
      error: null,
      txHash: null,
      txStatus: TransactionStatus.IDLE,
      corpseBalance: null,
      mushroomBalance: null,
      burnCorpse: async (..._args: Parameters<UseCorpseBurningResult['burnCorpse']>) => {},
      checkApproval: async (..._args: Parameters<UseCorpseBurningResult['checkApproval']>) => false,
      approveForBurning: async (..._args: Parameters<UseCorpseBurningResult['approveForBurning']>) => {},
      fetchBalances: async (..._args: Parameters<UseCorpseBurningResult['fetchBalances']>) => {},
    }
  );
}