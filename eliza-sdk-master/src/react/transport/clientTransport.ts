import { ElizaClient } from '../../client/ElizaClient.js';
import type { PaginationParams } from '../../types/index.js';
import type { AgentCharacter } from '../../types/character.js';
import type { StreamCallbacks } from '../../types/chat.js';
import type { ElizaTransport, SendMessageStreamInput } from './types.js';

export function createClientTransport(client: ElizaClient): ElizaTransport {
  return {
    auth: {
      getNonce: () => client.auth.getNonce(),
      verify: (message: string, signature: string, sessionId: string) =>
        client.auth.verify(message, signature, sessionId),
    },

    characters: {
      listRecords: (params?: PaginationParams & { nftCollectionId?: string }) =>
        client.characters.listRecords(params),
      getRecord: (id: string) => client.characters.getRecord(id),
      createRecord: (input: { externalId?: string; character: AgentCharacter }) =>
        client.characters.createRecord(input),
      replaceRecord: (id: string, input: { character: AgentCharacter }) =>
        client.characters.replaceRecord(id, input),
      parseSummary: (input: { summary: string }) => client.characters.parseSummary(input),
    },

    chat: {
      sendMessageStream: (input: SendMessageStreamInput, callbacks: StreamCallbacks) =>
        client.chat.sendMessageStream(input, callbacks),
      sendBuilderMessage: (input) => client.chat.sendBuilderMessage(input),
    },

    conversations: {
      list: (params?: PaginationParams) => client.conversations.list(params),
      listForCharacter: (characterId: string, params?: PaginationParams) =>
        client.conversations.listForCharacter(characterId, params),
      get: (id: string) => client.conversations.get(id),
      delete: (id: string) => client.conversations.delete(id),
    },

    nft: {
      listCollections: (params?: PaginationParams) => client.nft.listCollections(params),
      getCollection: (id: string) => client.nft.getCollection(id),
      upsertCollection: (input) => client.nft.upsertCollection(input),
      updateCollection: (id, input) => client.nft.updateCollection(id, input),
      deleteCollection: (id: string) => client.nft.deleteCollection(id),
      provisionCharacter: (input) => client.nft.provisionCharacter(input),
      listCollectionTokens: (input) => client.nft.listCollectionTokens(input),
    },
  };
}