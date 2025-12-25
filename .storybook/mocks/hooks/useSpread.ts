import { TransactionStatus } from '@/types/blockchain';
import type { useSpread as useSpreadHook } from '@/hooks/useSpread';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseSpreadResult = ReturnType<typeof useSpreadHook>;

export function useSpread(): UseSpreadResult {
  return (
    useHookMock<UseSpreadResult>('useSpread') ?? {
      isSpreading: false,
      error: null,
      txHash: null,
      txStatus: TransactionStatus.IDLE,
      infectionPrice: null,
      ethBalance: null,
      infectWagdie: async (..._args: Parameters<UseSpreadResult['infectWagdie']>) => {},
      spreadInfections: async (..._args: Parameters<UseSpreadResult['spreadInfections']>) => {},
      fetchInfectionPrice: async (..._args: Parameters<UseSpreadResult['fetchInfectionPrice']>) => {},
      fetchEthBalance: async (..._args: Parameters<UseSpreadResult['fetchEthBalance']>) => {},
    }
  );
}