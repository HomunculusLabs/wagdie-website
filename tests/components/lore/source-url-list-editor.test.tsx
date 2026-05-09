import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  SourceUrlListEditor,
  type EditableSubmissionLink,
} from '@/components/lore/submissions/SourceUrlListEditor';

function Harness() {
  const [links, setLinks] = useState<EditableSubmissionLink[]>([
    { url: '', role: 'source_media', displayTitle: '', archivedUrl: '', attribution: '' },
  ]);

  return <SourceUrlListEditor links={links} onChange={setLinks} />;
}

describe('SourceUrlListEditor', () => {
  it('adds, updates, and removes source URLs', () => {
    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('https://x.com/... or https://youtu.be/...'), {
      target: { value: 'https://x.com/wagdie/status/123' },
    });
    expect(screen.getByDisplayValue('https://x.com/wagdie/status/123')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add url/i }));
    expect(screen.getAllByPlaceholderText('https://x.com/... or https://youtu.be/...')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[1]);
    expect(screen.getAllByPlaceholderText('https://x.com/... or https://youtu.be/...')).toHaveLength(1);
  });
});
