import type { useAICharacter as useAICharacterHook } from '@/hooks/useAICharacter';
import { useHookMock } from '../hook-mocks/HookMocksProvider';

type UseAICharacterResult = ReturnType<typeof useAICharacterHook>;

export function useAICharacter(_tokenId: string): UseAICharacterResult {
  return (
    useHookMock<UseAICharacterResult>('useAICharacter') ?? {
      aiCharacter: null,
      isLoading: false,
      isSaving: false,
      isImporting: false,
      error: null,
      fetchAICharacter: async (..._args: Parameters<UseAICharacterResult['fetchAICharacter']>) => {},
      saveAICharacter: async (..._args: Parameters<UseAICharacterResult['saveAICharacter']>) => false,
      exportCharacter: async (..._args: Parameters<UseAICharacterResult['exportCharacter']>) => {},
      importCharacter: async (..._args: Parameters<UseAICharacterResult['importCharacter']>) => null,
      clearError: (..._args: Parameters<UseAICharacterResult['clearError']>) => {},
    }
  );
}