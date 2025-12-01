import { NextResponse } from 'next/server'
import { generateNonce } from '@/lib/auth/siwe'
import { cookies } from 'next/headers'

async function handleNonceRequest() {
  try {
    const nonce = generateNonce()

    // Store nonce in cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('siwe-nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    })

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}

// Support both GET and POST requests
export async function GET() {
  return handleNonceRequest()
}

export async function POST() {
  return handleNonceRequest()
}
