/**
 * Next.js Middleware
 * T039: Sets CSRF token cookie on page loads
 * T040: Configures matcher to exclude auth endpoints from CSRF
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CSRF_COOKIE_NAME = 'csrf-token'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Check if CSRF token cookie exists
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)

  if (!existingToken) {
    // Generate and set new CSRF token using Web Crypto API (Edge Runtime compatible)
    const token = crypto.randomUUID()

    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript to send in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return response
}

/**
 * T040: Configure middleware matcher
 * - Runs on all page routes (sets CSRF token)
 * - Excludes static files, images, and API routes from CSRF token setting
 * - Auth endpoints are excluded from CSRF validation (they use nonce instead)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately with route-level CSRF)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}
