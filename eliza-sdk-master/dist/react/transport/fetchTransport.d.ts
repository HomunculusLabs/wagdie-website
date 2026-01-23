import type { ElizaTransport } from './types.js';
export interface FetchTransportConfig {
    baseUrl: string;
    authNoncePath?: string;
    authVerifyPath?: string;
    charactersPath?: string;
    conversationsPath?: string;
    chatStreamPath?: string;
    builderChatPath?: string;
    charactersParseSummaryPath?: string;
    nftCollectionsPath?: string;
    nftProvisionPath?: string;
    fetch?: typeof globalThis.fetch;
    credentials?: RequestCredentials;
    getAuthHeader?: () => string | null;
}
export declare function createFetchTransport(config: FetchTransportConfig): ElizaTransport;
