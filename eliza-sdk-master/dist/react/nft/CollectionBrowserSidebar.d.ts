import type { ReactNode } from 'react';
import type { NftCollection } from '../../types/nft.js';
export interface CollectionBrowserSidebarProps {
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
    /** Whether regenerate option is enabled */
    regenerate: boolean;
    /** Callback when regenerate option changes */
    onRegenerateChange: (value: boolean) => void;
    /** Manual token ID for quick provision */
    manualTokenId: string;
    /** Callback when manual token ID changes */
    onManualTokenIdChange: (tokenId: string) => void;
    /** Callback when manual provision is triggered */
    onManualProvision: () => void;
    /** Whether manual provision is currently allowed */
    canManualProvision: boolean;
    /** Whether the sidebar is open (for mobile) */
    isOpen: boolean;
    /** Callback to close the sidebar */
    onClose: () => void;
    /** Whether controls should be disabled (e.g., during provisioning) */
    disabled: boolean;
    /** Custom class name for the container */
    className?: string;
    /**
     * Render prop for the characters section.
     * If not provided, a default message will be shown.
     * Pass a CharacterListPanel or similar component.
     */
    renderCharacters?: (selectedCollectionId: string) => ReactNode;
}
export declare function CollectionBrowserSidebar(props: CollectionBrowserSidebarProps): JSX.Element;
