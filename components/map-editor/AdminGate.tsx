'use client'

/**
 * AdminGate Component
 * Access control wrapper that verifies admin status
 */

import { useAdminAuth } from '@/hooks/map/useAdminAuth'

interface AdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  title?: string
  connectDescription?: string
  deniedDescription?: string
  deniedHelp?: string
}

export function AdminGate({
  children,
  fallback,
  title = 'Map Editor',
  connectDescription = 'Connect your wallet to access the map editor.',
  deniedDescription = 'You do not have permission to access the map editor.',
  deniedHelp = 'Only admin wallets can create, edit, or delete locations.',
}: AdminGateProps) {
  const { isConnected, isAdmin, isLoading, connect } = useAdminAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-soul-accent border-t-transparent mx-auto" />
          <p className="font-display text-soul-mist">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Not connected - show connect prompt
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="max-w-md text-center p-8">
          <h1 className="font-display text-3xl text-soul-accent mb-4">
            {title}
          </h1>
          <p className="text-soul-mist mb-6">
            {connectDescription}
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-soul-accent text-abyss font-display rounded hover:bg-soul-accent/80 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  // Connected but not admin - show denied message
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="max-w-md text-center p-8">
          <h1 className="font-display text-3xl text-soul-ember mb-4">
            Access Denied
          </h1>
          <p className="text-soul-mist mb-4">
            {deniedDescription}
          </p>
          <p className="text-soul-mist/60 text-sm">
            {deniedHelp}
          </p>
        </div>
      </div>
    )
  }

  // Admin - render children
  return <>{children}</>
}
