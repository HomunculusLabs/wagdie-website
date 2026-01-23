import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NftToken, ListCollectionTokensResponse } from '../../types/nft.js';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

export type UseCollectionTokensOptions = {
  collectionId: string;
  transport?: ElizaTransport;
  limit?: number; // default: 10
  autoLoad?: boolean; // default: true
  ownerAddress?: string; // filter tokens by owner wallet address
};

export type UseCollectionTokensResult = {
  tokens: NftToken[];
  collection: ListCollectionTokensResponse['collection'] | null;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useCollectionTokens(options: UseCollectionTokensOptions): UseCollectionTokensResult {
  const { collectionId, transport: transportOverride, limit = 10, autoLoad = true, ownerAddress } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const [tokens, setTokens] = useState<NftToken[]>([]);
  const [collection, setCollection] = useState<ListCollectionTokensResponse['collection'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React 18 Strict Mode)
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const safeSetState = useMemo(() => {
    return {
      setTokens: (updater: NftToken[] | ((prev: NftToken[]) => NftToken[])) => {
        if (!isMountedRef.current) return;
        setTokens(updater);
      },
      setCollection: (next: ListCollectionTokensResponse['collection'] | null) => {
        if (!isMountedRef.current) return;
        setCollection(next);
      },
      setIsLoading: (next: boolean) => {
        if (!isMountedRef.current) return;
        setIsLoading(next);
      },
      setError: (next: Error | null) => {
        if (!isMountedRef.current) return;
        setError(next);
      },
      setCursor: (next: string | null) => {
        if (!isMountedRef.current) return;
        setCursor(next);
      },
      setHasMore: (next: boolean) => {
        if (!isMountedRef.current) return;
        setHasMore(next);
      },
    };
  }, []);

  const loadInternal = useCallback(
    async (cursorValue: string | undefined, mode: 'replace' | 'append'): Promise<void> => {
      if (!transport) {
        safeSetState.setError(
          new Error(
            'useCollectionTokens requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.'
          )
        );
        return;
      }

      if (!collectionId) {
        safeSetState.setError(new Error('collectionId is required'));
        return;
      }

      const requestId = ++requestIdRef.current;

      safeSetState.setIsLoading(true);
      safeSetState.setError(null);

      try {
        const result = await transport.nft.listCollectionTokens({
          collectionId,
          limit,
          cursor: cursorValue,
          ownerAddress,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        safeSetState.setTokens((prev) =>
          mode === 'append' ? [...prev, ...result.tokens] : result.tokens
        );
        safeSetState.setCollection(result.collection);
        safeSetState.setCursor(result.cursor);
        safeSetState.setHasMore(result.cursor !== null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        safeSetState.setError(toError(err, 'Failed to load tokens'));
      } finally {
        if (requestIdRef.current !== requestId) return;
        safeSetState.setIsLoading(false);
      }
    },
    [collectionId, limit, ownerAddress, safeSetState, transport]
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoading) return;
    if (!hasMore) return;

    await loadInternal(cursor ?? undefined, 'append');
  }, [cursor, hasMore, isLoading, loadInternal]);

  const refresh = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    safeSetState.setTokens([]);
    safeSetState.setCollection(null);
    safeSetState.setCursor(null);
    safeSetState.setHasMore(true);
    safeSetState.setError(null);

    await loadInternal(undefined, 'replace');
  }, [loadInternal, safeSetState]);

  useEffect(() => {
    if (!autoLoad) return;
    if (!collectionId) return;

    void loadInternal(undefined, 'replace');
  }, [autoLoad, collectionId, loadInternal, transport]);

  return {
    tokens,
    collection,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
