import type { ApiResponse } from './responses';
import { ApiError, extractApiErrorMessage } from './client-errors';

export type ApiResponseShape = 'raw' | 'envelope';

export interface ApiReadOptions {
  fallbackMessage?: string;
  requireData?: boolean;
}

type ParsedResponseBody = {
  body: unknown;
  parseFailed: boolean;
  expectedJson: boolean;
};

function expectsJsonResponse(response: Response): boolean {
  const headers = response.headers as Headers | undefined;

  // Some existing hook tests use lightweight Response-like mocks without headers.
  // Treat those as JSON to match their `json()`-only shape while leaving real
  // Response content-type detection unchanged.
  if (!headers || typeof headers.get !== 'function') {
    return true;
  }

  const contentType = headers.get('content-type') ?? '';
  return contentType.includes('application/json') || contentType.includes('+json');
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: unknown }).name === 'AbortError';
}

async function parseResponseBody(response: Response): Promise<ParsedResponseBody> {
  const expectedJson = expectsJsonResponse(response);

  if (!expectedJson) {
    return {
      body: await response.text(),
      parseFailed: false,
      expectedJson,
    };
  }

  try {
    return {
      body: await response.json(),
      parseFailed: false,
      expectedJson,
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    return {
      body: undefined,
      parseFailed: true,
      expectedJson,
    };
  }
}

function toApiError(
  response: Response,
  body: unknown,
  fallbackMessage: string,
  options?: Parameters<typeof extractApiErrorMessage>[2]
): ApiError {
  return new ApiError(
    response.status,
    response.statusText,
    extractApiErrorMessage(body, fallbackMessage, options),
    body
  );
}

function isApiResponse<T>(body: unknown): body is ApiResponse<T> {
  return typeof body === 'object' && body !== null && 'success' in body;
}

export { ApiError, extractApiErrorMessage };

export async function readApiRaw<T>(response: Response, fallbackMessage = 'Request failed'): Promise<T> {
  const { body, parseFailed, expectedJson } = await parseResponseBody(response);

  if (!response.ok) {
    throw toApiError(response, body, fallbackMessage, { preferMessage: true });
  }

  if (parseFailed && expectedJson) {
    throw toApiError(response, body, fallbackMessage, { preferMessage: true });
  }

  return body as T;
}

export async function readApiEnvelope<T>(
  response: Response,
  fallbackMessage = 'Request failed',
  options: Pick<ApiReadOptions, 'requireData'> = {}
): Promise<T> {
  const { body, parseFailed } = await parseResponseBody(response);

  if (!response.ok || parseFailed || !isApiResponse<T>(body) || body.success !== true) {
    throw toApiError(response, body, fallbackMessage);
  }

  if (body.data === undefined && options.requireData !== false) {
    throw toApiError(response, body, fallbackMessage);
  }

  return body.data as T;
}

export async function readApiData<T>(response: Response, fallbackMessage: string): Promise<T> {
  return readApiEnvelope<T>(response, fallbackMessage);
}
