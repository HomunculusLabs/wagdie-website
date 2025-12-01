import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Clear iron-session
    const session = await getSession()
    session.destroy()

    // Clear session cookies by setting them to expire immediately
    // Must use set() with maxAge: 0 to properly clear cookies with path
    cookieStore.set('siwe-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    cookieStore.set('siwe-nonce', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
