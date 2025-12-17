/**
 * API Response Builders
 * Standardized response helpers for Next.js API routes
 */

import { NextResponse } from 'next/server'

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

export function jsonOk<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data })
}

export function jsonCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function jsonDeleted(message = 'Deleted successfully'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: true, message })
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
  return NextResponse.json(body, { status })
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
