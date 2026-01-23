/**
 * Eliza SDK Type Definitions
 */
export interface ElizaClientConfig {
    /** Base URL of the Eliza API */
    baseUrl: string;
    /** API key for authentication (server-side) */
    apiKey?: string;
    /** JWT token for user authentication (browser) */
    accessToken?: string;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Request timeout in ms (default: 30000) */
    timeout?: number;
}
export interface RetryConfig {
    /** Maximum retry attempts (default: 3) */
    maxRetries: number;
    /** Base delay in ms (default: 1000) */
    baseDelay: number;
    /** Whether to retry on 5xx errors (default: true) */
    retryServerErrors: boolean;
}
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export interface APIErrorResponse {
    error: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}
export interface NonceResponse {
    nonce: string;
    sessionId: string;
}
export interface VerifyCredentialsResponse {
    valid: boolean;
    client: {
        id: string;
        name: string;
        rateLimitTier: string;
    };
}
export * from './character.js';
export * from './chat.js';
export * from './conversation.js';
export * from './nft.js';
