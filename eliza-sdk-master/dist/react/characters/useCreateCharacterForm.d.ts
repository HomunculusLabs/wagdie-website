import type { ElizaTransport } from '../transport/types.js';
import type { CharacterRecord } from '../../types/character.js';
import type { CreateCharacterFormValues } from './createCharacterFormModel.js';
export type FieldErrors = Partial<Record<keyof CreateCharacterFormValues, string>>;
export type FieldLimits = {
    maxLength?: number;
    maxItems?: number;
};
export interface UseCreateCharacterFormOptions {
    /** Override the transport from context */
    transport?: ElizaTransport;
    /** Initial form values */
    initialValues?: Partial<CreateCharacterFormValues>;
    /** Enable client-side validation before submit (default: true) */
    clientValidate?: boolean;
    /** Callback when character is created successfully */
    onCreated?: (record: CharacterRecord) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
}
export interface UseCreateCharacterFormReturn {
    /** Current form values */
    values: CreateCharacterFormValues;
    /** Update a single field value */
    setField: <K extends keyof CreateCharacterFormValues>(key: K, value: CreateCharacterFormValues[K]) => void;
    /** Per-field validation errors */
    fieldErrors: FieldErrors;
    /** General form-level error message */
    formError: string | null;
    /** Whether the form is currently submitting */
    busy: boolean;
    /** Submit the form programmatically */
    submit: () => Promise<void>;
    /** Reset form to initial values */
    reset: () => void;
    /** Clear all errors without resetting values */
    clearErrors: () => void;
    /** Get field limits for a specific field */
    getFieldLimits: (name: keyof CreateCharacterFormValues) => FieldLimits | undefined;
    /** Field order for iteration */
    fieldsOrder: ReadonlyArray<keyof CreateCharacterFormValues>;
}
export declare function useCreateCharacterForm(options?: UseCreateCharacterFormOptions): UseCreateCharacterFormReturn;
