import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LoreSubmissionsAdminQueue } from '@/components/admin/lore-submissions/LoreSubmissionsAdminQueue';

export default function LoreSubmissionsAdminPage() {
  return (
    <AdminGate>
      <AdminShell
        title="Lore Submissions"
        description="Review token-owner community lore submissions, curate metadata, publish community records, and promote or demote canon status."
      >
        <LoreSubmissionsAdminQueue />
      </AdminShell>
    </AdminGate>
  );
}
