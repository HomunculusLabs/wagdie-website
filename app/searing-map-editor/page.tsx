'use client'

import { AdminGate } from '@/components/map-editor/AdminGate'
import { SearingMapEditorContainer } from '@/components/searing-map-editor/SearingMapEditorContainer'

export default function SearingMapEditorPage() {
  return (
    <AdminGate
      title="Searing Map Editor"
      connectDescription="Connect your wallet to access the searing map editor."
      deniedDescription="You do not have permission to access the searing map editor."
      deniedHelp="Only admin wallets can create, edit, or delete searing trait mappings."
    >
      <SearingMapEditorContainer />
    </AdminGate>
  )
}
