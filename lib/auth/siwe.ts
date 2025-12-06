import { SiweMessage } from 'siwe'

import { supabase } from '../supabase'

/**
 * Generate a random nonce for SIWE authentication
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

/**
 * Verify a SIWE message and signature
 */
export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.verify({ signature })

    if (!fields.data.address) {
      return { success: false, error: 'Invalid signature' }
    }

    return { success: true, address: fields.data.address }
  } catch (error) {
    console.error('SIWE verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    }
  }
}

/**
 * Create or update user record in database after successful SIWE verification
 * Note: This requires a 'users' table in Supabase which may not be created yet
 */
export async function upsertUser(ethAddress: string) {
  // TODO: Implement when users table is created in database
  // For now, just return success since session management handles auth
  return { data: { eth_address: ethAddress }, error: null }

  /* Commented out until users table is created
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('eth_address', ethAddress)
    .single()

  if (existingUser) {
    // Update existing user
    const { data, error } = await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (existingUser.login_count || 0) + 1,
      })
      .eq('eth_address', ethAddress)
      .select()
      .single()

    return { data, error }
  } else {
    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        eth_address: ethAddress,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: 1,
      })
      .select()
      .single()

    return { data, error }
  }
  */
}
