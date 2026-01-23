import type { NftCollection } from '../../types/nft.js';

function shortAddress(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '-';
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
}

function collectionLabel(c: NftCollection): string {
  const name = c.name || '(unnamed)';
  return `${name} - ${c.chainId} - ${shortAddress(c.contractAddress)}`;
}

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

export function CollectionBrowserPanel(props: CollectionBrowserPanelProps): JSX.Element {
  const {
    collections,
    selectedCollectionId,
    onCollectionChange,
    isLoadingCollections,
    viewMode,
    onViewModeChange,
    walletConnected,
    searchQuery,
    onSearchChange,
    disabled,
    className,
  } = props;

  return (
    <div className={`nftSidebarPanel ${className ?? ''}`}>
      {/* COLLECTION Section */}
      <section className="sidebar-section" aria-labelledby="sidebar-collection-header">
        <h2 id="sidebar-collection-header" className="sidebar-header">
          COLLECTION
        </h2>
        <select
          className="nft-collection-select"
          value={selectedCollectionId}
          onChange={(e) => onCollectionChange(e.target.value)}
          disabled={isLoadingCollections || disabled}
          aria-label="Select NFT collection"
        >
          <option value="">(select a collection)</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {collectionLabel(c)}
            </option>
          ))}
        </select>
      </section>

      {/* FILTERS Section */}
      <section className="sidebar-section" aria-labelledby="sidebar-filters-header">
        <h2 id="sidebar-filters-header" className="sidebar-header">
          FILTERS
        </h2>
        <div className="nft-filter-toggle" role="group" aria-label="Token view mode">
          <button
            type="button"
            className={viewMode === 'my' ? 'active' : ''}
            onClick={() => onViewModeChange('my')}
            disabled={disabled || !walletConnected}
            title={!walletConnected ? 'Connect wallet to view your tokens' : undefined}
            aria-pressed={viewMode === 'my'}
          >
            my tokens
          </button>
          <button
            type="button"
            className={viewMode === 'all' ? 'active' : ''}
            onClick={() => onViewModeChange('all')}
            disabled={disabled}
            aria-pressed={viewMode === 'all'}
          >
            all tokens
          </button>
        </div>
        <input
          type="text"
          className="nft-search-input"
          placeholder="Search by ID or name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          aria-label="Search tokens"
        />
      </section>
    </div>
  );
}
