import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, BuilderChatInput } from '../../types/chat.js';
import type { CreateCharacterInput } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

/**
 * Generate a unique ID for messages.
 * Falls back to a random UUID-like string in non-secure contexts.
 */
function generateId(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Default transcript builder - extracts user messages only.
 * Assistant messages are just guiding questions, not character description.
 */
function defaultBuildTranscript(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');
}

/** Parse status for the character generation */
export type ParseStatus = 'idle' | 'loading' | 'done' | 'error';

export interface UseBuilderChatSessionOptions {
  /** Override transport (otherwise uses ElizaProvider context) */
  transport?: ElizaTransport;
  /** System prompt for the builder assistant */
  systemPrompt?: string;
  /** Initial messages to populate the chat */
  initialMessages?: ChatMessage[];
  /** Initial assistant message (string or ChatMessage) */
  initialAssistantMessage?: string | ChatMessage;
  /** Custom transcript builder function */
  buildTranscript?: (messages: ChatMessage[]) => string;
  /** Callback when character is successfully parsed */
  onParsedValues?: (values: CreateCharacterInput) => void;
  /** Callback for send errors */
  onError?: (error: Error) => void;
  /** Callback for parse errors */
  onParseError?: (error: Error) => void;
}

export interface UseBuilderChatSessionResult {
  /** Current chat messages */
  messages: ChatMessage[];
  /** Whether a message is being sent */
  isSending: boolean;
  /** Current send error (null if none) */
  error: Error | null;
  /** Parse status for character generation */
  parseStatus: ParseStatus;
  /** Parse error (null if none) */
  parseError: Error | null;
  /** Whether the builder chat is available (transport supports it) */
  isAvailable: boolean;
  /** Whether there are enough messages to parse */
  canParse: boolean;
  /** Send a user message */
  sendMessage: (text: string) => Promise<void>;
  /** Parse the transcript and apply to form */
  applyToForm: () => Promise<CreateCharacterInput | null>;
  /** Reset the chat to initial state */
  reset: () => void;
  /** Clear the current error */
  clearError: () => void;
  /** Clear the parse error */
  clearParseError: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `You are a friendly character builder assistant helping users create Eliza AI agents. Your job is to have a natural conversation to gather information about the character they want to create.

Ask about:
- Character name and basic identity
- Personality traits and communication style
- Backstory and history
- Skills, knowledge areas, and topics they're interested in
- How they should speak (formal/casual, humor, quirks)
- Example interactions or scenarios

Be conversational and encouraging. Ask one or two questions at a time. When you have enough information, summarize what you've learned.

Keep your responses concise and focused. Don't overwhelm the user with too many questions at once.`;

const DEFAULT_INITIAL_MESSAGE = "Hello! I'm here to help you create a new Eliza character. Let's start with the basics - what would you like to name your character?";

/**
 * Hook for managing a character builder chat session.
 * Provides state management for chat messages, sending, and parsing.
 */
export function useBuilderChatSession(
  options: UseBuilderChatSessionOptions = {}
): UseBuilderChatSessionResult {
  const {
    transport: transportOverride,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    initialMessages,
    initialAssistantMessage = DEFAULT_INITIAL_MESSAGE,
    buildTranscript = defaultBuildTranscript,
    onParsedValues,
    onError,
    onParseError,
  } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  // Check if builder chat is available
  const isAvailable = Boolean(transport?.chat?.sendBuilderMessage);
  const canParseRef = useRef(false);

  // Build the initial message
  const initialMessage = useMemo<ChatMessage | null>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return null; // Don't add initial message if initialMessages provided
    }
    if (!initialAssistantMessage) {
      return null;
    }
    if (typeof initialAssistantMessage === 'string') {
      return {
        id: generateId(),
        role: 'assistant',
        content: initialAssistantMessage,
        createdAt: nowIso(),
      };
    }
    return initialAssistantMessage;
  }, [initialMessages, initialAssistantMessage]);

  // Initialize messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    if (initialMessage) {
      return [initialMessage];
    }
    return [];
  });

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
  const [parseError, setParseError] = useState<Error | null>(null);

  // Track messages ref for async operations
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Update canParse based on messages
  const canParse = useMemo(() => {
    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    return userMessageCount >= 1;
  }, [messages]);
  canParseRef.current = canParse;

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || isSending || !transport?.chat?.sendBuilderMessage) {
        return;
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: nowIso(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        // Build the request with all messages including the new one
        const allMessages = [...messagesRef.current, userMessage].map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const input: BuilderChatInput = {
          systemPrompt,
          messages: allMessages,
        };

        const response = await transport.chat.sendBuilderMessage(input);

        const assistantMessage: ChatMessage = {
          id: response.message.id || generateId(),
          role: 'assistant',
          content: response.message.content,
          createdAt: response.message.createdAt || nowIso(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorObj = toError(err, 'Failed to send message');
        setError(errorObj);
        onError?.(errorObj);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, transport, systemPrompt, onError]
  );

  const applyToForm = useCallback(async (): Promise<CreateCharacterInput | null> => {
    if (!canParseRef.current || !transport?.characters?.parseSummary) {
      return null;
    }

    setParseStatus('loading');
    setParseError(null);

    try {
      const transcript = buildTranscript(messagesRef.current);
      const parsed = await transport.characters.parseSummary({ summary: transcript });
      setParseStatus('done');
      onParsedValues?.(parsed);
      return parsed;
    } catch (err) {
      const errorObj = toError(err, 'Failed to parse character');
      setParseError(errorObj);
      setParseStatus('error');
      onParseError?.(errorObj);
      return null;
    }
  }, [transport, buildTranscript, onParsedValues, onParseError]);

  const reset = useCallback(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else if (initialMessage) {
      setMessages([initialMessage]);
    } else {
      setMessages([]);
    }
    setIsSending(false);
    setError(null);
    setParseStatus('idle');
    setParseError(null);
  }, [initialMessages, initialMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearParseError = useCallback(() => {
    setParseError(null);
  }, []);

  return {
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
  };
}
