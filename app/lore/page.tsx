import { BannerHeader } from '@/components/shared/BannerHeader';
import { LoreArchive } from '@/components/lore/LoreArchive';
import {
  getAllLoreCharacters,
  getAllLoreLocations,
  loreSeasons,
  parseLoreArchiveFilters,
} from '@/lib/lore';
import { getEffectiveArchiveItems } from '@/lib/lore/effective-query';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

interface LorePageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function LorePage({ searchParams }: LorePageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseLoreArchiveFilters(resolvedSearchParams);
  const items = await getEffectiveArchiveItems(filters);

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Lore Archive"
        subtitle="Trace the official and community chronicles of WAGDIE through seasons, places, characters, sources, and canon status."
      />

      <LoreArchive
        items={items}
        filters={filters}
        seasons={loreSeasons}
        locations={getAllLoreLocations()}
        characters={getAllLoreCharacters()}
      />
    </div>
  );
}
