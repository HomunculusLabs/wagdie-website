/**
 * API Response Builders
 * Standardized response helpers for Next.js API routes
 */

import type { NextResponse } from 'next/server'

export type JsonInit = {
  status?: number
  headers?: HeadersInit
}

function jsonResponse<T>(body: T, init?: JsonInit): NextResponse<T> {
  if (typeof Response !== 'undefined' && typeof Response.json === 'function') {
    return Response.json(body, init) as NextResponse<T>
  }

  const bodyText = JSON.stringify(body)
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  return {
    status: init?.status ?? 200,
    statusText: '',
    ok: init?.status === undefined || (init.status >= 200 && init.status < 300),
    headers,
    json: async () => body,
    text: async () => bodyText,
  } as unknown as NextResponse<T>
}

export type JsonBodyParseResult<T> =
  | { ok: true; data: T }
  | { ok: false }

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: string | string[]
}

// ============================================================================
// Success Responses
// ============================================================================

/**
 * Raw helpers preserve an endpoint's domain-specific JSON shape.
 * Use these for routes whose clients expect bodies like `{ characters }`,
 * `{ error }`, or other non-envelope contracts.
 */
export function jsonRaw<T>(body: T, init?: JsonInit): NextResponse<T> {
  return jsonResponse(body, init)
}

export function withNoStoreHeaders(headers?: HeadersInit): Headers {
  const noStoreHeaders = new Headers(headers)
  noStoreHeaders.set('Cache-Control', 'no-store')
  return noStoreHeaders
}

export function jsonNoStore<T>(body: T, init: JsonInit = {}): NextResponse<T> {
  return jsonRaw(body, {
    ...init,
    headers: withNoStoreHeaders(init.headers),
  })
}

export function jsonRawError(
  error: string,
  status: number,
  init?: Omit<JsonInit, 'status'>
): NextResponse<{ error: string }> {
  return jsonRaw({ error }, { ...init, status })
}

export function jsonNoStoreError(
  error: string,
  status: number,
  init?: Omit<JsonInit, 'status'>
): NextResponse<{ error: string }> {
  return jsonNoStore({ error }, { ...init, status })
}

/**
 * Envelope helpers return `{ success, data?, error?, details? }` and should
 * only be used by routes whose public contract is already envelope-shaped.
 */
export function jsonOk<T>(data: T): NextResponse<ApiResponse<T>> {
  return jsonResponse({ success: true, data })
}

export function jsonCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return jsonResponse({ success: true, data }, { status: 201 })
}

export function jsonDeleted(message = 'Deleted successfully'): NextResponse<ApiResponse> {
  return jsonResponse({ success: true, message })
}

// ============================================================================
// Error Responses
// ============================================================================

export function jsonError(
  error: string,
  status: number,
  details?: string | string[]
): NextResponse<ApiResponse> {
  const body: ApiResponse = { success: false, error }
  if (details !== undefined) {
    body.details = details
  }
  return jsonResponse(body, { status })
}

export function jsonBadRequest(error: string, details?: string[]): NextResponse<ApiResponse> {
  return jsonError(error, 400, details)
}

export function jsonUnauthorized(error = 'Not authenticated'): NextResponse<ApiResponse> {
  return jsonError(error, 401)
}

export function jsonForbidden(error = 'Not authorized - admin access required'): NextResponse<ApiResponse> {
  return jsonError(error, 403)
}

export function jsonNotFound(error = 'Not found'): NextResponse<ApiResponse> {
  return jsonError(error, 404)
}

export function jsonConflict(error: string): NextResponse<ApiResponse> {
  return jsonError(error, 409)
}

export function jsonServerError(error: string, devDetails?: unknown): NextResponse<ApiResponse> {
  const details = getDevErrorDetails(devDetails)
  return jsonError(error, 500, details)
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Extract error details for development only
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

function getDevErrorDetails(error: unknown): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined
  if (!error) return undefined
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/**
 * Safely parse JSON body from request
 * Returns the parsed body or null if invalid
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T
  } catch {
    return null
  }
}

export async function parseJsonBodyResult<T>(request: Request): Promise<JsonBodyParseResult<T>> {
  try {
    return { ok: true, data: await request.json() as T }
  } catch {
    return { ok: false }
  }
}
