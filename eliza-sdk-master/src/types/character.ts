/**
 * Character Types - Extended for Full Eliza SDK Support
 */

export type AgentMessage = {
  /**
   * Message author name (e.g. `user`, `assistant`, or an agent name).
   * Canonical message examples store `content.text` as the primary content.
   */
  name: string;
  content: { text: string };
  [key: string]: unknown;
};

export type AgentMessageExample = AgentMessage[];

export type CharacterPermissions = {
  canEdit: boolean;
};

/**
 * Canonical ElizaOS agent character payload (preferred).
 *
 * This type is intentionally permissive (`[key: string]: unknown`) so unknown keys
 * can round-trip end-to-end (editor -> API -> DB -> API -> editor) without loss.
 */
export type AgentCharacter = {
  name: string;
  username?: string;
  plugins?: string[];
  system?: string;
  bio?: string[];
  topics?: string[];
  messageExamples?: AgentMessageExample[];
  style?: {
    all?: string[];
    chat?: string[];
    post?: string[];
    [key: string]: unknown;
  };
  settings?: {
    /**
     * Secrets should typically be write-only and are often redacted by APIs.
     */
    secrets?: Record<string, string>;
    avatar?: string;
    [key: string]: unknown;
  };
  knowledge?: unknown;
  templates?: unknown;
  [key: string]: unknown;
};

/**
 * Canonical persisted character record returned by the Eliza API (preferred).
 */
export type CharacterRecord = {
  id: string;
  externalId: string | null;
  character: AgentCharacter;
  permissions?: CharacterPermissions;
  createdAt: string;
  updatedAt: string;
};

export interface ExampleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CharacterStyle {
  all?: string[];
  chat?: string[];
  post?: string[];
}

/**
 * Knowledge document for RAG integration
 */
export interface KnowledgeDocument {
  id: string;
  path: string;
  content: string;
}

/**
 * @deprecated Prefer canonical `CharacterRecord` (with `character: AgentCharacter`).
 */
export interface Character {
  id: string;
  name: string;
  /** External system ID for integration with external systems */
  externalId?: string;
  /** @deprecated Use bio[] instead. Kept for backward compatibility. */
  personality?: string;
  backstory: string;
  systemPrompt?: string;
  exampleMessages?: ExampleMessage[];
  // Extended Eliza fields
  /** Biographical snippets (1-10 items, 500 chars each) - randomly sampled for entropy */
  bio?: string[];
  /** History, facts, unique traits (0-20 items, 500 chars each) */
  lore?: string[];
  /** Areas of interest/expertise (0-30 items, 50 chars each) */
  topics?: string[];
  /** Personality trait keywords (0-20 items, 30 chars each) */
  adjectives?: string[];
  /** Writing style configuration */
  style?: CharacterStyle;
  /** Social media post examples (0-20 items, 280 chars each) */
  postExamples?: string[];
  /** Reference documents for RAG (0-5 documents, 50KB each) */
  knowledge?: KnowledgeDocument[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * @deprecated Prefer canonical create payload `{ externalId?: string; character: AgentCharacter }`.
 */
export interface CreateCharacterInput {
  name: string;
  /** @deprecated Use bio[] instead */
  personality?: string;
  backstory: string;
  systemPrompt?: string;
  exampleMessages?: ExampleMessage[];
  /** External system ID for upsert behavior */
  externalId?: string;
  // Extended Eliza fields
  /** Biographical snippets (1-10 items, 500 chars each) */
  bio?: string[];
  /** History, facts, unique traits (0-20 items, 500 chars each) */
  lore?: string[];
  /** Areas of interest/expertise (0-30 items, 50 chars each) */
  topics?: string[];
  /** Personality trait keywords (0-20 items, 30 chars each) */
  adjectives?: string[];
  /** Writing style configuration */
  style?: CharacterStyle;
  /** Social media post examples (0-20 items, 280 chars each) */
  postExamples?: string[];
  /** Reference documents for RAG (0-5 documents, 50KB each) */
  knowledge?: KnowledgeDocument[];
}

/**
 * @deprecated Prefer canonical replace payload `{ character: AgentCharacter }`.
 */
export interface UpdateCharacterInput {
  name?: string;
  /** @deprecated Use bio[] instead */
  personality?: string;
  backstory?: string;
  systemPrompt?: string;
  exampleMessages?: ExampleMessage[];
  // Extended Eliza fields
  /** Biographical snippets (1-10 items, 500 chars each) */
  bio?: string[];
  /** History, facts, unique traits (0-20 items, 500 chars each) */
  lore?: string[];
  /** Areas of interest/expertise (0-30 items, 50 chars each) */
  topics?: string[];
  /** Personality trait keywords (0-20 items, 30 chars each) */
  adjectives?: string[];
  /** Writing style configuration */
  style?: CharacterStyle;
  /** Social media post examples (0-20 items, 280 chars each) */
  postExamples?: string[];
  /** Reference documents for RAG (0-5 documents, 50KB each) */
  knowledge?: KnowledgeDocument[];
}
