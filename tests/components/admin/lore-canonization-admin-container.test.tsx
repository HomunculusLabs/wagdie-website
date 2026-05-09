import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoreCanonizationAdminContainer } from '@/components/admin/lore-canonization/LoreCanonizationAdminContainer';
import { loreEvents } from '@/lib/lore/data/events';
import type { LoreCanonizationAdminRecord } from '@/components/admin/lore-canonization/types';

const event = loreEvents.find((item) => item.id === 'event-pilgrims-ashen-road')!;

const makeRecord = (): LoreCanonizationAdminRecord => ({
  eventId: event.id,
  event,
  staticCanon: event.canon,
});

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

describe('LoreCanonizationAdminContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads canonization records and saves editor changes as a draft through the admin API', async () => {
    const record = makeRecord();
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ events: [record], count: 1 }))
      .mockResolvedValueOnce(jsonResponse({
        event: {
          ...record,
          draftOverride: {
            eventId: event.id,
            canon: { ...event.canon, note: 'Draft admin note' },
            publicationStatus: 'draft',
            updatedBy: '0xAdmin',
            updatedAt: '2026-05-09T00:00:00.000Z',
            createdAt: '2026-05-09T00:00:00.000Z',
          },
        },
      }));
    global.fetch = fetchMock;

    render(<LoreCanonizationAdminContainer />);

    expect((await screen.findAllByText(event.title)).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Editor canon note'), {
      target: { value: 'Draft admin note' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`/api/admin/lore/canonization/${event.id}`);
    expect(init).toMatchObject({ method: 'PATCH' });
    expect(JSON.parse(init.body)).toMatchObject({
      canon: {
        status: event.canon.status,
        stageId: event.canon.stageId,
        note: 'Draft admin note',
      },
    });
  });
});
