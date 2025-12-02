/**
 * Type definitions for Eliza API integration
 * Based on data-model.md specification
 */

// Re-export SDK types that we need to use
export type {
  Character as SDKCharacter,
  CreateCharacterInput as SDKCreateCharacterInput,
  UpdateCharacterInput as SDKUpdateCharacterInput,
  ExampleMessage as SDKExampleMessage,
  ChatMessage as SDKChatMessage,
  ChatResponse as SDKChatResponse,
  Conversation as SDKConversation,
  ConversationDetail as SDKConversationDetail,
  StreamCallbacks,
  StreamCallback,
  StreamCompleteCallback,
  StreamErrorCallback,
} from '@eliza/sdk'

/**
 * AI Character entity representing an AI persona linked to a WAGDIE character
 */
export interface AICharacter {
  id: string
  externalId: string // WAGDIE tokenId for linking
  name: string
  personality: string | null
  backstory: string | null
  systemPrompt: string | null
  exampleMessages: ExampleMessage[]
  createdAt: string
  updatedAt: string
}

/**
 * Example message pair for training character voice
 */
export interface ExampleMessage {
  userMessage: string
  assistantMessage: string
}

/**
 * Conversation entity representing a chat session
 */
export interface Conversation {
  id: string
  characterId: string
  userId: string // Wallet address
  title: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Chat message within a conversation
 */
export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/**
 * Extended conversation with messages
 */
export interface ConversationDetail extends Conversation {
  messages: ChatMessage[]
  hasMore: boolean
}

/**
 * Input for creating an AI character
 */
export interface CreateAICharacterInput {
  externalId: string
  name: string
  personality?: string
  backstory?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
}

/**
 * Input for updating an AI character
 */
export interface UpdateAICharacterInput {
  name?: string
  personality?: string
  backstory?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
}

/**
 * Input for sending a chat message
 */
export interface SendMessageInput {
  tokenId: string // WAGDIE character token ID
  message: string
  conversationId?: string
}

/**
 * Response from chat API (non-streaming)
 */
export interface ChatResponse {
  id: string
  content: string
  role: 'assistant'
  conversationId: string
  createdAt: string
}

/**
 * Token response from auth API
 */
export interface TokenResponse {
  accessToken: string
  expiresAt: string
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Draft AI persona stored in localStorage
 */
export interface DraftAIPersona {
  tokenId: string
  personality?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
  savedAt: string
}

/**
 * Streaming event types for SSE
 */
export type StreamEventType = 'token' | 'complete' | 'error'

export interface StreamTokenEvent {
  event: 'token'
  data: { token: string }
}

export interface StreamCompleteEvent {
  event: 'complete'
  data: {
    id: string
    content: string
    conversationId: string
  }
}

export interface StreamErrorEvent {
  event: 'error'
  data: { message: string }
}

export type StreamEvent = StreamTokenEvent | StreamCompleteEvent | StreamErrorEvent

/**
 * Field validation limits per data-model.md
 */
export const FIELD_LIMITS = {
  name: 100,
  personality: 2000,
  backstory: 5000,
  systemPrompt: 4000,
  messageContent: 10000,
  userMessageExample: 500,
  assistantMessageExample: 1000,
  maxExampleMessages: 20,
} as const
