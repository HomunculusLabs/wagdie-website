import { useCallback } from 'react';
import type { CharacterRecord } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import { cn } from '../shared/cn.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { CharacterSelectorView, type CharacterSelectorViewSlots } from './CharacterSelectorView.js';
import { useCharacters } from './useCharacters.js';

export interface CharacterSelectorProps {
  value: string | null; // selected character id
  onChange: (id: string | null) => void;

  transport?: ElizaTransport;
  pageSize?: number;

  // Customization
  getLabel?: (record: CharacterRecord) => string; // default: record.character.name
  disabled?: boolean;
  placeholder?: string; // default: 'Select a character...'

  // Styling
  className?: string;
  selectClassName?: string;
  optionClassName?: string;
  classNames?: SlotClassNames<CharacterSelectorViewSlots>;
  styles?: SlotStyles<CharacterSelectorViewSlots>;
  unstyled?: boolean;

  // Headless: render your own options
  renderOption?: (record: CharacterRecord, state: { selected: boolean }) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

function defaultGetLabel(record: CharacterRecord): string {
  return record.character.name;
}

export function CharacterSelector(props: CharacterSelectorProps): JSX.Element {
  const {
    value,
    onChange,
    transport,
    pageSize,
    getLabel = defaultGetLabel,
    disabled = false,
    placeholder = 'Select a character...',
    className,
    selectClassName,
    optionClassName,
    classNames,
    styles,
    unstyled = false,
    renderOption,
    renderEmpty,
    renderLoading,
  } = props;

  const { items, isLoading, error, hasMore, loadMore } = useCharacters({
    transport,
    pageSize,
    autoLoad: true,
  });

  const handleChange = useCallback(
    (id: string | null) => {
      onChange(id);
    },
    [onChange]
  );

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    void loadMore();
  }, [hasMore, isLoading, loadMore]);

  const mergedClassNames: SlotClassNames<CharacterSelectorViewSlots> | undefined =
    selectClassName || optionClassName
      ? {
          ...classNames,
          ...(selectClassName
            ? { select: cn(classNames?.select, selectClassName) }
            : {}),
          ...(optionClassName
            ? { option: cn(classNames?.option, optionClassName) }
            : {}),
        }
      : classNames;

  return (
    <CharacterSelectorView
      items={items}
      value={value}
      onChange={handleChange}
      isLoading={isLoading}
      error={error}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      getLabel={getLabel}
      disabled={disabled}
      placeholder={placeholder}
      renderOption={renderOption}
      renderEmpty={renderEmpty}
      renderLoading={renderLoading}
      className={className}
      classNames={mergedClassNames}
      styles={styles}
      unstyled={unstyled}
    />
  );
}