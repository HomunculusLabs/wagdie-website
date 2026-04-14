'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { MarkerPayload } from '@/game/EventBus';
import type { Location } from '@/lib/types/map';
import type { CharacterWithLocation } from '@/lib/repositories/character-repository';
import type { Character } from '@/types/character';
import { useOwnedCharacters } from '@/hooks/useOwnedCharacters';
import { useStakingStatuses } from '@/hooks/useStakingStatuses';
import { useStaking } from '@/hooks/useStaking';

export type ApprovalState = 'idle' | 'checking' | 'approved' | 'not_approved' | 'error';

export type LocationTab = 'staked-here' | 'your-characters';

export type StakableCharacter = Character & {
  isStaked: boolean;
  locationId?: bigint;
};

export type SetPage = Dispatch<SetStateAction<number>>;

export interface SelectedStakingLocation {
  location: Location;
  locationId: bigint;
}

export interface UseMapStakingPanelInput {
  isOpen: boolean;
  selectedLocation: SelectedStakingLocation | null;
  selectedMarker: MarkerPayload | null;
  stakedHere: CharacterWithLocation[];
  walletAddress?: string;
  onStakingChanged?: () => void;
}

export interface UseMapStakingPanelResult {
  effectiveWallet?: string;
  isConnected: boolean;
  isCorrectChain: boolean;
  chainError: string | null;

  activeTab: LocationTab;
  setActiveTab: (tab: LocationTab) => void;

  approvalState: ApprovalState;
  approvalError: string | null;
  handleApprove: () => Promise<void>;

  characters: Character[];
  pagedCharacters: Character[];
  allCharacters: StakableCharacter[];
  totalCharacters: number;
  totalPages: number;
  page: number;
  setPage: SetPage;
  startIndex: number;
  endIndex: number;

  isLoadingCharacters: boolean;
  isLoadingStatuses: boolean;
  dataLoadingError: string | null;
  transactionError: string | null;

  activeTokenId: number | null;
  handleStake: (tokenId: number) => Promise<void>;
  handleUnstake: (tokenId: number) => Promise<void>;

  isStaking: boolean;
  isUnstaking: boolean;
  isApproving: boolean;
  canStakeNow: boolean;
  showApprovalBanner: boolean;
}

const STAKING_CHAIN_ID = 1;
const PER_PAGE = 10;
const APPROVAL_CHECK_TIMEOUT_MS = 10_000;

function uniqueNumberList(items: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];

  for (const item of items) {
    if (typeof item !== 'number') continue;
    if (Number.isNaN(item)) continue;
    if (seen.has(item)) continue;

    seen.add(item);
    out.push(item);
  }

  return out;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Approval check timed out'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timeoutId);
        reject(err);
      });
  });
}

export function useMapStakingPanel(input: UseMapStakingPanelInput): UseMapStakingPanelResult {
  const {
    isOpen,
    selectedLocation,
    walletAddress,
    onStakingChanged,
  } = input;

  const { isConnected, address } = useAccount();
  const effectiveWallet = walletAddress ?? address;
  const chainId = useChainId();
  const isCorrectChain = chainId === STAKING_CHAIN_ID;
  const chainError = !isCorrectChain ? 'Switch to Ethereum Mainnet to stake' : null;

  const [activeTab, setActiveTab] = useState<LocationTab>('your-characters');
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const {
    isStaking,
    isUnstaking,
    isApproving,
    error: stakingError,
    checkApproval,
    approveForStaking,
    stakeWagdie,
    unstakeWagdie,
  } = useStaking();

  const approvalCheckInFlightRef = useRef(false);
  const approvalCheckNonceRef = useRef(0);
  const checkApprovalRef = useRef(checkApproval);
  const isOpenRef = useRef(isOpen);

  const stakingEnabled = isOpen;

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    checkApprovalRef.current = checkApproval;
  }, [checkApproval]);

  const charactersEnabled = stakingEnabled && isConnected && !!effectiveWallet;
  const {
    characters,
    isLoading: isLoadingCharacters,
    error: charactersError,
    refetch: refetchCharacters,
  } = useOwnedCharacters(effectiveWallet, { enabled: charactersEnabled });

  const totalCharacters = characters.length;
  const totalPages = Math.ceil(totalCharacters / PER_PAGE);
  const startIndex = page * PER_PAGE;
  const endIndex = Math.min(startIndex + PER_PAGE, totalCharacters);

  const pagedCharacters = useMemo(() => {
    return characters.slice(startIndex, endIndex);
  }, [characters, startIndex, endIndex]);

  const wagdieIds = useMemo(() => {
    const ids = pagedCharacters.map(c => c.token_id);
    return uniqueNumberList(ids);
  }, [pagedCharacters]);

  const statusesEnabled = stakingEnabled && isConnected && wagdieIds.length > 0;
  const {
    statuses,
    isLoading: isLoadingStatuses,
    error: statusesError,
    refetch: refetchStatuses,
  } = useStakingStatuses(wagdieIds, { enabled: statusesEnabled });

  const allCharacters = useMemo(() => {
    return pagedCharacters
      .map((character): StakableCharacter => ({
        ...character,
        isStaked: statuses.get(character.token_id)?.isStaked ?? false,
        locationId: statuses.get(character.token_id)?.locationId,
      }))
      .sort((a, b) => {
        if (a.isStaked !== b.isStaked) return a.isStaked ? 1 : -1;
        return a.token_id - b.token_id;
      });
  }, [pagedCharacters, statuses]);

  useEffect(() => {
    setPage(0);
  }, [effectiveWallet]);

  const runApprovalCheck = useCallback(async () => {
    if (!stakingEnabled || !isConnected || !address) {
      setApprovalState('idle');
      setApprovalError(null);
      return;
    }

    if (approvalCheckInFlightRef.current) return;
    approvalCheckInFlightRef.current = true;

    const currentNonce = ++approvalCheckNonceRef.current;

    setApprovalState('checking');
    setApprovalError(null);

    try {
      const approved = await withTimeout(
        Promise.resolve(checkApprovalRef.current()),
        APPROVAL_CHECK_TIMEOUT_MS
      );

      if (approvalCheckNonceRef.current !== currentNonce) return;
      if (!isOpenRef.current) return;

      setApprovalState(approved ? 'approved' : 'not_approved');
    } catch (err) {
      if (approvalCheckNonceRef.current !== currentNonce) return;
      if (!isOpenRef.current) return;

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to check approval';

      setApprovalState('error');
      setApprovalError(message);
    } finally {
      if (approvalCheckNonceRef.current === currentNonce) {
        approvalCheckInFlightRef.current = false;
      }
    }
  }, [isConnected, stakingEnabled, address]);

  useEffect(() => {
    void runApprovalCheck();
  }, [runApprovalCheck]);

  const handleApprove = useCallback(async () => {
    setApprovalError(null);
    await approveForStaking();
    await runApprovalCheck();
  }, [approveForStaking, runApprovalCheck]);

  const handleStake = useCallback(
    async (tokenId: number) => {
      if (!selectedLocation) return;
      setActiveTokenId(tokenId);

      try {
        await stakeWagdie(tokenId, selectedLocation.locationId);
        await Promise.all([refetchStatuses(), refetchCharacters()]);
        await onStakingChanged?.();
      } finally {
        setActiveTokenId(null);
      }
    },
    [selectedLocation, stakeWagdie, refetchStatuses, refetchCharacters, onStakingChanged]
  );

  const handleUnstake = useCallback(
    async (tokenId: number) => {
      setActiveTokenId(tokenId);

      try {
        await unstakeWagdie(tokenId);
        await Promise.all([refetchStatuses(), refetchCharacters()]);
        await onStakingChanged?.();
      } finally {
        setActiveTokenId(null);
      }
    },
    [unstakeWagdie, refetchStatuses, refetchCharacters, onStakingChanged]
  );

  const canStakeNow =
    isConnected &&
    !!selectedLocation &&
    approvalState === 'approved' &&
    isCorrectChain &&
    !isStaking &&
    !isApproving;

  const showApprovalBanner = isConnected && approvalState !== 'approved';

  const dataLoadingError =
    (charactersError ? `Failed to load characters: ${charactersError.message}` : null) ||
    (statusesError ? `Failed to load staking status: ${statusesError.message}` : null) ||
    null;

  const transactionError = stakingError?.message ?? null;

  return {
    effectiveWallet,
    isConnected,
    isCorrectChain,
    chainError,
    activeTab,
    setActiveTab,
    approvalState,
    approvalError,
    handleApprove,
    characters,
    pagedCharacters,
    allCharacters,
    totalCharacters,
    totalPages,
    page,
    setPage,
    startIndex,
    endIndex,
    isLoadingCharacters,
    isLoadingStatuses,
    dataLoadingError,
    transactionError,
    activeTokenId,
    handleStake,
    handleUnstake,
    isStaking,
    isUnstaking,
    isApproving,
    canStakeNow,
    showApprovalBanner,
  };
}
