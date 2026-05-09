'use client'

import type { AdminGateProps } from '@/components/admin/AdminGate'
import { AdminGate as SharedAdminGate } from '@/components/admin/AdminGate'

export type { AdminGateProps } from '@/components/admin/AdminGate'

export function AdminGate(props: AdminGateProps) {
  return (
    <SharedAdminGate
      title="Map Editor"
      connectDescription="Connect your wallet to access the map editor."
      deniedDescription="You do not have permission to access the map editor."
      deniedHelp="Only admin wallets can create, edit, or delete locations."
      {...props}
    />
  )
}
