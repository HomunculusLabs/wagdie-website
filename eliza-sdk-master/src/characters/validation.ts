import { z } from 'zod';
import { ElizaValidationError } from '../errors/ElizaValidationError.js';

/**
 * Field limits for Eliza character fields
 */
export const FIELD_LIMITS = {
  name: 100,
  bio: 500,
  maxBioEntries: 10,
  lore: 500,
  maxLoreEntries: 20,
  topic: 50,
  maxTopics: 30,
  adjective: 30,
  maxAdjectives: 20,
  styleRule: 200,
  maxStyleRules: 10,
  postExample: 280,
  maxPostExamples: 20,
  systemPrompt: 4000,
  maxKnowledgeDocs: 5,
  maxKnowledgeSize: 51200, // 50KB
} as const;

export const AgentCharacterSchema = z
  .object({
    name: z.string().min(1).max(FIELD_LIMITS.name).trim(),
  })
  .passthrough();

export type AgentCharacterValidated = z.infer<typeof AgentCharacterSchema>;

const ExampleMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(1000),
});

const CharacterStyleSchema = z.object({
  all: z.array(z.string().max(FIELD_LIMITS.styleRule)).max(FIELD_LIMITS.maxStyleRules).optional(),
  chat: z.array(z.string().max(FIELD_LIMITS.styleRule)).max(FIELD_LIMITS.maxStyleRules).optional(),
  post: z.array(z.string().max(FIELD_LIMITS.styleRule)).max(FIELD_LIMITS.maxStyleRules).optional(),
});

const KnowledgeDocumentSchema = z.object({
  id: z.string(),
  path: z.string(),
  content: z.string(),
});

// Extended Eliza field schemas
const BioSchema = z.array(z.string().max(FIELD_LIMITS.bio)).min(1).max(FIELD_LIMITS.maxBioEntries);
const LoreSchema = z.array(z.string().max(FIELD_LIMITS.lore)).max(FIELD_LIMITS.maxLoreEntries);
const TopicsSchema = z.array(z.string().max(FIELD_LIMITS.topic)).max(FIELD_LIMITS.maxTopics);
const AdjectivesSchema = z.array(z.string().max(FIELD_LIMITS.adjective)).max(FIELD_LIMITS.maxAdjectives);
const PostExamplesSchema = z.array(z.string().max(FIELD_LIMITS.postExample)).max(FIELD_LIMITS.maxPostExamples);
const KnowledgeSchema = z.array(KnowledgeDocumentSchema).max(FIELD_LIMITS.maxKnowledgeDocs);

export const CreateCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(FIELD_LIMITS.name, 'Name too long').trim(),
  personality: z.string().min(10, 'Personality must be at least 10 characters').max(5000).optional(),
  backstory: z.string().min(10, 'Backstory must be at least 10 characters').max(10000),
  systemPrompt: z.string().max(FIELD_LIMITS.systemPrompt).optional(),
  exampleMessages: z.array(ExampleMessageSchema).max(20).optional(),
  style: CharacterStyleSchema.optional(),
  externalId: z.string().max(255).optional(),
  // Extended Eliza fields
  bio: BioSchema.optional(),
  lore: LoreSchema.optional(),
  topics: TopicsSchema.optional(),
  adjectives: AdjectivesSchema.optional(),
  postExamples: PostExamplesSchema.optional(),
  knowledge: KnowledgeSchema.optional(),
});

export const UpdateCharacterInputSchema = z.object({
  name: z.string().min(1).max(FIELD_LIMITS.name).trim().optional(),
  personality: z.string().min(10).max(5000).optional(),
  backstory: z.string().min(10).max(10000).optional(),
  systemPrompt: z.string().max(FIELD_LIMITS.systemPrompt).optional(),
  exampleMessages: z.array(ExampleMessageSchema).max(20).optional(),
  style: CharacterStyleSchema.optional(),
  // Extended Eliza fields
  bio: BioSchema.optional(),
  lore: LoreSchema.optional(),
  topics: TopicsSchema.optional(),
  adjectives: AdjectivesSchema.optional(),
  postExamples: PostExamplesSchema.optional(),
  knowledge: KnowledgeSchema.optional(),
});

export type CreateCharacterInputValidated = z.infer<typeof CreateCharacterInputSchema>;
export type UpdateCharacterInputValidated = z.infer<typeof UpdateCharacterInputSchema>;

export function validateAgentCharacter(input: unknown): AgentCharacterValidated {
  const result = AgentCharacterSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw ElizaValidationError.fromFields(fieldErrors);
  }

  return result.data;
}

export function validateCreateCharacter(input: unknown): CreateCharacterInputValidated {
  const result = CreateCharacterInputSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw ElizaValidationError.fromFields(fieldErrors);
  }

  return result.data;
}

export function validateUpdateCharacter(input: unknown): UpdateCharacterInputValidated {
  const result = UpdateCharacterInputSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw ElizaValidationError.fromFields(fieldErrors);
  }

  return result.data;
}
