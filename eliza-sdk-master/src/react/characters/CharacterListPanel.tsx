import { useCharacters } from './useCharacters.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';
import type { CharacterRecord } from '../../types/character.js';

export interface CharacterListPanelProps {
  /** Callback when a character is selected */
  onPick: (characterId: string) => void;
  /** Currently selected character ID */
  selectedId?: string | null;
  /** Optional NFT collection ID to filter characters */
  nftCollectionId?: string;
  /** Custom class name for the container */
  className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getCharacterTokenId(record: CharacterRecord): string | null {
  const nft = isRecord(record.character) ? record.character['nft'] : null;
  if (!isRecord(nft)) return null;

  const tokenId = nft['tokenId'];
  if (typeof tokenId !== 'string') return null;

  const trimmed = tokenId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function shortId(id: string): string {
  if (!id) return '';
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

export function CharacterListPanel(props: CharacterListPanelProps): JSX.Element {
  const { onPick, selectedId, nftCollectionId, className } = props;

  const elizaContext = useOptionalEliza();
  const { items: characters = [], isLoading, error: loadError } = useCharacters({ nftCollectionId });

  if (!elizaContext?.transport) {
    return (
      <div className={`notice ${className ?? ''}`}>
        <span className="statusWarn">[warn]</span> Configure connection to load
        characters.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="characterSelectorList">
        {isLoading && <div className="muted">loading characters...</div>}
        {loadError && (
          <div className="statusErr">[error] {toError(loadError).message}</div>
        )}
        {!isLoading && !loadError && characters.length === 0 && (
          <div className="muted">no characters (create one)</div>
        )}
        {characters.map((record: CharacterRecord) => {
          const name = record.character?.name || '(unnamed)';
          const selected = record.id === selectedId;
          const tokenId = getCharacterTokenId(record);
          return (
            <button
              key={record.id}
              type="button"
              onClick={() => onPick(record.id)}
              aria-selected={selected}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span className="characterLine">
                <span className="caret">{selected ? '>' : ' '}</span>
                <span>{name}</span>
                <span className="characterMeta">({shortId(record.id)})</span>
                {tokenId ? (
                  <span className="characterMeta"> token {tokenId}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="notice" style={{ marginTop: 10 }}>
        <span className="statusWarn">[tip]</span> If the list is empty, verify
        tenant + API key (auth is required for character endpoints).
      </div>
    </div>
  );
}
