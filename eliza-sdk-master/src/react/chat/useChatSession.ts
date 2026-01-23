import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, StreamCallbacks } from '../../types/chat.js';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

export type UseChatSessionOptions = {
  transport?: ElizaTransport;
  characterId: string;
  initialConversationId?: string | null;
  onConversationId?: (id: string | null) => void;
};

export type UseChatSessionResult = {
  messages: ChatMessage[];
  conversationId: string | null;

  isStreaming: boolean;
  streamingContent: string;

  sendMessage: (text: string) => Promise<void>;
  abort: () => void;

  setConversationId: (id: string | null) => void;
  reset: () => void;

  error: Error | null;
  clearError: () => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.randomUUID) {
    return `${prefix}-${cryptoObj.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

type ActiveStreamState = {
  controller: AbortController;
  assistantContent: string;
  completed: boolean;
};

export function useChatSession(options: UseChatSessionOptions): UseChatSessionResult {
  const { transport: transportOverride, characterId, initialConversationId = null, onConversationId } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationIdState] = useState<string | null>(initialConversationId);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const attemptRef = useRef(0);
  const activeStreamRef = useRef<ActiveStreamState | null>(null);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React 18 Strict Mode)
    return () => {
      isMountedRef.current = false;
      attemptRef.current += 1;
      activeStreamRef.current?.controller.abort();
      activeStreamRef.current = null;
    };
  }, []);

  const safeSetState = useMemo(() => {
    return {
      setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
        if (!isMountedRef.current) return;
        setMessages(updater);
      },
      setConversationId: (next: string | null) => {
        if (!isMountedRef.current) return;
        setConversationIdState(next);
      },
      setIsStreaming: (next: boolean) => {
        if (!isMountedRef.current) return;
        setIsStreaming(next);
      },
      setStreamingContent: (next: string) => {
        if (!isMountedRef.current) return;
        setStreamingContent(next);
      },
      setError: (next: Error | null) => {
        if (!isMountedRef.current) return;
        setError(next);
      },
    };
  }, []);

  const clearError = useCallback(() => {
    safeSetState.setError(null);
  }, [safeSetState]);

  const setConversationId = useCallback(
    (next: string | null) => {
      safeSetState.setConversationId(next);
      onConversationId?.(next);
    },
    [onConversationId, safeSetState]
  );

  const abort = useCallback(() => {
    attemptRef.current += 1;
    activeStreamRef.current?.controller.abort();
    activeStreamRef.current = null;

    safeSetState.setIsStreaming(false);
    safeSetState.setStreamingContent('');
  }, [safeSetState]);

  const reset = useCallback(() => {
    abort();
    safeSetState.setMessages([]);
    setConversationId(null);
    safeSetState.setError(null);
  }, [abort, safeSetState, setConversationId]);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!transport) {
        safeSetState.setError(
          new Error('useChatSession requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.')
        );
        return;
      }

      if (!characterId || characterId.trim().length === 0) {
        safeSetState.setError(new Error('useChatSession requires a non-empty characterId.'));
        return;
      }

      if (isStreaming) {
        return;
      }

      // Abort any previous in-flight stream just in case.
      abort();

      const attemptId = ++attemptRef.current;
      const controller = new AbortController();

      activeStreamRef.current = {
        controller,
        assistantContent: '',
        completed: false,
      };

      const userMessage: ChatMessage = {
        id: randomId('user'),
        role: 'user',
        content: trimmed,
        createdAt: nowIso(),
      };

      safeSetState.setMessages((prev) => [...prev, userMessage]);
      safeSetState.setError(null);
      safeSetState.setIsStreaming(true);
      safeSetState.setStreamingContent('');

      const callbacks: StreamCallbacks = {
        onChunk: (chunk: string) => {
          if (attemptRef.current !== attemptId) return;
          const active = activeStreamRef.current;
          if (!active || active.controller.signal.aborted) return;
          if (active.completed) return;

          active.assistantContent += chunk;
          safeSetState.setStreamingContent(active.assistantContent);
        },

        onComplete: (message: ChatMessage, nextConversationId: string) => {
          if (attemptRef.current !== attemptId) return;
          const active = activeStreamRef.current;
          if (!active || active.controller.signal.aborted) return;
          if (active.completed) return;

          active.completed = true;

          safeSetState.setMessages((prev) => [...prev, message]);
          setConversationId(nextConversationId || null);

          safeSetState.setIsStreaming(false);
          safeSetState.setStreamingContent('');
          activeStreamRef.current = null;
        },

        onError: (err) => {
          if (attemptRef.current !== attemptId) return;
          const active = activeStreamRef.current;
          if (!active || active.controller.signal.aborted) return;
          if (active.completed) return;

          safeSetState.setError(toError(err, 'Chat request failed'));
          safeSetState.setIsStreaming(false);
          safeSetState.setStreamingContent('');
          activeStreamRef.current = null;
        },
      };

      try {
        await transport.chat.sendMessageStream(
          {
            characterId,
            message: trimmed,
            conversationId: conversationId ?? undefined,
          },
          callbacks
        );

        // If a transport returns without calling onComplete/onError, best-effort finalize.
        if (attemptRef.current !== attemptId) return;

        const active = activeStreamRef.current;
        if (!active || active.controller.signal.aborted || active.completed) return;

        if (active.assistantContent) {
          const assistantMessage: ChatMessage = {
            id: randomId('assistant'),
            role: 'assistant',
            content: active.assistantContent,
            createdAt: nowIso(),
          };

          active.completed = true;
          safeSetState.setMessages((prev) => [...prev, assistantMessage]);
        }

        safeSetState.setIsStreaming(false);
        safeSetState.setStreamingContent('');
        activeStreamRef.current = null;
      } catch (err) {
        if (attemptRef.current !== attemptId) return;

        const active = activeStreamRef.current;
        if (active && active.controller.signal.aborted) {
          // Soft-abort: ignore errors after abort.
          return;
        }

        safeSetState.setError(toError(err, 'Chat request failed'));
        safeSetState.setIsStreaming(false);
        safeSetState.setStreamingContent('');
        activeStreamRef.current = null;
      }
    },
    [abort, characterId, conversationId, isStreaming, safeSetState, setConversationId, transport]
  );

  return {
    messages,
    conversationId,

    isStreaming,
    streamingContent,

    sendMessage,
    abort,

    setConversationId,
    reset,

    error,
    clearError,
  };
}