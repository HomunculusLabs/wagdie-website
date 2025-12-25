/**
 * Ownership Sync API Route
 * Syncs NFT ownership from blockchain to database
 * Can be triggered by Vercel cron or manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OwnershipSyncService } from '@/lib/services/sync/ownership-sync-service'

/**
 * Verify the sync secret key for authorization
 * Supports both Authorization header and query parameter for Vercel cron
 */
function verifyAuthorization(request: NextRequest): boolean {
  const syncSecret = process.env.SYNC_SECRET_KEY

  // If no secret is configured, deny all requests
  if (!syncSecret) {
    console.error('SYNC_SECRET_KEY not configured')
    return false
  }

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    if (token === syncSecret) {
      return true
    }
  }

  // Check query parameter (for Vercel cron)
  const querySecret = request.nextUrl.searchParams.get('secret')
  if (querySecret === syncSecret) {
    return true
  }

  return false
}

/**
 * Create a Supabase admin client for bypassing RLS
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase configuration for admin client (set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL)'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * GET handler for Vercel cron (cron sends GET requests)
 */
export async function GET(request: NextRequest) {
  return handleSync(request)
}

/**
 * POST handler for manual triggers
 */
export async function POST(request: NextRequest) {
  return handleSync(request)
}

/**
 * Main sync handler
 */
async function handleSync(request: NextRequest) {
  // Verify authorization
  if (!verifyAuthorization(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create admin client for database writes
    const supabaseAdmin = createAdminClient()

    // Create sync service with admin client
    const syncService = new OwnershipSyncService({
      chunkSize: 100,
      delayMs: 100,
      supabaseClient: supabaseAdmin,
    })

    // Run the sync
    console.log('[Ownership Sync] Starting sync...')
    const result = await syncService.runFullSync()
    console.log('[Ownership Sync] Sync completed:', result)

    // Return appropriate status based on result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Ownership sync completed successfully',
        stats: {
          tokensProcessed: result.tokensProcessed,
          tokensUpdated: result.tokensUpdated,
          duration: `${result.duration}ms`,
        },
        timestamp: result.timestamp,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Ownership sync completed with errors',
          stats: {
            tokensProcessed: result.tokensProcessed,
            tokensUpdated: result.tokensUpdated,
            tokensFailed: result.tokensFailed,
            duration: `${result.duration}ms`,
          },
          errors: result.errors,
          timestamp: result.timestamp,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Ownership Sync] Error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
