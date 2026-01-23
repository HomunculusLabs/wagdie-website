import type { SlotClassNames, SlotStyles } from '../../shared/slots.js';
export type ChatInputSlots = 'root' | 'textarea' | 'sendButton';
export interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    sendButtonLabel?: string;
    classNames?: SlotClassNames<ChatInputSlots>;
    styles?: SlotStyles<ChatInputSlots>;
    unstyled?: boolean;
}
export declare function ChatInput(props: ChatInputProps): JSX.Element;
