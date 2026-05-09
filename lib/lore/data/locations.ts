import type { LoreLocation } from '../types';

export const loreLocations: LoreLocation[] = [
  {
    id: 'location-mass-grave',
    slug: 'mass-grave',
    name: 'The Mass Grave',
    aliases: ['Mass Grave', 'The Grave'],
    summary: 'The first known gathering place of the dead and the symbolic origin point of the collection.',
    description: 'The Mass Grave anchors the earliest WAGDIE records: a collective origin where the dead first appear as a single warning before individual chronicles begin to separate from the horde.',
    tags: ['origin', 'grave', 'official'],
  },
  {
    id: 'location-blackened-citadel',
    slug: 'blackened-citadel',
    name: 'The Blackened Citadel',
    aliases: ['Blackened Citadel', 'Citadel'],
    summary: 'A ruined seat of command used in official dispatches and later community campaigns.',
    description: 'The Blackened Citadel is both destination and contested memory: official marches point toward it, while community records continue to attach rumors, pilgrimages, and disputed geography to its ruins.',
    tags: ['fortress', 'campaign', 'canon'],
  },
  {
    id: 'location-searing-altar',
    slug: 'searing-altar',
    name: 'The Searing Altar',
    aliases: ['Searing Altar', 'The Altar'],
    summary: 'The ritual site where Concord-linked transformations are recorded.',
    description: "The Searing Altar marks the archive's transformation records, connecting Concord sacrifice, ritual fire, and later community speculation around hidden or mirrored rites.",
    tags: ['searing', 'ritual', 'concords'],
  },
  {
    id: 'location-ashen-road',
    slug: 'ashen-road',
    name: 'The Ashen Road',
    aliases: ['Ashen Road'],
    summary: 'A community-named route between staking camps and contested ruins.',
    description: 'The Ashen Road began as community geography: a named route for pilgrims, maps, staking camps, and contested travel between better-established canon locations.',
    tags: ['road', 'community', 'staking'],
  },
  {
    id: 'location-archive-vault',
    slug: 'archive-vault',
    name: 'Archive Vault',
    aliases: ['The Vault', 'Manual Archive'],
    summary: 'A preservation label for manually captured Discord, tweet, and media records.',
    description: 'Archive Vault is a meta-location for preservation work: records gathered from Discord, tweets, images, and manual ledgers are grouped here when the source context matters as much as physical geography.',
    tags: ['archive', 'preservation'],
  },
];
