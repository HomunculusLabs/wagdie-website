import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaginationParams } from '../../types/index.js';
import type { CharacterRecord } from '../../types/character.js';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';

export type UseCharactersOptions = {
  transport?: ElizaTransport; // defaults to context
  pageSize?: number; // default: 20
  autoLoad?: boolean; // default: true (auto-fetch on mount)
  nftCollectionId?: string;
};

export type UseCharactersResult = {
  items: CharacterRecord[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  load: (page?: number) => Promise<void>; // load specific page
  loadMore: () => Promise<void>; // load next page (append)
  refresh: () => Promise<void>; // reload from page 1
};

export function useCharacters(options: UseCharactersOptions = {}): UseCharactersResult {
  const { transport: transportOverride, pageSize: pageSizeOverride, autoLoad = true, nftCollectionId } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const pageSize = pageSizeOverride ?? 20;

  const [items, setItems] = useState<CharacterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React 18 Strict Mode)
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1; // invalidate any in-flight updates
    };
  }, []);

  const safeSetState = useMemo(() => {
    return {
      setItems: (updater: CharacterRecord[] | ((prev: CharacterRecord[]) => CharacterRecord[])) => {
        if (!isMountedRef.current) return;
        setItems(updater);
      },
      setIsLoading: (next: boolean) => {
        if (!isMountedRef.current) return;
        setIsLoading(next);
      },
      setError: (next: Error | null) => {
        if (!isMountedRef.current) return;
        setError(next);
      },
      setPage: (next: number) => {
        if (!isMountedRef.current) return;
        setPage(next);
      },
      setHasMore: (next: boolean) => {
        if (!isMountedRef.current) return;
        setHasMore(next);
      },
    };
  }, []);

  const loadInternal = useCallback(
    async (targetPage: number, mode: 'replace' | 'append'): Promise<void> => {
      if (!transport) {
        safeSetState.setError(
          new Error(
            'useCharacters requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.'
          )
        );
        return;
      }

      const requestId = ++requestIdRef.current;

      safeSetState.setIsLoading(true);
      safeSetState.setError(null);

      try {
        const params: PaginationParams & { nftCollectionId?: string } = {
          page: targetPage,
          pageSize,
          nftCollectionId,
        };

        const result = await transport.characters.listRecords(params);

        if (requestIdRef.current !== requestId) return;

        safeSetState.setItems((prev) => (mode === 'append' ? [...prev, ...result.items] : result.items));
        safeSetState.setPage(result.page ?? targetPage);
        safeSetState.setHasMore(Boolean(result.hasMore));
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        safeSetState.setError(toError(err, 'Failed to load characters'));
      } finally {
        if (requestIdRef.current !== requestId) return;
        safeSetState.setIsLoading(false);
      }
    },
    [pageSize, safeSetState, transport, nftCollectionId]
  );

  const load = useCallback(
    async (nextPage?: number): Promise<void> => {
      const targetPage = nextPage ?? 1;
      await loadInternal(targetPage, 'replace');
    },
    [loadInternal]
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoading) return;
    if (!hasMore && items.length > 0) return;

    const nextPage = Math.max(1, page + 1);
    await loadInternal(nextPage, 'append');
  }, [hasMore, isLoading, items.length, loadInternal, page]);

  const refresh = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1; // invalidate any in-flight request
    safeSetState.setItems([]);
    safeSetState.setPage(1);
    safeSetState.setHasMore(false);
    safeSetState.setError(null);

    await loadInternal(1, 'replace');
  }, [loadInternal, safeSetState]);

  useEffect(() => {
    if (!autoLoad) return;

    // Only auto-load once (or when the transport changes).
    // If transport is missing, surface a helpful error but do not throw.
    void load(1);
  }, [autoLoad, load, nftCollectionId, transport]);

  return {
    items,
    isLoading,
    error,
    page,
    hasMore,
    load,
    loadMore,
    refresh,
  };
}