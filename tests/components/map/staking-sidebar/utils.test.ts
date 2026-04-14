import type { Character } from '@/types/character';
import {
  getCharacterName,
  getMarkerTitle,
  truncateAddress,
  uniqueNumberList,
} from '@/components/map/staking-sidebar/utils';

describe('staking-sidebar utils', () => {
  it('formats marker titles with safe fallbacks', () => {
    expect(getMarkerTitle(null)).toBe('Map');
    expect(getMarkerTitle({ name: '  The Mire  ' })).toBe('  The Mire  ');
    expect(getMarkerTitle({ name: '   ' })).toBe('Marker Details');
  });

  it('truncates wallet addresses and preserves short values', () => {
    expect(truncateAddress()).toBe('—');
    expect(truncateAddress('0x1234')).toBe('0x1234');
    expect(truncateAddress('0x1234567890abcdef')).toBe('0x1234...cdef');
  });

  it('uses character name, metadata name, then token id fallback', () => {
    expect(getCharacterName({ token_id: 7, name: '  Grigor  ' } as Character)).toBe('Grigor');
    expect(getCharacterName({ token_id: 8, metadata: { name: '  Bone Seer  ' } } as Character)).toBe('Bone Seer');
    expect(getCharacterName({ token_id: 9 } as Character)).toBe('#9');
  });

  it('deduplicates valid numbers while preserving first-seen order', () => {
    expect(uniqueNumberList([3, 1, 3, Number.NaN, 2, 1, 0])).toEqual([3, 1, 2, 0]);
  });
});
