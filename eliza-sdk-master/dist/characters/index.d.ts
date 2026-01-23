import type { HttpClient } from '../client/http.js';
import type { AgentCharacter, CharacterRecord, Character, CreateCharacterInput, UpdateCharacterInput } from '../types/character.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';
interface CharacterListParams extends PaginationParams {
    nftCollectionId?: string;
}
export declare class CharactersAPI {
    private http;
    constructor(http: HttpClient);
    listRecords(params?: CharacterListParams): Promise<PaginatedResponse<CharacterRecord>>;
    getRecord(id: string): Promise<CharacterRecord>;
    createRecord(input: {
        externalId?: string;
        character: AgentCharacter;
    }): Promise<CharacterRecord>;
    replaceRecord(id: string, input: {
        character: AgentCharacter;
    }): Promise<CharacterRecord>;
    parseSummary(input: {
        summary: string;
    }): Promise<CreateCharacterInput>;
    /**
     * List all characters (with pagination)
     */
    list(params?: CharacterListParams): Promise<PaginatedResponse<Character>>;
    /**
     * Get a character by ID
     */
    get(id: string): Promise<Character>;
    /**
     * Create a new character
     * If externalId is provided and a character with that externalId exists,
     * it will be updated instead (upsert behavior)
     */
    create(input: CreateCharacterInput): Promise<Character>;
    /**
     * Update an existing character
     */
    update(id: string, input: UpdateCharacterInput): Promise<Character>;
    /**
     * Delete a character
     */
    delete(id: string): Promise<void>;
    /**
     * Get a character by external ID
     * Useful for integrations that track characters by their own IDs
     */
    getByExternalId(externalId: string): Promise<Character | null>;
    /**
     * Get a CharacterRecord by external ID
     * Returns the full record with AgentCharacter payload (canonical format)
     */
    getRecordByExternalId(externalId: string): Promise<CharacterRecord | null>;
}
export {};
