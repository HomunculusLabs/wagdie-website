import { fireEvent, render, screen } from '@testing-library/react';
import { ApprovalBanner, ApprovalReadyBanner } from '@/components/map/staking-sidebar/ApprovalBanner';
import { LocationDetailsCard } from '@/components/map/staking-sidebar/LocationDetailsCard';
import { LocationTabs } from '@/components/map/staking-sidebar/LocationTabs';
import { LocationRoomPanel } from '@/components/map/staking-sidebar/LocationRoomPanel';
import { PaginationControls } from '@/components/map/staking-sidebar/PaginationControls';
import { WalletGate } from '@/components/map/staking-sidebar/WalletGate';
import { CharacterStakeList } from '@/components/map/staking-sidebar/CharacterStakeList';
import { StakedHereList } from '@/components/map/staking-sidebar/StakedHereList';
import type { StakableCharacter } from '@/hooks/map/useMapStakingPanel';

describe('staking-sidebar presentational components', () => {
  it('renders enriched location details', () => {
    render(
      <LocationDetailsCard
        location={{
          id: 'loc-1',
          name: 'The Abyss',
          description: 'A dark and treacherous realm',
          image_url: '/images/locations/abyss.png',
          lore: 'The dead whisper beneath the stones.',
          metadata: {
            center: [1, 2],
            bounds: [[0, 0], [10, 10]],
            properties: {
              region: 'North',
              terrain: 'Ash plains',
              difficulty: 'hard',
            },
            special_properties: ['Cursed', 'Hidden crypts'],
          },
        }}
      />
    );

    expect(screen.getByText('Location Details')).toBeInTheDocument();
    expect(screen.getByAltText('The Abyss image')).toHaveAttribute('src', '/images/locations/abyss.png');
    expect(screen.getByText('The dead whisper beneath the stones.')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('Ash plains')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
    expect(screen.getByText('Cursed')).toBeInTheDocument();
    expect(screen.getByText('Hidden crypts')).toBeInTheDocument();
  });

  it('renders nothing when location has no enriched details', () => {
    const { container } = render(
      <LocationDetailsCard
        location={{
          id: 'loc-1',
          name: 'The Abyss',
          metadata: { center: [1, 2], bounds: [[0, 0], [10, 10]] },
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders wallet gate copy', () => {
    render(<WalletGate />);

    expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
    expect(screen.getByText('Connect to view and stake your characters')).toBeInTheDocument();
  });

  it('switches location tabs and shows counts', () => {
    const setActiveTab = jest.fn();

    render(
      <LocationTabs
        activeTab="your-characters"
        setActiveTab={setActiveTab}
        stakedCount={3}
        totalCharacters={12}
        isConnected
      />
    );

    expect(screen.getByRole('button', { name: /Staked Here\s*3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Your Characters\s*12/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Staked Here/i }));
    fireEvent.click(screen.getByRole('button', { name: /Room/i }));

    expect(setActiveTab).toHaveBeenCalledWith('staked-here');
    expect(setActiveTab).toHaveBeenCalledWith('room');
  });

  it('renders public room transcript and hides trigger controls from ineligible visitors', () => {
    render(
      <LocationRoomPanel
        roomData={{
          room: {
            id: 'room-1',
            locationId: 'loc-1',
            locationName: 'The Abyss',
            tickEnabled: true,
            lastTickAt: null,
            nextTickAt: null,
            tickCount: 1,
            createdAt: '2026-05-11T12:00:00.000Z',
            updatedAt: '2026-05-11T12:00:00.000Z',
          },
          participants: [{ tokenId: 7, name: 'Wagdie #7', imageUrl: null }],
          messages: [{
            id: 'msg-1',
            sequence: 1,
            authorKind: 'agent',
            tokenId: 7,
            authorName: 'Wagdie #7',
            content: 'The bell tolls beneath the ash.',
            createdAt: '2026-05-11T12:00:00.000Z',
          }],
          pagination: { page: 1, pageSize: 20, total: 1, hasMore: false },
        }}
        isLoading={false}
        error={null}
        canTriggerAsOwner={false}
        isTriggering={false}
        triggerState="idle"
        triggerError={null}
        onTrigger={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByText('Room Transcript')).toBeInTheDocument();
    expect(screen.getByText('The bell tolls beneath the ash.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Stir the Room/i })).not.toBeInTheDocument();
  });

  it('shows owner trigger controls only for eligible owners and disables them when too few participants remain', () => {
    render(
      <LocationRoomPanel
        roomData={{
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
          participants: [{ tokenId: 7, name: 'Wagdie #7', imageUrl: null }],
          messages: [],
          pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
        }}
        isLoading={false}
        error={null}
        canTriggerAsOwner
        isTriggering={false}
        triggerState="idle"
        triggerError={null}
        onTrigger={jest.fn()}
        onRetry={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Stir the Room/i })).toBeDisabled();
    expect(screen.getByText('At least two eligible participants are required.')).toBeInTheDocument();
  });

  it('calls the room trigger action for eligible owners', () => {
    const onTrigger = jest.fn().mockResolvedValue(undefined);

    render(
      <LocationRoomPanel
        roomData={{
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
          participants: [
            { tokenId: 7, name: 'Wagdie #7', imageUrl: null },
            { tokenId: 8, name: 'Wagdie #8', imageUrl: null },
          ],
          messages: [],
          pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
        }}
        isLoading={false}
        error={null}
        canTriggerAsOwner
        isTriggering={false}
        triggerState="idle"
        triggerError={null}
        onTrigger={onTrigger}
        onRetry={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Stir the Room/i }));

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('updates pagination with functional page setters and honors disabled states', () => {
    const setPage = jest.fn();

    render(
      <PaginationControls
        page={1}
        totalPages={3}
        startIndex={10}
        endIndex={20}
        totalCharacters={25}
        isLoadingStatuses={false}
        setPage={setPage}
      />
    );

    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 11-20 of 25');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(setPage).toHaveBeenCalledTimes(2);
    expect(setPage.mock.calls[0][0](1)).toBe(0);
    expect(setPage.mock.calls[1][0](1)).toBe(2);
  });

  it('hides pagination when only one page is available', () => {
    const { container } = render(
      <PaginationControls
        page={0}
        totalPages={1}
        startIndex={0}
        endIndex={5}
        totalCharacters={5}
        isLoadingStatuses={false}
        setPage={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders approval states and calls approve action when enabled', () => {
    const handleApprove = jest.fn().mockResolvedValue(undefined);

    render(
      <ApprovalBanner
        approvalState="not_approved"
        approvalError={null}
        isApproving={false}
        handleApprove={handleApprove}
      />
    );

    expect(screen.getByText('Contract approval required')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(handleApprove).toHaveBeenCalledTimes(1);
  });

  it('renders approval success and error states', () => {
    const { rerender } = render(<ApprovalReadyBanner />);
    expect(screen.getByText('Ready to stake')).toBeInTheDocument();

    rerender(
      <ApprovalBanner
        approvalState="error"
        approvalError="Approval check timed out"
        isApproving={false}
        handleApprove={jest.fn()}
      />
    );

    expect(screen.getByText('Approval check failed')).toBeInTheDocument();
    expect(screen.getByText('Approval check timed out')).toBeInTheDocument();
  });

  it('disables owned-character unstake actions when canUnstakeNow is false', () => {
    const character: StakableCharacter = {
      token_id: 7,
      name: 'Wagdie #7',
      image_url: '/images/placeholder-character.svg',
      isStaked: true,
    };

    render(
      <CharacterStakeList
        allCharacters={[character]}
        activeTokenId={null}
        isStaking={false}
        isUnstaking={false}
        isLoadingStatuses={false}
        canStakeNow
        canUnstakeNow={false}
        handleStake={jest.fn()}
        handleUnstake={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Unstake' })).toBeDisabled();
  });

  it('disables staked-here unstake actions when canUnstakeNow is false', () => {
    render(
      <StakedHereList
        stakedHere={[
          {
            token_id: 7,
            name: 'Wagdie #7',
            image_url: '/images/placeholder-character.svg',
            owner_address: '0xabc',
            staker_address: '0xabc',
          } as any,
        ]}
        effectiveWallet="0xabc"
        activeTokenId={null}
        isUnstaking={false}
        isLoadingStatuses={false}
        canUnstakeNow={false}
        handleUnstake={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Unstake' })).toBeDisabled();
  });

  it('disables matching owned-character stake and unstake actions while sync is pending', () => {
    const unstakedCharacter: StakableCharacter = {
      token_id: 7,
      name: 'Wagdie #7',
      image_url: '/images/placeholder-character.svg',
      isStaked: false,
    };
    const stakedCharacter: StakableCharacter = {
      token_id: 8,
      name: 'Wagdie #8',
      image_url: '/images/placeholder-character.svg',
      isStaked: true,
    };

    const { rerender } = render(
      <CharacterStakeList
        allCharacters={[unstakedCharacter]}
        activeTokenId={null}
        isStaking={false}
        isUnstaking={false}
        isLoadingStatuses={false}
        canStakeNow
        canUnstakeNow
        pendingSyncTokenIds={new Set([7])}
        handleStake={jest.fn()}
        handleUnstake={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Stake' })).toBeDisabled();

    rerender(
      <CharacterStakeList
        allCharacters={[stakedCharacter]}
        activeTokenId={null}
        isStaking={false}
        isUnstaking={false}
        isLoadingStatuses={false}
        canStakeNow
        canUnstakeNow
        pendingSyncTokenIds={new Set([8])}
        handleStake={jest.fn()}
        handleUnstake={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Unstake' })).toBeDisabled();
  });

  it('disables matching staked-here unstake actions while sync is pending', () => {
    render(
      <StakedHereList
        stakedHere={[
          {
            token_id: 7,
            name: 'Wagdie #7',
            image_url: '/images/placeholder-character.svg',
            owner_address: '0xabc',
            staker_address: '0xabc',
          } as any,
        ]}
        effectiveWallet="0xabc"
        activeTokenId={null}
        isUnstaking={false}
        isLoadingStatuses={false}
        canUnstakeNow
        pendingSyncTokenIds={new Set([7])}
        handleUnstake={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Unstake' })).toBeDisabled();
  });
});
