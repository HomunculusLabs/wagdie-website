import { useCallback, useMemo, useState } from 'react';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

import type { AgentCharacter, CharacterRecord } from '../../types/character.js';
import { validateCreateCharacter } from '../../characters/validation.js';
import { ElizaValidationError } from '../../errors/ElizaValidationError.js';

import type { CreateCharacterFormValues } from './createCharacterFormModel.js';
import { FIELD_LIMITS, getDefaultFormValues, toCreateCharacterInput } from './createCharacterFormModel.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mergeInitialValues(
  defaults: CreateCharacterFormValues,
  initial?: Partial<CreateCharacterFormValues>
): CreateCharacterFormValues {
  if (!initial) return defaults;

  const next: CreateCharacterFormValues = { ...defaults };

  (Object.keys(initial) as Array<keyof CreateCharacterFormValues>).forEach((key) => {
    const value = initial[key];
    if (value === undefined) return;

    // Cast through unknown to avoid TS inferring an impossible intersection type.
    (next as unknown as Record<string, unknown>)[key] = value;
  });

  return next;
}

function getFieldLimits(name: keyof CreateCharacterFormValues): FieldLimits | undefined {
  switch (name) {
    case 'name':
      return { maxLength: FIELD_LIMITS.name };
    case 'backstory':
      return { maxLength: 10000 };
    case 'systemPrompt':
      return { maxLength: FIELD_LIMITS.systemPrompt };
    case 'bio':
      return { maxLength: FIELD_LIMITS.bio, maxItems: FIELD_LIMITS.maxBioEntries };
    case 'lore':
      return { maxLength: FIELD_LIMITS.lore, maxItems: FIELD_LIMITS.maxLoreEntries };
    case 'topics':
      return { maxLength: FIELD_LIMITS.topic, maxItems: FIELD_LIMITS.maxTopics };
    case 'adjectives':
      return { maxLength: FIELD_LIMITS.adjective, maxItems: FIELD_LIMITS.maxAdjectives };
    case 'postExamples':
      return { maxLength: FIELD_LIMITS.postExample, maxItems: FIELD_LIMITS.maxPostExamples };
    default:
      return undefined;
  }
}

function normalizeValidationErrors(error: ElizaValidationError): FieldErrors {
  const out: FieldErrors = {};

  const allowed: Record<string, keyof CreateCharacterFormValues> = {
    name: 'name',
    backstory: 'backstory',
    systemPrompt: 'systemPrompt',
    bio: 'bio',
    lore: 'lore',
    topics: 'topics',
    adjectives: 'adjectives',
    postExamples: 'postExamples',
  };

  for (const [path, messages] of Object.entries(error.fieldErrors)) {
    const rootKey = path.split('.')[0] || path;
    const formKey = allowed[rootKey];

    if (!formKey) continue;
    if (!Array.isArray(messages) || messages.length === 0) continue;

    out[formKey] = messages[0];
  }

  return out;
}

function createAgentCharacterFromValidatedInput(
  input: ReturnType<typeof validateCreateCharacter>
): AgentCharacter {
  const character: AgentCharacter = {
    name: input.name,
  };

  if (typeof input.systemPrompt === 'string' && input.systemPrompt.trim().length > 0) {
    character.system = input.systemPrompt;
    character['systemPrompt'] = input.systemPrompt;
  }

  if (Array.isArray(input.bio) && input.bio.length > 0) {
    character.bio = input.bio;
  }

  if (Array.isArray(input.topics) && input.topics.length > 0) {
    character.topics = input.topics;
  }

  character['backstory'] = input.backstory;

  if (Array.isArray(input.lore) && input.lore.length > 0) {
    character['lore'] = input.lore;
  }

  if (Array.isArray(input.adjectives) && input.adjectives.length > 0) {
    character['adjectives'] = input.adjectives;
  }

  if (Array.isArray(input.postExamples) && input.postExamples.length > 0) {
    character['postExamples'] = input.postExamples;
  }

  return character;
}

const FIELDS_ORDER: ReadonlyArray<keyof CreateCharacterFormValues> = [
  'name',
  'backstory',
  'systemPrompt',
  'bio',
  'lore',
  'topics',
  'adjectives',
  'postExamples',
] as const;

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useCreateCharacterForm(
  options: UseCreateCharacterFormOptions = {}
): UseCreateCharacterFormReturn {
  const {
    transport: transportOverride,
    initialValues,
    clientValidate = true,
    onCreated,
    onError,
  } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const initial = useMemo(() => {
    const defaults = getDefaultFormValues();
    return mergeInitialValues(defaults, initialValues);
  }, [initialValues]);

  const [values, setValues] = useState<CreateCharacterFormValues>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = useCallback(
    <K extends keyof CreateCharacterFormValues>(name: K, next: CreateCharacterFormValues[K]) => {
      setValues((prev) => ({ ...prev, [name]: next }));
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    },
    []
  );

  const clearErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
    setFieldErrors({});
    setFormError(null);
  }, [initial]);

  const submit = useCallback(async () => {
    if (busy) return;

    setFormError(null);
    setFieldErrors({});

    if (!transport) {
      const err = new Error(
        'useCreateCharacterForm requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.'
      );
      setFormError(err.message);
      onError?.(err);
      return;
    }

    const createInput = toCreateCharacterInput(values);

    let validated: ReturnType<typeof validateCreateCharacter>;
    try {
      if (clientValidate) {
        validated = validateCreateCharacter(createInput);
      } else {
        validated = createInput as unknown as ReturnType<typeof validateCreateCharacter>;
      }
    } catch (error) {
      const err = toError(error, 'Failed to create character');

      if (error instanceof ElizaValidationError) {
        const normalized = normalizeValidationErrors(error);
        setFieldErrors(normalized);

        if (Object.keys(normalized).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError(err.message);
      }

      onError?.(err);
      return;
    }

    setBusy(true);

    try {
      const character = createAgentCharacterFromValidatedInput(validated);
      const record = await transport.characters.createRecord({ character });
      onCreated?.(record);
    } catch (error) {
      const err = toError(error, 'Failed to create character');
      setFormError(err.message);
      onError?.(err);
    } finally {
      setBusy(false);
    }
  }, [busy, clientValidate, onCreated, onError, transport, values]);

  return {
    values,
    setField,
    fieldErrors,
    formError,
    busy,
    submit,
    reset,
    clearErrors,
    getFieldLimits,
    fieldsOrder: FIELDS_ORDER,
  };
}
