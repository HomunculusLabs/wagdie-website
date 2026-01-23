import type {
  AuthTokens,
  NonceResponse,
  PaginatedResponse,
  PaginationParams,
} from '../../types/index.js';
import type { AgentCharacter, CharacterRecord, CreateCharacterInput } from '../../types/character.js';
import type { StreamCallbacks, BuilderChatInput, BuilderChatResponse } from '../../types/chat.js';
import type { Conversation, ConversationDetail } from '../../types/conversation.js';
import type {
  NftCollection,
  ProvisionNftCharacterInput,
  ProvisionNftCharacterResponse,
  TokenStandard,
  UpsertNftCollectionInput,
  UpdateNftCollectionInput,
  ListCollectionTokensInput,
  ListCollectionTokensResponse,
} from '../../types/nft.js';

import { ElizaAPIError } from '../../errors/ElizaAPIError.js';
import { ElizaNetworkError } from '../../errors/ElizaNetworkError.js';

import type { ElizaTransport, SendMessageStreamInput } from './types.js';
import { readSSEStream } from './sse.js';

export interface FetchTransportConfig {
  baseUrl: string;
  authNoncePath?: string; // default: "/auth/nonce"
  authVerifyPath?: string; // default: "/auth/verify"
  charactersPath?: string; // default: "/characters"
  conversationsPath?: string; // default: "/conversations"
  chatStreamPath?: string; // default: "/chat"
  builderChatPath?: string; // default: "/chat/builder"
  charactersParseSummaryPath?: string; // default: "/characters/parse-summary"
  nftCollectionsPath?: string; // default: "/nft/collections"
  nftProvisionPath?: string; // default: "/nft/provision"
  fetch?: typeof globalThis.fetch;
  credentials?: RequestCredentials; // default: "include"
  getAuthHeader?: () => string | null;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${normalizePath(path)}`;
}

function withQuery(url: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, value);
  }

  const queryString = params.toString();
  if (!queryString) return url;

  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    try {
      const text = await response.text();
      return safeParseJson(text);
    } catch {
      return null;
    }
  }
}

function toAuthTokens(data: unknown): AuthTokens {
  if (!isRecord(data)) {
    throw new ElizaAPIError('Invalid auth response', 500);
  }

  const accessToken =
    (typeof data.accessToken === 'string' && data.accessToken) ||
    (typeof data.token === 'string' && data.token) ||
    null;

  if (!accessToken) {
    throw new ElizaAPIError('Missing access token in auth response', 500);
  }

  const refreshToken = typeof data.refreshToken === 'string' ? data.refreshToken : undefined;

  let expiresAt: number | undefined = undefined;

  if (typeof data.expiresAt === 'number') {
    expiresAt = data.expiresAt;
  } else if (typeof data.expiresAt === 'string') {
    const parsed = new Date(data.expiresAt).getTime();
    if (!Number.isNaN(parsed)) expiresAt = parsed;
  } else if (typeof data.expiresIn === 'number') {
    expiresAt = Date.now() + data.expiresIn * 1000;
  }

  return { accessToken, refreshToken, expiresAt };
}

function coercePaginatedResponse<T>(
  data: unknown,
  options: {
    page: number;
    pageSize: number;
    itemsKey?: 'items' | 'characters' | 'conversations';
  }
): PaginatedResponse<T> {
  const { page, pageSize, itemsKey } = options;

  if (!isRecord(data)) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  // Already in SDK shape
  if (Array.isArray(data.items) && typeof data.total === 'number') {
    return {
      items: data.items as T[],
      total: data.total,
      page: typeof data.page === 'number' ? data.page : page,
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : pageSize,
      hasMore: typeof data.hasMore === 'boolean'
        ? data.hasMore
        : (typeof data.page === 'number' && typeof data.pageSize === 'number'
          ? data.page * data.pageSize < data.total
          : page * pageSize < data.total),
    };
  }

  // Common alternative shapes
  const key = itemsKey;
  const rawItems =
    key && Array.isArray((data as UnknownRecord)[key])
      ? ((data as UnknownRecord)[key] as unknown[])
      : null;

  const total = typeof data.total === 'number' ? data.total : (rawItems ? rawItems.length : 0);

  if (rawItems) {
    return {
      items: rawItems as T[],
      total,
      page: typeof data.page === 'number' ? data.page : page,
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : pageSize,
      hasMore: typeof data.hasMore === 'boolean'
        ? data.hasMore
        : page * pageSize < total,
    };
  }

  // Fallback: no known list key
  return { items: [], total: 0, page, pageSize, hasMore: false };
}

function coerceTokenStandard(value: unknown): TokenStandard {
  if (value === 'erc721' || value === 'erc1155' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

function mapNftCollection(data: unknown): NftCollection {
  if (!isRecord(data)) {
    throw new ElizaAPIError('Invalid NFT collection response', 500);
  }

  const config = isRecord(data.config) ? (data.config as Record<string, unknown>) : undefined;

  return {
    id: typeof data.id === 'string' ? data.id : '',
    chainId: typeof data.chainId === 'number' ? data.chainId : 0,
    contractAddress: typeof data.contractAddress === 'string' ? data.contractAddress : '',
    name: typeof data.name === 'string' ? data.name : '',
    tokenStandard: coerceTokenStandard(data.tokenStandard),
    ...(config ? { config } : {}),
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };
}

export function createFetchTransport(config: FetchTransportConfig): ElizaTransport {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  const authNoncePath = config.authNoncePath ?? '/auth/nonce';
  const authVerifyPath = config.authVerifyPath ?? '/auth/verify';
  const charactersPath = config.charactersPath ?? '/characters';
  const conversationsPath = config.conversationsPath ?? '/conversations';
  const chatStreamPath = config.chatStreamPath ?? '/chat';
  const builderChatPath = config.builderChatPath ?? '/chat/builder';
  const charactersParseSummaryPath = config.charactersParseSummaryPath ?? '/characters/parse-summary';
  const nftCollectionsPath = config.nftCollectionsPath ?? '/nft/collections';
  const nftProvisionPath = config.nftProvisionPath ?? '/nft/provision';

  const fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
  const credentials: RequestCredentials = config.credentials ?? 'include';
  const getAuthHeader = config.getAuthHeader;

  const requestJson = async <T>(
    input: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
      body?: unknown;
      headers?: Record<string, string>;
    }
  ): Promise<T> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(input.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(input.headers ?? {}),
    };

    const authHeader = getAuthHeader?.();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let response: Response;
    try {
      response = await fetchImpl(input.url, {
        method: input.method,
        headers,
        credentials,
        ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
      });
    } catch (error) {
      throw new ElizaNetworkError(
        'Network request failed',
        error instanceof Error ? error : undefined
      );
    }

    if (!response.ok) {
      const body = await safeReadJson(response);
      if (isRecord(body)) {
        throw ElizaAPIError.fromResponse(response.status, body as any);
      }
      throw new ElizaAPIError(`HTTP ${response.status}`, response.status);
    }

    const json = await safeReadJson(response);
    return json as T;
  };

  return {
    auth: {
      async getNonce(): Promise<NonceResponse> {
        const url = joinUrl(baseUrl, authNoncePath);
        const data = await requestJson<unknown>({ method: 'GET', url });

        if (!isRecord(data)) {
          throw new ElizaAPIError('Invalid nonce response', 500);
        }

        const nonce = typeof data.nonce === 'string' ? data.nonce : null;
        const sessionId = typeof data.sessionId === 'string' ? data.sessionId : null;

        if (!nonce || !sessionId) {
          throw new ElizaAPIError('Missing nonce/sessionId in nonce response', 500);
        }

        return { nonce, sessionId };
      },

      async verify(message: string, signature: string, sessionId: string): Promise<AuthTokens> {
        const url = joinUrl(baseUrl, authVerifyPath);
        const data = await requestJson<unknown>({
          method: 'POST',
          url,
          body: { message, signature, sessionId },
        });

        return toAuthTokens(data);
      },
    },

    characters: {
      async listRecords(params?: PaginationParams): Promise<PaginatedResponse<CharacterRecord>> {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        const nftCollectionId = (params as { nftCollectionId?: string } | undefined)?.nftCollectionId;

        const url = withQuery(joinUrl(baseUrl, charactersPath), {
          page: String(page),
          pageSize: String(pageSize),
          nftCollectionId,
        });

        const data = await requestJson<unknown>({ method: 'GET', url });

        return coercePaginatedResponse<CharacterRecord>(data, {
          page,
          pageSize,
          itemsKey: 'characters',
        });
      },

      async getRecord(id: string): Promise<CharacterRecord> {
        const url = joinUrl(baseUrl, `${normalizePath(charactersPath)}/${encodeURIComponent(id)}`);
        return requestJson<CharacterRecord>({ method: 'GET', url });
      },

      async createRecord(input: { externalId?: string; character: AgentCharacter }): Promise<CharacterRecord> {
        const url = joinUrl(baseUrl, charactersPath);
        return requestJson<CharacterRecord>({
          method: 'POST',
          url,
          body: {
            externalId: input.externalId,
            character: input.character,
          },
        });
      },

      async replaceRecord(id: string, input: { character: AgentCharacter }): Promise<CharacterRecord> {
        const url = joinUrl(baseUrl, `${normalizePath(charactersPath)}/${encodeURIComponent(id)}`);
        return requestJson<CharacterRecord>({
          method: 'PUT',
          url,
          body: { character: input.character },
        });
      },

      async parseSummary(input: { summary: string }): Promise<CreateCharacterInput> {
        const url = joinUrl(baseUrl, charactersParseSummaryPath);
        const data = await requestJson<{ parsed: CreateCharacterInput }>({
          method: 'POST',
          url,
          body: input,
        });
        return data.parsed;
      },
    },

    chat: {
      async sendMessageStream(input: SendMessageStreamInput, callbacks: StreamCallbacks): Promise<void> {
        const url = joinUrl(baseUrl, chatStreamPath);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        };

        const authHeader = getAuthHeader?.();
        if (authHeader) {
          headers['Authorization'] = authHeader;
        }

        try {
          const response = await fetchImpl(url, {
            method: 'POST',
            headers,
            credentials,
            body: JSON.stringify({
              characterId: input.characterId,
              message: input.message,
              conversationId: input.conversationId,
            }),
          });

          await readSSEStream(response, callbacks);
        } catch (error) {
          callbacks.onError(
            error instanceof Error
              ? new ElizaNetworkError('Chat stream request failed', error)
              : new ElizaNetworkError('Chat stream request failed')
          );
        }
      },

      async sendBuilderMessage(input: BuilderChatInput): Promise<BuilderChatResponse> {
        const url = joinUrl(baseUrl, builderChatPath);
        return requestJson<BuilderChatResponse>({
          method: 'POST',
          url,
          body: input,
        });
      },
    },

    conversations: {
      async list(params?: PaginationParams): Promise<PaginatedResponse<Conversation>> {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;

        const url = withQuery(joinUrl(baseUrl, conversationsPath), {
          page: String(page),
          pageSize: String(pageSize),
        });

        const data = await requestJson<unknown>({ method: 'GET', url });

        return coercePaginatedResponse<Conversation>(data, {
          page,
          pageSize,
          itemsKey: 'conversations',
        });
      },

      async listForCharacter(
        characterId: string,
        params?: PaginationParams
      ): Promise<PaginatedResponse<Conversation>> {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;

        // Default strategy: filter via query param (works well for proxy backends).
        const url = withQuery(joinUrl(baseUrl, conversationsPath), {
          characterId,
          page: String(page),
          pageSize: String(pageSize),
        });

        const data = await requestJson<unknown>({ method: 'GET', url });

        return coercePaginatedResponse<Conversation>(data, {
          page,
          pageSize,
          itemsKey: 'conversations',
        });
      },

      async get(id: string): Promise<ConversationDetail> {
        const url = joinUrl(
          baseUrl,
          `${normalizePath(conversationsPath)}/${encodeURIComponent(id)}`
        );
        return requestJson<ConversationDetail>({ method: 'GET', url });
      },

      async delete(id: string): Promise<void> {
        const url = joinUrl(
          baseUrl,
          `${normalizePath(conversationsPath)}/${encodeURIComponent(id)}`
        );
        await requestJson<unknown>({ method: 'DELETE', url });
      },
    },

    nft: {
      async listCollections(params?: PaginationParams): Promise<PaginatedResponse<NftCollection>> {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;

        const url = withQuery(joinUrl(baseUrl, nftCollectionsPath), {
          page: String(page),
          pageSize: String(pageSize),
        });

        const data = await requestJson<unknown>({ method: 'GET', url });

        if (!isRecord(data)) {
          return { items: [], total: 0, page, pageSize, hasMore: false };
        }

        const rawCollections = Array.isArray(data.collections) ? data.collections : [];
        const pagination = isRecord(data.pagination) ? data.pagination : null;

        const total =
          pagination && typeof pagination.total === 'number'
            ? pagination.total
            : rawCollections.length;

        const resolvedPage =
          pagination && typeof pagination.page === 'number' ? pagination.page : page;

        const resolvedPageSize =
          pagination && typeof pagination.pageSize === 'number'
            ? pagination.pageSize
            : pageSize;

        return {
          items: rawCollections.map((collection) => mapNftCollection(collection)),
          total,
          page: resolvedPage,
          pageSize: resolvedPageSize,
          hasMore: resolvedPage * resolvedPageSize < total,
        };
      },

      async getCollection(id: string): Promise<NftCollection> {
        const url = joinUrl(
          baseUrl,
          `${normalizePath(nftCollectionsPath)}/${encodeURIComponent(id)}`
        );
        const data = await requestJson<unknown>({ method: 'GET', url });
        return mapNftCollection(data);
      },

      async upsertCollection(input: UpsertNftCollectionInput): Promise<NftCollection> {
        const url = joinUrl(baseUrl, nftCollectionsPath);
        const data = await requestJson<unknown>({ method: 'POST', url, body: input });
        return mapNftCollection(data);
      },

      async updateCollection(id: string, input: UpdateNftCollectionInput): Promise<NftCollection> {
        const url = joinUrl(
          baseUrl,
          `${normalizePath(nftCollectionsPath)}/${encodeURIComponent(id)}`
        );
        const data = await requestJson<unknown>({ method: 'PUT', url, body: input });
        return mapNftCollection(data);
      },

      async deleteCollection(id: string): Promise<void> {
        const url = joinUrl(
          baseUrl,
          `${normalizePath(nftCollectionsPath)}/${encodeURIComponent(id)}`
        );
        await requestJson<unknown>({ method: 'DELETE', url });
      },

      async provisionCharacter(
        input: ProvisionNftCharacterInput
      ): Promise<ProvisionNftCharacterResponse> {
        const url = joinUrl(baseUrl, nftProvisionPath);
        return requestJson<ProvisionNftCharacterResponse>({
          method: 'POST',
          url,
          body: input,
        });
      },

      async listCollectionTokens(
        input: ListCollectionTokensInput
      ): Promise<ListCollectionTokensResponse> {
        const { collectionId, limit = 10, cursor, ownerAddress } = input;
        const url = withQuery(
          joinUrl(baseUrl, `${normalizePath(nftCollectionsPath)}/${encodeURIComponent(collectionId)}/tokens`),
          {
            limit: String(limit),
            cursor,
            owner: ownerAddress,
          }
        );
        return requestJson<ListCollectionTokensResponse>({ method: 'GET', url });
      },
    },
  };
}