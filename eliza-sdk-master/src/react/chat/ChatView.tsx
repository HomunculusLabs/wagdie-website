// ChatView - controlled presentational component
import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { ChatMessagesProps, ChatMessagesSlots } from './components/ChatMessages.js';
import type { ChatInputSlots } from './components/ChatInput.js';
import { ChatMessages } from './components/ChatMessages.js';
import { ChatInput } from './components/ChatInput.js';
import { cn } from '../shared/cn.js';
import { dataElizaComponent, dataElizaSlot } from '../shared/dataAttrs.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';

// ChatView's own slots
export type ChatViewSlots =
  | 'root'
  | 'header'
  | 'error'
  | 'errorMessage'
  | 'errorDismiss'
  | 'messagesContainer'
  | 'input'
  | 'footer';

// Combined slots including child component slots (prefixed to avoid collision)
export type ChatViewAllSlots =
  | ChatViewSlots
  | `messages.${ChatMessagesSlots}`
  | `chatInput.${ChatInputSlots}`;

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

export function ChatView(props: ChatViewProps): JSX.Element {
  const {
    messages,
    streamingContent = '',
    isStreaming = false,
    error = null,
    onSend,
    onClearError,
    header,
    footer,
    renderMessage,
    inputPlaceholder = 'Type a message...',
    sendButtonLabel = 'Send',
    className,
    classNames,
    styles,
    messagesClassNames,
    messagesStyles,
    inputClassNames,
    inputStyles,
    unstyled = false,
  } = props;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollDepsKey = useMemo(() => {
    const last = messages[messages.length - 1];
    return `${messages.length}:${last?.id ?? ''}:${streamingContent.length}:${isStreaming ? '1' : '0'}`;
  }, [isStreaming, messages, streamingContent.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [scrollDepsKey]);

  // When unstyled=true, apply NO inline styles
  const rootStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        flexDirection: 'column',
      };

  const errorStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        marginBottom: 8,
        padding: 8,
        border: '1px solid var(--eliza-chat-error-border, #fca5a5)',
        background: 'var(--eliza-chat-error-bg, #fee2e2)',
        color: 'var(--eliza-chat-error-color, #7f1d1d)',
      };

  const errorRowStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      };

  const messagesContainerStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        flex: 1,
        minHeight: 0,
      };

  // Merge base styles with user overrides
  const mergedRootStyle = rootStyle || styles?.root ? { ...rootStyle, ...styles?.root } : undefined;
  const mergedErrorStyle =
    errorStyle || styles?.error ? { ...errorStyle, ...styles?.error } : undefined;
  const mergedMessagesContainerStyle =
    messagesContainerStyle || styles?.messagesContainer
      ? { ...messagesContainerStyle, ...styles?.messagesContainer }
      : undefined;

  return (
    <div
      {...dataElizaComponent('ChatView')}
      className={cn(className, classNames?.root)}
      style={mergedRootStyle}
    >
      {header ? (
        <div
          {...dataElizaSlot('header')}
          className={cn(classNames?.header)}
          style={styles?.header}
        >
          {header}
        </div>
      ) : null}

      {error ? (
        <div
          {...dataElizaSlot('error')}
          role='alert'
          className={cn(classNames?.error)}
          style={mergedErrorStyle}
        >
          <div style={errorRowStyle}>
            <div
              {...dataElizaSlot('errorMessage')}
              className={cn(classNames?.errorMessage)}
              style={styles?.errorMessage}
            >
              {error.message}
            </div>
            <button
              {...dataElizaSlot('errorDismiss')}
              type='button'
              onClick={() => onClearError?.()}
              disabled={!onClearError}
              className={cn(classNames?.errorDismiss)}
              style={styles?.errorDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div
        {...dataElizaSlot('messagesContainer')}
        className={cn(classNames?.messagesContainer)}
        style={mergedMessagesContainerStyle}
      >
        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          renderMessage={renderMessage}
          classNames={messagesClassNames}
          styles={messagesStyles}
          unstyled={unstyled}
        />
        <div ref={bottomRef} />
      </div>

      <div
        {...dataElizaSlot('input')}
        className={cn(classNames?.input)}
        style={styles?.input}
      >
        <ChatInput
          onSend={onSend}
          disabled={isStreaming}
          placeholder={inputPlaceholder}
          sendButtonLabel={sendButtonLabel}
          classNames={inputClassNames}
          styles={inputStyles}
          unstyled={unstyled}
        />
      </div>

      {footer ? (
        <div
          {...dataElizaSlot('footer')}
          className={cn(classNames?.footer)}
          style={styles?.footer}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
