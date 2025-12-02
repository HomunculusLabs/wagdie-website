/**
 * Unit Tests for Address Normalizer
 *
 * Tests EIP-55 checksumming and address validation.
 * Following TDD: These tests should PASS because address-normalizer.ts already exists.
 *
 * Task: T025
 */

import { describe, it, expect } from '@jest/globals';
import {
  normalizeAddress,
  normalizeOwnerAddress,
  safeNormalizeAddress,
  detectDuplicateAddresses,
} from '../../src/utils/address-normalizer.js';

describe('Address Normalizer', () => {
  describe('normalizeAddress', () => {
    it('should convert lowercase address to EIP-55 checksummed format', () => {
      const lowercase = '0x5aeda56215b167893e80b4fe645ba6d5bab767de';
      const checksummed = normalizeAddress(lowercase);

      // EIP-55 checksum: mixed case based on hash
      expect(checksummed).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    });

    it('should accept already checksummed address', () => {
      const checksummed = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = normalizeAddress(checksummed);

      expect(result).toBe(checksummed);
    });

    it('should handle  address', () => {
      const  = '0X5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED';
      const result = normalizeAddress();

      expect(result).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    });

    it('should throw error for invalid address format', () => {
      const invalid = '0xINVALID';

      expect(() => normalizeAddress(invalid)).toThrow('Invalid Ethereum address');
    });

    it('should throw error for address without 0x prefix', () => {
      const noPrefix = '5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

      expect(() => normalizeAddress(noPrefix)).toThrow('Invalid Ethereum address');
    });

    it('should throw error for address with wrong length', () => {
      const tooShort = '0x5aAeb6053F3E94C9';

      expect(() => normalizeAddress(tooShort)).toThrow('Invalid Ethereum address');
    });

    it('should handle address with extra whitespace', () => {
      const withSpaces = '  0x5aeda56215b167893e80b4fe645ba6d5bab767de  ';
      const result = normalizeAddress(withSpaces);

      expect(result).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    });
  });

  describe('normalizeOwnerAddress', () => {
    it('should normalize valid owner address when not burned', () => {
      const address = '0x5aeda56215b167893e80b4fe645ba6d5bab767de';
      const result = normalizeOwnerAddress(address, false);

      expect(result).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    });

    it('should return null when character is burned (regardless of address)', () => {
      const address = '0x5aeda56215b167893e80b4fe645ba6d5bab767de';
      const result = normalizeOwnerAddress(address, true);

      expect(result).toBeNull();
    });

    it('should return null when address is null and burned is true', () => {
      const result = normalizeOwnerAddress(null, true);

      expect(result).toBeNull();
    });

    it('should return null when address is undefined and burned is true', () => {
      const result = normalizeOwnerAddress(undefined, true);

      expect(result).toBeNull();
    });

    it('should return null when address is empty string and not burned', () => {
      const result = normalizeOwnerAddress('', false);

      expect(result).toBeNull();
    });

    it('should throw error for invalid address when not burned', () => {
      expect(() => normalizeOwnerAddress('0xINVALID', false)).toThrow();
    });
  });

  describe('safeNormalizeAddress', () => {
    it('should return success result for valid address', () => {
      const address = '0x5aeda56215b167893e80b4fe645ba6d5bab767de';
      const result = safeNormalizeAddress(address);

      expect(result.success).toBe(true);
      expect(result.normalized).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      expect(result.error).toBeUndefined();
    });

    it('should return failure result for invalid address', () => {
      const invalid = '0xINVALID';
      const result = safeNormalizeAddress(invalid);

      expect(result.success).toBe(false);
      expect(result.normalized).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid Ethereum address');
    });

    it('should return failure result for empty address', () => {
      const result = safeNormalizeAddress('');

      expect(result.success).toBe(false);
      expect(result.normalized).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('detectDuplicateAddresses', () => {
    it('should detect addresses with different casing that normalize to same value', () => {
      const addresses = [
        '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
        '0X5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      ];

      const duplicates = detectDuplicateAddresses(addresses);

      expect(duplicates.size).toBe(1);
      expect(duplicates.has('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);

      const duplicateGroup = duplicates.get('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      expect(duplicateGroup).toHaveLength(2);
      expect(duplicateGroup).toContain('0x5aeda56215b167893e80b4fe645ba6d5bab767de');
      expect(duplicateGroup).toContain('0X5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED');
    });

    it('should return empty map when no duplicates exist', () => {
      const addresses = [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      ];

      const duplicates = detectDuplicateAddresses(addresses);

      expect(duplicates.size).toBe(0);
    });

    it('should handle invalid addresses gracefully', () => {
      const addresses = [
        '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
        '0xINVALID',
        '0X5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED',
      ];

      const duplicates = detectDuplicateAddresses(addresses);

      // Should detect the two valid duplicates, ignore the invalid one
      expect(duplicates.size).toBe(1);
      expect(duplicates.has('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
    });

    it('should detect multiple groups of duplicates', () => {
      const addresses = [
        '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
        '0X5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED',
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
        '0X742D35CC6634C0532925A3B844BC9E7595F0BEB',
      ];

      const duplicates = detectDuplicateAddresses(addresses);

      expect(duplicates.size).toBe(2);
    });
  });

  describe('EIP-55 Compliance', () => {
    it('should produce correct checksum for known test vectors', () => {
      // Known EIP-55 test vectors from https://eips.ethereum.org/EIPS/eip-55
      const testVectors = [
        {
          input: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
          expected: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        },
        {
          input: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
          expected: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        },
        {
          input: '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
          expected: '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        },
        {
          input: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
          expected: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        },
      ];

      for (const { input, expected } of testVectors) {
        const result = normalizeAddress(input.toLowerCase());
        expect(result).toBe(expected);
      }
    });

    it('should detect invalid checksum and recalculate correctly', () => {
      // Intentionally wrong checksum
      const wrongChecksum = '0x5aAeb6053f3e94c9b9a09f33669435e7ef1beaed';
      const result = normalizeAddress(wrongChecksum);

      // Should recalculate to correct checksum
      expect(result).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    });
  });
});
