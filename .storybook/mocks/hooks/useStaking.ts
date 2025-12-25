import { TransactionStatus } from '@/types/blockchain';
import type { useStaking as useStakingHook } from '@/hooks/useStaking';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseStakingResult = ReturnType<typeof useStakingHook>;

export function useStaking(): UseStakingResult {
  return (
    useHookMock<UseStakingResult>('useStaking') ?? {
      isStaking: false,
      isUnstaking: false,
      isApproving: false,
      error: null,
      txHash: null,
      txStatus: TransactionStatus.IDLE,
      stakeWagdie: async (..._args: Parameters<UseStakingResult['stakeWagdie']>) => {},
      unstakeWagdie: async (..._args: Parameters<UseStakingResult['unstakeWagdie']>) => {},
      checkApproval: async (..._args: Parameters<UseStakingResult['checkApproval']>) => false,
      approveForStaking: async (..._args: Parameters<UseStakingResult['approveForStaking']>) => {},
    }
  );
}