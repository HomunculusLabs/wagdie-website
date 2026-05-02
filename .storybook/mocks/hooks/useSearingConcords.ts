import type { useSearingConcords as useSearingConcordsHook } from '@/hooks/useSearingConcords';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseSearingConcordsResult = ReturnType<typeof useSearingConcordsHook>;

export function useSearingConcords(..._args: Parameters<typeof useSearingConcordsHook>): UseSearingConcordsResult {
  return (
    useHookMock<UseSearingConcordsResult>('useSearingConcords') ?? {
      concords: [],
      allSearableConcords: [],
      isLoading: false,
      error: null,
      refetch: async (..._args: Parameters<UseSearingConcordsResult['refetch']>) => {},
    }
  );
}
