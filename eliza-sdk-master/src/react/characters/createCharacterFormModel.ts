import type { CreateCharacterInput } from '../../types/character.js';
import { FIELD_LIMITS } from '../../characters/validation.js';

export interface CreateCharacterFormValues {
  name: string;
  backstory: string; // maps to CreateCharacterInput.backstory (required by schema)
  systemPrompt?: string; // optional system prompt
  bio?: string[]; // additional bio entries
  lore?: string[];
  topics?: string[];
  adjectives?: string[];
  postExamples?: string[];
}

// Export FIELD_LIMITS for form validation UI
export { FIELD_LIMITS };

function normalizeString(value: string): string {
  return value.trim();
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStringArray(values: string[] | undefined): string[] | undefined {
  if (!Array.isArray(values)) return undefined;

  const normalized = values
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

// Convert form values → CreateCharacterInput (for SDK validation)
export function toCreateCharacterInput(values: CreateCharacterFormValues): CreateCharacterInput {
  const name = normalizeString(values.name);
  const backstory = normalizeString(values.backstory);

  const systemPrompt = normalizeOptionalString(values.systemPrompt);

  const bioExtra = normalizeStringArray(values.bio);
  const lore = normalizeStringArray(values.lore);
  const topics = normalizeStringArray(values.topics);
  const adjectives = normalizeStringArray(values.adjectives);
  const postExamples = normalizeStringArray(values.postExamples);

  // If backstory is short enough to qualify as a bio entry, include it as the first bio line.
  // This preserves the "backstory maps to bio[0]" intent without forcing long backstories
  // into bio limits (500 chars).
  const bioFromBackstory =
    backstory.length > 0 && backstory.length <= FIELD_LIMITS.bio ? [backstory] : [];

  const bioCombined =
    bioFromBackstory.length > 0 || (bioExtra && bioExtra.length > 0)
      ? uniqueStrings([...(bioFromBackstory ?? []), ...(bioExtra ?? [])])
      : undefined;

  return {
    name,
    backstory,
    ...(systemPrompt ? { systemPrompt } : {}),
    ...(bioCombined ? { bio: bioCombined } : {}),
    ...(lore ? { lore } : {}),
    ...(topics ? { topics } : {}),
    ...(adjectives ? { adjectives } : {}),
    ...(postExamples ? { postExamples } : {}),
  };
}

// Default form values
export function getDefaultFormValues(): CreateCharacterFormValues {
  return {
    name: '',
    backstory: '',
    systemPrompt: '',
    bio: [],
    lore: [],
    topics: [],
    adjectives: [],
    postExamples: [],
  };
}