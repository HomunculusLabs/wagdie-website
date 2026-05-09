import type { LoreLocation } from '../types';

export const loreLocations = [
  {
    id: 'location-mass-grave',
    slug: 'mass-grave',
    name: 'The Mass Grave',
    summary: 'The first known gathering place of the dead and the symbolic origin point of the collection.',
    tags: ['origin', 'grave', 'official'],
  },
  {
    id: 'location-blackened-citadel',
    slug: 'blackened-citadel',
    name: 'The Blackened Citadel',
    summary: 'A ruined seat of command used in official dispatches and later community campaigns.',
    tags: ['fortress', 'campaign', 'canon'],
  },
  {
    id: 'location-searing-altar',
    slug: 'searing-altar',
    name: 'The Searing Altar',
    summary: 'The ritual site where Concord-linked transformations are recorded.',
    tags: ['searing', 'ritual', 'concords'],
  },
  {
    id: 'location-ashen-road',
    slug: 'ashen-road',
    name: 'The Ashen Road',
    summary: 'A community-named route between staking camps and contested ruins.',
    tags: ['road', 'community', 'staking'],
  },
  {
    id: 'location-archive-vault',
    slug: 'archive-vault',
    name: 'Archive Vault',
    summary: 'A preservation label for manually captured Discord, tweet, and media records.',
    tags: ['archive', 'preservation'],
  },
] satisfies LoreLocation[];
