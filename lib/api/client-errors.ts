/**
 * Client-side API error utilities shared by fetch helpers.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export interface ApiErrorMessageOptions {
  preferMessage?: boolean;
}

export function extractApiErrorMessage(
  body: unknown,
  fallbackMessage: string,
  options: ApiErrorMessageOptions = {}
): string {
  if (isRecord(body)) {
    const details = body.details;

    if (Array.isArray(details)) {
      const message = details
        .filter((detail): detail is string => typeof detail === 'string' && detail.trim().length > 0)
        .join('\n');

      if (message) {
        return message;
      }
    }

    if (typeof details === 'string' && details.trim()) {
      return details;
    }

    const primaryField = options.preferMessage ? 'message' : 'error';
    const secondaryField = options.preferMessage ? 'error' : 'message';

    return getStringField(body, primaryField)
      ?? getStringField(body, secondaryField)
      ?? fallbackMessage;
  }

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  return fallbackMessage;
}
