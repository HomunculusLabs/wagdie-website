import { type ReactNode } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { CreateCharacterInput } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { type ChatMessagesSlots } from './components/ChatMessages.js';
import { type ChatInputSlots } from './components/ChatInput.js';
/** Slot names for CharacterBuilderChat component */
export type CharacterBuilderChatSlots = 'root' | 'messages' | 'input' | 'actions' | 'applyButton' | 'clearButton' | 'hint' | 'status' | 'error' | 'parseError' | 'success' | 'unavailable';
export interface CharacterBuilderChatProps {
    /** Override transport (otherwise uses ElizaProvider context) */
    transport?: ElizaTransport;
    /** System prompt for the builder assistant */
    systemPrompt?: string;
    /** Initial assistant message to display */
    initialAssistantMessage?: string | ChatMessage;
    /** Callback when character is successfully parsed */
    onParsedValues?: (values: CreateCharacterInput) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
    /** Callback for parse errors */
    onParseError?: (error: Error) => void;
    /** Disable the chat */
    disabled?: boolean;
    /** Custom message renderer */
    renderMessage?: (message: ChatMessage, state: {
        isStreaming: boolean;
    }) => ReactNode;
    /** Placeholder text for the input */
    inputPlaceholder?: string;
    /** Label for the send button */
    sendButtonLabel?: string;
    /** Label for the apply button */
    applyButtonLabel?: string;
    /** Label for the clear button */
    clearButtonLabel?: string;
    /** Hint text when user can parse */
    readyHint?: string;
    /** Hint text when user needs to provide more info */
    needsInfoHint?: string;
    /** Success message after applying */
    successMessage?: string;
    /** Unavailable message when transport doesn't support builder chat */
    unavailableMessage?: string;
    /** Remove default styles */
    unstyled?: boolean;
    /** Root element class name */
    className?: string;
    /** Class names for each slot */
    classNames?: SlotClassNames<CharacterBuilderChatSlots>;
    /** Inline styles for each slot */
    styles?: SlotStyles<CharacterBuilderChatSlots>;
    /** Class names for ChatMessages slots */
    messagesClassNames?: SlotClassNames<ChatMessagesSlots>;
    /** Styles for ChatMessages slots */
    messagesStyles?: SlotStyles<ChatMessagesSlots>;
    /** Class names for ChatInput slots */
    inputClassNames?: SlotClassNames<ChatInputSlots>;
    /** Styles for ChatInput slots */
    inputStyles?: SlotStyles<ChatInputSlots>;
}
/**
 * CharacterBuilderChat component - an interactive chat interface
 * for creating Eliza characters through conversation.
 *
 * Uses the builder chat API to guide users through character creation
 * and can parse the conversation into structured character data.
 */
export declare function CharacterBuilderChat(props: CharacterBuilderChatProps): JSX.Element;
