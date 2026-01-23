import type { ReactNode } from 'react';
import type { NftCollection, ProvisionNftCharacterResponse } from '../../types/nft.js';
export type NftViewMode = 'my' | 'all';
export interface NftBrowserModel {
    collections: NftCollection[];
    isLoadingCollections: boolean;
    collectionsError: string | null;
    reloadCollections: () => Promise<void>;
    selectedCollectionId: string;
    setSelectedCollectionId: (id: string) => void;
    selectedCollection: NftCollection | null;
    viewMode: NftViewMode;
    setViewMode: (mode: NftViewMode) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    regenerate: boolean;
    setRegenerate: (v: boolean) => void;
    manualTokenId: string;
    setManualTokenId: (id: string) => void;
    canManualProvision: boolean;
    isProvisioning: boolean;
    provisionError: string | null;
    lastResult: ProvisionNftCharacterResponse | null;
    provisionByTokenId: (tokenId: string) => Promise<ProvisionNftCharacterResponse | null>;
    clearProvisionStatus: () => void;
    hasAuth: boolean;
    walletAddress: string | null;
}
export interface NftBrowserProviderProps {
    hasAuth: boolean;
    walletAddress: string | null;
    children: ReactNode;
}
export declare function NftBrowserProvider({ hasAuth, walletAddress, children, }: NftBrowserProviderProps): JSX.Element;
export declare function useNftBrowser(): NftBrowserModel;
export declare function useOptionalNftBrowser(): NftBrowserModel | null;
