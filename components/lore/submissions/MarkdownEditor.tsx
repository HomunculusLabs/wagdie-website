'use client';

import { useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function MarkdownEditor({ value, onChange, disabled = false, label = 'Lore body' }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-soul-bone">{label}</h3>
          <p className="text-sm text-soul-mist/70">
            Markdown is supported. Raw HTML is ignored in preview and public rendering.
          </p>
        </div>
        <div className="rounded border border-soul-accent/20 bg-abyss/60 p-1">
          {(['write', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`px-3 py-1 text-xs font-display uppercase tracking-wide transition-colors ${mode === tab ? 'bg-soul-accent/20 text-soul-accent' : 'text-soul-mist hover:text-soul-bone'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={16}
          className="w-full rounded-lg border border-soul-accent/20 bg-abyss/70 p-4 font-mono text-sm leading-6 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
          placeholder="Write the chronicle in Markdown..."
          aria-label={label}
        />
      ) : (
        <div className="min-h-64 rounded-lg border border-soul-accent/20 bg-abyss/70 p-4">
          {value.trim() ? (
            <MarkdownPreview markdown={value} />
          ) : (
            <p className="text-sm text-soul-mist/60">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
