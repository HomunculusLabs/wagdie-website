import type {
  AuthTokens,
  NonceResponse,
  PaginatedResponse,
  PaginationParams,
} from '../../types/index.js';
import type { AgentCharacter, CharacterRecord, CreateCharacterInput } from '../../types/character.js';
import type {
  StreamCallbacks,
  BuilderChatInput,
  BuilderChatResponse,
} from '../../types/chat.js';
import type { Conversation, ConversationDetail } from '../../types/conversation.js';
import type {
  NftCollection,
  ProvisionNftCharacterInput,
  ProvisionNftCharacterResponse,
  UpsertNftCollectionInput,
  UpdateNftCollectionInput,
  ListCollectionTokensInput,
  ListCollectionTokensResponse,
} from '../../types/nft.js';

export type CreateCharacterRecordInput = {
  externalId?: string;
  character: AgentCharacter;
};

export type ReplaceCharacterRecordInput = {
  character: AgentCharacter;
};

export type SendMessageStreamInput = {
  characterId: string;
  message: string;
  conversationId?: string;
};

// Re-export builder chat types from shared types
export type { BuilderChatInput, BuilderChatResponse } from '../../types/chat.js';

export interface ElizaTransport {
  auth: {
    getNonce(): Promise<NonceResponse>;
    verify(message: string, signature: string, sessionId: string): Promise<AuthTokens>;
  };

  characters: {
    listRecords(
      params?: PaginationParams & { nftCollectionId?: string }
    ): Promise<PaginatedResponse<CharacterRecord>>;
    getRecord(id: string): Promise<CharacterRecord>;
    createRecord(input: CreateCharacterRecordInput): Promise<CharacterRecord>;
    replaceRecord(id: string, input: ReplaceCharacterRecordInput): Promise<CharacterRecord>;
    parseSummary?: (input: { summary: string }) => Promise<CreateCharacterInput>;
  };

  chat: {
    sendMessageStream(input: SendMessageStreamInput, callbacks: StreamCallbacks): Promise<void>;
    sendBuilderMessage?(input: BuilderChatInput): Promise<BuilderChatResponse>;
  };

  conversations: {
    list(params?: PaginationParams): Promise<PaginatedResponse<Conversation>>;
    listForCharacter(
      characterId: string,
      params?: PaginationParams
    ): Promise<PaginatedResponse<Conversation>>;
    get(id: string): Promise<ConversationDetail>;
    delete(id: string): Promise<void>;
  };

  nft: {
    listCollections(params?: PaginationParams): Promise<PaginatedResponse<NftCollection>>;
    getCollection(id: string): Promise<NftCollection>;
    upsertCollection(input: UpsertNftCollectionInput): Promise<NftCollection>;
    updateCollection(id: string, input: UpdateNftCollectionInput): Promise<NftCollection>;
    deleteCollection(id: string): Promise<void>;
    provisionCharacter(input: ProvisionNftCharacterInput): Promise<ProvisionNftCharacterResponse>;
    listCollectionTokens(input: ListCollectionTokensInput): Promise<ListCollectionTokensResponse>;
  };
}