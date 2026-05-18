/**
 * Zod validation schemas for Eliza character fields
 * Based on data-model.md and spec.md field limits
 */

import { z } from 'zod'
import { FIELD_LIMITS } from '@/types/eliza'

export const nullableTrimmedString = (max: number, label: string) =>
  z
    .union([z.string().max(max, `${label} must be at most ${max} characters`), z.null()])
    .transform((value) => {
      if (value === null) return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    })

/**
 * Bio array schema - required, 1-10 items, 500 chars each
 */
export const bioSchema = z
  .array(z.string().max(FIELD_LIMITS.bio, `Bio entry must be at most ${FIELD_LIMITS.bio} characters`))
  .min(1, 'At least one bio entry is required')
  .max(FIELD_LIMITS.maxBioEntries, `Maximum ${FIELD_LIMITS.maxBioEntries} bio entries allowed`)

/** Bio array schema for updates/imports where [] means explicit clear. */
export const bioUpdateSchema = z
  .array(z.string().max(FIELD_LIMITS.bio, `Bio entry must be at most ${FIELD_LIMITS.bio} characters`))
  .max(FIELD_LIMITS.maxBioEntries, `Maximum ${FIELD_LIMITS.maxBioEntries} bio entries allowed`)

/**
 * Lore array schema - optional, 0-20 items, 500 chars each
 */
export const loreSchema = z
  .array(z.string().max(FIELD_LIMITS.lore, `Lore entry must be at most ${FIELD_LIMITS.lore} characters`))
  .max(FIELD_LIMITS.maxLoreEntries, `Maximum ${FIELD_LIMITS.maxLoreEntries} lore entries allowed`)

/**
 * Topics array schema - optional, 0-30 items, 50 chars each
 */
export const topicsSchema = z
  .array(z.string().max(FIELD_LIMITS.topic, `Topic must be at most ${FIELD_LIMITS.topic} characters`))
  .max(FIELD_LIMITS.maxTopics, `Maximum ${FIELD_LIMITS.maxTopics} topics allowed`)

/**
 * Adjectives array schema - optional, 0-20 items, 30 chars each
 */
export const adjectivesSchema = z
  .array(z.string().max(FIELD_LIMITS.adjective, `Adjective must be at most ${FIELD_LIMITS.adjective} characters`))
  .max(FIELD_LIMITS.maxAdjectives, `Maximum ${FIELD_LIMITS.maxAdjectives} adjectives allowed`)

/**
 * Style rule array schema - 0-10 items, 200 chars each
 */
const styleRuleArraySchema = z
  .array(z.string().max(FIELD_LIMITS.styleRule, `Style rule must be at most ${FIELD_LIMITS.styleRule} characters`))
  .max(FIELD_LIMITS.maxStyleRules, `Maximum ${FIELD_LIMITS.maxStyleRules} style rules allowed`)

/**
 * Style config schema - all/chat/post arrays
 */
export const styleConfigSchema = z.object({
  all: styleRuleArraySchema.optional(),
  chat: styleRuleArraySchema.optional(),
  post: styleRuleArraySchema.optional(),
})

/**
 * Post examples array schema - optional, 0-20 items, 280 chars each
 */
export const postExamplesSchema = z
  .array(z.string().max(FIELD_LIMITS.postExample, `Post example must be at most ${FIELD_LIMITS.postExample} characters`))
  .max(FIELD_LIMITS.maxPostExamples, `Maximum ${FIELD_LIMITS.maxPostExamples} post examples allowed`)

/**
 * System prompt schema - optional, 0-4000 chars
 */
export const systemPromptSchema = z
  .string()
  .max(FIELD_LIMITS.systemPrompt, `System prompt must be at most ${FIELD_LIMITS.systemPrompt} characters`)

export const nullableSystemPromptSchema = nullableTrimmedString(FIELD_LIMITS.systemPrompt, 'System prompt')
export const usernameSchema = nullableTrimmedString(FIELD_LIMITS.username, 'Username')
export const backstorySchema = nullableTrimmedString(FIELD_LIMITS.backstory, 'Backstory')

const safeMetadataValueSchema = z.union([
  z.string().max(FIELD_LIMITS.metadataStringValue),
  z.number(),
  z.boolean(),
  z.null(),
])

const keyRegex = /^[A-Za-z0-9_.-]{1,64}$/

export const templatesSchema = z
  .union([
    z.record(
      z.string().regex(keyRegex, 'Template name may contain letters, numbers, underscore, dash, and dot'),
      z.string().max(FIELD_LIMITS.templateBody)
    ).refine((value) => Object.keys(value).length <= FIELD_LIMITS.maxTemplates, {
      message: `Maximum ${FIELD_LIMITS.maxTemplates} templates allowed`,
    }),
    z.null(),
  ])

export const safeSettingsSchema = z.object({
  avatar: nullableTrimmedString(FIELD_LIMITS.settingsAvatar, 'Avatar').optional(),
  metadata: z.object({
    wagdieUser: z
      .union([
        z.record(
          z.string().regex(keyRegex, 'Metadata key may contain letters, numbers, underscore, dash, and dot'),
          safeMetadataValueSchema
        ).refine((value) => Object.keys(value).length <= FIELD_LIMITS.maxMetadataKeys, {
          message: `Maximum ${FIELD_LIMITS.maxMetadataKeys} metadata keys allowed`,
        }),
        z.null(),
      ])
      .optional(),
  }).optional(),
})

export const assistantStyleConfigSchema = z.object({
  all: styleRuleArraySchema.optional(),
  chat: styleRuleArraySchema.optional(),
  post: styleRuleArraySchema.optional(),
}).strict()

export const assistantSafeSettingsSchema = z.object({
  avatar: nullableTrimmedString(FIELD_LIMITS.settingsAvatar, 'Avatar').optional(),
  metadata: z.object({
    wagdieUser: z
      .union([
        z.record(
          z.string().regex(keyRegex, 'Metadata key may contain letters, numbers, underscore, dash, and dot'),
          safeMetadataValueSchema
        ).refine((value) => Object.keys(value).length <= FIELD_LIMITS.maxMetadataKeys, {
          message: `Maximum ${FIELD_LIMITS.maxMetadataKeys} metadata keys allowed`,
        }),
        z.null(),
      ])
      .optional(),
  }).strict().optional(),
}).strict()

export const assistantTemplatesSchema = z.record(
  z.string().regex(keyRegex, 'Template name may contain letters, numbers, underscore, dash, and dot'),
  z.string().max(FIELD_LIMITS.templateBody)
).refine((value) => Object.keys(value).length <= FIELD_LIMITS.maxTemplates, {
  message: `Maximum ${FIELD_LIMITS.maxTemplates} templates allowed`,
})

/**
 * Example message schema
 */
export const exampleMessageSchema = z.object({
  userMessage: z.string().max(FIELD_LIMITS.userMessageExample, `User message must be at most ${FIELD_LIMITS.userMessageExample} characters`),
  assistantMessage: z.string().max(FIELD_LIMITS.assistantMessageExample, `Assistant message must be at most ${FIELD_LIMITS.assistantMessageExample} characters`),
})

/**
 * Example messages array schema
 */
export const exampleMessagesSchema = z
  .array(exampleMessageSchema)
  .max(FIELD_LIMITS.maxExampleMessages, `Maximum ${FIELD_LIMITS.maxExampleMessages} example messages allowed`)

export const assistantExampleMessageSchema = exampleMessageSchema.strict()

export const assistantExampleMessagesSchema = z
  .array(assistantExampleMessageSchema)
  .max(FIELD_LIMITS.maxExampleMessages, `Maximum ${FIELD_LIMITS.maxExampleMessages} example messages allowed`)

/**
 * Knowledge document schema (for validation only, not file content)
 */
export const knowledgeDocumentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  size: z.number().max(FIELD_LIMITS.maxKnowledgeSize, `Document must be at most ${FIELD_LIMITS.maxKnowledgeSize / 1024}KB`),
  mimeType: z.enum(['text/plain', 'text/markdown']),
  uploadedAt: z.string(),
})

/**
 * Full AI persona update schema for form/API validation
 */
export const aiPersonaUpdateSchema = z.object({
  name: z.string().max(FIELD_LIMITS.name).optional(),
  username: usernameSchema.optional(),
  personality: z.string().max(FIELD_LIMITS.personality).optional(),
  backstory: backstorySchema.optional(),
  system: nullableSystemPromptSchema.optional(),
  systemPrompt: nullableSystemPromptSchema.optional(),
  templates: templatesSchema.optional(),
  settings: safeSettingsSchema.optional(),
  bio: bioUpdateSchema.optional(),
  lore: loreSchema.optional(),
  topics: topicsSchema.optional(),
  adjectives: adjectivesSchema.optional(),
  style: styleConfigSchema.optional(),
  postExamples: postExamplesSchema.optional(),
  exampleMessages: exampleMessagesSchema.optional(),
}).passthrough()

const exportMessageSchema = z.object({
  user: z.string().optional(),
  name: z.string().optional(),
  content: z.object({ text: z.string() }),
}).refine((value) => Boolean(value.user || value.name), {
  message: 'Message example entries must include user or name',
})

/**
 * Eliza character export validation schema. Passthrough is intentional so the
 * policy layer can warn about skipped backend-owned/unsupported fields.
 */
export const elizaCharacterExportSchema = z.object({
  name: z.string().max(FIELD_LIMITS.name).optional(),
  username: z.string().max(FIELD_LIMITS.username).optional(),
  bio: bioUpdateSchema.optional(),
  lore: loreSchema.optional(),
  backstory: z.union([z.string().max(FIELD_LIMITS.backstory), z.null()]).optional(),
  topics: topicsSchema.optional(),
  adjectives: adjectivesSchema.optional(),
  style: styleConfigSchema.optional(),
  messageExamples: z.array(z.array(exportMessageSchema)).optional(),
  postExamples: postExamplesSchema.optional(),
  system: systemPromptSchema.optional(),
  systemPrompt: systemPromptSchema.optional(),
  templates: templatesSchema.optional(),
  settings: safeSettingsSchema.passthrough().optional(),
  knowledge: z.array(z.object({
    id: z.string(),
    path: z.string(),
    content: z.string(),
  })).max(FIELD_LIMITS.maxKnowledgeDocs).optional(),
}).passthrough()

export const personaAssistantEditableDraftSchema = z.object({
  username: usernameSchema.optional(),
  backstory: backstorySchema.optional(),
  system: nullableSystemPromptSchema.optional(),
  bio: bioUpdateSchema.optional(),
  lore: loreSchema.optional(),
  topics: topicsSchema.optional(),
  adjectives: adjectivesSchema.optional(),
  style: assistantStyleConfigSchema.optional(),
  exampleMessages: assistantExampleMessagesSchema.optional(),
  postExamples: postExamplesSchema.optional(),
  templates: assistantTemplatesSchema.optional(),
  settings: assistantSafeSettingsSchema.optional(),
}).strict()

export const personaAssistantMessageSchema = z.object({
  id: z.string().min(1).max(120),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(FIELD_LIMITS.messageContent),
  createdAt: z.string().min(1),
}).strict()

export const personaAssistantRequestSchema = z.object({
  mode: z.enum(['chat', 'generate']),
  messages: z.array(personaAssistantMessageSchema).max(30),
  editorSnapshot: personaAssistantEditableDraftSchema,
}).strict()

export type AIPersonaUpdateInput = z.infer<typeof aiPersonaUpdateSchema>
export type ElizaCharacterExportInput = z.infer<typeof elizaCharacterExportSchema>
export type PersonaAssistantEditableDraftInput = z.infer<typeof personaAssistantEditableDraftSchema>
export type PersonaAssistantRequestInput = z.infer<typeof personaAssistantRequestSchema>
