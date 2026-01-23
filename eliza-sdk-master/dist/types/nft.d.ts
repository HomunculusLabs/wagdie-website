export type TokenStandard = 'erc721' | 'erc1155' | 'unknown';
export interface NftCollection {
    id: string;
    chainId: number;
    contractAddress: string;
    name: string;
    tokenStandard: TokenStandard;
    config?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface NftAttribute {
    trait_type: string;
    value: string | number | boolean | null;
}
export interface NftTokenMetadata {
    name?: string;
    description?: string;
    imageUrl?: string;
    attributes?: NftAttribute[];
    collectionName?: string;
    externalUrl?: string;
}
export interface UpsertNftCollectionInput {
    chainId: number;
    contractAddress: string;
    name: string;
    tokenStandard?: TokenStandard;
    config?: Record<string, unknown>;
}
export interface UpdateNftCollectionInput {
    name?: string;
    tokenStandard?: TokenStandard;
    config?: Record<string, unknown>;
}
export interface ProvisionNftCharacterInput {
    chainId: number;
    contractAddress: string;
    tokenId: string;
    regenerate?: boolean;
}
export interface ProvisionNftCharacterResponse {
    character: import('./character.js').CharacterRecord;
    nft: {
        chainId: number;
        contractAddress: string;
        tokenId: string;
        metadata: NftTokenMetadata;
    };
    created: boolean;
}
export interface NftToken {
    tokenId: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    attributes?: NftAttribute[];
}
export interface ListCollectionTokensInput {
    collectionId: string;
    limit?: number;
    cursor?: string;
    ownerAddress?: string;
}
export interface ListCollectionTokensResponse {
    tokens: NftToken[];
    cursor: string | null;
    collection: {
        id: string;
        chainId: number;
        contractAddress: string;
        name: string;
    };
}
