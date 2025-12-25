import type { useTokenBalances as useTokenBalancesHook } from '@/hooks/useTokenBalances';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseTokenBalancesResult = ReturnType<typeof useTokenBalancesHook>;

export function useTokenBalances(): UseTokenBalancesResult {
  return (
    useHookMock<UseTokenBalancesResult>('useTokenBalances') ?? {
      balances: {
        concord: null,
        corpse: null,
        mushroom: null,
      },
      isLoading: false,
      error: null,
      refetch: async (..._args: Parameters<UseTokenBalancesResult['refetch']>) => {},
    }
  );
}