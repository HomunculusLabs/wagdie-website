/**
 * Single Location API Route
 * GET: Fetch a location by ID (public)
 * PATCH: Update a location (admin only)
 * DELETE: Delete a location (admin only)
 */

import { NextRequest } from 'next/server'
import { LocationService } from '@/lib/services/location-service'
import type { UpdateLocationInput } from '@/lib/types/map'
import {
  jsonOk,
  jsonNotFound,
  jsonBadRequest,
  jsonDeleted,
  jsonServerError,
  parseJsonBody,
  requireAdmin,
  isAuthError,
  handleServiceError,
} from '@/lib/api'

const locationService = new LocationService()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const location = await locationService.getById(params.id)

    if (!location) {
      return jsonNotFound('Location not found')
    }

    return jsonOk(location)
  } catch (error) {
    return jsonServerError('Failed to fetch location', error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params

    // Require admin authentication
    const auth = await requireAdmin()
    if (isAuthError(auth)) return auth

    // Parse request body
    const input = await parseJsonBody<UpdateLocationInput>(request)
    if (!input) {
      return jsonBadRequest('Invalid JSON body')
    }

    // Update location
    const location = await locationService.update(params.id, input, auth.address)
    return jsonOk(location)
  } catch (error) {
    return handleServiceError(error, 'Failed to update location')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params

    // Require admin authentication
    const auth = await requireAdmin()
    if (isAuthError(auth)) return auth

    // Delete location
    await locationService.delete(params.id, auth.address)
    return jsonDeleted('Location deleted successfully')
  } catch (error) {
    return handleServiceError(error, 'Failed to delete location')
  }
}
