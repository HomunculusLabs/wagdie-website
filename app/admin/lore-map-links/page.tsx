import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LoreMapLinksAdmin } from '@/components/admin/lore-map-links/LoreMapLinksAdmin';

export default function LoreMapLinksAdminPage() {
  return (
    <AdminGate>
      <AdminShell
        title="Lore Map Links"
        description="Link lore locations to live interactive-map places so lore pages can deep-link visitors into the map."
      >
        <LoreMapLinksAdmin />
      </AdminShell>
    </AdminGate>
  );
}
