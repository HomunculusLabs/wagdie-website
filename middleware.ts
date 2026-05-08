/**
 * Next.js Middleware
 * T039: Sets CSRF token cookie on page loads
 * T040: Configures matcher to exclude auth endpoints from CSRF
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CSRF_COOKIE_NAME = 'csrf-token'
const remoteApiBaseUrl = process.env.WAGDIE_API_BASE_URL?.replace(/\/$/, '')

async function proxyApiRequest(request: NextRequest) {
  if (!remoteApiBaseUrl || !request.nextUrl.pathname.startsWith('/api/')) {
    return null
  }

  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, remoteApiBaseUrl)
  const headers = new Headers(request.headers)

  // Let the deployed instance see its own host/protocol rather than localhost.
  headers.delete('host')
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-proto')
  headers.set('x-forwarded-host', destination.host)
  headers.set('x-forwarded-proto', destination.protocol.replace(':', ''))
  // Force uncompressed upstream response. Node's fetch transparently
  // decompresses, but if we forward a `Content-Encoding: gzip` header back
  // with an already-decompressed body the browser double-decodes → garbage.
  headers.set('accept-encoding', 'identity')

  const upstream = await fetch(destination, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
    // Required by fetch when forwarding a streamed request body in Node/undici.
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  // Defense-in-depth: if upstream still set an encoding header, drop it along
  // with content-length (which would no longer match the decoded body).
  const upstreamHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] }
  const upstreamSetCookies = typeof upstreamHeaders.getSetCookie === 'function'
    ? upstreamHeaders.getSetCookie()
    : []
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')

  // Preserve multiple Set-Cookie headers when rebuilding the response. Fetch
  // Headers can otherwise collapse them into a single comma-joined value.
  if (upstreamSetCookies.length > 0) {
    responseHeaders.delete('set-cookie')
    upstreamSetCookies.forEach((cookie) => responseHeaders.append('set-cookie', cookie))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export async function middleware(request: NextRequest) {
  const proxiedApiResponse = await proxyApiRequest(request)
  if (proxiedApiResponse) {
    return proxiedApiResponse
  }

  const response = NextResponse.next()

  // Do not set CSRF cookies for local API routes when the remote proxy is disabled.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return response
  }

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
 * - Runs on API routes only to support the optional local-dev remote API proxy
 * - Excludes static files and images
 */
export const config = {
  matcher: [
    '/api/:path*',
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}
