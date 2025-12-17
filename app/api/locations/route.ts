/**
 * Locations API Route
 * GET: Fetch all locations (public)
 * POST: Create a new location (admin only)
 */

import { NextRequest } from 'next/server'
import { LocationService } from '@/lib/services/location-service'
import type { CreateLocationInput } from '@/lib/types/map'
import {
  jsonOk,
  jsonCreated,
  jsonBadRequest,
  jsonServerError,
  parseJsonBody,
  requireAdmin,
  isAuthError,
  handleServiceError,
} from '@/lib/api'

const locationService = new LocationService()

export async function GET() {
  try {
    const locations = await locationService.getAll()
    return jsonOk(locations)
  } catch (error) {
    return jsonServerError('Failed to fetch locations', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin()
    if (isAuthError(auth)) return auth

    // Parse request body
    const input = await parseJsonBody<CreateLocationInput>(request)
    if (!input) {
      return jsonBadRequest('Invalid JSON body')
    }

    // Create location
    const location = await locationService.create(input, auth.address)
    return jsonCreated(location)
  } catch (error) {
    return handleServiceError(error, 'Failed to create location')
  }
}
