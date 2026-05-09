import type { Meta, StoryObj } from '@storybook/react';
import { CharacterProfile } from './CharacterProfile';
import { characterWithNoAppearances, loreStoryData } from './story-data';

const canonizingCharacter = loreStoryData.characters.find(
  (character) => character.id === loreStoryData.communityCanonizingEvent.characterIds[0],
)!;

const canonizingAppearances = [
  loreStoryData.communityCanonizingEvent,
  loreStoryData.disputedEvent,
].filter((event) => event.characterIds.includes(canonizingCharacter.id));

const canonizingSources = loreStoryData.allSources.filter((source) =>
  canonizingAppearances.some((event) => event.sourceIds.includes(source.id)),
);

const meta: Meta<typeof CharacterProfile> = {
  title: 'Components/Lore/CharacterProfile',
  component: CharacterProfile,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CharacterProfile>;

export const AppearedInTimeline: Story = {
  args: {
    character: canonizingCharacter,
    image: loreStoryData.communityCanonizingMedia[0],
    appearedInEvents: canonizingAppearances,
    firstAppearance: canonizingAppearances[0],
    associatedLocations: loreStoryData.locations.filter((location) =>
      canonizingAppearances.some((event) => event.locationIds.includes(location.id)),
    ),
    seasons: loreStoryData.seasons,
    allLocations: loreStoryData.locations,
    sources: canonizingSources,
  },
};

export const NoAppearances: Story = {
  args: {
    character: characterWithNoAppearances,
    appearedInEvents: [],
    associatedLocations: [],
    seasons: loreStoryData.seasons,
    allLocations: loreStoryData.locations,
    sources: [loreStoryData.disputedSources[0]],
  },
};
