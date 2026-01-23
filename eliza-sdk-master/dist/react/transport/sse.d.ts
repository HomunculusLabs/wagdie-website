import type { StreamCallbacks } from '../../types/chat.js';
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
export declare function readSSEStream(response: Response, callbacks: StreamCallbacks): Promise<void>;
