import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../shared/cn.js';
import { dataElizaComponent, dataElizaSlot } from '../../shared/dataAttrs.js';
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

export function ChatInput(props: ChatInputProps): JSX.Element {
  const {
    onSend,
    disabled = false,
    placeholder = 'Type a message...',
    className,
    sendButtonLabel = 'Send',
    classNames,
    styles,
    unstyled = false,
  } = props;

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When unstyled=true, apply NO inline styles - let consumers control everything via classNames
  const rootStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        display: 'flex',
        gap: 8,
        padding: 12,
        borderTop: '1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))',
      };

  const textareaStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        flex: 1,
        resize: 'none',
        padding: '10px 12px',
        borderRadius: 'var(--eliza-chat-input-radius, 10px)',
        border: '1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))',
        background: 'var(--eliza-chat-input-bg, transparent)',
        font: 'inherit',
      };

  const sendButtonStyle: React.CSSProperties | undefined = unstyled
    ? undefined
    : {
        padding: '10px 12px',
        borderRadius: 'var(--eliza-chat-input-radius, 10px)',
        border: '1px solid var(--eliza-chat-input-border, rgba(0,0,0,0.2))',
        background: disabled
          ? 'var(--eliza-chat-send-bg-disabled, #e5e7eb)'
          : 'var(--eliza-chat-send-bg, #111827)',
        color: disabled
          ? 'var(--eliza-chat-send-color-disabled, #6b7280)'
          : 'var(--eliza-chat-send-color, #f9fafb)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const doSend = useCallback(() => {
    if (disabled) return;

    const trimmed = value.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setValue('');

    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.focus();
    }
  }, [disabled, onSend, value]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') return;
      if (e.shiftKey) return;

      e.preventDefault();
      doSend();
    },
    [doSend]
  );

  // Merge base styles with user overrides (undefined + object = object)
  const mergedRootStyle = rootStyle || styles?.root ? { ...rootStyle, ...styles?.root } : undefined;
  const mergedTextareaStyle =
    textareaStyle || styles?.textarea ? { ...textareaStyle, ...styles?.textarea } : undefined;
  const mergedSendButtonStyle =
    sendButtonStyle || styles?.sendButton ? { ...sendButtonStyle, ...styles?.sendButton } : undefined;

  return (
    <div
      {...dataElizaComponent('ChatInput')}
      className={cn(className, classNames?.root)}
      style={mergedRootStyle}
    >
      <textarea
        {...dataElizaSlot('textarea')}
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        aria-label="Chat message input"
        className={cn(classNames?.textarea)}
        style={mergedTextareaStyle}
      />

      <button
        {...dataElizaSlot('sendButton')}
        type="button"
        onClick={doSend}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
        className={cn(classNames?.sendButton)}
        style={mergedSendButtonStyle}
      >
        {sendButtonLabel}
      </button>
    </div>
  );
}