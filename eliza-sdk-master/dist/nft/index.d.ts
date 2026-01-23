import type { HttpClient } from '../client/http.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';
import type { NftCollection, ProvisionNftCharacterInput, ProvisionNftCharacterResponse, UpdateNftCollectionInput, UpsertNftCollectionInput, ListCollectionTokensInput, ListCollectionTokensResponse } from '../types/nft.js';
export declare class NftAPI {
    private http;
    constructor(http: HttpClient);
    listCollections(params?: PaginationParams): Promise<PaginatedResponse<NftCollection>>;
    getCollection(id: string): Promise<NftCollection>;
    upsertCollection(input: UpsertNftCollectionInput): Promise<NftCollection>;
    updateCollection(id: string, input: UpdateNftCollectionInput): Promise<NftCollection>;
    deleteCollection(id: string): Promise<void>;
    provisionCharacter(input: ProvisionNftCharacterInput): Promise<ProvisionNftCharacterResponse>;
    listCollectionTokens(input: ListCollectionTokensInput): Promise<ListCollectionTokensResponse>;
    private mapCollection;
}
