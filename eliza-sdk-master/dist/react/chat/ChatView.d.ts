import type { ReactNode } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { ChatMessagesProps, ChatMessagesSlots } from './components/ChatMessages.js';
import type { ChatInputSlots } from './components/ChatInput.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
export type ChatViewSlots = 'root' | 'header' | 'error' | 'errorMessage' | 'errorDismiss' | 'messagesContainer' | 'input' | 'footer';
export type ChatViewAllSlots = ChatViewSlots | `messages.${ChatMessagesSlots}` | `chatInput.${ChatInputSlots}`;
export interface ChatViewProps {
    messages: ChatMessage[];
    streamingContent?: string;
    isStreaming?: boolean;
    error?: Error | null;
    onSend: (text: string) => void;
    onClearError?: () => void;
    header?: ReactNode;
    footer?: ReactNode;
    renderMessage?: ChatMessagesProps['renderMessage'];
    inputPlaceholder?: string;
    sendButtonLabel?: string;
    className?: string;
    /** Slot classNames for ChatView elements */
    classNames?: SlotClassNames<ChatViewSlots>;
    /** Slot styles for ChatView elements */
    styles?: SlotStyles<ChatViewSlots>;
    /** Slot classNames for ChatMessages child component */
    messagesClassNames?: SlotClassNames<ChatMessagesSlots>;
    /** Slot styles for ChatMessages child component */
    messagesStyles?: SlotStyles<ChatMessagesSlots>;
    /** Slot classNames for ChatInput child component */
    inputClassNames?: SlotClassNames<ChatInputSlots>;
    /** Slot styles for ChatInput child component */
    inputStyles?: SlotStyles<ChatInputSlots>;
    /** Remove all default styling - consumers control everything via classNames */
    unstyled?: boolean;
}
export declare function ChatView(props: ChatViewProps): JSX.Element;
