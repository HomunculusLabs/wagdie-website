import { renderHook, waitFor } from '@testing-library/react';
import { useLocationRoom } from '@/hooks/map/useLocationRoom';

const roomPayload = {
  room: {
    id: 'room-1',
    locationId: 'loc-1',
    locationName: 'The Abyss',
    tickEnabled: true,
    lastTickAt: null,
    nextTickAt: null,
    tickCount: 0,
    createdAt: '2026-05-11T12:00:00.000Z',
    updatedAt: '2026-05-11T12:00:00.000Z',
  },
  participants: [],
  messages: [],
  pagination: { page: 1, pageSize: 30, total: 0, hasMore: false },
};

describe('useLocationRoom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => roomPayload,
    })) as jest.Mock;
  });

  it('loads public room data without a wallet when the room tab is active', async () => {
    const { result } = renderHook(() => useLocationRoom({
      locationId: 'loc-1',
      isActive: true,
      stakedHere: [],
      walletAddress: undefined,
      isConnected: false,
    }));

    await waitFor(() => expect(result.current.roomData?.room.id).toBe('room-1'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/eliza/location-rooms/loc-1?pageSize=30',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(result.current.canTriggerAsOwner).toBe(false);
  });

  it('computes owner trigger eligibility from staked participant effective ownership', () => {
    const { result, rerender } = renderHook(
      (props: { wallet: string }) => useLocationRoom({
        locationId: 'loc-1',
        isActive: false,
        stakedHere: [{
          token_id: 7,
          owner_address: '0xOwner',
          staker_address: '0xStakeR',
          location_id: 'loc-1',
        } as any],
        walletAddress: props.wallet,
        isConnected: true,
      }),
      { initialProps: { wallet: '0xowner' } }
    );

    expect(result.current.canTriggerAsOwner).toBe(false);

    rerender({ wallet: '0xstaker' });

    expect(result.current.canTriggerAsOwner).toBe(true);
  });
});
