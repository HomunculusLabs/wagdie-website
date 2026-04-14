/**
 * Local Eliza SDK-compatible types.
 *
 * These match the SDK's exported shapes while avoiding direct SDK type imports in
 * application code that currently has module-resolution issues with the local SDK.
 */

/**
 * Message within a conversation example.
 */
export type AgentMessage = {
  name: string
  content: {
    text: string
  }
  [key: string]: unknown
}

/**
 * Array of messages forming a conversation example.
 */
export type AgentMessageExample = AgentMessage[]

/**
 * Canonical ElizaOS agent character payload.
 */
export type AgentCharacter = {
  name: string
  username?: string
  plugins?: string[]
  system?: string
  bio?: string[]
  topics?: string[]
  messageExamples?: AgentMessageExample[]
  style?: {
    all?: string[]
    chat?: string[]
    post?: string[]
    [key: string]: unknown
  }
  settings?: {
    secrets?: Record<string, string>
    avatar?: string
    [key: string]: unknown
  }
  knowledge?: unknown
  templates?: unknown
  [key: string]: unknown
}

/**
 * Character permissions.
 */
export type CharacterPermissions = {
  canEdit: boolean
}

/**
 * Canonical persisted character record.
 */
export type CharacterRecord = {
  id: string
  externalId: string | null
  character: AgentCharacter
  permissions?: CharacterPermissions
  createdAt: string
  updatedAt: string
}

/**
 * Authentication tokens from SDK.
 */
export type AuthTokens = {
  accessToken: string
  expiresAt: number
  refreshToken?: string
}

/**
 * Chat message type.
 */
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

/**
 * Chat response from SDK.
 */
export type ChatResponse = {
  id: string
  conversationId: string
  content: string
  createdAt?: string
}

/**
 * Character style configuration.
 */
export type CharacterStyle = {
  all?: string[]
  chat?: string[]
  post?: string[]
}

/**
 * Stream callback for receiving chunks.
 */
export type StreamCallback = (chunk: string) => void

/**
 * Stream complete callback - receives the full message and conversation ID.
 */
export type StreamCompleteCallback = (message: ChatMessage, conversationId: string) => void

/**
 * Stream error callback.
 */
export type StreamErrorCallback = (error: Error) => void

/**
 * Stream callbacks object for chat streaming.
 */
export type StreamCallbacks = {
  onChunk?: StreamCallback
  onComplete?: StreamCompleteCallback
  onError?: StreamErrorCallback
}

/**
 * Legacy v0.1-style example message item (role/content).
 *
 * Kept because some call sites during migration still produce this format.
 */
export type RoleContentMessage = { role: 'user' | 'assistant'; content: string }
