import { AdminGate } from '@/components/admin/AdminGate'
import { AdminShell } from '@/components/admin/AdminShell'
import { SearingMapEditorContainer } from '@/components/searing-map-editor/SearingMapEditorContainer'

export default function AdminSearingMapPage() {
  return (
    <AdminGate
      title="Searing Map Admin"
      connectDescription="Connect your wallet to access the searing map editor."
      deniedDescription="You do not have permission to access the searing map editor."
      deniedHelp="Only admin wallets can create, edit, or delete searing trait mappings."
    >
      <AdminShell contentClassName="">
        <SearingMapEditorContainer />
      </AdminShell>
    </AdminGate>
  )
}
