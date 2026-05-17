import { generateNonce } from '@/lib/auth/siwe'
import { cookies } from 'next/headers'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'

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

    return jsonRaw({ nonce })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return jsonRawError('Failed to generate nonce', 500)
  }
}

// Support both GET and POST requests
export async function GET() {
  return handleNonceRequest()
}

export async function POST() {
  return handleNonceRequest()
}
