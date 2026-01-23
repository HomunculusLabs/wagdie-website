import type { NftToken, ListCollectionTokensResponse } from '../../types/nft.js';
/**
 * Convert IPFS URLs to use a public gateway
 */
export declare function resolveIpfsUrl(url: string | undefined): string | undefined;
export type TokenBrowserProps = {
    tokens: NftToken[];
    collection: ListCollectionTokensResponse['collection'] | null;
    isLoading: boolean;
    error: Error | null;
    hasMore: boolean;
    onLoadMore: () => void;
    onSelectToken: (token: NftToken) => void;
    disabled?: boolean;
    /** Custom class name for the container */
    className?: string;
};
export declare function TokenBrowser(props: TokenBrowserProps): JSX.Element;
