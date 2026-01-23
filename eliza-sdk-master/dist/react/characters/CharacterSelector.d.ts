import type { CharacterRecord } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { type CharacterSelectorViewSlots } from './CharacterSelectorView.js';
export interface CharacterSelectorProps {
    value: string | null;
    onChange: (id: string | null) => void;
    transport?: ElizaTransport;
    pageSize?: number;
    getLabel?: (record: CharacterRecord) => string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    selectClassName?: string;
    optionClassName?: string;
    classNames?: SlotClassNames<CharacterSelectorViewSlots>;
    styles?: SlotStyles<CharacterSelectorViewSlots>;
    unstyled?: boolean;
    renderOption?: (record: CharacterRecord, state: {
        selected: boolean;
    }) => React.ReactNode;
    renderEmpty?: () => React.ReactNode;
    renderLoading?: () => React.ReactNode;
}
export declare function CharacterSelector(props: CharacterSelectorProps): JSX.Element;
