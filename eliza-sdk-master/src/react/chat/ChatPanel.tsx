import { type ReactNode, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { ElizaTransport } from '../transport/types.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { ChatView, type ChatViewSlots } from './ChatView.js';
import type { ChatMessagesSlots } from './components/ChatMessages.js';
import type { ChatInputSlots } from './components/ChatInput.js';
import { useChatSession } from './useChatSession.js';

export interface ChatPanelProps {
  transport?: ElizaTransport;
  characterId: string;

  header?: ReactNode;
  footer?: ReactNode;

  // Styling - ChatView slots
  className?: string;
  classNames?: SlotClassNames<ChatViewSlots>;
  styles?: SlotStyles<ChatViewSlots>;

  // Styling - ChatMessages child slots
  messagesClassNames?: SlotClassNames<ChatMessagesSlots>;
  messagesStyles?: SlotStyles<ChatMessagesSlots>;

  // Styling - ChatInput child slots
  inputClassNames?: SlotClassNames<ChatInputSlots>;
  inputStyles?: SlotStyles<ChatInputSlots>;

  /** Remove all default styling - consumers control everything via classNames */
  unstyled?: boolean;

  initialConversationId?: string | null;
  onConversationIdChange?: (id: string | null) => void;

  // Message customization
  renderMessage?: (message: ChatMessage, state: { isStreaming: boolean }) => ReactNode;

  // Input customization
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

export function ChatPanel(props: ChatPanelProps): JSX.Element {
  const {
    transport,
    characterId,
    header,
    footer,
    className,
    classNames,
    styles,
    messagesClassNames,
    messagesStyles,
    inputClassNames,
    inputStyles,
    unstyled = false,
    initialConversationId = null,
    onConversationIdChange,
    renderMessage,
    inputPlaceholder = 'Type a message...',
    sendButtonLabel = 'Send',
    autoStart,
  } = props;

  const {
    messages,
    streamingContent,
    isStreaming,
    sendMessage,
    error,
    clearError,
  } = useChatSession({
    transport,
    characterId,
    initialConversationId,
    onConversationId: onConversationIdChange,
  });

  // Auto-start: send initial message if configured
  const autoStartFiredRef = useRef(false);

  useEffect(() => {
    if (!autoStart) return;
    if (autoStartFiredRef.current) return;
    if (isStreaming) return;

    const isAlwaysMode = autoStart.when === 'always';
    const isNewConversation = messages.length === 0 && !initialConversationId;
    const shouldSend = isAlwaysMode || isNewConversation;

    if (shouldSend && autoStart.message.trim()) {
      autoStartFiredRef.current = true;
      void sendMessage(autoStart.message);
    }
  }, [autoStart, messages.length, isStreaming, initialConversationId, sendMessage]);

  // Reset auto-start flag when characterId changes
  useEffect(() => {
    autoStartFiredRef.current = false;
  }, [characterId]);

  return (
    <ChatView
      messages={messages}
      streamingContent={streamingContent}
      isStreaming={isStreaming}
      error={error}
      onClearError={clearError}
      onSend={(text) => {
        void sendMessage(text);
      }}
      header={header}
      footer={footer}
      renderMessage={renderMessage}
      inputPlaceholder={inputPlaceholder}
      sendButtonLabel={sendButtonLabel}
      className={className}
      classNames={classNames}
      styles={styles}
      messagesClassNames={messagesClassNames}
      messagesStyles={messagesStyles}
      inputClassNames={inputClassNames}
      inputStyles={inputStyles}
      unstyled={unstyled}
    />
  );
}