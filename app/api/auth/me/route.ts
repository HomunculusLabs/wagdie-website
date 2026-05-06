/**
 * Current User API Route
 * Returns current session data or 401 if not authenticated
 */

import { getSession } from '@/lib/auth/session'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'

export async function GET() {
  try {
    const session = await getSession()

    // Check if session exists and is not expired
    if (!session.address || !session.expires || session.expires < Date.now()) {
      return jsonRawError('Not authenticated', 401)
    }

    // Return session data (without sensitive info like signatures)
    return jsonRaw({
      address: session.address,
      expires: session.expires,
      selectedCharacter: session.selectedCharacter || null
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return jsonRawError('Failed to fetch user session', 500)
  }
}
