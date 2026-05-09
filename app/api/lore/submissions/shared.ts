import { NextResponse } from 'next/server';
import { getRateLimitHeaders, RateLimiter } from '@/lib/middleware/rate-limit';
import { getClientIp, logRateLimitEvent } from '@/lib/utils/audit-logger';
import {
  jsonBadRequest,
  jsonConflict,
  jsonError,
  jsonForbidden,
  jsonNotFound,
  jsonServerError,
  type ApiResponse,
} from '@/lib/api/responses';
import {
  LoreSubmissionConflictError,
  LoreSubmissionForbiddenError,
  LoreSubmissionNotFoundError,
  LoreSubmissionRateLimitError,
  LoreSubmissionValidationError,
} from '@/lib/services/lore-submission-service';

export const loreSubmissionWriteRateLimiter = new RateLimiter({
  maxRequests: 12,
  windowMs: 60 * 1000,
});

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function applyLoreSubmissionRateLimit(request: Request): NextResponse<ApiResponse> | null {
  const headers = request.headers instanceof Headers ? request.headers : new Headers(request.headers);
  const ip = getClientIp(headers) ?? 'unknown';
  const result = loreSubmissionWriteRateLimiter.check(ip);
  if (result.allowed) return null;

  logRateLimitEvent(ip, new URL(request.url).pathname, {
    limit: result.limit,
    count: result.count,
  });

  const response = jsonError('Too many lore submission requests. Please try again later.', 429);
  for (const [key, value] of Object.entries(getRateLimitHeaders(result))) {
    response.headers.set(key, value);
  }
  response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
  return response;
}

export function handleLoreSubmissionApiError(
  error: unknown,
  fallbackMessage: string,
): NextResponse<ApiResponse> {
  if (error instanceof LoreSubmissionValidationError) {
    return jsonBadRequest(error.message, error.details);
  }

  if (error instanceof LoreSubmissionForbiddenError) {
    return jsonForbidden(error.message);
  }

  if (error instanceof LoreSubmissionNotFoundError) {
    return jsonNotFound(error.message);
  }

  if (error instanceof LoreSubmissionConflictError) {
    return jsonConflict(error.message);
  }

  if (error instanceof LoreSubmissionRateLimitError) {
    return jsonError(error.message, 429);
  }

  console.error(`${fallbackMessage}:`, error);
  return jsonServerError(fallbackMessage, error);
}
