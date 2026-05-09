import { BannerHeader } from '@/components/shared/BannerHeader';
import { UserSubmissionDetail } from '@/components/lore/submissions/UserSubmissionDetail';

interface LoreSubmissionDetailPageProps {
  params: Promise<{ submissionId: string }>;
}

export default async function LoreSubmissionDetailPage({ params }: LoreSubmissionDetailPageProps) {
  const { submissionId } = await params;

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Submission Detail"
        subtitle="Review the submitted content, source URLs, admin notes, and revision state for this community lore entry."
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <UserSubmissionDetail submissionId={submissionId} />
      </main>
    </div>
  );
}
