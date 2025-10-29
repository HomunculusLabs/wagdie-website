/**
 * Current User API Route
 * Returns current session data or 401 if not authenticated
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()

    // Check if session exists and is not expired
    if (!session.address || !session.expires || session.expires < Date.now()) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return session data (without sensitive info like signatures)
    return NextResponse.json({
      address: session.address,
      expires: session.expires,
      selectedCharacter: session.selectedCharacter || null
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user session' },
      { status: 500 }
    )
  }
}
