/**
 * Single Location API Route
 * GET: Fetch a location by ID (public)
 * PATCH: Update a location (admin only)
 * DELETE: Delete a location (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/admin'
import {
  LocationService,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@/lib/services/location-service'
import type { UpdateLocationInput } from '@/lib/types/map'

const locationService = new LocationService()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const location = await locationService.getById(params.id)

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: location,
    })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params

    // Authenticate user
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify admin status
    if (!isAdmin(session.address)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized - admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    let input: UpdateLocationInput
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Update location
    const location = await locationService.update(params.id, input, session.address)

    return NextResponse.json({
      success: true,
      data: location,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: 400 }
      )
    }

    console.error('Error updating location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params

    // Authenticate user
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify admin status
    if (!isAdmin(session.address)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized - admin access required' },
        { status: 403 }
      )
    }

    // Delete location
    await locationService.delete(params.id, session.address)

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    console.error('Error deleting location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
