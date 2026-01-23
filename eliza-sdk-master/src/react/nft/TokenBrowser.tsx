import type { NftToken, ListCollectionTokensResponse } from '../../types/nft.js';
import { toError } from '../shared/errors.js';

/**
 * Convert IPFS URLs to use a public gateway
 */
export function resolveIpfsUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}

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

function shortTokenId(tokenId: string): string {
  if (tokenId.length <= 8) return tokenId;
  return `${tokenId.slice(0, 6)}...`;
}

export function TokenBrowser(props: TokenBrowserProps): JSX.Element {
  const {
    tokens,
    collection,
    isLoading,
    error,
    hasMore,
    onLoadMore,
    onSelectToken,
    disabled,
    className,
  } = props;

  if (error) {
    return (
      <div className={`alertError ${className ?? ''}`} role="alert">
        <span className="statusErr">[error]</span> {toError(error).message}
      </div>
    );
  }

  if (isLoading && tokens.length === 0) {
    return (
      <div className={`muted ${className ?? ''}`} style={{ padding: 12 }}>
        loading tokens...
      </div>
    );
  }

  if (!isLoading && tokens.length === 0) {
    return (
      <div className={`notice ${className ?? ''}`}>
        <span className="statusWarn">[info]</span> No tokens found in this collection.
      </div>
    );
  }

  return (
    <div className={className}>
      {collection && (
        <div className="muted" style={{ marginBottom: 'var(--space-3, 12px)' }}>
          {collection.name} ({tokens.length} loaded)
        </div>
      )}

      <div className="nft-grid">
        {tokens.map((token) => (
          <button
            key={token.tokenId}
            type="button"
            onClick={() => onSelectToken(token)}
            disabled={disabled}
            className="nft-token"
            style={{
              padding: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                background: 'var(--color-bg-surface, #1a1a1a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {token.imageUrl ? (
                <img
                  src={resolveIpfsUrl(token.imageUrl)}
                  alt={token.name || `Token ${token.tokenId}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span style="color: var(--color-text-muted, #888); font-size: 10px;">#${shortTokenId(token.tokenId)}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="nft-token-id">
                  #{shortTokenId(token.tokenId)}
                </span>
              )}
            </div>

            <div className="nft-token-info">
              <div className="nft-token-name">
                {token.name || `#${token.tokenId}`}
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div style={{ marginTop: 'var(--space-4, 16px)', textAlign: 'center' }}>
          <button
            className="button"
            type="button"
            onClick={onLoadMore}
            disabled={isLoading || disabled}
          >
            {isLoading ? 'loading...' : 'load more'}
          </button>
        </div>
      )}

      {!hasMore && tokens.length > 0 && (
        <div className="muted" style={{ marginTop: 'var(--space-4, 16px)', textAlign: 'center' }}>
          end of collection
        </div>
      )}
    </div>
  );
}
