import type { ReactNode } from 'react';
import type { CharacterRecord } from '../../types/character.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
export type CharacterSelectorViewSlots = 'root' | 'select' | 'option' | 'listbox' | 'item' | 'itemButton' | 'loadMore' | 'empty' | 'loading' | 'error';
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
    renderOption?: (record: CharacterRecord, state: {
        selected: boolean;
    }) => ReactNode;
    renderEmpty?: () => ReactNode;
    renderLoading?: () => ReactNode;
    className?: string;
    classNames?: SlotClassNames<CharacterSelectorViewSlots>;
    styles?: SlotStyles<CharacterSelectorViewSlots>;
    unstyled?: boolean;
}
export declare function CharacterSelectorView(props: CharacterSelectorViewProps): JSX.Element;
