import type { HttpClient } from '../client/http.js';
import type {
  AgentCharacter,
  CharacterRecord,
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
  ExampleMessage,
} from '../types/character.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';
import { validateAgentCharacter, validateCreateCharacter, validateUpdateCharacter } from './validation.js';

interface CharacterListParams extends PaginationParams {
  // Future: add filters like search, tags, etc.
  nftCollectionId?: string;
}

function recordToLegacyCharacter(record: CharacterRecord): Character {
  const character = record.character;

  const backstory =
    typeof character['backstory'] === 'string' ? (character['backstory'] as string) : '';

  const personality =
    typeof character['personality'] === 'string'
      ? (character['personality'] as string)
      : undefined;

  const systemPrompt =
    typeof character['systemPrompt'] === 'string'
      ? (character['systemPrompt'] as string)
      : typeof character.system === 'string'
        ? character.system
        : undefined;

  const exampleMessages = Array.isArray(character['exampleMessages'])
    ? (character['exampleMessages'] as ExampleMessage[])
    : undefined;

  const lore = Array.isArray(character['lore']) ? (character['lore'] as string[]) : undefined;
  const adjectives = Array.isArray(character['adjectives'])
    ? (character['adjectives'] as string[])
    : undefined;

  const postExamples = Array.isArray(character['postExamples'])
    ? (character['postExamples'] as string[])
    : undefined;

  const knowledge = Array.isArray(character.knowledge) ? (character.knowledge as unknown[]) : undefined;

  return {
    id: record.id,
    name: character.name,
    externalId: record.externalId ?? undefined,
    personality,
    backstory,
    systemPrompt,
    exampleMessages,
    bio: character.bio,
    lore,
    topics: character.topics,
    adjectives,
    style: character.style as Character['style'],
    postExamples,
    knowledge: knowledge as Character['knowledge'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function exampleMessagesToMessageExamples(
  exampleMessages: ExampleMessage[]
): AgentCharacter['messageExamples'] {
  return exampleMessages.map((msg) => [{ name: msg.role, content: { text: msg.content } }]);
}

export class CharactersAPI {
  constructor(private http: HttpClient) {}

  async listRecords(params: CharacterListParams = {}): Promise<PaginatedResponse<CharacterRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const nftCollectionId =
      typeof params.nftCollectionId === 'string' ? params.nftCollectionId : undefined;

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));
    if (nftCollectionId) {
      query.set('nftCollectionId', nftCollectionId);
    }

    const response = await this.http.get<{
      characters: CharacterRecord[];
      total: number;
    }>(`/characters?${query.toString()}`);

    return {
      items: response.characters,
      total: response.total,
      page,
      pageSize,
      hasMore: page * pageSize < response.total,
    };
  }

  async getRecord(id: string): Promise<CharacterRecord> {
    return this.http.get<CharacterRecord>(`/characters/${id}`);
  }

  async createRecord(input: { externalId?: string; character: AgentCharacter }): Promise<CharacterRecord> {
    const validatedCharacter = validateAgentCharacter(input.character);

    const body = {
      externalId: input.externalId,
      character: validatedCharacter,
    };

    return this.http.post<CharacterRecord>('/characters', body);
  }

  async replaceRecord(id: string, input: { character: AgentCharacter }): Promise<CharacterRecord> {
    const validatedCharacter = validateAgentCharacter(input.character);

    const body = {
      character: validatedCharacter,
    };

    return this.http.put<CharacterRecord>(`/characters/${id}`, body);
  }

  async parseSummary(input: { summary: string }): Promise<CreateCharacterInput> {
    const response = await this.http.post<{ parsed: CreateCharacterInput }>(
      '/characters/parse-summary',
      input
    );

    return response.parsed;
  }

  /**
   * List all characters (with pagination)
   */
  async list(params: CharacterListParams = {}): Promise<PaginatedResponse<Character>> {
    const { page = 1, pageSize = 20 } = params;

    const records = await this.listRecords({ page, pageSize });

    return {
      items: records.items.map(recordToLegacyCharacter),
      total: records.total,
      page: records.page,
      pageSize: records.pageSize,
      hasMore: records.hasMore,
    };
  }

  /**
   * Get a character by ID
   */
  async get(id: string): Promise<Character> {
    const record = await this.getRecord(id);
    return recordToLegacyCharacter(record);
  }

  /**
   * Create a new character
   * If externalId is provided and a character with that externalId exists,
   * it will be updated instead (upsert behavior)
   */
  async create(input: CreateCharacterInput): Promise<Character> {
    const validated = validateCreateCharacter(input);

    const character: AgentCharacter = {
      name: validated.name,
      system: validated.systemPrompt,
      bio: validated.bio ?? (validated.personality ? [validated.personality] : undefined),
      topics: validated.topics,
      style: validated.style,
      knowledge: validated.knowledge,
      messageExamples: validated.exampleMessages
        ? exampleMessagesToMessageExamples(validated.exampleMessages)
        : undefined,
    };

    // Preserve legacy keys for backward compatibility (stored as passthrough keys)
    character.backstory = validated.backstory;
    if (validated.personality !== undefined) character.personality = validated.personality;
    if (validated.systemPrompt !== undefined) character.systemPrompt = validated.systemPrompt;
    if (validated.exampleMessages !== undefined) character.exampleMessages = validated.exampleMessages;
    if (validated.lore !== undefined) character.lore = validated.lore;
    if (validated.adjectives !== undefined) character.adjectives = validated.adjectives;
    if (validated.postExamples !== undefined) character.postExamples = validated.postExamples;

    const record = await this.createRecord({
      externalId: validated.externalId,
      character,
    });

    return recordToLegacyCharacter(record);
  }

  /**
   * Update an existing character
   */
  async update(id: string, input: UpdateCharacterInput): Promise<Character> {
    const validated = validateUpdateCharacter(input);

    const existing = await this.getRecord(id);
    const character: AgentCharacter = { ...(existing.character as AgentCharacter) };

    if (validated.name !== undefined) {
      character.name = validated.name;
    }

    if (validated.backstory !== undefined) {
      character.backstory = validated.backstory;
    }

    if (validated.systemPrompt !== undefined) {
      character.system = validated.systemPrompt;
      character.systemPrompt = validated.systemPrompt;
    }

    if (validated.personality !== undefined) {
      character.personality = validated.personality;
      if (validated.bio === undefined) {
        character.bio = [validated.personality];
      }
    }

    if (validated.exampleMessages !== undefined) {
      character.exampleMessages = validated.exampleMessages;
      character.messageExamples = exampleMessagesToMessageExamples(validated.exampleMessages);
    }

    if (validated.style !== undefined) {
      character.style = validated.style;
    }

    // Extended Eliza fields
    if (validated.bio !== undefined) {
      character.bio = validated.bio;
    }
    if (validated.lore !== undefined) {
      character.lore = validated.lore;
    }
    if (validated.topics !== undefined) {
      character.topics = validated.topics;
    }
    if (validated.adjectives !== undefined) {
      character.adjectives = validated.adjectives;
    }
    if (validated.postExamples !== undefined) {
      character.postExamples = validated.postExamples;
    }
    if (validated.knowledge !== undefined) {
      character.knowledge = validated.knowledge;
    }

    const record = await this.replaceRecord(id, { character });
    return recordToLegacyCharacter(record);
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/characters/${id}`);
  }

  /**
   * Get a character by external ID
   * Useful for integrations that track characters by their own IDs
   */
  async getByExternalId(externalId: string): Promise<Character | null> {
    try {
      const response = await this.http.get<CharacterRecord>(
        `/characters/external/${encodeURIComponent(externalId)}`
      );
      return recordToLegacyCharacter(response);
    } catch (error) {
      // Return null for 404 errors
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a CharacterRecord by external ID
   * Returns the full record with AgentCharacter payload (canonical format)
   */
  async getRecordByExternalId(externalId: string): Promise<CharacterRecord | null> {
    try {
      return await this.http.get<CharacterRecord>(
        `/characters/external/${encodeURIComponent(externalId)}`
      );
    } catch (error) {
      // Return null for 404 errors
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}
