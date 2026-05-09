import Link from 'next/link';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { UserSubmissionsList } from '@/components/lore/submissions/UserSubmissionsList';

export default function LoreSubmissionsPage() {
  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="My Lore Submissions"
        subtitle="Track community lore you submitted, revise requested changes, and see publication status."
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex justify-between gap-3">
          <Link href="/lore" className="text-sm font-display text-soul-accent hover:text-soul-bone">← Lore archive</Link>
          <Link href="/lore/submit" className="text-sm font-display text-soul-accent hover:text-soul-bone">New submission</Link>
        </div>
        <UserSubmissionsList />
      </main>
    </div>
  );
}
