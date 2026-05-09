import type { LoreSeason } from '../types';

export const loreSeasons = [
  {
    id: 'season-genesis',
    slug: 'genesis',
    title: 'Genesis Ashes',
    summary: 'The opening era: mint, first sightings, and the earliest official transmissions.',
    order: 1,
  },
  {
    id: 'season-searing',
    slug: 'searing',
    title: 'The Searing',
    summary: 'The period when Concords, sacrifice, and transformed identities reshaped the dead.',
    order: 2,
  },
  {
    id: 'season-community-chronicles',
    slug: 'community-chronicles',
    title: 'Community Chronicles',
    summary: 'Player-led expeditions and archive recoveries that were preserved for canon review.',
    order: 3,
  },
] satisfies LoreSeason[];
