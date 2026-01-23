import type { ChatMessage } from '../../types/chat.js';
import type { ElizaTransport } from '../transport/types.js';
export type UseChatSessionOptions = {
    transport?: ElizaTransport;
    characterId: string;
    initialConversationId?: string | null;
    onConversationId?: (id: string | null) => void;
};
export type UseChatSessionResult = {
    messages: ChatMessage[];
    conversationId: string | null;
    isStreaming: boolean;
    streamingContent: string;
    sendMessage: (text: string) => Promise<void>;
    abort: () => void;
    setConversationId: (id: string | null) => void;
    reset: () => void;
    error: Error | null;
    clearError: () => void;
};
export declare function useChatSession(options: UseChatSessionOptions): UseChatSessionResult;
