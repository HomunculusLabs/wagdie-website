'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Live-map link block for lore location pages.
 *
 * Reads the admin-curated lore_map_links table (via /api/lore/map-links?slug=)
 * and, when a link exists for this lore location, renders a card that embeds
 * the interactive map and deep-links to it.
 */

interface LoreMapLinkCardProps {
  loreLocationSlug: string;
  loreLocationName: string;
}

interface MapLink {
  id: string;
  loreLocationSlug: string;
  mapLocationId: string;
}

interface LocationInfo {
  id: string;
  name: string;
  description?: string | null;
  metadata?: { coordinates?: { x: number; y: number }; rarity?: string } | null;
}

export function LoreMapLinkCard({ loreLocationSlug, loreLocationName }: LoreMapLinkCardProps) {
  const [link, setLink] = useState<MapLink | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'linked' | 'none'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/lore/map-links?slug=${encodeURIComponent(loreLocationSlug)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const json = (await response.json()) as { links?: MapLink[] };
        const found = json.links?.[0] ?? null;
        if (cancelled) return;
        if (!found) {
          setStatus('none');
          return;
        }
        setLink(found);
        return fetch(`/api/locations/${encodeURIComponent(found.mapLocationId)}`)
          .then(async (locationResponse) => {
            if (!locationResponse.ok) throw new Error('location fetch failed');
            const locationJson = (await locationResponse.json()) as { location?: LocationInfo } & Partial<LocationInfo>;
            if (cancelled) return;
            const info = locationJson.location ?? (locationJson as Partial<LocationInfo>);
            setLocation(
              info && typeof info.id === 'string'
                ? { id: info.id, name: info.name ?? '', description: info.description ?? null, metadata: info.metadata ?? null }
                : null,
            );
            setStatus('linked');
          })
          .catch(() => {
            if (!cancelled) setStatus('linked');
          });
      })
      .catch(() => {
        if (!cancelled) setStatus('none');
      });

    return () => {
      cancelled = true;
    };
  }, [loreLocationSlug]);

  if (status !== 'linked' || !link) {
    return null;
  }

  return (
    <section className="border border-soul-accent/20 bg-soul-900/50 p-5 md:p-6">
      <p className="text-sm font-serif uppercase tracking-[0.28em] text-soul-accent">
        On the world map
      </p>
      <h2 className="mt-2 font-display text-2xl lowercase tracking-widest text-neutral-50">
        {location?.name || loreLocationName}
      </h2>
      <p className="mt-3 font-serif text-base leading-7 text-neutral-200">
        This lore location is linked to a live place on the interactive WAGDIE world map —
        see where characters are staked there today.
      </p>
      <Link
        href={`/map?location=${encodeURIComponent(link.mapLocationId)}`}
        className="mt-4 inline-flex items-center gap-2 rounded border border-soul-accent/40 bg-soul-accent/10 px-4 py-2 text-sm font-display uppercase tracking-wide text-soul-bone transition-colors hover:border-soul-accent hover:bg-soul-accent/20"
      >
        Open on the map →
      </Link>
    </section>
  );
}
