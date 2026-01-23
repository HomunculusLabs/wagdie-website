import type { HttpClient } from '../client/http.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';
import type {
  NftCollection,
  ProvisionNftCharacterInput,
  ProvisionNftCharacterResponse,
  TokenStandard,
  UpdateNftCollectionInput,
  UpsertNftCollectionInput,
  ListCollectionTokensInput,
  ListCollectionTokensResponse,
} from '../types/nft.js';

function coerceTokenStandard(value: unknown): TokenStandard {
  if (value === 'erc721' || value === 'erc1155' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class NftAPI {
  constructor(private http: HttpClient) {}

  // Collections

  async listCollections(params: PaginationParams = {}): Promise<PaginatedResponse<NftCollection>> {
    const { page = 1, pageSize = 20 } = params;

    const response = await this.http.get<{
      collections: Array<{
        id: string;
        chainId: number;
        contractAddress: string;
        name: string;
        tokenStandard: string;
        config?: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>(`/nft/collections?page=${page}&pageSize=${pageSize}`);

    const total = response.pagination?.total ?? 0;

    return {
      items: (response.collections ?? []).map((c) => this.mapCollection(c)),
      total,
      page: response.pagination?.page ?? page,
      pageSize: response.pagination?.pageSize ?? pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getCollection(id: string): Promise<NftCollection> {
    const response = await this.http.get<{
      id: string;
      chainId: number;
      contractAddress: string;
      name: string;
      tokenStandard: string;
      config?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>(`/nft/collections/${id}`);

    return this.mapCollection(response);
  }

  async upsertCollection(input: UpsertNftCollectionInput): Promise<NftCollection> {
    const response = await this.http.post<{
      id: string;
      chainId: number;
      contractAddress: string;
      name: string;
      tokenStandard: string;
      config?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>('/nft/collections', input);

    return this.mapCollection(response);
  }

  async updateCollection(id: string, input: UpdateNftCollectionInput): Promise<NftCollection> {
    const response = await this.http.put<{
      id: string;
      chainId: number;
      contractAddress: string;
      name: string;
      tokenStandard: string;
      config?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>(`/nft/collections/${id}`, input);

    return this.mapCollection(response);
  }

  async deleteCollection(id: string): Promise<void> {
    await this.http.delete(`/nft/collections/${id}`);
  }

  // Provisioning

  async provisionCharacter(
    input: ProvisionNftCharacterInput
  ): Promise<ProvisionNftCharacterResponse> {
    return this.http.post<ProvisionNftCharacterResponse>('/nft/provision', input);
  }

  // Token listing

  async listCollectionTokens(
    input: ListCollectionTokensInput
  ): Promise<ListCollectionTokensResponse> {
    const { collectionId, limit = 10, cursor, ownerAddress } = input;

    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) {
      params.set('cursor', cursor);
    }
    if (ownerAddress) {
      params.set('owner', ownerAddress);
    }

    return this.http.get<ListCollectionTokensResponse>(
      `/nft/collections/${encodeURIComponent(collectionId)}/tokens?${params.toString()}`
    );
  }

  private mapCollection(input: {
    id: string;
    chainId: number;
    contractAddress: string;
    name: string;
    tokenStandard: string;
    config?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): NftCollection {
    const config = isRecord(input.config) ? input.config : undefined;

    return {
      id: input.id,
      chainId: input.chainId,
      contractAddress: input.contractAddress,
      name: input.name,
      tokenStandard: coerceTokenStandard(input.tokenStandard),
      ...(config ? { config } : {}),
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
  }
}