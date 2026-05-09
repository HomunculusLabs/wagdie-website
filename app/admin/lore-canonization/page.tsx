import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LoreCanonizationAdminContainer } from '@/components/admin/lore-canonization/LoreCanonizationAdminContainer';

export default function LoreCanonizationAdminPage() {
  return (
    <AdminGate>
      <AdminShell
        title="Lore Canonization"
        description="Edit canonization drafts, preview public workflow display, publish approved overrides, and reset events to their static lore state."
      >
        <LoreCanonizationAdminContainer />
      </AdminShell>
    </AdminGate>
  );
}
