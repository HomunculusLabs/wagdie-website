import type { ElizaTransport } from '../transport/types.js';
import type { CharacterRecord } from '../../types/character.js';
import type { CreateCharacterFormValues } from './createCharacterFormModel.js';
export interface CreateCharacterFormProps {
    transport?: ElizaTransport;
    initialValues?: Partial<CreateCharacterFormValues>;
    onCreated?: (record: CharacterRecord) => void;
    onError?: (error: Error) => void;
    clientValidate?: boolean;
    className?: string;
    fieldClassName?: string;
    buttonClassName?: string;
    renderField?: (field: {
        name: keyof CreateCharacterFormValues;
        value: unknown;
        setValue: (next: unknown) => void;
        error?: string;
        limits?: {
            maxLength?: number;
            maxItems?: number;
        };
    }) => React.ReactNode;
    submitLabel?: string;
    isSubmitting?: boolean;
}
export declare function CreateCharacterForm(props: CreateCharacterFormProps): JSX.Element;
