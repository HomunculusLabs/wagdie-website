import type { ReactNode } from 'react';
import type { ChatMessage } from '../../../types/chat.js';
import type { SlotClassNames, SlotStyles } from '../../shared/slots.js';
export type ChatMessagesSlots = 'root' | 'list' | 'empty' | 'row' | 'bubble' | 'bubbleUser' | 'bubbleAssistant' | 'typing';
export interface ChatMessagesProps {
    messages: ChatMessage[];
    streamingContent?: string;
    isStreaming?: boolean;
    className?: string;
    renderMessage?: (message: ChatMessage, state: {
        isStreaming: boolean;
    }) => ReactNode;
    classNames?: SlotClassNames<ChatMessagesSlots>;
    styles?: SlotStyles<ChatMessagesSlots>;
    unstyled?: boolean;
}
export declare function ChatMessages(props: ChatMessagesProps): JSX.Element;
