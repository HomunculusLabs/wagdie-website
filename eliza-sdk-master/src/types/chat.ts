/**
 * Chat Types
 */

import type { ElizaError } from '../errors/index.js';

export interface SendMessageInput {
  /** The message content */
  message: string;
  /** Optional conversation ID to continue */
  conversationId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
}

/** Callback for streaming responses */
export type StreamCallback = (chunk: string) => void;

/** Callback for stream completion */
export type StreamCompleteCallback = (message: ChatMessage, conversationId: string) => void;

/** Callback for stream errors */
export type StreamErrorCallback = (error: ElizaError) => void;

export interface StreamCallbacks {
  onChunk: StreamCallback;
  onComplete: StreamCompleteCallback;
  onError: StreamErrorCallback;
}

/**
 * Builder Chat Types
 * Used for the character builder assistant chat
 */

/** Role for builder chat messages */
export type BuilderChatRole = 'user' | 'assistant';

/** Input message format for builder chat */
export interface BuilderChatInputMessage {
  role: BuilderChatRole;
  content: string;
}

/** Input for the builder chat endpoint */
export interface BuilderChatInput {
  systemPrompt: string;
  messages: BuilderChatInputMessage[];
}

/** Response from the builder chat endpoint */
export interface BuilderChatResponse {
  message: ChatMessage;
}
