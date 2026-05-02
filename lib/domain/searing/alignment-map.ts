// Legacy alignment mapping derived from character background traits.
// Keep values lowercase for case-insensitive comparisons.
export const ALIGNMENT_MAP: Record<string, string[]> = {
  Neutral: ['break'],
  'Lawful Good': ['her glory'],
  'Neutral Good': ['serpentine', 'zerd', 'gothic'],
  'Chaotic Good': ['cold', 'vaulted'],
  'Lawful Neutral': ['charter', 'her illusionary grace'],
  'Chaotic Neutral': ['slaughter', 'altered'],
  'Lawful Evil': ['midnight', 'galactic', 'darkdweller chapel'],
  'Neutral Evil': ['void', 'silt', 'her dark blessing'],
  'Chaotic Evil': ['brimstone', 'yearn'],
}
