/**
 * Mock Event Data for WAGDIE World Map
 * This data simulates burn, death, and fight events across the WAGDIE world
 */

import type { EventMarker } from '@/lib/types/map';

export const mockBurnEvents: EventMarker[] = [
  {
    id: 'burn-001',
    type: 'burn',
    title: 'The Great Purge',
    description: 'A massive burning event that cleared the northern wastelands',
    timestamp: '2024-03-15T14:30:00Z',
    position: [400, 350],
  },
  {
    id: 'burn-002',
    type: 'burn',
    title: 'Citadel of Ashes',
    description: 'The infamous burn site where the crimson stronghold fell',
    timestamp: '2024-02-28T09:15:00Z',
    position: [1200, 900],
  },
  {
    id: 'burn-003',
    type: 'burn',
    title: 'Desert Cremation',
    description: 'Sandstorm ritual burning in the eastern dunes',
    timestamp: '2024-01-20T18:45:00Z',
    position: [1800, 600],
  },
];

export const mockDeathEvents: EventMarker[] = [
  {
    id: 'death-001',
    type: 'death',
    title: 'Battle of Thornvale',
    description: 'Where the infamous warlord met their end',
    timestamp: '2024-04-10T11:20:00Z',
    position: [650, 1200],
  },
  {
    id: 'death-002',
    type: 'death',
    title: 'The Fallen Titan',
    description: 'A legendary character perished at dawn',
    timestamp: '2024-03-22T06:00:00Z',
    position: [1500, 400],
  },
  {
    id: 'death-003',
    type: 'death',
    title: 'Ravencrest Massacre',
    description: 'The night when ravens feasted on the fallen',
    timestamp: '2024-02-14T23:30:00Z',
    position: [900, 1500],
  },
  {
    id: 'death-004',
    type: 'death',
    title: 'Ashen Graveyard',
    description: 'Final resting place of many brave souls',
    timestamp: '2024-01-08T15:00:00Z',
    position: [1700, 1300],
  },
];

export const mockFightEvents: EventMarker[] = [
  {
    id: 'fight-001',
    type: 'fight',
    title: 'Arena of Bones',
    description: 'Epic PvP battle that lasted three days',
    timestamp: '2024-05-01T12:00:00Z',
    position: [500, 800],
  },
  {
    id: 'fight-002',
    type: 'fight',
    title: 'Crimson Clash',
    description: 'Legends collided in this legendary encounter',
    timestamp: '2024-04-18T16:30:00Z',
    position: [1400, 700],
  },
  {
    id: 'fight-003',
    type: 'fight',
    title: 'The Siege of Ironhold',
    description: 'Massive siege battle with hundreds of participants',
    timestamp: '2024-03-05T08:00:00Z',
    position: [300, 1600],
  },
  {
    id: 'fight-004',
    type: 'fight',
    title: 'Shadow Duel',
    description: 'Silent battle fought in the moonlit shadows',
    timestamp: '2024-02-25T21:00:00Z',
    position: [1100, 300],
  },
  {
    id: 'fight-005',
    type: 'fight',
    title: 'Storm Peak Skirmish',
    description: 'Lightning-fast combat on the mountain summit',
    timestamp: '2024-01-30T13:45:00Z',
    position: [1600, 1100],
  },
];
