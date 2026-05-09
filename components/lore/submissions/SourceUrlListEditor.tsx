'use client';

import { Button } from '@/components/ui/Button';
import type { LoreSubmissionLinkRole } from '@/types/lore-submission';

export interface EditableSubmissionLink {
  url: string;
  role: LoreSubmissionLinkRole;
  displayTitle?: string;
  archivedUrl?: string;
  attribution?: string;
}

export interface SourceUrlListEditorProps {
  links: EditableSubmissionLink[];
  onChange: (links: EditableSubmissionLink[]) => void;
  maxLinks?: number;
  disabled?: boolean;
}

const emptyLink = (): EditableSubmissionLink => ({
  url: '',
  role: 'source_media',
  displayTitle: '',
  archivedUrl: '',
  attribution: '',
});

const roleLabels: Record<LoreSubmissionLinkRole, string> = {
  source: 'Source',
  media: 'Media',
  source_media: 'Source + media',
};

export function SourceUrlListEditor({
  links,
  onChange,
  maxLinks = 10,
  disabled = false,
}: SourceUrlListEditorProps) {
  const updateLink = (index: number, patch: Partial<EditableSubmissionLink>) => {
    onChange(links.map((link, currentIndex) => (
      currentIndex === index ? { ...link, ...patch } : link
    )));
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, currentIndex) => currentIndex !== index));
  };

  const addLink = () => {
    if (links.length >= maxLinks) return;
    onChange([...links, emptyLink()]);
  };

  return (
    <section className="space-y-3" aria-label="Source and media URLs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-soul-bone">Sources and media</h3>
          <p className="text-sm text-soul-mist/70">
            Add Twitter/X, YouTube, or source URLs. At least one unique link is required.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={addLink}
          disabled={disabled || links.length >= maxLinks}
        >
          Add URL
        </Button>
      </div>

      <div className="space-y-4">
        {links.map((link, index) => (
          <div
            key={index}
            className="rounded-lg border border-soul-accent/15 bg-soul-shadow/60 p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
              <label className="space-y-1 text-sm text-soul-mist">
                <span className="font-display uppercase tracking-wide">URL</span>
                <input
                  value={link.url}
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                  placeholder="https://x.com/... or https://youtu.be/..."
                  disabled={disabled}
                  className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-soul-mist">
                <span className="font-display uppercase tracking-wide">Role</span>
                <select
                  value={link.role}
                  onChange={(event) => updateLink(index, { role: event.target.value as LoreSubmissionLinkRole })}
                  disabled={disabled}
                  className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => removeLink(index)}
                  disabled={disabled || links.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm text-soul-mist">
                <span className="font-display uppercase tracking-wide">Display title</span>
                <input
                  value={link.displayTitle ?? ''}
                  onChange={(event) => updateLink(index, { displayTitle: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-soul-mist">
                <span className="font-display uppercase tracking-wide">Archive URL</span>
                <input
                  value={link.archivedUrl ?? ''}
                  onChange={(event) => updateLink(index, { archivedUrl: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-soul-mist">
                <span className="font-display uppercase tracking-wide">Attribution</span>
                <input
                  value={link.attribution ?? ''}
                  onChange={(event) => updateLink(index, { attribution: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
