/**
 * Local type declarations for @eliza/sdk
 * The SDK package is missing .d.ts files in dist/
 */

declare module '@eliza/sdk' {
  // Error types
  export class ElizaError extends Error {
    isRetryable: boolean
    details?: unknown
    toJSON(): object
  }

  export class ElizaAPIError extends ElizaError {
    code: string
    statusCode: number
  }

  export class ElizaAuthError extends ElizaError {
    code: string
    statusCode: number
  }

  export class ElizaRateLimitError extends ElizaError {
    code: string
    statusCode: number
    retryAfter?: number
  }

  export class ElizaNetworkError extends ElizaError {
    code: string
  }

  export class ElizaValidationError extends ElizaError {
    code: string
  }

  export function isElizaError(error: unknown): error is ElizaError

  // Configuration types
  export interface RetryConfig {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  }

  export interface ElizaClientConfig {
    baseUrl: string
    apiKey?: string
    accessToken?: string
    timeout?: number
    retry?: RetryConfig
    retryConfig?: RetryConfig
  }

  // Auth types
  export interface AuthTokens {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
  }

  export interface SIWEMessageParams {
    domain: string
    address: string
    uri: string
    chainId: number
    nonce: string
    statement?: string
    issuedAt?: string
    expirationTime?: string
  }

  export interface SIWEVerificationResult {
    success: boolean
    address?: string
    error?: string
    fields?: Record<string, unknown>
  }

  export function createSIWEMessage(params: SIWEMessageParams): string
  export function verifySIWEMessage(message: string, signature: string): Promise<SIWEVerificationResult>
  export function generateNonce(): string

  // Character types
  export interface CharacterStyle {
    all?: string[]
    chat?: string[]
    post?: string[]
  }

  export interface ExampleMessage {
    role: 'user' | 'assistant'
    content: string
  }

  export interface KnowledgeDocument {
    id?: string
    content: string
    metadata?: Record<string, unknown>
  }

  export interface Character {
    id: string
    name: string
    personality?: string
    backstory?: string | null
    systemPrompt?: string
    exampleMessages?: ExampleMessage[]
    style?: CharacterStyle
    topics?: string[]
    adjectives?: string[]
    knowledge?: KnowledgeDocument[]
    settings?: Record<string, unknown>
    createdAt?: string
    updatedAt?: string
  }

  export interface CreateCharacterInput {
    name: string
    externalId?: string
    personality?: string
    backstory?: string
    systemPrompt?: string
    exampleMessages?: ExampleMessage[]
    style?: CharacterStyle
    topics?: string[]
    adjectives?: string[]
    knowledge?: KnowledgeDocument[]
  }

  export interface UpdateCharacterInput {
    name?: string
    personality?: string
    backstory?: string
    systemPrompt?: string
    exampleMessages?: ExampleMessage[]
    style?: CharacterStyle
    topics?: string[]
    adjectives?: string[]
    knowledge?: KnowledgeDocument[]
  }

  // Chat types
  export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }

  export interface ChatResponse {
    id: string
    conversationId: string
    content: string
    role: 'assistant'
    createdAt: string
  }

  export interface SendMessageInput {
    message: string
    conversationId?: string
  }

  export type StreamCallback = (chunk: string) => void
  export type StreamCompleteCallback = (response: ChatResponse) => void
  export type StreamErrorCallback = (error: Error) => void

  export interface StreamCallbacks {
    onChunk?: StreamCallback
    onComplete?: StreamCompleteCallback
    onError?: StreamErrorCallback
  }

  // Conversation types
  export interface Conversation {
    id: string
    characterId: string
    messageCount: number
    createdAt: string
    lastMessageAt: string
  }

  export interface ConversationMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }

  export interface ConversationDetail extends Conversation {
    messages: ConversationMessage[]
  }

  // Pagination
  export interface PaginationParams {
    page?: number
    pageSize?: number
  }

  export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }

  // Auth API
  export interface NonceResponse {
    nonce: string
    sessionId: string
  }

  export interface VerifyCredentialsResponse {
    success: boolean
    address?: string
    error?: string
  }

  export class AuthAPI {
    getNonce(): Promise<NonceResponse>
    verify(message: string, signature: string, sessionId: string): Promise<AuthTokens>
    verifyCredentials(message: string, signature: string, sessionId: string): Promise<VerifyCredentialsResponse>
  }

  // API classes
  export class CharactersAPI {
    create(input: CreateCharacterInput): Promise<Character>
    get(id: string): Promise<Character>
    getByExternalId(externalId: string): Promise<Character>
    update(id: string, input: UpdateCharacterInput): Promise<Character>
    delete(id: string): Promise<void>
    list(params?: PaginationParams): Promise<PaginatedResponse<Character>>
  }

  export class ChatAPI {
    sendMessage(characterId: string, input: SendMessageInput): Promise<ChatResponse>
    streamMessage(characterId: string, input: SendMessageInput, callbacks: StreamCallbacks): Promise<ChatResponse>
    sendMessageStream(input: { characterId: string; message: string; conversationId?: string }, callbacks: StreamCallbacks): Promise<void>
  }

  export class ConversationsAPI {
    get(conversationId: string): Promise<ConversationDetail>
    list(params?: PaginationParams): Promise<PaginatedResponse<Conversation>>
    listForCharacter(characterId: string, params?: PaginationParams): Promise<PaginatedResponse<Conversation>>
    delete(conversationId: string): Promise<void>
  }

  // Main client
  export class ElizaClient {
    constructor(config: ElizaClientConfig)
    auth: AuthAPI
    characters: CharactersAPI
    chat: ChatAPI
    conversations: ConversationsAPI
    setAuthTokens(tokens: AuthTokens): void
    clearAuthTokens(): void
    getAuthTokens(): AuthTokens | null
  }

  // Validation
  export const AgentCharacterSchema: unknown
  export const FIELD_LIMITS: Record<string, number>
  export function validateAgentCharacter(input: unknown): unknown

  export const VERSION: string
}
