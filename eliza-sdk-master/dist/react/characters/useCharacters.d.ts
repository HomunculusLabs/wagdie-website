import type { CharacterRecord } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
export type UseCharactersOptions = {
    transport?: ElizaTransport;
    pageSize?: number;
    autoLoad?: boolean;
    nftCollectionId?: string;
};
export type UseCharactersResult = {
    items: CharacterRecord[];
    isLoading: boolean;
    error: Error | null;
    page: number;
    hasMore: boolean;
    load: (page?: number) => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
};
export declare function useCharacters(options?: UseCharactersOptions): UseCharactersResult;
