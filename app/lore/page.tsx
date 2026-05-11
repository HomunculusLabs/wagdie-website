import { BannerHeader } from '@/components/shared/BannerHeader';
import { LoreArchive } from '@/components/lore/LoreArchive';
import { parseLoreArchiveFilters } from '@/lib/lore/archive-filter-params';
import {
  getAllEffectiveLoreCharacters,
  getAllEffectiveLoreLocations,
  getAllEffectiveLoreSeasons,
  getEffectiveArchiveItems,
  getEffectiveSourcesByEventId,
} from '@/lib/lore/effective-query';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

interface LorePageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function LorePage({ searchParams }: LorePageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseLoreArchiveFilters(resolvedSearchParams);
  const [items, seasons, locations, characters] = await Promise.all([
    getEffectiveArchiveItems(filters),
    getAllEffectiveLoreSeasons(),
    getAllEffectiveLoreLocations(),
    getAllEffectiveLoreCharacters(),
  ]);
  const sourcesByEventId = await getEffectiveSourcesByEventId(items);

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Lore Archive"
        subtitle="Trace the official and community chronicles of WAGDIE through seasons, places, characters, sources, and canon status."
      />

      <LoreArchive
        items={items}
        filters={filters}
        seasons={seasons}
        locations={locations}
        characters={characters}
        sourcesByEventId={sourcesByEventId}
      />
    </div>
  );
}
