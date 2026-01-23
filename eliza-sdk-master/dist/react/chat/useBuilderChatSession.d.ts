import type { ChatMessage } from '../../types/chat.js';
import type { CreateCharacterInput } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
/** Parse status for the character generation */
export type ParseStatus = 'idle' | 'loading' | 'done' | 'error';
export interface UseBuilderChatSessionOptions {
    /** Override transport (otherwise uses ElizaProvider context) */
    transport?: ElizaTransport;
    /** System prompt for the builder assistant */
    systemPrompt?: string;
    /** Initial messages to populate the chat */
    initialMessages?: ChatMessage[];
    /** Initial assistant message (string or ChatMessage) */
    initialAssistantMessage?: string | ChatMessage;
    /** Custom transcript builder function */
    buildTranscript?: (messages: ChatMessage[]) => string;
    /** Callback when character is successfully parsed */
    onParsedValues?: (values: CreateCharacterInput) => void;
    /** Callback for send errors */
    onError?: (error: Error) => void;
    /** Callback for parse errors */
    onParseError?: (error: Error) => void;
}
export interface UseBuilderChatSessionResult {
    /** Current chat messages */
    messages: ChatMessage[];
    /** Whether a message is being sent */
    isSending: boolean;
    /** Current send error (null if none) */
    error: Error | null;
    /** Parse status for character generation */
    parseStatus: ParseStatus;
    /** Parse error (null if none) */
    parseError: Error | null;
    /** Whether the builder chat is available (transport supports it) */
    isAvailable: boolean;
    /** Whether there are enough messages to parse */
    canParse: boolean;
    /** Send a user message */
    sendMessage: (text: string) => Promise<void>;
    /** Parse the transcript and apply to form */
    applyToForm: () => Promise<CreateCharacterInput | null>;
    /** Reset the chat to initial state */
    reset: () => void;
    /** Clear the current error */
    clearError: () => void;
    /** Clear the parse error */
    clearParseError: () => void;
}
/**
 * Hook for managing a character builder chat session.
 * Provides state management for chat messages, sending, and parsing.
 */
export declare function useBuilderChatSession(options?: UseBuilderChatSessionOptions): UseBuilderChatSessionResult;
