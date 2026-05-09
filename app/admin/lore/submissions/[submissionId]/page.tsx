import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LoreSubmissionAdminDetail } from '@/components/admin/lore-submissions/LoreSubmissionAdminDetail';
import { getAllLoreCharacters, getAllLoreLocations, loreSeasons } from '@/lib/lore';

interface LoreSubmissionAdminDetailPageProps {
  params: Promise<{ submissionId: string }>;
}

export default async function LoreSubmissionAdminDetailPage({ params }: LoreSubmissionAdminDetailPageProps) {
  const { submissionId } = await params;
  const referenceOptions = {
    seasons: loreSeasons.map((season) => ({ id: season.id, label: season.title })),
    characters: getAllLoreCharacters().map((character) => ({
      id: character.id,
      label: `${character.name}${character.tokenId ? ` (#${character.tokenId})` : ''}`,
    })),
    locations: getAllLoreLocations().map((location) => ({ id: location.id, label: location.name })),
  };

  return (
    <AdminGate>
      <AdminShell
        title="Review Lore Submission"
        description="Inspect submitter content, sanitize Markdown previews, curate graph metadata, and run review/publication workflow actions."
      >
        <LoreSubmissionAdminDetail submissionId={submissionId} referenceOptions={referenceOptions} />
      </AdminShell>
    </AdminGate>
  );
}
