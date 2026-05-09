'use client'

/**
 * AdminGate Component
 * Access control wrapper that verifies admin status.
 */

import type { ReactNode } from 'react'
import { useAdminAuth } from '@/hooks/map/useAdminAuth'

export interface AdminGateProps {
  children: ReactNode
  fallback?: ReactNode
  title?: string
  connectDescription?: string
  deniedDescription?: string
  deniedHelp?: string
}

export function AdminGate({
  children,
  fallback,
  title = 'Admin',
  connectDescription = 'Connect your wallet to access the admin panel.',
  deniedDescription = 'You do not have permission to access the admin panel.',
  deniedHelp = 'Only admin wallets can access this area.',
}: AdminGateProps) {
  const { isConnected, isAdmin, isLoading, connect, connectInjected } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-soul-accent border-t-transparent" />
          <p className="font-display text-soul-mist">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="max-w-md p-8 text-center">
          <h1 className="mb-4 font-display text-3xl text-soul-accent">
            {title}
          </h1>
          <p className="mb-6 text-soul-mist">
            {connectDescription}
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={connect}
              className="w-full rounded bg-soul-accent px-6 py-3 font-display text-abyss transition-colors hover:bg-soul-accent/80"
            >
              Connect Wallet
            </button>
            <button
              type="button"
              onClick={connectInjected}
              className="w-full rounded border border-soul-accent/50 px-6 py-3 font-display text-soul-accent transition-colors hover:border-soul-accent hover:text-neutral-50"
            >
              Connect Browser Wallet
            </button>
          </div>
          <p className="mt-4 text-xs text-soul-mist/60">
            Use the browser wallet option on localhost if the wallet modal does not open.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="max-w-md p-8 text-center">
          <h1 className="mb-4 font-display text-3xl text-soul-ember">
            Access Denied
          </h1>
          <p className="mb-4 text-soul-mist">
            {deniedDescription}
          </p>
          <p className="text-sm text-soul-mist/60">
            {deniedHelp}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
