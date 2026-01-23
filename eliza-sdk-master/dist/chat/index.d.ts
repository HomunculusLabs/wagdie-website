import type { HttpClient } from '../client/http.js';
import type { ChatResponse, StreamCallbacks, BuilderChatInput, BuilderChatResponse } from '../types/chat.js';
export type { BuilderChatInput, BuilderChatResponse } from '../types/chat.js';
/**
 * Input for sending a chat message
 */
export interface ChatMessageInput {
    characterId: string;
    message: string;
    conversationId?: string;
}
export declare class ChatAPI {
    private http;
    private getAuthHeader;
    constructor(http: HttpClient, getAuthHeader: () => string | null);
    /**
     * Send a message and get the complete response
     */
    sendMessage(input: ChatMessageInput): Promise<ChatResponse>;
    /**
     * Send a message and stream the response
     */
    sendMessageStream(input: ChatMessageInput, callbacks: StreamCallbacks): Promise<void>;
    /**
     * Send a message to the builder chat (no character required).
     * Used for the character builder assistant.
     */
    sendBuilderMessage(input: BuilderChatInput): Promise<BuilderChatResponse>;
}
