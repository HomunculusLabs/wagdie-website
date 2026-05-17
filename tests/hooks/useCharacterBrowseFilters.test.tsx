import { act, renderHook } from '@testing-library/react';

import {
  buildCharacterBrowsePath,
  CHARACTER_SEARCH_DEBOUNCE_MS,
  hasActiveCharacterBrowseFilters,
  parseCharacterBrowseFilters,
  useCharacterBrowseFilters,
} from '@/hooks/useCharacterBrowseFilters';

function params(query = ''): URLSearchParams {
  return new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
}

function setupHook(query = '', walletAddress?: string) {
  const router = { push: jest.fn() };
  const hook = renderHook(
    ({ searchParams, wallet }) => useCharacterBrowseFilters({
      searchParams,
      router,
      walletAddress: wallet,
    }),
    {
      initialProps: {
        searchParams: params(query),
        wallet: walletAddress,
      },
    }
  );

  return { router, ...hook };
}

describe('character browse filter URL helpers', () => {
  it('parses initial URL filters with defaults', () => {
    expect(parseCharacterBrowseFilters(params())).toEqual({
      tab: 'all',
      sort: 'asc',
      page: 1,
      searchQuery: '',
      hasSheet: false,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      the17: null,
      armor: null,
      back: null,
      mask: null,
    });

    expect(parseCharacterBrowseFilters(params('tab=owned&sort=desc&page=4&search=orc&hasSheet=true&origin=Warrior&alignment=Chaotic&the17=Luta&armor=Plate&back=Cloak&mask=Skull'))).toEqual({
      tab: 'owned',
      sort: 'desc',
      page: 4,
      searchQuery: 'orc',
      hasSheet: true,
      hasElizaProfile: false,
      origin: 'Warrior',
      alignment: 'Chaotic',
      the17: 'Luta',
      armor: 'Plate',
      back: 'Cloak',
      mask: 'Skull',
    });
  });

  it('omits default URL values and trims search', () => {
    expect(buildCharacterBrowsePath({
      tab: 'all',
      sort: 'asc',
      page: 1,
      search: '',
      hasSheet: false,
      origin: null,
      alignment: null,
      the17: null,
      armor: null,
      back: null,
      mask: null,
    })).toBe('/characters');

    expect(buildCharacterBrowsePath({
      tab: 'infected',
      sort: 'desc',
      page: 2,
      search: '  dread  ',
      hasSheet: true,
      origin: 'Feral',
      alignment: null,
      the17: 'Luta the Beacon',
      armor: null,
      back: 'Wings',
      mask: null,
    })).toBe('/characters?tab=infected&sort=desc&page=2&search=dread&hasSheet=true&origin=Feral&the17=Luta+the+Beacon&back=Wings');
  });

  it('detects active filters beyond tab and sort', () => {
    expect(hasActiveCharacterBrowseFilters(parseCharacterBrowseFilters(params('tab=infected&sort=asc')))).toBe(false);
    expect(hasActiveCharacterBrowseFilters(parseCharacterBrowseFilters(params('search=abc')))).toBe(true);
    expect(hasActiveCharacterBrowseFilters(parseCharacterBrowseFilters(params('hasSheet=true')))).toBe(true);
  });
});

describe('useCharacterBrowseFilters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('resets page to 1 when filters change', () => {
    const { result, router } = setupHook('page=5&search=bone&armor=Mail');

    act(() => {
      result.current.handlers.onOriginChange('Ghoul');
    });

    expect(router.push).toHaveBeenCalledWith('/characters?search=bone&origin=Ghoul&armor=Mail');
  });

  it('preserves a non-default sort when filters change', () => {
    const { result, router } = setupHook('page=5&sort=desc&search=bone&armor=Mail');

    act(() => {
      result.current.handlers.onOriginChange('Ghoul');
    });

    expect(router.push).toHaveBeenCalledWith('/characters?sort=desc&search=bone&origin=Ghoul&armor=Mail');
  });

  it('updates page without resetting filters and scrolls to top', () => {
    const { result, router } = setupHook('tab=infected&search=bone&hasSheet=true');

    act(() => {
      result.current.handlers.onPageChange(3);
    });

    expect(router.push).toHaveBeenCalledWith('/characters?tab=infected&page=3&search=bone&hasSheet=true');
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('debounces search for 400ms and uses the latest URL filters', () => {
    const { result, rerender, router } = setupHook('page=4&search=old&origin=Old');

    act(() => {
      result.current.setSearchInput('new');
    });

    act(() => {
      jest.advanceTimersByTime(CHARACTER_SEARCH_DEBOUNCE_MS - 1);
    });

    expect(router.push).not.toHaveBeenCalled();

    rerender({
      searchParams: params('tab=infected&page=6&search=old&origin=New&mask=Skull'),
      wallet: undefined,
    });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/characters?tab=infected&search=new&origin=New&mask=Skull');
  });

  it('clear all resets tab, sort, filters, search, and page defaults', () => {
    const { result, router } = setupHook('tab=owned&sort=asc&page=5&search=orc&hasSheet=true&origin=Feral&armor=Plate');

    act(() => {
      result.current.handlers.onClearAllFilters();
    });

    expect(result.current.searchInput).toBe('');
    expect(router.push).toHaveBeenCalledWith('/characters');
  });

  it('removes individual filters and resets page', () => {
    const { result, router } = setupHook('page=3&search=orc&origin=Feral&mask=Skull');

    act(() => {
      result.current.handlers.onRemoveFilter('mask');
    });

    expect(router.push).toHaveBeenCalledWith('/characters?search=orc&origin=Feral');
  });

  it('clears search immediately when removing the search filter', () => {
    const { result, router } = setupHook('page=3&search=orc&origin=Feral');

    act(() => {
      result.current.handlers.onRemoveFilter('search');
    });

    expect(result.current.searchInput).toBe('');
    expect(router.push).toHaveBeenCalledWith('/characters?origin=Feral');
  });

  it('guards owned tab queries until a wallet is connected', () => {
    const { result, rerender } = setupHook('tab=owned');

    expect(result.current.walletForQuery).toBeUndefined();
    expect(result.current.canQuery).toBe(false);

    rerender({
      searchParams: params('tab=owned'),
      wallet: '0xabc',
    });

    expect(result.current.walletForQuery).toBe('0xabc');
    expect(result.current.canQuery).toBe(true);
  });
});
