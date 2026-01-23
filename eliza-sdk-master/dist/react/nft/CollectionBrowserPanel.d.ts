import type { NftCollection } from '../../types/nft.js';
export interface CollectionBrowserPanelProps {
    /** List of available NFT collections */
    collections: NftCollection[];
    /** Currently selected collection ID */
    selectedCollectionId: string;
    /** Callback when collection selection changes */
    onCollectionChange: (collectionId: string) => void;
    /** Whether collections are currently loading */
    isLoadingCollections: boolean;
    /** Current view mode: 'my' for wallet-owned tokens, 'all' for all tokens */
    viewMode: 'my' | 'all';
    /** Callback when view mode changes */
    onViewModeChange: (mode: 'my' | 'all') => void;
    /** Whether a wallet is connected (required for 'my' view) */
    walletConnected: boolean;
    /** Current search query */
    searchQuery: string;
    /** Callback when search query changes */
    onSearchChange: (query: string) => void;
    /** Whether controls should be disabled (e.g., during provisioning) */
    disabled: boolean;
    /** Custom class name for the container */
    className?: string;
}
export declare function CollectionBrowserPanel(props: CollectionBrowserPanelProps): JSX.Element;
