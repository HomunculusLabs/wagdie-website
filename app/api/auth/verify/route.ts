import { NextRequest, NextResponse } from 'next/server'
import { verifySiweMessage, upsertUser } from '@/lib/auth/siwe'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json()

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      )
    }

    // Get nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('siwe-nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'No nonce found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify the SIWE message
    const verification = await verifySiweMessage(message, signature)

    if (!verification.success || !verification.address) {
      return NextResponse.json(
        { error: verification.error || 'Verification failed' },
        { status: 401 }
      )
    }

    // Create or update user in database
    const { data: user, error: dbError } = await upsertUser(verification.address)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      )
    }

    // Clear the nonce cookie
    cookieStore.delete('siwe-nonce')

    // Set iron-session with user data
    const session = await getSession()
    session.address = verification.address
    session.siwe = {
      message,
      signature,
      nonce,
    }
    session.expires = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    await session.save()

    // Also set the simple siwe-session cookie for backwards compatibility
    cookieStore.set('siwe-session', verification.address, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      address: verification.address,
      user,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
