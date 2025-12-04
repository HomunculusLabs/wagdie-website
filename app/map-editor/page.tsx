'use client'

/**
 * Map Editor Page
 * Admin-only page for creating, editing, and deleting map locations
 */

import { AdminGate } from '@/components/map-editor/AdminGate'
import { MapEditorContainer } from '@/components/map-editor/MapEditorContainer'

export default function MapEditorPage() {
  return (
    <AdminGate>
      <MapEditorContainer />
    </AdminGate>
  )
}
