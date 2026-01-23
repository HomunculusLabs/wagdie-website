import type { ChatMessage, StreamCallbacks } from '../types/chat.js';
import { ElizaNetworkError } from '../errors/ElizaNetworkError.js';
import { ElizaAPIError } from '../errors/ElizaAPIError.js';

export interface StreamConfig {
  url: string;
  getAuthHeader: () => string | null;
  timeout?: number;
}

type StreamState = {
  fullContent: string;
  messageId: string;
  conversationId: string;
  aborted: boolean;
  completed: boolean;
};

type TimeoutId = ReturnType<typeof setTimeout> | undefined;

function createStreamState(): StreamState {
  return {
    fullContent: '',
    messageId: '',
    conversationId: '',
    aborted: false,
    completed: false,
  };
}

function buildAssistantMessage(state: StreamState, idOverride?: string): ChatMessage {
  return {
    id: idOverride ?? state.messageId,
    role: 'assistant',
    content: state.fullContent,
    createdAt: new Date().toISOString(),
  };
}

function clearTimeoutIfSet(timeoutId: TimeoutId): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

function setStreamTimeout(
  currentTimeoutId: TimeoutId,
  ms: number,
  onTimeout: () => void
): ReturnType<typeof setTimeout> {
  clearTimeoutIfSet(currentTimeoutId);
  return setTimeout(onTimeout, ms);
}

function buildEventSourceUrl(url: string, authHeader: string | null): string {
  const streamUrl = new URL(url);

  // EventSource doesn't support custom headers, so we need to use query params or cookies
  // For API keys, we'll use a query parameter
  if (authHeader?.startsWith('Bearer elk_')) {
    streamUrl.searchParams.set('apiKey', authHeader.replace('Bearer ', ''));
  }

  return streamUrl.toString();
}

function appendEventSourceToken(
  state: StreamState,
  callbacks: StreamCallbacks,
  token: string
): void {
  // EventSource semantics: preserve `data.token || data.content || ''` (including empty-string chunk)
  state.fullContent += token;
  callbacks.onChunk(token);
}

function appendFetchToken(
  state: StreamState,
  callbacks: StreamCallbacks,
  token: string
): void {
  // Fetch semantics: only called when `parsed.token || parsed.content` is truthy
  state.fullContent += token;
  callbacks.onChunk(token);
}

function handleEventSourceMessage(
  state: StreamState,
  rawData: string,
  callbacks: StreamCallbacks,
  control: {
    clearTimeout: () => void;
    close: () => void;
    abort: () => void;
  }
): void {
  if (state.aborted) {
    return;
  }

  try {
    const data = JSON.parse(rawData) as Record<string, unknown>;

    // Handle different event types
    if ((data as any).type === 'token' || (data as any).token) {
      const token = ((data as any).token || (data as any).content || '') as string;
      appendEventSourceToken(state, callbacks, token);
      return;
    }

    if ((data as any).type === 'complete' || (data as any).done) {
      // Stream complete
      state.messageId =
        (((data as any).messageId || (data as any).id) as string) || state.messageId;
      state.conversationId =
        (((data as any).conversationId as string) || state.conversationId) as string;

      control.clearTimeout();

      const message = buildAssistantMessage(state);
      state.completed = true;

      callbacks.onComplete(message, state.conversationId);
      control.close();
      return;
    }

    if ((data as any).type === 'error' || (data as any).error) {
      throw new ElizaAPIError(
        (((data as any).message || (data as any).error || 'Stream error') as string) ??
          'Stream error',
        500
      );
    }

    if ((data as any).conversationId) {
      // Metadata update
      state.conversationId = (data as any).conversationId as string;
      if ((data as any).messageId) {
        state.messageId = (data as any).messageId as string;
      }
      return;
    }
  } catch (parseError) {
    // If it's just text content, treat it as a token
    if (typeof rawData === 'string' && !rawData.startsWith('{')) {
      appendEventSourceToken(state, callbacks, rawData);
    } else if (parseError instanceof ElizaAPIError) {
      // Preserve current behavior: only surface JSON-ish parse failures if they are ElizaAPIError
      callbacks.onError(parseError);
      control.abort();
    }
  }
}

function handleFetchSseLine(state: StreamState, line: string, callbacks: StreamCallbacks): void {
  if (!line.startsWith('data: ')) {
    return;
  }

  const data = line.slice(6);

  if (data === '[DONE]') {
    return;
  }

  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;

    if ((parsed as any).token || (parsed as any).content) {
      const token = ((parsed as any).token || (parsed as any).content) as string;
      appendFetchToken(state, callbacks, token);
    }

    if ((parsed as any).conversationId) {
      state.conversationId = (parsed as any).conversationId as string;
    }

    if ((parsed as any).messageId || (parsed as any).id) {
      state.messageId = ((parsed as any).messageId || (parsed as any).id) as string;
    }

    if ((parsed as any).done || (parsed as any).type === 'complete') {
      const message = buildAssistantMessage(state);
      callbacks.onComplete(message, state.conversationId);
    }
  } catch {
    // Non-JSON data, treat as token
    if (data.trim()) {
      appendFetchToken(state, callbacks, data);
    }
  }
}

/**
 * SSE streaming implementation for chat messages
 */
export function createChatStream(
  config: StreamConfig,
  callbacks: StreamCallbacks
): { abort: () => void } {
  const { url, getAuthHeader, timeout = 60000 } = config;

  const state = createStreamState();
  let timeoutId: TimeoutId;
  let eventSource: EventSource | null = null;

  const abort = () => {
    state.aborted = true;
    clearTimeoutIfSet(timeoutId);
    if (eventSource) {
      eventSource.close();
    }
  };

  // Set timeout
  timeoutId = setStreamTimeout(timeoutId, timeout, () => {
    abort();
    callbacks.onError(new ElizaNetworkError('Stream timed out'));
  });

  try {
    const authHeader = getAuthHeader();
    const eventSourceUrl = buildEventSourceUrl(url, authHeader);

    eventSource = new EventSource(eventSourceUrl, {
      withCredentials: true, // For cookie-based auth
    });

    eventSource.onopen = () => {
      if (state.aborted) return;
      // Clear timeout on successful connection, set new one for message timeout
      clearTimeoutIfSet(timeoutId);
      timeoutId = setStreamTimeout(timeoutId, timeout, () => {
        abort();
        callbacks.onError(new ElizaNetworkError('Stream message timed out'));
      });
    };

    eventSource.onmessage = (event) => {
      if (state.aborted) return;

      handleEventSourceMessage(state, event.data as string, callbacks, {
        clearTimeout: () => clearTimeoutIfSet(timeoutId),
        close: () => {
          eventSource?.close();
        },
        abort,
      });
    };

    eventSource.onerror = (error) => {
      if (state.aborted) return;
      abort();

      // EventSource error doesn't have much info
      callbacks.onError(
        new ElizaNetworkError('Stream connection error', error as unknown as Error)
      );
    };
  } catch (error) {
    abort();
    callbacks.onError(
      error instanceof Error
        ? new ElizaNetworkError('Failed to create stream', error)
        : new ElizaNetworkError('Failed to create stream')
    );
  }

  return { abort };
}

/**
 * Fetch-based streaming for environments without EventSource
 */
export async function fetchChatStream(
  config: StreamConfig,
  body: unknown,
  callbacks: StreamCallbacks
): Promise<void> {
  const { url, getAuthHeader, timeout = 60000 } = config;

  const state = createStreamState();

  const controller = new AbortController();
  let timeoutId: TimeoutId;
  timeoutId = setStreamTimeout(timeoutId, timeout, () => controller.abort());

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const authHeader = getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw ElizaAPIError.fromResponse(response.status);
    }

    if (!response.body) {
      throw new ElizaNetworkError('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      // Preserve current behavior: split per chunk by newline (no buffering across chunks)
      const lines = chunk.split('\n');

      for (const line of lines) {
        handleFetchSseLine(state, line, callbacks);
      }
    }

    // If we haven't completed yet, send completion
    if (state.fullContent && !state.messageId) {
      const message = buildAssistantMessage(
        state,
        crypto.randomUUID?.() || Date.now().toString()
      );
      callbacks.onComplete(message, state.conversationId);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      callbacks.onError(new ElizaNetworkError('Stream timed out'));
    } else if (error instanceof ElizaAPIError) {
      callbacks.onError(error);
    } else {
      callbacks.onError(
        new ElizaNetworkError('Stream failed', error instanceof Error ? error : undefined)
      );
    }
  } finally {
    clearTimeoutIfSet(timeoutId);
  }
}
