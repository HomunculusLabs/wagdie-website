import type { ReactNode } from 'react';
import type { ChatMessage } from '../../../types/chat.js';
import { cn } from '../../shared/cn.js';
import { dataElizaComponent, dataElizaSlot } from '../../shared/dataAttrs.js';
import type { SlotClassNames, SlotStyles } from '../../shared/slots.js';

export type ChatMessagesSlots =
  | 'root'
  | 'list'
  | 'empty'
  | 'row'
  | 'bubble'
  | 'bubbleUser'
  | 'bubbleAssistant'
  | 'typing';

export interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  className?: string;
  renderMessage?: (message: ChatMessage, state: { isStreaming: boolean }) => ReactNode;
  classNames?: SlotClassNames<ChatMessagesSlots>;
  styles?: SlotStyles<ChatMessagesSlots>;
  unstyled?: boolean;
}

function isUser(role: ChatMessage['role']): boolean {
  return role === 'user';
}

type DefaultMessageBubbleProps = {
  message: ChatMessage;
  isStreaming: boolean;
  classNames?: SlotClassNames<ChatMessagesSlots>;
  styles?: SlotStyles<ChatMessagesSlots>;
  unstyled?: boolean;
};

function DefaultMessageBubble(props: DefaultMessageBubbleProps): JSX.Element {
  const { message, isStreaming, classNames, styles, unstyled = false } = props;
  const isUserMessage = isUser(message.role);

  // When unstyled=true, apply NO inline styles - consumers control via classNames
  const rowStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      };

  const bubbleStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        maxWidth: '80%',
        padding: '10px 12px',
        borderRadius: 'var(--eliza-chat-bubble-radius, 12px)',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        border: '1px solid var(--eliza-chat-bubble-border, rgba(0,0,0,0.1))',
        opacity: isStreaming ? 0.85 : 1,
        background: isUserMessage
          ? 'var(--eliza-chat-bubble-user-bg, #111827)'
          : 'var(--eliza-chat-bubble-assistant-bg, #f3f4f6)',
        color: isUserMessage
          ? 'var(--eliza-chat-bubble-user-color, #f9fafb)'
          : 'var(--eliza-chat-bubble-assistant-color, #111827)',
      };

  // Merge base styles with user overrides
  const mergedRowStyle = rowStyle || styles?.row ? { ...rowStyle, ...styles?.row } : undefined;
  const mergedBubbleStyle =
    bubbleStyle || styles?.bubble || (isUserMessage ? styles?.bubbleUser : styles?.bubbleAssistant)
      ? {
          ...bubbleStyle,
          ...styles?.bubble,
          ...(isUserMessage ? styles?.bubbleUser : styles?.bubbleAssistant),
        }
      : undefined;

  return (
    <div
      {...dataElizaSlot('row')}
      role="listitem"
      className={cn(classNames?.row)}
      style={mergedRowStyle}
    >
      <div
        {...dataElizaSlot(isUserMessage ? 'bubbleUser' : 'bubbleAssistant')}
        className={cn(
          classNames?.bubble,
          isUserMessage ? classNames?.bubbleUser : classNames?.bubbleAssistant
        )}
        style={mergedBubbleStyle}
      >
        {message.content}
        {isStreaming ? <span aria-hidden="true"> ▍</span> : null}
      </div>
    </div>
  );
}

export function ChatMessages(props: ChatMessagesProps): JSX.Element {
  const {
    messages,
    streamingContent = '',
    isStreaming = false,
    className,
    renderMessage,
    classNames,
    styles,
    unstyled = false,
  } = props;

  // When unstyled=true, apply NO inline styles
  const rootStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : { overflowY: 'auto', padding: 12 };

  const emptyStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : { opacity: 0.7, padding: 8 };

  const typingStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : { opacity: 0.7, padding: 8 };

  const renderOne = (message: ChatMessage, streaming: boolean) => {
    if (renderMessage) {
      return (
        <div
          key={message.id}
          {...dataElizaSlot('row')}
          role="listitem"
          className={cn(classNames?.row)}
          style={styles?.row}
        >
          {renderMessage(message, { isStreaming: streaming })}
        </div>
      );
    }

    return (
      <DefaultMessageBubble
        key={message.id}
        message={message}
        isStreaming={streaming}
        classNames={classNames}
        styles={styles}
        unstyled={unstyled}
      />
    );
  };

  const hasStreamingBubble = isStreaming && streamingContent.trim().length > 0;

  const streamingMessage: ChatMessage | null = hasStreamingBubble
    ? {
        id: '__eliza_streaming__',
        role: 'assistant',
        content: streamingContent,
        createdAt: new Date().toISOString(),
      }
    : null;

  // Merge base styles with user overrides
  const mergedRootStyle = rootStyle || styles?.root ? { ...rootStyle, ...styles?.root } : undefined;
  const mergedEmptyStyle =
    emptyStyle || styles?.empty ? { ...emptyStyle, ...styles?.empty } : undefined;
  const mergedTypingStyle =
    typingStyle || styles?.typing ? { ...typingStyle, ...styles?.typing } : undefined;

  return (
    <div
      {...dataElizaComponent('ChatMessages')}
      className={cn(className, classNames?.root)}
      role="log"
      aria-live="polite"
      style={mergedRootStyle}
    >
      {messages.length === 0 && !streamingMessage ? (
        <div
          {...dataElizaSlot('empty')}
          className={cn(classNames?.empty)}
          style={mergedEmptyStyle}
        >
          No messages yet.
        </div>
      ) : null}

      <div
        {...dataElizaSlot('list')}
        role="list"
        className={cn(classNames?.list)}
        style={styles?.list}
      >
        {messages.map((m) => renderOne(m, false))}
        {streamingMessage ? renderOne(streamingMessage, true) : null}
        {isStreaming && !streamingMessage ? (
          <div
            {...dataElizaSlot('typing')}
            className={cn(classNames?.typing)}
            style={mergedTypingStyle}
          >
            Assistant is typing…
          </div>
        ) : null}
      </div>
    </div>
  );
}