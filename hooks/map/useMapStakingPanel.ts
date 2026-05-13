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
import { STAKING_CHAIN_ERROR, STAKING_CHAIN_ID } from '@/lib/contracts/staking-chain';

export type ApprovalState = 'idle' | 'checking' | 'approved' | 'not_approved' | 'error';

export type LocationTab = 'staked-here' | 'your-characters' | 'room';

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
  syncWarning: string | null;
  pendingSyncTokenIds: Set<number>;

  activeTokenId: number | null;
  handleStake: (tokenId: number) => Promise<void>;
  handleUnstake: (tokenId: number) => Promise<void>;

  isStaking: boolean;
  isUnstaking: boolean;
  isApproving: boolean;
  canStakeNow: boolean;
  canUnstakeNow: boolean;
  showApprovalBanner: boolean;
}

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
  const chainError = !isCorrectChain ? STAKING_CHAIN_ERROR : null;

  const [activeTab, setActiveTab] = useState<LocationTab>('your-characters');
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [pendingSyncTokenIds, setPendingSyncTokenIds] = useState<Set<number>>(() => new Set());

  const {
    isStaking,
    isUnstaking,
    isApproving,
    error: stakingError,
    checkApproval,
    approveForStaking,
    stakeWagdie,
    unstakeWagdie,
    syncStakingState,
  } = useStaking();

  const approvalCheckInFlightRef = useRef(false);
  const approvalCheckNonceRef = useRef(0);
  const checkApprovalRef = useRef(checkApproval);
  const isOpenRef = useRef(isOpen);
  const syncRetryTimerRef = useRef<number | null>(null);
  const syncOperationNonceRef = useRef(0);

  const stakingEnabled = isOpen;

  const clearSyncRetry = useCallback(() => {
    if (syncRetryTimerRef.current === null) return;
    window.clearTimeout(syncRetryTimerRef.current);
    syncRetryTimerRef.current = null;
  }, []);

  const addPendingSyncToken = useCallback((tokenId: number) => {
    setPendingSyncTokenIds((current) => {
      const next = new Set(current);
      next.add(tokenId);
      return next;
    });
  }, []);

  const removePendingSyncToken = useCallback((tokenId: number) => {
    setPendingSyncTokenIds((current) => {
      if (!current.has(tokenId)) return current;
      const next = new Set(current);
      next.delete(tokenId);
      return next;
    });
  }, []);

  const clearPendingSyncTokens = useCallback(() => {
    setPendingSyncTokenIds((current) => current.size === 0 ? current : new Set());
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    checkApprovalRef.current = checkApproval;
  }, [checkApproval]);

  useEffect(() => {
    if (isOpen) return;

    clearSyncRetry();
    syncOperationNonceRef.current += 1;
    setSyncWarning(null);
    clearPendingSyncTokens();
  }, [isOpen, clearSyncRetry, clearPendingSyncTokens]);

  useEffect(() => {
    return () => {
      clearSyncRetry();
      syncOperationNonceRef.current += 1;
      clearPendingSyncTokens();
    };
  }, [clearSyncRetry, clearPendingSyncTokens]);

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
    if (!stakingEnabled || !isConnected || !address || !isCorrectChain) {
      approvalCheckNonceRef.current += 1;
      approvalCheckInFlightRef.current = false;
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
  }, [isConnected, stakingEnabled, address, isCorrectChain]);

  useEffect(() => {
    void runApprovalCheck();
  }, [runApprovalCheck]);

  const handleApprove = useCallback(async () => {
    setApprovalError(null);

    if (!isCorrectChain) {
      setApprovalError(STAKING_CHAIN_ERROR);
      return;
    }

    await approveForStaking();
    await runApprovalCheck();
  }, [approveForStaking, runApprovalCheck, isCorrectChain]);

  const handlePostTransactionRefresh = useCallback(
    async (params: {
      tokenId: number;
      action: 'stake' | 'unstake';
      outcome: Awaited<ReturnType<typeof stakeWagdie>>;
    }) => {
      const { tokenId, action, outcome } = params;

      if (!outcome.transaction.success) return;

      const syncOutcome = outcome.sync;

      if (syncOutcome?.ok === false) {
        const warningMessage =
          syncOutcome.message ??
          'Transaction confirmed, but map data is still syncing.';
        const operationNonce = ++syncOperationNonceRef.current;

        clearSyncRetry();
        addPendingSyncToken(tokenId);
        setSyncWarning(warningMessage);

        await Promise.allSettled([
          refetchStatuses({ source: 'chain', tokenIds: [tokenId] }),
          refetchCharacters(),
          Promise.resolve(onStakingChanged?.()),
        ]);

        if (!syncOutcome.retryable) return;

        syncRetryTimerRef.current = window.setTimeout(() => {
          void (async () => {
            const retryOutcome = await syncStakingState(tokenId, action);

            if (syncOperationNonceRef.current !== operationNonce) return;
            if (!isOpenRef.current) return;

            if (retryOutcome.ok) {
              removePendingSyncToken(tokenId);
              setSyncWarning(null);
              await Promise.allSettled([
                refetchStatuses(),
                refetchCharacters(),
                Promise.resolve(onStakingChanged?.()),
              ]);
              return;
            }

            setSyncWarning(retryOutcome.message ?? warningMessage);
          })();
        }, 5_000);

        return;
      }

      clearSyncRetry();
      syncOperationNonceRef.current += 1;
      removePendingSyncToken(tokenId);
      setSyncWarning(null);
      await Promise.all([refetchStatuses(), refetchCharacters()]);
      await onStakingChanged?.();
    },
    [
      clearSyncRetry,
      refetchStatuses,
      refetchCharacters,
      onStakingChanged,
      stakeWagdie,
      syncStakingState,
      addPendingSyncToken,
      removePendingSyncToken,
    ]
  );

  const handleStake = useCallback(
    async (tokenId: number) => {
      if (!selectedLocation) return;
      setActiveTokenId(tokenId);
      removePendingSyncToken(tokenId);

      try {
        const outcome = await stakeWagdie(tokenId, selectedLocation.locationId);
        await handlePostTransactionRefresh({ tokenId, action: 'stake', outcome });
      } finally {
        setActiveTokenId(null);
      }
    },
    [selectedLocation, stakeWagdie, handlePostTransactionRefresh, removePendingSyncToken]
  );

  const handleUnstake = useCallback(
    async (tokenId: number) => {
      setActiveTokenId(tokenId);
      removePendingSyncToken(tokenId);

      try {
        const outcome = await unstakeWagdie(tokenId);
        await handlePostTransactionRefresh({ tokenId, action: 'unstake', outcome });
      } finally {
        setActiveTokenId(null);
      }
    },
    [unstakeWagdie, handlePostTransactionRefresh, removePendingSyncToken]
  );

  const canStakeNow =
    isConnected &&
    !!selectedLocation &&
    approvalState === 'approved' &&
    isCorrectChain &&
    !isStaking &&
    !isApproving;

  const canUnstakeNow =
    isConnected &&
    isCorrectChain &&
    !isUnstaking &&
    !isApproving;

  const showApprovalBanner = isConnected && isCorrectChain && approvalState !== 'approved';

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
    syncWarning,
    pendingSyncTokenIds,
    activeTokenId,
    handleStake,
    handleUnstake,
    isStaking,
    isUnstaking,
    isApproving,
    canStakeNow,
    canUnstakeNow,
    showApprovalBanner,
  };
}
