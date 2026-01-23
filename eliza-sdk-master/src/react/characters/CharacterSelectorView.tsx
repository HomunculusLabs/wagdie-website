// CharacterSelectorView - controlled presentational component
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import type { CharacterRecord } from '../../types/character.js';
import { cn } from '../shared/cn.js';
import { dataElizaComponent, dataElizaSlot } from '../shared/dataAttrs.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';

export type CharacterSelectorViewSlots =
  | 'root'
  | 'select'
  | 'option'
  | 'listbox'
  | 'item'
  | 'itemButton'
  | 'loadMore'
  | 'empty'
  | 'loading'
  | 'error';

export interface CharacterSelectorViewProps {
  items: CharacterRecord[];
  value: string | null;
  onChange: (id: string | null) => void;
  isLoading?: boolean;
  error?: Error | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  getLabel?: (record: CharacterRecord) => string;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'select' | 'listbox';
  renderOption?: (record: CharacterRecord, state: { selected: boolean }) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  className?: string;
  classNames?: SlotClassNames<CharacterSelectorViewSlots>;
  styles?: SlotStyles<CharacterSelectorViewSlots>;
  unstyled?: boolean;
}

const LOAD_MORE_VALUE = '__eliza_load_more__';

function defaultGetLabel(record: CharacterRecord): string {
  const name = record.character?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return name;
  }
  return '(unnamed)';
}

export function CharacterSelectorView(props: CharacterSelectorViewProps): JSX.Element {
  const {
    items,
    value,
    onChange,
    isLoading = false,
    error = null,
    hasMore = false,
    onLoadMore,
    getLabel = defaultGetLabel,
    disabled = false,
    placeholder = 'Select a character...',
    variant = 'select',
    renderOption,
    renderEmpty,
    renderLoading,
    className,
    classNames,
    styles,
    unstyled = false,
  } = props;

  const resolvedVariant = renderOption ? 'listbox' : variant;

  const rootStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const stateStyle: CSSProperties = unstyled
    ? {}
    : {
        padding: '6px 8px',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        border: '1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))',
        background: 'var(--eliza-character-selector-bg, transparent)',
        color: 'var(--eliza-character-selector-color, inherit)',
      };

  const errorStyle: CSSProperties = unstyled
    ? {}
    : {
        padding: '6px 8px',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        border: '1px solid var(--eliza-character-selector-error-border, #fca5a5)',
        background: 'var(--eliza-character-selector-error-bg, #fee2e2)',
        color: 'var(--eliza-character-selector-error-color, #7f1d1d)',
      };

  const selectStyle: CSSProperties = unstyled
    ? { width: '100%' }
    : {
        width: '100%',
        padding: '6px 8px',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        border: '1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))',
        background: 'var(--eliza-character-selector-bg, transparent)',
        color: 'var(--eliza-character-selector-color, inherit)',
        font: 'inherit',
      };

  const listboxStyle: CSSProperties = unstyled
    ? { display: 'flex', flexDirection: 'column', gap: 4 }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 'var(--eliza-character-selector-padding, 8px)',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        border: '1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))',
        background: 'var(--eliza-character-selector-bg, transparent)',
      };

  const itemButtonStyle: CSSProperties = unstyled
    ? { width: '100%', textAlign: 'left' }
    : {
        width: '100%',
        textAlign: 'left',
        border: '1px solid transparent',
        background: 'transparent',
        color: 'var(--eliza-character-selector-color, inherit)',
        padding: '6px 8px',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      };

  const loadMoreStyle: CSSProperties = unstyled
    ? { alignSelf: 'flex-start' }
    : {
        alignSelf: 'flex-start',
        padding: '6px 8px',
        borderRadius: 'var(--eliza-character-selector-radius, 6px)',
        border: '1px solid var(--eliza-character-selector-border, rgba(0,0,0,0.2))',
        background: 'var(--eliza-character-selector-bg, transparent)',
        color: 'var(--eliza-character-selector-color, inherit)',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
      };

  const renderLoadingBlock = (): JSX.Element => (
    <div
      {...dataElizaSlot('loading')}
      className={cn(classNames?.loading)}
      style={{ ...stateStyle, ...styles?.loading }}
    >
      {renderLoading ? renderLoading() : <div>Loading characters...</div>}
    </div>
  );

  const renderErrorBlock = (): JSX.Element => (
    <div
      {...dataElizaSlot('error')}
      role="alert"
      className={cn(classNames?.error)}
      style={{ ...errorStyle, ...styles?.error }}
    >
      {error?.message ?? 'Failed to load characters.'}
    </div>
  );

  const renderEmptyBlock = (): JSX.Element => (
    <div
      {...dataElizaSlot('empty')}
      className={cn(classNames?.empty)}
      style={{ ...stateStyle, ...styles?.empty }}
    >
      {renderEmpty ? renderEmpty() : <div>No characters available.</div>}
    </div>
  );

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;

    if (next === LOAD_MORE_VALUE) {
      if (!disabled && onLoadMore && !isLoading) {
        onLoadMore();
      }
      return;
    }

    if (!next) {
      onChange(null);
      return;
    }

    onChange(next);
  };

  let content: ReactNode = null;

  if (isLoading && items.length === 0) {
    content = renderLoadingBlock();
  } else if (error) {
    content = renderErrorBlock();
  } else if (items.length === 0) {
    content = renderEmptyBlock();
  } else if (resolvedVariant === 'select') {
    content = (
      <select
        {...dataElizaSlot('select')}
        className={cn(classNames?.select)}
        style={{ ...selectStyle, ...styles?.select }}
        value={value ?? ''}
        onChange={handleSelectChange}
        disabled={disabled}
        aria-label="Select character"
      >
        <option
          className={cn(classNames?.option)}
          style={styles?.option}
          value=""
        >
          {placeholder}
        </option>

        {items.map((record) => {
          const label = getLabel(record);
          return (
            <option
              key={record.id}
              className={cn(classNames?.option)}
              style={styles?.option}
              value={record.id}
            >
              {label}
            </option>
          );
        })}

        {hasMore && onLoadMore ? (
          <option
            className={cn(classNames?.loadMore)}
            style={styles?.loadMore}
            value={LOAD_MORE_VALUE}
            disabled={disabled || isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more...'}
          </option>
        ) : null}
      </select>
    );
  } else {
    content = (
      <div
        {...dataElizaSlot('listbox')}
        role="listbox"
        aria-disabled={disabled ? 'true' : undefined}
        className={cn(classNames?.listbox)}
        style={{ ...listboxStyle, ...styles?.listbox }}
      >
        {items.map((record) => {
          const selected = record.id === value;
          return (
            <div
              {...dataElizaSlot('item')}
              key={record.id}
              className={cn(classNames?.item)}
              style={styles?.item}
            >
              <button
                {...dataElizaSlot('itemButton')}
                type="button"
                role="option"
                aria-selected={selected ? 'true' : undefined}
                onClick={() => onChange(record.id)}
                disabled={disabled}
                className={cn(classNames?.itemButton)}
                style={{
                  ...itemButtonStyle,
                  ...(selected && !unstyled
                    ? {
                        background:
                          'var(--eliza-character-selector-selected-bg, rgba(0,0,0,0.08))',
                      }
                    : {}),
                  ...styles?.itemButton,
                }}
              >
                {renderOption ? renderOption(record, { selected }) : getLabel(record)}
              </button>
            </div>
          );
        })}

        {hasMore && onLoadMore ? (
          <button
            {...dataElizaSlot('loadMore')}
            type="button"
            onClick={() => {
              if (disabled || isLoading) return;
              onLoadMore();
            }}
            disabled={disabled || isLoading}
            className={cn(classNames?.loadMore)}
            style={{ ...loadMoreStyle, ...styles?.loadMore }}
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      {...dataElizaComponent('CharacterSelectorView')}
      className={cn(className, classNames?.root)}
      style={{ ...rootStyle, ...styles?.root }}
    >
      {content}
    </div>
  );
}
