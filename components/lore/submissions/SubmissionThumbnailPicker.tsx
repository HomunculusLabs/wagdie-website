'use client';

import { useEffect, useState } from 'react';
import type { Character } from '@/types/character';
import type { LoreThumbnail } from '@/lib/lore/submissions/thumbnail';

/**
 * Thumbnail picker for lore submissions.
 *
 * Three sources:
 * - token: one of the submitter's owned WAGDIE tokens (art preview)
 * - map_location: an existing interactive-map location
 * - custom: a custom image URL with optional attribution
 */

interface MapLocationOption {
  id: string;
  name: string;
}

interface SubmissionThumbnailPickerProps {
  value: LoreThumbnail | null;
  onChange: (thumbnail: LoreThumbnail | null) => void;
  ownedCharacters: Character[];
  ownedLoading?: boolean;
  ownedError?: boolean;
  disabled?: boolean;
}

const KIND_LABELS: Record<LoreThumbnail['kind'], string> = {
  token: 'Token art',
  map_location: 'Map location',
  custom: 'Custom image',
};

function tokenImageHref(character: Character): string | null {
  const direct = character.image_url ?? null;
  if (direct) return direct;
  const metadata = character.metadata as { image?: string; image_url?: string } | null | undefined;
  if (metadata && typeof metadata === 'object') {
    if (typeof metadata.image === 'string' && metadata.image) return metadata.image;
    if (typeof metadata.image_url === 'string' && metadata.image_url) return metadata.image_url;
  }
  return null;
}

export function SubmissionThumbnailPicker({
  value,
  onChange,
  ownedCharacters,
  ownedLoading = false,
  ownedError = false,
  disabled = false,
}: SubmissionThumbnailPickerProps) {
  const [kind, setKind] = useState<LoreThumbnail['kind'] | 'none'>(value?.kind ?? 'none');
  const [mapLocations, setMapLocations] = useState<MapLocationOption[]>([]);
  const [mapLocationsError, setMapLocationsError] = useState(false);
  const [customUrl, setCustomUrl] = useState(value?.kind === 'custom' ? value.imageUrl : '');
  const [customAttribution, setCustomAttribution] = useState(
    value?.kind === 'custom' ? (value.attribution ?? '') : '',
  );

  useEffect(() => {
    if (kind !== 'map_location' || mapLocations.length > 0 || mapLocationsError) return;
    let cancelled = false;

    fetch('/api/locations')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const json = (await response.json()) as { locations?: MapLocationOption[] } & Record<string, unknown>;
        const rows = Array.isArray(json.locations)
          ? json.locations
          : Array.isArray(json.data)
            ? (json.data as MapLocationOption[])
            : [];
        if (!cancelled) setMapLocations(rows.map((row) => ({ id: row.id, name: row.name })));
      })
      .catch(() => {
        if (!cancelled) setMapLocationsError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, mapLocations.length, mapLocationsError]);

  function selectKind(next: LoreThumbnail['kind'] | 'none') {
    setKind(next);
    if (next === 'none') {
      onChange(null);
      return;
    }
    if (next === 'token') {
      const first = ownedCharacters[0];
      onChange(first ? { kind: 'token', tokenId: String(first.token_id) } : null);
      return;
    }
    if (next === 'map_location') {
      const first = mapLocations[0];
      onChange(first ? { kind: 'map_location', mapLocationId: first.id } : null);
      return;
    }
    onChange(customUrl.trim() ? { kind: 'custom', imageUrl: customUrl.trim() } : null);
  }

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="font-display uppercase tracking-wide text-sm text-soul-mist">
        Thumbnail
      </legend>
      <p className="text-xs text-soul-mist/60">
        Choose the image shown with your submission: your token&apos;s art, a map location, or a custom image.
      </p>

      <div className="flex flex-wrap gap-2">
        {(['none', 'token', 'map_location', 'custom'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => selectKind(option)}
            disabled={disabled}
            className={`rounded border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
              kind === option
                ? 'border-soul-accent bg-soul-accent/15 text-soul-bone'
                : 'border-soul-accent/20 bg-abyss/60 text-soul-mist hover:border-soul-accent/50'
            }`}
          >
            {option === 'none' ? 'No thumbnail' : KIND_LABELS[option]}
          </button>
        ))}
      </div>

      {kind === 'token' && (
        <div className="space-y-2">
          {ownedLoading && <span className="text-xs text-soul-mist/60">Loading owned tokens…</span>}
          {ownedError && <span className="text-xs text-soul-ember">Could not load owned tokens — pick manually below.</span>}
          <div className="flex flex-wrap gap-2">
            {ownedCharacters.slice(0, 12).map((character) => {
              const tokenId = String(character.token_id);
              const isSelected = value?.kind === 'token' && value.tokenId === tokenId;
              const href = tokenImageHref(character);
              return (
                <button
                  key={tokenId}
                  type="button"
                  onClick={() => onChange({ kind: 'token', tokenId })}
                  disabled={disabled}
                  title={`Token #${tokenId}`}
                  className={`relative h-16 w-16 overflow-hidden rounded border transition-colors ${
                    isSelected ? 'border-soul-accent' : 'border-soul-accent/20 hover:border-soul-accent/60'
                  }`}
                >
                  {href ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={href} alt={`Token #${tokenId}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-soul-mist">
                      #{tokenId}
                    </span>
                  )}
                </button>
              );
            })}
            {ownedCharacters.length === 0 && !ownedLoading && (
              <span className="text-xs text-soul-mist/60">No owned tokens found.</span>
            )}
          </div>
        </div>
      )}

      {kind === 'map_location' && (
        <label className="block space-y-1 text-sm text-soul-mist">
          <span className="font-display uppercase tracking-wide text-xs">Map location</span>
          {mapLocations.length > 0 ? (
            <select
              value={value?.kind === 'map_location' ? value.mapLocationId : ''}
              onChange={(event) =>
                onChange(event.target.value ? { kind: 'map_location', mapLocationId: event.target.value } : null)
              }
              disabled={disabled}
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
            >
              <option value="">Select a location…</option>
              {mapLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          ) : mapLocationsError ? (
            <span className="text-xs text-soul-ember">Could not load map locations.</span>
          ) : (
            <span className="text-xs text-soul-mist/60">Loading map locations…</span>
          )}
        </label>
      )}

      {kind === 'custom' && (
        <div className="space-y-2">
          <label className="block space-y-1 text-sm text-soul-mist">
            <span className="font-display uppercase tracking-wide text-xs">Image URL</span>
            <input
              value={customUrl}
              onChange={(event) => {
                setCustomUrl(event.target.value);
                const trimmed = event.target.value.trim();
                onChange(trimmed
                  ? { kind: 'custom', imageUrl: trimmed, attribution: customAttribution.trim() || undefined }
                  : null);
              }}
              disabled={disabled}
              placeholder="https://…"
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
            />
          </label>
          <label className="block space-y-1 text-sm text-soul-mist">
            <span className="font-display uppercase tracking-wide text-xs">Attribution (optional)</span>
            <input
              value={customAttribution}
              onChange={(event) => {
                setCustomAttribution(event.target.value);
                if (value?.kind === 'custom') {
                  onChange({
                    ...value,
                    attribution: event.target.value.trim() || undefined,
                  });
                }
              }}
              disabled={disabled}
              placeholder="Artist, source, or license"
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
