/**
 * Session Configuration
 * Iron session setup for SIWE authentication
 */

import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { UserSession } from '@/types/wallet'

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_production',
  cookieName: 'wagdie_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  },
}

export async function getSession(): Promise<IronSession<UserSession>> {
  const cookieStore = await cookies()
  return getIronSession<UserSession>(cookieStore, sessionOptions)
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
