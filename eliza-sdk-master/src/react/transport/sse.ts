import type { ChatMessage, StreamCallbacks } from '../../types/chat.js';
import { ElizaAPIError } from '../../errors/ElizaAPIError.js';
import { ElizaNetworkError } from '../../errors/ElizaNetworkError.js';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildAssistantMessage(id: string, content: string): ChatMessage {
  return {
    id,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
}

function buildFallbackId(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `msg-${Date.now()}`;
}

function extractTokenFromPayload(payload: UnknownRecord): string | null {
  const token = getString(payload.token);
  if (token !== null) return token;

  const content = getString(payload.content);
  if (content !== null) return content;

  if (payload.type === 'token') {
    return '';
  }

  return null;
}

function extractErrorMessage(payload: UnknownRecord): string {
  const message = getString(payload.message);
  if (message) return message;

  const error = getString(payload.error);
  if (error) return error;

  return 'Stream error';
}

function extractConversationId(payload: UnknownRecord): string | null {
  const conversationId = getString(payload.conversationId);
  return conversationId ?? null;
}

function extractMessageId(payload: UnknownRecord): string | null {
  const messageId = getString(payload.messageId);
  if (messageId) return messageId;

  const id = getString(payload.id);
  if (id) return id;

  return null;
}

function isDonePayload(payload: UnknownRecord): boolean {
  if (payload.done === true) return true;
  if (payload.type === 'complete') return true;
  return false;
}

/**
 * Reads an SSE stream from a fetch Response and fans out to StreamCallbacks.
 *
 * Supports:
 * - SDK-style events: `data: {"token":"..."} ... data: {"done":true,...}`
 * - wagdie-style events: `event: token|complete|error` + `data: {...}`
 *
 * Notes:
 * - This function follows the SDK streaming convention: it reports errors via `callbacks.onError`
 *   and does not throw for normal transport/parse failures.
 */
export async function readSSEStream(response: Response, callbacks: StreamCallbacks): Promise<void> {
  let completed = false;
  let fullContent = '';
  let conversationId = '';
  let messageId = '';

  try {
    if (!response.ok) {
      const status = response.status;
      const text = await response.text().catch(() => '');
      const parsed = text ? safeJsonParse(text) : null;

      if (isRecord(parsed)) {
        callbacks.onError(ElizaAPIError.fromResponse(status, parsed as any));
      } else {
        callbacks.onError(new ElizaAPIError(text || `HTTP ${status}`, status));
      }
      return;
    }

    if (!response.body) {
      callbacks.onError(new ElizaNetworkError('No response stream'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    const maybeComplete = (contentOverride?: string, idOverride?: string, conversationIdOverride?: string) => {
      if (completed) return;
      completed = true;

      const finalContent = typeof contentOverride === 'string' ? contentOverride : fullContent;
      if (typeof contentOverride === 'string') {
        fullContent = contentOverride;
      }

      if (typeof conversationIdOverride === 'string') {
        conversationId = conversationIdOverride;
      }

      if (typeof idOverride === 'string') {
        messageId = idOverride;
      }

      const finalMessageId = messageId || buildFallbackId();
      const message = buildAssistantMessage(finalMessageId, finalContent);

      callbacks.onComplete(message, conversationId);
    };

    const handleToken = (token: string) => {
      if (completed) return;
      fullContent += token;
      callbacks.onChunk(token);
    };

    const handleError = (message: string) => {
      if (completed) return;
      callbacks.onError(new ElizaAPIError(message, 500));
    };

    const handleSdkDataPayload = (payload: UnknownRecord) => {
      const nextConversationId = extractConversationId(payload);
      if (nextConversationId) conversationId = nextConversationId;

      const nextMessageId = extractMessageId(payload);
      if (nextMessageId) messageId = nextMessageId;

      if (payload.type === 'error' || payload.error) {
        handleError(extractErrorMessage(payload));
        return;
      }

      const token = extractTokenFromPayload(payload);
      if (token !== null && !isDonePayload(payload)) {
        handleToken(token);
      }

      if (isDonePayload(payload)) {
        const messageObj = isRecord(payload.message) ? (payload.message as UnknownRecord) : null;
        const contentFromMessage = messageObj ? getString(messageObj.content) : null;
        const contentOverride = getString(payload.content) ?? contentFromMessage ?? undefined;

        const idFromMessage = messageObj ? getString(messageObj.id) : null;
        const idOverride = extractMessageId(payload) ?? idFromMessage ?? undefined;

        const conversationIdOverride = extractConversationId(payload) ?? undefined;

        maybeComplete(contentOverride, idOverride, conversationIdOverride);
      }
    };

    const handleWagdieEvent = (eventType: string, dataRaw: string) => {
      const parsed = safeJsonParse(dataRaw);

      if (!isRecord(parsed)) {
        if (eventType === 'token') {
          handleToken(dataRaw);
          return;
        }

        if (eventType === 'error') {
          handleError(dataRaw || 'Stream error');
          return;
        }

        if (eventType === 'complete') {
          maybeComplete(dataRaw);
          return;
        }

        return;
      }

      const payload = parsed as UnknownRecord;

      if (eventType === 'token') {
        const token = getString((payload as UnknownRecord).token) ?? getString((payload as UnknownRecord).content) ?? '';
        handleToken(token);
        return;
      }

      if (eventType === 'error') {
        handleError(extractErrorMessage(payload));
        return;
      }

      if (eventType === 'complete') {
        const content = getString(payload.content) ?? fullContent;
        const cid = getString(payload.conversationId) ?? conversationId;
        const id = getString(payload.id) ?? messageId;

        if (cid) conversationId = cid;
        if (id) messageId = id;

        maybeComplete(content, id || undefined, cid || undefined);
      }
    };

    const handleEventBlock = (block: string) => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');
      let eventType = '';
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice('event:'.length).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice('data:'.length).trimStart());
          continue;
        }
      }

      const dataRaw = dataLines.join('\n');

      if (!dataRaw) return;
      if (dataRaw === '[DONE]') return;

      if (eventType) {
        handleWagdieEvent(eventType, dataRaw);
        return;
      }

      // SDK-style: only `data:` lines, typically JSON
      const parsed = safeJsonParse(dataRaw);
      if (isRecord(parsed)) {
        handleSdkDataPayload(parsed);
        return;
      }

      // If not JSON, treat as raw token content (SDK sometimes emits plain text)
      if (dataRaw) {
        handleToken(dataRaw);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        handleEventBlock(block);
      }
    }

    // Flush any trailing buffered content (best-effort)
    if (buffer.trim()) {
      handleEventBlock(buffer);
    }

    // Match SDK behavior: if we received content but never got an explicit completion event,
    // synthesize completion.
    if (!completed && fullContent) {
      maybeComplete();
    }
  } catch (error) {
    callbacks.onError(
      error instanceof Error
        ? new ElizaNetworkError('Stream failed', error)
        : new ElizaNetworkError('Stream failed')
    );
  }
}