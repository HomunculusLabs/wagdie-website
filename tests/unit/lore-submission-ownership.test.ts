import {
  parseLoreSubmissionTokenId,
  verifyLoreSubmissionTokenOwnership,
  type TokenOwnershipSupabaseClient,
} from '@/lib/lore/submissions/ownership';

function mockOwnershipClient(data: unknown, error: { message: string } | null = null): TokenOwnershipSupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(async () => ({ data, error })),
        })),
      })),
    })),
  };
}

describe('lore submission token ownership helper', () => {
  it('parses token ids within the WAGDIE collection range', () => {
    expect(parseLoreSubmissionTokenId('1')).toBe(1);
    expect(parseLoreSubmissionTokenId(6666)).toBe(6666);
    expect(parseLoreSubmissionTokenId('0')).toBeNull();
    expect(parseLoreSubmissionTokenId('0001')).toBeNull();
    expect(parseLoreSubmissionTokenId('6667')).toBeNull();
    expect(parseLoreSubmissionTokenId('1.5')).toBeNull();
  });

  it('accepts the indexed owner address', async () => {
    const client = mockOwnershipClient({
      token_id: 7,
      owner_address: '0xABCDEF0000000000000000000000000000000001',
      staker_address: null,
    });

    const result = await verifyLoreSubmissionTokenOwnership({
      tokenId: '7',
      walletAddress: '0xabcdef0000000000000000000000000000000001',
      supabaseClient: client,
    });

    expect(result).toMatchObject({
      owns: true,
      reason: 'owned',
      tokenId: 7,
      walletAddress: '0xabcdef0000000000000000000000000000000001',
    });
  });

  it('accepts the staker address for staked characters', async () => {
    const client = mockOwnershipClient({
      token_id: 9,
      owner_address: '0x1111111111111111111111111111111111111111',
      staker_address: '0xABCDEF0000000000000000000000000000000002',
    });

    const result = await verifyLoreSubmissionTokenOwnership({
      tokenId: 9,
      walletAddress: '0xabcdef0000000000000000000000000000000002',
      supabaseClient: client,
    });

    expect(result.owns).toBe(true);
    expect(result.reason).toBe('staked');
  });

  it('rejects mismatched wallets and missing characters without throwing', async () => {
    const mismatch = await verifyLoreSubmissionTokenOwnership({
      tokenId: '3',
      walletAddress: '0xabcdef0000000000000000000000000000000003',
      supabaseClient: mockOwnershipClient({
        token_id: 3,
        owner_address: '0x1111111111111111111111111111111111111111',
        staker_address: null,
      }),
    });
    const missing = await verifyLoreSubmissionTokenOwnership({
      tokenId: '4',
      walletAddress: '0xabcdef0000000000000000000000000000000004',
      supabaseClient: mockOwnershipClient(null),
    });

    expect(mismatch).toMatchObject({ owns: false, reason: 'not_owner' });
    expect(missing).toMatchObject({ owns: false, reason: 'not_found' });
  });

  it('reports invalid input before querying Supabase', async () => {
    await expect(verifyLoreSubmissionTokenOwnership({
      tokenId: 'nope',
      walletAddress: '0xabcdef0000000000000000000000000000000005',
      supabaseClient: mockOwnershipClient(null),
    })).resolves.toMatchObject({ owns: false, reason: 'invalid_token_id' });

    await expect(verifyLoreSubmissionTokenOwnership({
      tokenId: '5',
      walletAddress: 'not-a-wallet',
      supabaseClient: mockOwnershipClient(null),
    })).resolves.toMatchObject({ owns: false, reason: 'invalid_address' });
  });

  it('throws explicit database errors for API layers to map to 500s', async () => {
    await expect(verifyLoreSubmissionTokenOwnership({
      tokenId: '6',
      walletAddress: '0xabcdef0000000000000000000000000000000006',
      supabaseClient: mockOwnershipClient(null, { message: 'db down' }),
    })).rejects.toThrow('Failed to verify token ownership: db down');
  });
});
