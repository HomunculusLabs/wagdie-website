import { render, screen } from '@testing-library/react';
import { SourceAttribution } from '@/components/lore/SourceAttribution';
import { SourceList } from '@/components/lore/SourceList';
import { loreSources } from '@/lib/lore/data/sources';

describe('lore source preservation UI', () => {
  it('renders full attribution metadata for source list entries', () => {
    const source = loreSources.find((item) => item.id === 'source-official-genesis-tweet')!;

    render(<SourceList sources={[source]} />);

    expect(screen.getByText(source.title)).toBeInTheDocument();
    expect(screen.getByText(/Twitter\/X/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`•\\s*${source.author}`))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Original' })).toHaveAttribute('href', source.url);
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', source.archivedUrl);
    expect(screen.getByText(/Captured/i)).toBeInTheDocument();
    expect(screen.getByText(source.attribution)).toBeInTheDocument();
    expect(screen.getByText(source.preservationNote!)).toBeInTheDocument();
  });

  it('handles manual/offline sources without broken links', () => {
    const source = loreSources.find((item) => item.id === 'source-manual-rumor-ledger')!;

    render(<SourceList sources={[source]} />);

    expect(screen.getByText(source.title)).toBeInTheDocument();
    expect(screen.getByText(/Offline\/manual archive only/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Original' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Archive' })).not.toBeInTheDocument();
    expect(screen.getByText(source.attribution)).toBeInTheDocument();
    expect(screen.getByText(source.preservationNote!)).toBeInTheDocument();
  });

  it('shows compact source attribution details including links or offline note', () => {
    const source = loreSources.find((item) => item.id === 'source-community-map-submission')!;

    render(<SourceAttribution sources={[source]} />);

    expect(screen.getByText(source.title)).toBeInTheDocument();
    expect(screen.getByText(/Community archive/i)).toBeInTheDocument();
    expect(screen.getByText(source.attribution)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', source.archivedUrl);
  });
});
