/**
 * API Error Handler
 * Centralized error handling for service errors in API routes
 */

import { NextResponse } from 'next/server'
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@/lib/services/location-service'
import {
  jsonBadRequest,
  jsonNotFound,
  jsonConflict,
  jsonServerError,
  type ApiResponse,
} from './responses'

/**
 * Handle known service errors and return appropriate responses
 * Returns null if the error is not a known service error
 */
export function handleServiceError(
  error: unknown,
  fallbackMessage: string
): NextResponse<ApiResponse> {
  if (error instanceof NotFoundError) {
    return jsonNotFound(error.message)
  }

  if (error instanceof ValidationError) {
    return jsonBadRequest(error.message, error.details)
  }

  if (error instanceof ConflictError) {
    return jsonConflict(error.message)
  }

  // Unknown error - log and return generic message
  console.error(`${fallbackMessage}:`, error)
  return jsonServerError(fallbackMessage, error)
}
