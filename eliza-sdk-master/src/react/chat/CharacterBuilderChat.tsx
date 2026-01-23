import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ChatMessage } from '../../types/chat.js';
import type { CreateCharacterInput } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import { cn } from '../shared/cn.js';
import { dataElizaComponent, dataElizaSlot } from '../shared/dataAttrs.js';
import type { SlotClassNames, SlotStyles } from '../shared/slots.js';
import { ChatMessages, type ChatMessagesSlots } from './components/ChatMessages.js';
import { ChatInput, type ChatInputSlots } from './components/ChatInput.js';
import { useBuilderChatSession } from './useBuilderChatSession.js';

/** Slot names for CharacterBuilderChat component */
export type CharacterBuilderChatSlots =
  | 'root'
  | 'messages'
  | 'input'
  | 'actions'
  | 'applyButton'
  | 'clearButton'
  | 'hint'
  | 'status'
  | 'error'
  | 'parseError'
  | 'success'
  | 'unavailable';

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
  renderMessage?: (message: ChatMessage, state: { isStreaming: boolean }) => ReactNode;
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
export function CharacterBuilderChat(props: CharacterBuilderChatProps): JSX.Element {
  const {
    transport,
    systemPrompt,
    initialAssistantMessage,
    onParsedValues,
    onError,
    onParseError,
    disabled = false,
    renderMessage,
    inputPlaceholder = 'Describe your character...',
    sendButtonLabel = 'Send',
    applyButtonLabel = 'Apply to Form',
    clearButtonLabel = 'Clear Chat',
    readyHint = 'Ready! Click to populate the form.',
    needsInfoHint = 'Describe your character to get started.',
    successMessage = 'Form populated! Edit and submit when ready.',
    unavailableMessage = 'Character builder chat is not available. Use the manual form instead.',
    unstyled = false,
    className,
    classNames,
    styles,
    messagesClassNames,
    messagesStyles,
    inputClassNames,
    inputStyles,
  } = props;

  const {
    messages,
    isSending,
    error,
    parseStatus,
    parseError,
    isAvailable,
    canParse,
    sendMessage,
    applyToForm,
    reset,
    clearError,
    clearParseError,
  } = useBuilderChatSession({
    transport,
    systemPrompt,
    initialAssistantMessage,
    onParsedValues,
    onError,
    onParseError,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after sending
  useEffect(() => {
    if (!isSending) {
      inputRef.current?.focus();
    }
  }, [isSending]);

  const handleSend = useCallback(
    (text: string) => {
      if (!disabled) {
        sendMessage(text);
      }
    },
    [disabled, sendMessage]
  );

  const handleApply = useCallback(() => {
    if (!disabled) {
      applyToForm();
    }
  }, [disabled, applyToForm]);

  const handleClear = useCallback(() => {
    reset();
  }, [reset]);

  // Default styles
  const rootStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '300px',
      };

  const actionsStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        flexWrap: 'wrap',
      };

  const buttonStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        padding: '6px 12px',
        cursor: 'pointer',
      };

  const hintStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        fontSize: '0.875rem',
        opacity: 0.7,
        marginLeft: 'auto',
      };

  const statusStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        padding: '8px',
        marginTop: '8px',
        borderRadius: '4px',
      };

  const errorStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        padding: '8px',
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      };

  const unavailableStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        padding: '16px',
        textAlign: 'center',
        opacity: 0.7,
      };

  // If builder chat is not available, show unavailable message
  if (!isAvailable) {
    return (
      <div
        {...dataElizaComponent('CharacterBuilderChat')}
        {...dataElizaSlot('unavailable')}
        className={cn(className, classNames?.unavailable)}
        style={{ ...unavailableStyle, ...styles?.root, ...styles?.unavailable }}
      >
        {unavailableMessage}
      </div>
    );
  }

  return (
    <div
      {...dataElizaComponent('CharacterBuilderChat')}
      {...dataElizaSlot('root')}
      className={cn(className, classNames?.root)}
      style={{ ...rootStyle, ...styles?.root }}
    >
      {/* Messages */}
      <div
        {...dataElizaSlot('messages')}
        className={cn(classNames?.messages)}
        style={{ flex: 1, overflow: 'auto', ...styles?.messages }}
      >
        <ChatMessages
          messages={messages}
          streamingContent=""
          isStreaming={isSending}
          renderMessage={renderMessage}
          classNames={messagesClassNames}
          styles={messagesStyles}
          unstyled={unstyled}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Send error */}
      {error && (
        <div
          {...dataElizaSlot('error')}
          role="alert"
          className={cn(classNames?.error)}
          style={{ ...errorStyle, ...styles?.error }}
        >
          <span>{error.message}</span>
          <button
            type="button"
            onClick={clearError}
            className={cn(classNames?.clearButton)}
            style={buttonStyle}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input */}
      <div
        {...dataElizaSlot('input')}
        className={cn(classNames?.input)}
        style={styles?.input}
      >
        <ChatInput
          onSend={handleSend}
          disabled={disabled || isSending}
          placeholder={inputPlaceholder}
          sendButtonLabel={isSending ? '...' : sendButtonLabel}
          classNames={inputClassNames}
          styles={inputStyles}
          unstyled={unstyled}
        />
      </div>

      {/* Actions */}
      <div
        {...dataElizaSlot('actions')}
        className={cn(classNames?.actions)}
        style={{ ...actionsStyle, ...styles?.actions }}
      >
        <button
          type="button"
          {...dataElizaSlot('applyButton')}
          onClick={handleApply}
          disabled={disabled || !canParse || parseStatus === 'loading'}
          className={cn(classNames?.applyButton)}
          style={{ ...buttonStyle, ...styles?.applyButton }}
        >
          {parseStatus === 'loading' ? 'Applying...' : applyButtonLabel}
        </button>
        <button
          type="button"
          {...dataElizaSlot('clearButton')}
          onClick={handleClear}
          disabled={disabled || messages.length === 0}
          className={cn(classNames?.clearButton)}
          style={{ ...buttonStyle, ...styles?.clearButton }}
        >
          {clearButtonLabel}
        </button>
        <span
          {...dataElizaSlot('hint')}
          className={cn(classNames?.hint)}
          style={{ ...hintStyle, ...styles?.hint }}
        >
          {canParse ? readyHint : needsInfoHint}
        </span>
      </div>

      {/* Parse error */}
      {parseStatus === 'error' && parseError && (
        <div
          {...dataElizaSlot('parseError')}
          role="alert"
          className={cn(classNames?.parseError)}
          style={{ ...errorStyle, ...styles?.parseError }}
        >
          <span>{parseError.message}</span>
          <button
            type="button"
            onClick={clearParseError}
            className={cn(classNames?.clearButton)}
            style={buttonStyle}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success status */}
      {parseStatus === 'done' && (
        <div
          {...dataElizaSlot('success')}
          className={cn(classNames?.success)}
          style={{ ...statusStyle, ...styles?.success }}
        >
          {successMessage}
        </div>
      )}
    </div>
  );
}
