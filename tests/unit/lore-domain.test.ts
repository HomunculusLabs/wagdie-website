import {
  getArchiveItems,
  getCanonizationProgress,
  getEventsForCharacter,
  getEventsForLocation,
  getSourcesForEvent,
  getAllLoreCharacters,
  getAllLoreLocations,
  getCharacterConnections,
  getLocationById,
  getLocationBySlug,
  loreEvents,
  parseLoreArchiveFilters,
  validateLoreArchive,
} from '@/lib/lore';
import type { LoreEvent } from '@/lib/lore/types';

const cloneEvent = (event: LoreEvent): LoreEvent => JSON.parse(JSON.stringify(event)) as LoreEvent;

describe('lore domain', () => {
  it('ships valid static archive data', () => {
    expect(validateLoreArchive()).toEqual({ valid: true, errors: [] });
  });

  it('filters by character, canon status, canon stage, and keyword-expanded related records', () => {
    const filters = parseLoreArchiveFilters({
      character: 'steely-3721',
      canonStatus: 'canonizing',
      canonStage: 'continuity_review',
      keyword: 'Steely',
    });

    const items = getArchiveItems(filters);

    expect(items.map((event) => event.slug)).toEqual(['pilgrims-of-the-ashen-road']);
  });

  it('keeps invalid canon statuses and stages from throwing or constraining results', () => {
    const filters = parseLoreArchiveFilters({ canonStatus: 'not-real', canonStage: 'also-not-real' });

    expect(filters.canonStatus).toBeUndefined();
    expect(filters.canonStage).toBeUndefined();
    expect(getArchiveItems(filters)).toHaveLength(loreEvents.length);
  });

  it('applies canonStatus and canonStage filters with AND semantics', () => {
    const validCombination = getArchiveItems(parseLoreArchiveFilters({
      canonStatus: 'canonizing',
      canonStage: 'continuity_review',
    }));
    const emptyCombination = getArchiveItems(parseLoreArchiveFilters({
      canonStatus: 'canon',
      canonStage: 'continuity_review',
    }));

    expect(validCombination.map((event) => event.slug)).toEqual(['pilgrims-of-the-ashen-road']);
    expect(emptyCombination).toEqual([]);
  });

  it('derives canonization progress from the current stage and displayable steps', () => {
    const event = loreEvents.find((item) => item.slug === 'pilgrims-of-the-ashen-road')!;
    const progress = getCanonizationProgress(event.canon);

    expect(progress.stage.id).toBe('continuity_review');
    expect(progress.currentStep?.stageId).toBe('continuity_review');
    expect(progress.completedCount).toBe(2);
    expect(progress.totalCount).toBe(5);
    expect(progress.percent).toBe(50);
    expect(progress.terminal).toBe(false);
  });

  it('excludes skipped steps and weights terminal current stages as complete', () => {
    const disputedEvent = loreEvents.find((item) => item.slug === 'rumor-beneath-the-citadel')!;
    const disputedProgress = getCanonizationProgress(disputedEvent.canon);
    const canonEvent = loreEvents.find((item) => item.slug === 'genesis-mint')!;
    const canonProgress = getCanonizationProgress(canonEvent.canon);

    expect(disputedProgress.stage.id).toBe('disputed');
    expect(disputedProgress.terminal).toBe(true);
    expect(disputedProgress.totalCount).toBe(3);
    expect(disputedProgress.percent).toBe(67);
    expect(canonProgress.terminal).toBe(true);
    expect(canonProgress.percent).toBe(100);
  });

  it('returns sorted appearances and source records through query helpers', () => {
    const appearances = getEventsForCharacter('character-5');

    expect(appearances.map((event) => event.slug)).toEqual([
      'genesis-mint',
      'searing-rite',
    ]);
    expect(getSourcesForEvent(appearances[0]).map((source) => source.id)).toContain('source-official-genesis-tweet');
  });

  it('resolves locations and returns sorted events for a location', () => {
    const locations = getAllLoreLocations();
    const location = getLocationBySlug('blackened-citadel');

    expect(locations.map((item) => item.slug)).toContain('blackened-citadel');
    expect(location?.id).toBe('location-blackened-citadel');
    expect(getLocationById('location-blackened-citadel')?.slug).toBe('blackened-citadel');
    expect(getLocationBySlug('not-real')).toBeUndefined();

    const events = getEventsForLocation('location-blackened-citadel');

    expect(events.map((event) => event.slug)).toEqual([
      'first-citadel-march',
      'searing-rite',
      'pilgrims-of-the-ashen-road',
      'rumor-beneath-the-citadel',
    ]);
    expect(events.every((event) => event.locationIds.includes('location-blackened-citadel'))).toBe(true);
    expect(getEventsForLocation('location-missing')).toEqual([]);
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
    const brokenEvent = cloneEvent(loreEvents[0]);
    brokenEvent.id = 'event-broken-references';
    brokenEvent.slug = loreEvents[1].slug;
    brokenEvent.sourceIds = ['source-missing'];
    brokenEvent.characterIds = ['character-missing'];
    brokenEvent.locationIds = ['location-missing'];
    brokenEvent.canon.path = [
      {
        stageId: 'canonized',
        label: 'Broken step',
        status: 'current',
        sourceIds: ['source-step-missing'],
      },
    ];

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

  it('reports canon status and stage mismatches', () => {
    const brokenEvent = cloneEvent(loreEvents[0]);
    brokenEvent.id = 'event-broken-stage-mismatch';
    brokenEvent.slug = 'broken-stage-mismatch';
    brokenEvent.canon.status = 'canon';
    brokenEvent.canon.stageId = 'continuity_review';
    brokenEvent.canon.path = [
      { stageId: 'continuity_review', status: 'current' },
    ];

    const result = validateLoreArchive({ events: [brokenEvent] });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Event event-broken-stage-mismatch canon status canon is incompatible with stage continuity_review',
    );
  });

  it('reports missing current canon steps', () => {
    const brokenEvent = cloneEvent(loreEvents[0]);
    brokenEvent.id = 'event-missing-current-step';
    brokenEvent.slug = 'missing-current-step';
    brokenEvent.canon.path = [
      { stageId: 'canonized', status: 'complete' },
    ];

    const result = validateLoreArchive({ events: [brokenEvent] });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Event event-missing-current-step canon path must include exactly one current step');
  });

  it('reports current canon step stage mismatches', () => {
    const brokenEvent = cloneEvent(loreEvents[0]);
    brokenEvent.id = 'event-current-step-mismatch';
    brokenEvent.slug = 'current-step-mismatch';
    brokenEvent.canon.stageId = 'canonized';
    brokenEvent.canon.path = [
      { stageId: 'source_attributed', status: 'current' },
    ];

    const result = validateLoreArchive({ events: [brokenEvent] });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Event event-current-step-mismatch current canon step source_attributed does not match stage canonized',
    );
  });

  it('reports duplicate location slugs and missing location media/source references', () => {
    const [location] = getAllLoreLocations();
    const brokenLocation = {
      ...location,
      id: 'location-broken',
      imageId: 'media-missing',
      sourceIds: ['source-missing'],
    };

    const result = validateLoreArchive({ locations: [...getAllLoreLocations(), brokenLocation] });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        `Duplicate location slug: ${location.slug}`,
        'Location location-broken references missing image media: media-missing',
        'Location location-broken references missing source: source-missing',
      ]),
    );
  });
});
