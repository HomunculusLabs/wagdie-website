import { CanonizationPath } from '@/components/lore/CanonizationPath';
import { CanonWorkflowSummary } from '@/components/lore/CanonWorkflowSummary';
import { loreSources } from '@/lib/lore/data/sources';
import type { Canonization, LoreEvent } from '@/lib/lore/types';

interface CanonizationPreviewProps {
  event: LoreEvent;
  canon: Canonization;
}

export function CanonizationPreview({ event, canon }: CanonizationPreviewProps) {
  return (
    <section className="space-y-5 rounded-lg border border-soul-accent/20 bg-soul-shadow/60 p-4 md:p-5">
      <div>
        <p className="text-xs font-display uppercase tracking-[0.18em] text-soul-accent">
          Public display preview
        </p>
        <h2 className="mt-2 font-display text-2xl text-soul-bone">
          {event.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-soul-mist/75">
          This preview uses the same canon workflow components as public lore pages. It reflects the editor state, not necessarily published public state.
        </p>
      </div>

      <CanonWorkflowSummary canon={canon} variant="detail" />
      <CanonizationPath canon={canon} sources={loreSources} />
    </section>
  );
}
