import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

type SupabaseClientOptions = { admin?: boolean }

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export function createSupabaseClient(options: SupabaseClientOptions = {}) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON_KEY ||
    ''

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    ''

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL (set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL)')
  }

  const useAdmin = options.admin && typeof window === 'undefined'
  const selectedKey = useAdmin && serviceRoleKey ? serviceRoleKey : anonKey

  if (!selectedKey) {
    throw new Error(
      useAdmin
        ? 'Missing Supabase service role key (set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY)'
        : 'Missing Supabase anon key (set NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }

  // Helpful guard: local demo keys will fail against remote Supabase.
  const payload = decodeJwtPayload(selectedKey)
  // Note: don't assume non-local URLs are hosted Supabase (cloudflared tunnels are common).
  // We keep this as a soft guard for the common hosted Supabase URL format.
  if (payload?.iss === 'supabase-demo' && /\.supabase\.co\b/.test(supabaseUrl)) {
    console.warn(
      `Supabase key issuer is "supabase-demo" but URL looks hosted (${supabaseUrl}). ` +
        'If this is a hosted Supabase project, update your anon/service role keys.'
    )
  }

  return createClient<Database>(supabaseUrl, selectedKey)
}

// Browser-safe anon client
export const supabase = createSupabaseClient()
// Server-only admin client (falls back to anon if not configured)
export const supabaseAdmin = createSupabaseClient({ admin: true })
