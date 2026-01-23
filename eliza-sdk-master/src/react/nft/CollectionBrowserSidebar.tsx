import type { FormEvent, ReactNode } from 'react';
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

export function CollectionBrowserSidebar(props: CollectionBrowserSidebarProps): JSX.Element {
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
    regenerate,
    onRegenerateChange,
    manualTokenId,
    onManualTokenIdChange,
    onManualProvision,
    canManualProvision,
    isOpen,
    onClose,
    disabled,
    className,
    renderCharacters,
  } = props;

  const handleManualProvisionSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManualProvision) return;
    onManualProvision();
  };

  return (
    <aside
      className={`collectionBrowserSidebar ${isOpen ? 'sidebarOpen' : ''} ${className ?? ''}`}
      aria-label="Collection Browser Filters"
    >
      {/* Close button for mobile */}
      <button
        type="button"
        className="button sidebarCloseBtn"
        onClick={onClose}
        aria-label="Close filters"
      >
        close
      </button>

      {/* COLLECTION Section */}
      <section className="browser-sidebar-section" aria-labelledby="sidebar-collection-header">
        <h2 id="sidebar-collection-header" className="browser-sidebar-header">
          COLLECTION
        </h2>
        <select
          className="browser-collection-select"
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
        <div className="muted" style={{ fontSize: 'var(--text-xs, 10px)' }}>
          {isLoadingCollections
            ? 'loading...'
            : `${collections.length} collection(s)`}
        </div>
      </section>

      {/* FILTERS Section */}
      <section className="browser-sidebar-section" aria-labelledby="sidebar-filters-header">
        <h2 id="sidebar-filters-header" className="browser-sidebar-header">
          FILTERS
        </h2>
        <div className="browser-filter-toggle" role="group" aria-label="Token view mode">
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
          className="browser-search-input"
          placeholder="Search by ID or name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          aria-label="Search tokens"
        />
      </section>

      {/* SETTINGS Section */}
      <section className="browser-sidebar-section" aria-labelledby="sidebar-settings-header">
        <h2 id="sidebar-settings-header" className="browser-sidebar-header">
          SETTINGS
        </h2>
        <label className="browser-checkbox-row">
          <input
            type="checkbox"
            checked={regenerate}
            onChange={(e) => onRegenerateChange(e.target.checked)}
            disabled={disabled}
          />
          <span className="browser-checkbox-label">
            <span>regenerate</span>
            <span className="browser-checkbox-hint">
              Rebuild character from fresh metadata
            </span>
          </span>
        </label>
      </section>

      {/* QUICK PROVISION Section */}
      <section className="browser-sidebar-section" aria-labelledby="sidebar-quickprovision-header">
        <h2 id="sidebar-quickprovision-header" className="browser-sidebar-header">
          QUICK PROVISION
        </h2>
        <form onSubmit={handleManualProvisionSubmit} className="browser-quick-provision">
          <input
            type="text"
            className="browser-search-input"
            placeholder="Token ID"
            value={manualTokenId}
            onChange={(e) => onManualTokenIdChange(e.target.value)}
            disabled={disabled || !selectedCollectionId}
            aria-label="Token ID for quick provision"
          />
          <button
            type="submit"
            className="button buttonPrimary"
            disabled={disabled || !canManualProvision}
          >
            go
          </button>
        </form>
        {!selectedCollectionId && (
          <div className="muted" style={{ fontSize: 'var(--text-xs, 10px)' }}>
            Select a collection first
          </div>
        )}
      </section>

      {/* CHARACTERS Section */}
      <section
        className="browser-sidebar-section browser-characters-section"
        aria-labelledby="sidebar-characters-header"
      >
        <h2 id="sidebar-characters-header" className="browser-sidebar-header">
          CHARACTERS
        </h2>
        {selectedCollectionId ? (
          renderCharacters ? (
            renderCharacters(selectedCollectionId)
          ) : (
            <div className="muted" style={{ fontSize: 'var(--text-xs, 10px)' }}>
              Use renderCharacters prop to display characters
            </div>
          )
        ) : (
          <div className="muted" style={{ fontSize: 'var(--text-xs, 10px)' }}>
            Select a collection to see characters
          </div>
        )}
      </section>
    </aside>
  );
}
