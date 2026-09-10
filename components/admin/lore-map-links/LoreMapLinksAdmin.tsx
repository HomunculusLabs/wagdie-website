'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Admin surface for lore ↔ map location links.
 *
 * Lists existing links, lets the admin pick a lore location (from the static
 * lore data) and a map location (from /api/locations), and upserts the pair
 * via POST /api/lore/map-links.
 */

interface MapLocationOption {
  id: string;
  name: string;
}

interface LoreLocationOption {
  slug: string;
  name: string;
}

interface LoreMapLink {
  id: string;
  loreLocationSlug: string;
  mapLocationId: string;
  createdBy: string;
  createdAt: string;
}

export function LoreMapLinksAdmin() {
  const [links, setLinks] = useState<LoreMapLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [loreLocations, setLoreLocations] = useState<LoreLocationOption[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocationOption[]>([]);
  const [loreSlug, setLoreSlug] = useState('');
  const [mapId, setMapId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/lore/map-links');
      if (!response.ok) throw new Error(`Failed to load links (${response.status})`);
      const json = (await response.json()) as { links?: LoreMapLink[] };
      setLinks(json.links ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load links');
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();

    fetch('/api/locations')
      .then(async (response) => {
        if (!response.ok) throw new Error('locations request failed');
        const json = (await response.json()) as { locations?: MapLocationOption[] } & Record<string, unknown>;
        const rows = Array.isArray(json.locations)
          ? json.locations
          : Array.isArray(json.data)
            ? (json.data as MapLocationOption[])
            : [];
        setMapLocations(rows.map((row) => ({ id: row.id, name: row.name })));
      })
      .catch(() => setError('Could not load map locations'));

    fetch('/api/lore/locations')
      .then(async (response) => {
        if (!response.ok) throw new Error('lore locations request failed');
        const html = await response.text();
        // The lore location list is a page; fall back to a small parse of hrefs.
        const slugs = [...html.matchAll(/\/lore\/locations\/([a-z0-9-]+)/g)].map((match) => match[1]);
        const unique = [...new Set(slugs)];
        setLoreLocations(unique.map((slug) => ({ slug, name: slug.replace(/-/g, ' ') })));
      })
      .catch(() => setError((prev) => prev ?? 'Could not load lore locations'));
  }, [loadLinks]);

  const mapLocationName = useMemo(() => {
    const map = new Map(mapLocations.map((location) => [location.id, location.name]));
    return map;
  }, [mapLocations]);

  async function handleSave() {
    if (!loreSlug || !mapId) {
      setError('Pick both a lore location and a map location.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/lore/map-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loreLocationSlug: loreSlug, mapLocationId: mapId }),
      });

      const json = (await response.json().catch(() => null)) as { error?: string; details?: string | string[] } | null;
      if (!response.ok) {
        const details = Array.isArray(json?.details) ? json.details.join('; ') : json?.details;
        throw new Error(details || json?.error || `Failed to save link (${response.status})`);
      }

      setSuccess(`Linked "${loreSlug}" → "${mapLocationName.get(mapId) ?? mapId}".`);
      setLoreSlug('');
      setMapId('');
      await loadLinks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5 md:p-7">
        <h2 className="font-display text-2xl text-soul-accent">Link a lore location to the map</h2>
        <p className="mt-2 text-sm leading-6 text-soul-mist/75">
          Linked lore location pages show an &quot;On the world map&quot; card that deep-links visitors into the
          interactive map at that location.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-sm text-soul-ember">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="mt-4 rounded border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-soul-mist">
            <span className="font-display uppercase tracking-wide">Lore location slug</span>
            <input
              value={loreSlug}
              onChange={(event) => setLoreSlug(event.target.value.trim())}
              placeholder="the-primordial-lands"
              list="lore-location-slugs"
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
            />
            <datalist id="lore-location-slugs">
              {loreLocations.map((location) => (
                <option key={location.slug} value={location.slug}>{location.name}</option>
              ))}
            </datalist>
          </label>

          <label className="space-y-1 text-sm text-soul-mist">
            <span className="font-display uppercase tracking-wide">Map location</span>
            <select
              value={mapId}
              onChange={(event) => setMapId(event.target.value)}
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
            >
              <option value="">Select a map location…</option>
              {mapLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={handleSave} isLoading={saving} disabled={!loreSlug || !mapId}>
            Save link
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5 md:p-7">
        <h2 className="font-display text-2xl text-soul-accent">Existing links</h2>
        {linksLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-soul-mist/60">
            <Spinner size="sm" /> Loading…
          </div>
        ) : links.length === 0 ? (
          <p className="mt-4 text-sm text-soul-mist/60">No lore↔map links yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.id} className="rounded border border-soul-accent/10 bg-black/20 px-4 py-3 text-sm">
                <span className="font-mono text-soul-bone">{link.loreLocationSlug}</span>
                <span className="mx-2 text-soul-mist/50">→</span>
                <span className="text-soul-mist">{mapLocationName.get(link.mapLocationId) ?? link.mapLocationId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
