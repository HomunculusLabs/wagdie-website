import { AdminGate } from '@/components/admin/AdminGate'
import { AdminShell } from '@/components/admin/AdminShell'
import { MapEditorContainer } from '@/components/map-editor/MapEditorContainer'

export default function AdminMapLocationsPage() {
  return (
    <AdminGate
      title="Map Locations Admin"
      connectDescription="Connect your wallet to access the map location editor."
      deniedDescription="You do not have permission to access the map location editor."
      deniedHelp="Only admin wallets can create, edit, or delete locations."
    >
      <AdminShell contentClassName="">
        <MapEditorContainer />
      </AdminShell>
    </AdminGate>
  )
}
