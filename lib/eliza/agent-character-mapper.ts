import type { AICharacter, StyleConfig, UpdateAICharacterInput } from '@/types/eliza'

import type { AgentCharacter, CharacterRecord } from '@/lib/eliza/sdk-types'
import { migratePersonalityToBio } from '@/lib/eliza/migration'
import {
  fromAgentMessageExamples,
  toAgentMessageExamples,
} from '@/lib/eliza/message-examples'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.filter((v) => typeof v === 'string') as string[]
  return items.length > 0 ? items : []
}

function mergeObjectsPreservingUndefined<T extends Record<string, unknown>>(
  existing: T | undefined,
  patch: T | undefined
): T | undefined {
  if (!existing && !patch) return undefined
  const result: Record<string, unknown> = { ...(existing || {}) }

  if (patch) {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue
      result[key] = value
    }
  }

  return result as T
}

/**
 * Create an AgentCharacter payload from wagdie's AICharacter DTO.
 *
 * Key mappings:
 * - systemPrompt -> system
 * - personality -> bio[] (via migratePersonalityToBio)
 * - backstory -> preserved as custom key AND also mirrored into `lore[]` for editor compatibility
 * - exampleMessages -> messageExamples (canonical SDK format)
 */
export function toAgentCharacterFromAICharacter(input: Partial<AICharacter>): AgentCharacter {
  const name = isNonEmptyString(input.name) ? input.name.trim() : 'Unnamed Character'

  const bio =
    Array.isArray(input.bio) && input.bio.length > 0
      ? input.bio
      : migratePersonalityToBio(input.personality ?? null)

  const topics = Array.isArray(input.topics) ? input.topics : []

  const loreFromInput =
    Array.isArray(input.lore) && input.lore.length > 0
      ? input.lore
      : isNonEmptyString(input.backstory)
        ? [input.backstory]
        : []

  // Convert to canonical messageExamples format
  const messageExamples = toAgentMessageExamples(input.exampleMessages)

  const character: AgentCharacter = {
    name,
    system: input.systemPrompt ?? undefined,
    bio,
    topics,
    messageExamples,
    // StyleConfig is compatible with the SDK `style` shape (all/chat/post arrays).
    style: (input.style as unknown as AgentCharacter['style']) ?? undefined,

    // Custom/back-compat keys (AgentCharacter is permissive by design with [key: string]: unknown)
    backstory: input.backstory ?? null,
    lore: loreFromInput,
    adjectives: asStringArray((input as unknown as Record<string, unknown>).adjectives) ?? [],
    postExamples: Array.isArray(input.postExamples) ? input.postExamples : [],
  }

  return character
}

/**
 * Create a *partial* AgentCharacter patch from wagdie's UpdateAICharacterInput.
 *
 * This is intended to be merged into an existing AgentCharacter before calling
 * `characters.replaceRecord(id, { character })` (full replace).
 */
export function toAgentCharacterPatchFromUpdate(
  update: UpdateAICharacterInput
): Partial<AgentCharacter> {
  const patch: Partial<AgentCharacter> = {}

  if (update.name !== undefined) {
    patch.name = update.name
  }

  if (update.systemPrompt !== undefined) {
    patch.system = update.systemPrompt ?? undefined
  }

  // bio: prefer explicit bio[], otherwise derive from legacy personality
  if (update.bio !== undefined) {
    patch.bio = update.bio
  } else if (update.personality !== undefined) {
    patch.bio = migratePersonalityToBio(update.personality ?? null)
  }

  if (update.topics !== undefined) {
    patch.topics = update.topics
  }

  if (update.style !== undefined) {
    patch.style = update.style as unknown as AgentCharacter['style']
  }

  // Convert to canonical messageExamples format
  if (update.exampleMessages !== undefined) {
    patch.messageExamples = toAgentMessageExamples(update.exampleMessages)
  }

  // Backstory: keep custom key, mirror into lore[] for editor/compat.
  if (update.backstory !== undefined) {
    const backstory = update.backstory ?? ''
    const patchWithBackstory = patch as unknown as { backstory: string | null; lore: string[] }
    patchWithBackstory.backstory = backstory
    patchWithBackstory.lore = isNonEmptyString(backstory) ? [backstory] : []
  }

  // Extended wagdie fields (not in SDK type but supported by AgentCharacter's permissive keys)
  if (update.lore !== undefined) {
    const patchWithLore = patch as unknown as { lore: string[] | undefined }
    patchWithLore.lore = update.lore
  }
  if (update.adjectives !== undefined) {
    const patchWithAdjectives = patch as unknown as { adjectives: string[] | undefined }
    patchWithAdjectives.adjectives = update.adjectives
  }
  if (update.postExamples !== undefined) {
    const patchWithPostExamples = patch as unknown as { postExamples: string[] | undefined }
    patchWithPostExamples.postExamples = update.postExamples
  }

  return patch
}

/**
 * Merge helper for safe `characters.replaceRecord()` usage.
 *
 * Rules:
 * - Undefined patch values do NOT overwrite existing values.
 * - Arrays overwrite only when patch provides a value (including empty arrays).
 * - `style` and `settings` are shallow-merged, preserving existing keys unless patch defines them.
 * - Other keys are assigned directly.
 */
export function mergeAgentCharacter(
  existing: AgentCharacter,
  patch: Partial<AgentCharacter>
): AgentCharacter {
  const merged: AgentCharacter = { ...existing }

  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (value === undefined) continue

    if (key === 'style') {
      merged.style = mergeObjectsPreservingUndefined(
        existing.style as Record<string, unknown> | undefined,
        value as Record<string, unknown> | undefined
      ) as AgentCharacter['style']
      continue
    }

    if (key === 'settings') {
      merged.settings = mergeObjectsPreservingUndefined(
        existing.settings as Record<string, unknown> | undefined,
        value as Record<string, unknown> | undefined
      ) as AgentCharacter['settings']
      continue
    }

    const mergedRecord = merged as unknown as Record<string, unknown>
    mergedRecord[key] = value
  }

  // Ensure required field
  if (!isNonEmptyString(merged.name)) {
    merged.name = isNonEmptyString(existing.name) ? existing.name : 'Unnamed Character'
  }

  return merged
}

/**
 * Apply a wagdie UpdateAICharacterInput to an existing AgentCharacter and return the merged result.
 */
export function applyWagdieUpdateToAgentCharacter(
  existing: AgentCharacter,
  update: UpdateAICharacterInput
): AgentCharacter {
  const patch = toAgentCharacterPatchFromUpdate(update)
  return mergeAgentCharacter(existing, patch)
}

/**
 * Extract backstory with backward compatibility:
 * - Prefer custom `backstory` key if present
 * - Otherwise fall back to the first `lore` entry if present
 */
export function extractBackstory(character: AgentCharacter): string | null {
  const backstory = (character as unknown as { backstory?: unknown }).backstory
  if (typeof backstory === 'string') return backstory
  if (backstory === null) return null

  const lore = (character as unknown as { lore?: unknown }).lore
  const loreArr = asStringArray(lore)
  if (loreArr && loreArr.length > 0) return loreArr[0]

  return null
}

/**
 * Map an SDK CharacterRecord into wagdie's AICharacter DTO.
 *
 * This keeps wagdie's existing DTO stable while we migrate internals to v0.2.
 * Uses canonical `messageExamples` (AgentMessageExample) rather than legacy `exampleMessages`.
 */
export function toAICharacterFromRecord(tokenId: string, record: CharacterRecord): AICharacter {
  const c = record.character

  const bio = Array.isArray(c.bio) ? c.bio : []
  const topics = Array.isArray(c.topics) ? c.topics : []

  const lore = asStringArray((c as unknown as { lore?: unknown }).lore) ?? []
  const adjectives = asStringArray((c as unknown as { adjectives?: unknown }).adjectives) ?? []
  const postExamples = asStringArray((c as unknown as { postExamples?: unknown }).postExamples) ?? []

  const backstory = extractBackstory(c)

  // Convert from canonical messageExamples to wagdie's exampleMessages format
  const exampleMessages = fromAgentMessageExamples(c.messageExamples)

  return {
    id: record.id,
    externalId: record.externalId ?? tokenId,
    name: c.name,
    // Back-compat: keep personality populated from bio for older UI usage.
    personality: bio.length > 0 ? bio.join('\n\n') : null,
    backstory,
    systemPrompt: c.system ?? null,
    exampleMessages,

    bio,
    lore,
    topics,
    adjectives,
    style: (c.style as unknown as StyleConfig) ?? undefined,
    postExamples,
    knowledge: undefined,

    createdAt: record.createdAt ?? '',
    updatedAt: record.updatedAt ?? '',
  }
}
