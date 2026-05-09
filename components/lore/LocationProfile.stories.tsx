import type { Meta, StoryObj } from '@storybook/react';
import { LocationProfile } from './LocationProfile';
import { locationWithNoEvents, loreStoryData } from './story-data';

const location = loreStoryData.locations.find((item) => item.slug === 'blackened-citadel')!;
const locationEvents = [
  loreStoryData.officialEvent,
  loreStoryData.communityCanonizingEvent,
  loreStoryData.disputedEvent,
].filter((event) => event.locationIds.includes(location.id));

const aliasLocation = loreStoryData.locations.find((item) => item.aliases.length > 1) ?? location;

const meta: Meta<typeof LocationProfile> = {
  title: 'Components/Lore/LocationProfile',
  component: LocationProfile,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LocationProfile>;

export const Default: Story = {
  args: {
    location,
    events: locationEvents,
    seasons: loreStoryData.seasons,
    allLocations: loreStoryData.locations,
    characters: loreStoryData.characters,
  },
};

export const NoEvents: Story = {
  args: {
    location: locationWithNoEvents,
    events: [],
    seasons: loreStoryData.seasons,
    allLocations: loreStoryData.locations,
    characters: loreStoryData.characters,
  },
};

export const WithAliases: Story = {
  args: {
    location: aliasLocation,
    events: loreStoryData.relatedEvents.filter((event) => event.locationIds.includes(aliasLocation.id)),
    seasons: loreStoryData.seasons,
    allLocations: loreStoryData.locations,
    characters: loreStoryData.characters,
  },
};
