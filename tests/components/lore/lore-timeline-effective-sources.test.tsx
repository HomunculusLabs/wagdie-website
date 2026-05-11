import { render, screen } from '@testing-library/react';
import { LoreTimeline } from '@/components/lore/LoreTimeline';
import { getStaticLoreBaseDataset } from '@/lib/lore/base-dataset';

describe('LoreTimeline effective source rendering', () => {
  it('uses route-provided sources instead of resolving static sources itself', () => {
    const dataset = getStaticLoreBaseDataset();
    const event = dataset.events.find((item) => item.sourceIds.length > 0)!;
    const source = dataset.sources.find((item) => item.id === event.sourceIds[0])!;

    render(
      <LoreTimeline
        items={[event]}
        seasons={dataset.seasons}
        locations={dataset.locations}
        characters={dataset.characters}
        sourcesByEventId={{ [event.id]: [source] }}
      />,
    );

    expect(screen.getByText(source.title)).toBeInTheDocument();
  });

  it('does not fall back to static source helpers when route sources are absent', () => {
    const dataset = getStaticLoreBaseDataset();
    const event = dataset.events.find((item) => item.sourceIds.length > 0)!;
    const source = dataset.sources.find((item) => item.id === event.sourceIds[0])!;

    render(
      <LoreTimeline
        items={[event]}
        seasons={dataset.seasons}
        locations={dataset.locations}
        characters={dataset.characters}
      />,
    );

    expect(screen.queryByText(source.title)).not.toBeInTheDocument();
    expect(screen.getByText('No source attribution records attached.')).toBeInTheDocument();
  });
});
