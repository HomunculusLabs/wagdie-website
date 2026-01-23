import { type ReactNode } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { ElizaTransport } from '../transport/types.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { type ChatViewSlots } from './ChatView.js';
import type { ChatMessagesSlots } from './components/ChatMessages.js';
import type { ChatInputSlots } from './components/ChatInput.js';
export interface ChatPanelProps {
    transport?: ElizaTransport;
    characterId: string;
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
    classNames?: SlotClassNames<ChatViewSlots>;
    styles?: SlotStyles<ChatViewSlots>;
    messagesClassNames?: SlotClassNames<ChatMessagesSlots>;
    messagesStyles?: SlotStyles<ChatMessagesSlots>;
    inputClassNames?: SlotClassNames<ChatInputSlots>;
    inputStyles?: SlotStyles<ChatInputSlots>;
    /** Remove all default styling - consumers control everything via classNames */
    unstyled?: boolean;
    initialConversationId?: string | null;
    onConversationIdChange?: (id: string | null) => void;
    renderMessage?: (message: ChatMessage, state: {
        isStreaming: boolean;
    }) => ReactNode;
    inputPlaceholder?: string;
    sendButtonLabel?: string;
    /**
     * Auto-start the chat with an initial message.
     * - `message`: The message to send automatically
     * - `when`: 'noConversation' (default) only sends if no existing conversation,
     *           'always' sends every time the component mounts
     */
    autoStart?: {
        message: string;
        when?: 'noConversation' | 'always';
    };
}
export declare function ChatPanel(props: ChatPanelProps): JSX.Element;
