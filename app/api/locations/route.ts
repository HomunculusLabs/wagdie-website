/**
 * Locations API Route
 * GET: Fetch all locations (public)
 * POST: Create a new location (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/admin'
import { LocationService, ValidationError, ConflictError } from '@/lib/services/location-service'
import type { CreateLocationInput } from '@/lib/types/map'

const locationService = new LocationService()

export async function GET() {
  try {
    const locations = await locationService.getAll()

    return NextResponse.json({
      success: true,
      data: locations,
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
    let input: CreateLocationInput
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Create location
    const location = await locationService.create(input, session.address)

    return NextResponse.json(
      { success: true, data: location },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: 400 }
      )
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    console.error('Error creating location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
