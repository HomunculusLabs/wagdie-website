import {
  getArchiveItems,
  getEventsForCharacter,
  getSourcesForEvent,
  getAllLoreCharacters,
  getCharacterConnections,
  loreEvents,
  parseLoreArchiveFilters,
  validateLoreArchive,
} from '@/lib/lore';

describe('lore domain', () => {
  it('ships valid static archive data', () => {
    expect(validateLoreArchive()).toEqual({ valid: true, errors: [] });
  });

  it('filters by character, canon status, and keyword-expanded related records', () => {
    const filters = parseLoreArchiveFilters({
      character: 'steely-3721',
      canonStatus: 'canonizing',
      keyword: 'Steely',
    });

    const items = getArchiveItems(filters);

    expect(items.map((event) => event.slug)).toEqual(['pilgrims-of-the-ashen-road']);
  });

  it('keeps invalid canon statuses from throwing or constraining results', () => {
    const filters = parseLoreArchiveFilters({ canonStatus: 'not-real' });

    expect(filters.canonStatus).toBeUndefined();
    expect(getArchiveItems(filters)).toHaveLength(loreEvents.length);
  });

  it('returns sorted appearances and source records through query helpers', () => {
    const appearances = getEventsForCharacter('character-5');

    expect(appearances.map((event) => event.slug)).toEqual([
      'genesis-mint',
      'searing-rite',
    ]);
    expect(getSourcesForEvent(appearances[0]).map((source) => source.id)).toContain('source-official-genesis-tweet');
  });

  it('keeps the event-character graph populated enough to show the whole picture', () => {
    const characters = getAllLoreCharacters();
    const referencedCharacterIds = new Set(loreEvents.flatMap((event) => event.characterIds));

    expect(characters.length).toBeGreaterThanOrEqual(12);
    expect(loreEvents.every((event) => event.characterIds.length >= 5)).toBe(true);
    expect(characters.every((character) => referencedCharacterIds.has(character.id))).toBe(true);
  });


  it('derives co-appearing character connections for character profiles', () => {
    const connections = getCharacterConnections('character-5');

    expect(connections.length).toBeGreaterThan(0);
    expect(connections.map((connection) => connection.character.id)).toEqual(
      expect.arrayContaining(['character-3015', 'character-1780']),
    );
    expect(connections.every((connection) => connection.sharedEvents.length > 0)).toBe(true);
  });

  it('reports duplicate ids/slugs and missing references', () => {
    const brokenEvent = {
      ...loreEvents[0],
      id: 'event-broken-references',
      slug: loreEvents[1].slug,
      sourceIds: ['source-missing'],
      characterIds: ['character-missing'],
      locationIds: ['location-missing'],
      canon: {
        ...loreEvents[0].canon,
        path: [
          {
            label: 'Broken step',
            status: 'complete' as const,
            sourceIds: ['source-step-missing'],
          },
        ],
      },
    };

    const result = validateLoreArchive({ events: [...loreEvents, brokenEvent] });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        `Duplicate event slug: ${loreEvents[1].slug}`,
        'Event event-broken-references references missing source: source-missing',
        'Event event-broken-references references missing character: character-missing',
        'Event event-broken-references references missing location: location-missing',
        'Event event-broken-references canon step 1 references missing source: source-step-missing',
      ]),
    );
  });
});
