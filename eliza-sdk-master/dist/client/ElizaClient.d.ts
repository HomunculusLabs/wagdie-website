import type { ElizaClientConfig, AuthTokens, NonceResponse, VerifyCredentialsResponse } from '../types/index.js';
import { HttpClient } from './http.js';
import { AuthManager } from './auth.js';
import { ChatAPI } from '../chat/index.js';
import { CharactersAPI } from '../characters/index.js';
import { ConversationsAPI } from '../conversations/index.js';
import { NftAPI } from '../nft/index.js';
export declare class ElizaClient {
    private readonly http;
    private readonly authManager;
    private readonly baseUrl;
    private _characters?;
    private _chat?;
    private _conversations?;
    private _auth?;
    private _nft?;
    constructor(config: ElizaClientConfig);
    /**
     * Verify the current credentials are valid
     */
    verifyCredentials(): Promise<VerifyCredentialsResponse>;
    /**
     * Check if the client is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Access auth methods
     */
    get auth(): AuthAPI;
    /**
     * Access characters API
     */
    get characters(): CharactersAPI;
    /**
     * Access chat API
     */
    get chat(): ChatAPI;
    /**
     * Access conversations API
     */
    get conversations(): ConversationsAPI;
    /**
     * Access NFT API (collections + provisioning)
     */
    get nft(): NftAPI;
    /**
     * Get the underlying HTTP client (for advanced usage)
     */
    getHttpClient(): HttpClient;
}
/**
 * Auth API wrapper
 */
declare class AuthAPI {
    private authManager;
    constructor(authManager: AuthManager);
    /**
     * Get a nonce for SIWE authentication
     */
    getNonce(): Promise<NonceResponse>;
    /**
     * Verify SIWE message and signature
     */
    verify(message: string, signature: string, sessionId: string): Promise<AuthTokens>;
    /**
     * Refresh the access token
     */
    refresh(): Promise<void>;
    /**
     * Clear authentication state
     */
    logout(): void;
    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean;
}
export {};
