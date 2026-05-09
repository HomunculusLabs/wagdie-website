import Link from 'next/link';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { LoreSubmissionForm } from '@/components/lore/submissions/LoreSubmissionForm';

export default function LoreSubmitPage() {
  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Submit Community Lore"
        subtitle="Token owners can contribute Markdown chronicles with source and media URLs for admin review."
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex justify-end">
          <Link href="/lore/submissions" className="text-sm font-display text-soul-accent hover:text-soul-bone">
            View my submissions
          </Link>
        </div>
        <LoreSubmissionForm />
      </main>
    </div>
  );
}
