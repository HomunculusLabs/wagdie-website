import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import type { NftCollection, ProvisionNftCharacterResponse } from '../../types/nft.js';
import { toError } from '../shared/errors.js';

export type NftViewMode = 'my' | 'all';

export interface NftBrowserModel {
  // Collections
  collections: NftCollection[];
  isLoadingCollections: boolean;
  collectionsError: string | null;
  reloadCollections: () => Promise<void>;

  // Selection + derived
  selectedCollectionId: string;
  setSelectedCollectionId: (id: string) => void;
  selectedCollection: NftCollection | null;

  // Filters/settings
  viewMode: NftViewMode;
  setViewMode: (mode: NftViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  regenerate: boolean;
  setRegenerate: (v: boolean) => void;

  // Manual provision
  manualTokenId: string;
  setManualTokenId: (id: string) => void;
  canManualProvision: boolean;

  // Provisioning operation state
  isProvisioning: boolean;
  provisionError: string | null;
  lastResult: ProvisionNftCharacterResponse | null;

  // Actions
  provisionByTokenId: (tokenId: string) => Promise<ProvisionNftCharacterResponse | null>;
  clearProvisionStatus: () => void;

  // Environment inputs exposed for UI decisions
  hasAuth: boolean;
  walletAddress: string | null;
}

const NftBrowserContext = createContext<NftBrowserModel | null>(null);

export interface NftBrowserProviderProps {
  hasAuth: boolean;
  walletAddress: string | null;
  children: ReactNode;
}

export function NftBrowserProvider({
  hasAuth,
  walletAddress,
  children,
}: NftBrowserProviderProps): JSX.Element {
  const elizaContext = useOptionalEliza();
  const transport = elizaContext?.transport ?? null;

  // Collection state
  const [collections, setCollections] = useState<NftCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);

  // Filter state
  const [viewMode, setViewMode] = useState<NftViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [regenerate, setRegenerate] = useState(false);

  // Quick provision state
  const [manualTokenId, setManualTokenId] = useState<string>('');

  // Operation state
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProvisionNftCharacterResponse | null>(null);

  // Switch to 'all' view when wallet disconnects while viewing 'my' tokens
  useEffect(() => {
    if (!walletAddress && viewMode === 'my') {
      setViewMode('all');
    }
  }, [walletAddress, viewMode]);

  const selectedCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((c) => c.id === selectedCollectionId) ?? null;
  }, [collections, selectedCollectionId]);

  // Load collections
  const reloadCollections = useCallback(async (): Promise<void> => {
    if (!transport) return;

    setIsLoadingCollections(true);
    setCollectionsError(null);

    try {
      const res = await transport.nft.listCollections({ page: 1, pageSize: 50 });
      setCollections(res.items);

      setSelectedCollectionId((prev) => prev || res.items[0]?.id || '');
    } catch (e) {
      setCollections([]);
      setCollectionsError(toError(e, 'Failed to load collections').message);
    } finally {
      setIsLoadingCollections(false);
    }
  }, [transport]);

  // Provision by token ID
  const provisionByTokenId = useCallback(
    async (tokenId: string): Promise<ProvisionNftCharacterResponse | null> => {
      if (!transport) return null;
      if (!selectedCollection) return null;
      if (isProvisioning) return null;

      setProvisionError(null);
      setLastResult(null);
      setIsProvisioning(true);

      try {
        const result = await transport.nft.provisionCharacter({
          chainId: selectedCollection.chainId,
          contractAddress: selectedCollection.contractAddress,
          tokenId,
          regenerate,
        });

        setLastResult(result);
        return result;
      } catch (err) {
        setProvisionError(toError(err, 'Provision failed').message);
        return null;
      } finally {
        setIsProvisioning(false);
      }
    },
    [isProvisioning, regenerate, selectedCollection, transport]
  );

  const clearProvisionStatus = useCallback(() => {
    setProvisionError(null);
    setLastResult(null);
  }, []);

  // Validation for manual provision
  const canManualProvision = !!selectedCollectionId && !!manualTokenId.trim() && !isProvisioning;

  const value: NftBrowserModel = useMemo(
    () => ({
      collections,
      isLoadingCollections,
      collectionsError,
      reloadCollections,
      selectedCollectionId,
      setSelectedCollectionId,
      selectedCollection,
      viewMode,
      setViewMode,
      searchQuery,
      setSearchQuery,
      regenerate,
      setRegenerate,
      manualTokenId,
      setManualTokenId,
      canManualProvision,
      isProvisioning,
      provisionError,
      lastResult,
      provisionByTokenId,
      clearProvisionStatus,
      hasAuth,
      walletAddress,
    }),
    [
      collections,
      isLoadingCollections,
      collectionsError,
      reloadCollections,
      selectedCollectionId,
      selectedCollection,
      viewMode,
      searchQuery,
      regenerate,
      manualTokenId,
      canManualProvision,
      isProvisioning,
      provisionError,
      lastResult,
      provisionByTokenId,
      clearProvisionStatus,
      hasAuth,
      walletAddress,
    ]
  );

  return (
    <NftBrowserContext.Provider value={value}>
      {children}
    </NftBrowserContext.Provider>
  );
}

export function useNftBrowser(): NftBrowserModel {
  const context = useContext(NftBrowserContext);
  if (!context) {
    throw new Error('useNftBrowser must be used within an NftBrowserProvider');
  }
  return context;
}

export function useOptionalNftBrowser(): NftBrowserModel | null {
  return useContext(NftBrowserContext);
}
