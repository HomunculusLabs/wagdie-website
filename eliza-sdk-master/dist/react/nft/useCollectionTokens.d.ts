import type { NftToken, ListCollectionTokensResponse } from '../../types/nft.js';
import type { ElizaTransport } from '../transport/types.js';
export type UseCollectionTokensOptions = {
    collectionId: string;
    transport?: ElizaTransport;
    limit?: number;
    autoLoad?: boolean;
    ownerAddress?: string;
};
export type UseCollectionTokensResult = {
    tokens: NftToken[];
    collection: ListCollectionTokensResponse['collection'] | null;
    isLoading: boolean;
    error: Error | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
};
export declare function useCollectionTokens(options: UseCollectionTokensOptions): UseCollectionTokensResult;
