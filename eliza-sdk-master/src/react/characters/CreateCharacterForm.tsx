import { useCallback, useMemo, useState } from 'react';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

import type { AgentCharacter, CharacterRecord } from '../../types/character.js';
import { validateCreateCharacter } from '../../characters/validation.js';
import { ElizaValidationError } from '../../errors/ElizaValidationError.js';

import type { CreateCharacterFormValues } from './createCharacterFormModel.js';
import { FIELD_LIMITS, getDefaultFormValues, toCreateCharacterInput } from './createCharacterFormModel.js';

export interface CreateCharacterFormProps {
  transport?: ElizaTransport;

  initialValues?: Partial<CreateCharacterFormValues>;
  onCreated?: (record: CharacterRecord) => void;
  onError?: (error: Error) => void;

  // Validation control
  clientValidate?: boolean; // default: true

  // Styling
  className?: string;
  fieldClassName?: string;
  buttonClassName?: string;

  // Headless: render your own fields
  renderField?: (field: {
    name: keyof CreateCharacterFormValues;
    value: unknown;
    setValue: (next: unknown) => void;
    error?: string;
    limits?: { maxLength?: number; maxItems?: number };
  }) => React.ReactNode;

  // Submit button customization
  submitLabel?: string; // default: "Create Character"
  isSubmitting?: boolean; // controlled loading state
}

type FieldErrors = Partial<Record<keyof CreateCharacterFormValues, string>>;

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function joinLines(values: string[] | undefined): string {
  if (!Array.isArray(values) || values.length === 0) return '';
  return values.join('\n');
}

function mergeInitialValues(defaults: CreateCharacterFormValues, initial?: Partial<CreateCharacterFormValues>): CreateCharacterFormValues {
  if (!initial) return defaults;

  const next: CreateCharacterFormValues = { ...defaults };

  (Object.keys(initial) as Array<keyof CreateCharacterFormValues>).forEach((key) => {
    const value = initial[key];
    if (value === undefined) return;

    // Cast through unknown to avoid TS inferring an impossible intersection type for indexed assignment.
    (next as unknown as Record<string, unknown>)[key] = value;
  });

  return next;
}

function getFieldLimits(name: keyof CreateCharacterFormValues): { maxLength?: number; maxItems?: number } | undefined {
  switch (name) {
    case 'name':
      return { maxLength: FIELD_LIMITS.name };
    case 'backstory':
      // Not in FIELD_LIMITS; aligns with CreateCharacterInputSchema max(10000)
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

    // Keep the first message for simple UI rendering
    out[formKey] = messages[0];
  }

  return out;
}

function createAgentCharacterFromValidatedInput(input: ReturnType<typeof validateCreateCharacter>): AgentCharacter {
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

  // Preserve legacy/passthrough keys for compatibility with the SDK’s Character mapping
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

export function CreateCharacterForm(props: CreateCharacterFormProps): JSX.Element {
  const {
    transport: transportOverride,
    initialValues,
    onCreated,
    onError,
    clientValidate = true,
    className,
    fieldClassName,
    buttonClassName,
    renderField,
    submitLabel = 'Create Character',
    isSubmitting,
  } = props;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const initial = useMemo(() => {
    const defaults = getDefaultFormValues();
    return mergeInitialValues(defaults, initialValues);
  }, [initialValues]);

  const [values, setValues] = useState<CreateCharacterFormValues>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const busy = typeof isSubmitting === 'boolean' ? isSubmitting : internalSubmitting;

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

  const setFieldUnknown = useCallback(
    (name: keyof CreateCharacterFormValues, next: unknown) => {
      setValues((prev) => ({ ...prev, [name]: next as CreateCharacterFormValues[keyof CreateCharacterFormValues] }));
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (busy) return;

      setFormError(null);
      setFieldErrors({});

      if (!transport) {
        const err = new Error(
          'CreateCharacterForm requires an ElizaTransport: pass props.transport or wrap in <ElizaProvider>.'
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
          // If clientValidate is disabled, we still need a value shaped like the schema output.
          // This cast is safe because CreateCharacterInput is the schema input type.
          validated = createInput as unknown as ReturnType<typeof validateCreateCharacter>;
        }
      } catch (error) {
        const err = toError(error, 'Failed to create character');

        if (error instanceof ElizaValidationError) {
          const normalized = normalizeValidationErrors(error);
          setFieldErrors(normalized);

          // If nothing mapped, still show a general error.
          if (Object.keys(normalized).length === 0) {
            setFormError(error.message);
          }
        } else {
          setFormError(err.message);
        }

        onError?.(err);
        return;
      }

      const shouldManageSubmitting = typeof isSubmitting !== 'boolean';
      if (shouldManageSubmitting) {
        setInternalSubmitting(true);
      }

      try {
        const character = createAgentCharacterFromValidatedInput(validated);

        const record = await transport.characters.createRecord({ character });

        onCreated?.(record);
      } catch (error) {
        const err = toError(error, 'Failed to create character');
        setFormError(err.message);
        onError?.(err);
      } finally {
        if (shouldManageSubmitting) {
          setInternalSubmitting(false);
        }
      }
    },
    [busy, clientValidate, isSubmitting, onCreated, onError, transport, values]
  );

  const renderDefaultTextInput = (
    name: keyof CreateCharacterFormValues,
    label: string,
    options: { placeholder?: string; disabled?: boolean } = {}
  ) => {
    const limits = getFieldLimits(name);
    const error = fieldErrors[name];

    return (
      <div className={fieldClassName}>
        <label>
          <div>{label}</div>
          <input
            type="text"
            value={typeof values[name] === 'string' ? (values[name] as string) : ''}
            onChange={(ev) => setFieldUnknown(name, ev.target.value)}
            disabled={options.disabled}
            placeholder={options.placeholder}
            maxLength={limits?.maxLength}
          />
        </label>
        {error && <div role="alert">{error}</div>}
      </div>
    );
  };

  const renderDefaultTextArea = (
    name: keyof CreateCharacterFormValues,
    label: string,
    options: { placeholder?: string; disabled?: boolean; rows?: number } = {}
  ) => {
    const limits = getFieldLimits(name);
    const error = fieldErrors[name];

    return (
      <div className={fieldClassName}>
        <label>
          <div>{label}</div>
          <textarea
            value={typeof values[name] === 'string' ? (values[name] as string) : ''}
            onChange={(ev) => setFieldUnknown(name, ev.target.value)}
            disabled={options.disabled}
            placeholder={options.placeholder}
            rows={options.rows ?? 4}
            maxLength={limits?.maxLength}
          />
        </label>
        {error && <div role="alert">{error}</div>}
      </div>
    );
  };

  const renderDefaultLinesTextArea = (
    name: keyof CreateCharacterFormValues,
    label: string,
    options: { placeholder?: string; disabled?: boolean; rows?: number } = {}
  ) => {
    const limits = getFieldLimits(name);
    const error = fieldErrors[name];

    const current = Array.isArray(values[name]) ? (values[name] as string[]) : [];

    return (
      <div className={fieldClassName}>
        <label>
          <div>
            {label}
            {typeof limits?.maxItems === 'number' ? ` (max ${limits.maxItems})` : ''}
          </div>
          <textarea
            value={joinLines(current)}
            onChange={(ev) => {
              const parsed = parseLines(ev.target.value);
              setField(name as keyof CreateCharacterFormValues, parsed as unknown as CreateCharacterFormValues[typeof name]);
            }}
            disabled={options.disabled}
            placeholder={options.placeholder}
            rows={options.rows ?? 4}
          />
        </label>
        {error && <div role="alert">{error}</div>}
      </div>
    );
  };

  const fieldsOrder: Array<keyof CreateCharacterFormValues> = [
    'name',
    'backstory',
    'systemPrompt',
    'bio',
    'lore',
    'topics',
    'adjectives',
    'postExamples',
  ];

  return (
    <form className={className} onSubmit={handleSubmit}>
      {formError && (
        <div role="alert">
          {formError}
        </div>
      )}

      {renderField ? (
        <>
          {fieldsOrder.map((name) => {
            const limits = getFieldLimits(name);
            const error = fieldErrors[name];

            return (
              <div key={String(name)}>
                {renderField({
                  name,
                  value: values[name],
                  setValue: (next) => setFieldUnknown(name, next),
                  error,
                  limits,
                })}
              </div>
            );
          })}
        </>
      ) : (
        <>
          {renderDefaultTextInput('name', 'Name', {
            placeholder: `Up to ${FIELD_LIMITS.name} characters`,
            disabled: busy,
          })}

          {renderDefaultTextArea('backstory', 'Backstory', {
            placeholder: 'A short background story (required)',
            disabled: busy,
            rows: 5,
          })}

          {renderDefaultTextArea('systemPrompt', 'System Prompt (optional)', {
            placeholder: `Up to ${FIELD_LIMITS.systemPrompt} characters`,
            disabled: busy,
            rows: 5,
          })}

          {renderDefaultLinesTextArea('bio', 'Bio (one per line)', {
            placeholder: `Up to ${FIELD_LIMITS.maxBioEntries} lines, ${FIELD_LIMITS.bio} chars each`,
            disabled: busy,
            rows: 4,
          })}

          {renderDefaultLinesTextArea('lore', 'Lore (one per line)', {
            placeholder: `Up to ${FIELD_LIMITS.maxLoreEntries} lines, ${FIELD_LIMITS.lore} chars each`,
            disabled: busy,
            rows: 4,
          })}

          {renderDefaultLinesTextArea('topics', 'Topics (one per line)', {
            placeholder: `Up to ${FIELD_LIMITS.maxTopics} lines, ${FIELD_LIMITS.topic} chars each`,
            disabled: busy,
            rows: 3,
          })}

          {renderDefaultLinesTextArea('adjectives', 'Adjectives (one per line)', {
            placeholder: `Up to ${FIELD_LIMITS.maxAdjectives} lines, ${FIELD_LIMITS.adjective} chars each`,
            disabled: busy,
            rows: 3,
          })}

          {renderDefaultLinesTextArea('postExamples', 'Post Examples (one per line)', {
            placeholder: `Up to ${FIELD_LIMITS.maxPostExamples} lines, ${FIELD_LIMITS.postExample} chars each`,
            disabled: busy,
            rows: 4,
          })}
        </>
      )}

      <div>
        <button
          className={buttonClassName}
          type="submit"
          disabled={busy}
        >
          {busy ? 'Creating…' : submitLabel}
        </button>
      </div>
    </form>
  );
}