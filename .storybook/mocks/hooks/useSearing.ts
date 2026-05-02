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
      approvalStatus: {
        isWagdieApproved: false,
        isConcordApproved: false,
        isFullyApproved: false,
      },
      searConcords: async (..._args: Parameters<UseSearingResult['searConcords']>) => ({
        success: true,
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      }),
      checkApproval: async (..._args: Parameters<UseSearingResult['checkApproval']>) => false,
      checkApprovalStatus: async (..._args: Parameters<UseSearingResult['checkApprovalStatus']>) => ({
        isWagdieApproved: false,
        isConcordApproved: false,
        isFullyApproved: false,
      }),
      approveForSearing: async (..._args: Parameters<UseSearingResult['approveForSearing']>) => {},
      getConcordBalance: async (..._args: Parameters<UseSearingResult['getConcordBalance']>) => null,
      getConcordBalances: async (..._args: Parameters<UseSearingResult['getConcordBalances']>) => [],
    }
  );
}