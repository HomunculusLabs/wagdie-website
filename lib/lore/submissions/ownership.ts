import { CHARACTERS_TABLE } from '@/lib/db/tables';

export type TokenOwnershipReason =
  | 'owned'
  | 'staked'
  | 'not_owner'
  | 'not_found'
  | 'invalid_token_id'
  | 'invalid_address'
  | 'client_unavailable';

export interface TokenOwnershipCheckResult {
  tokenId: number | null;
  walletAddress: string | null;
  owns: boolean;
  reason: TokenOwnershipReason;
  ownerAddress: string | null;
  stakerAddress: string | null;
}

type CharacterOwnershipRow = {
  token_id: number;
  owner_address: string | null;
  staker_address?: string | null;
};

type SupabaseMaybeSingleResult = Promise<{
  data: unknown;
  error: { message: string } | null;
}>;

export type TokenOwnershipSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: number) => {
        maybeSingle: () => SupabaseMaybeSingleResult;
      };
    };
  };
};

export interface VerifyTokenOwnershipOptions {
  tokenId: string | number;
  walletAddress: string;
  supabaseClient?: TokenOwnershipSupabaseClient | null;
  minTokenId?: number;
  maxTokenId?: number;
}

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function normalizeLoreSubmissionWalletAddress(address: string | null | undefined): string | null {
  const trimmed = address?.trim();
  if (!trimmed || !ADDRESS_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export function parseLoreSubmissionTokenId(
  tokenId: string | number,
  options: { minTokenId?: number; maxTokenId?: number } = {}
): number | null {
  const { minTokenId = 1, maxTokenId = 6666 } = options;
  if (typeof tokenId === 'string' && !/^[1-9]\d*$/.test(tokenId.trim())) {
    return null;
  }

  const parsed = typeof tokenId === 'number' ? tokenId : Number(tokenId.trim());

  if (!Number.isInteger(parsed) || parsed < minTokenId || parsed > maxTokenId) {
    return null;
  }

  return parsed;
}

function resultForInvalid(reason: 'invalid_token_id' | 'invalid_address'): TokenOwnershipCheckResult {
  return {
    tokenId: null,
    walletAddress: null,
    owns: false,
    reason,
    ownerAddress: null,
    stakerAddress: null,
  };
}

function addressesMatch(left: string | null | undefined, right: string): boolean {
  return left?.toLowerCase() === right;
}

async function getDefaultOwnershipClient(): Promise<TokenOwnershipSupabaseClient | null> {
  const { getSupabaseAdmin } = await import('@/lib/supabase');
  return getSupabaseAdmin() as TokenOwnershipSupabaseClient | null;
}

export async function verifyLoreSubmissionTokenOwnership(
  options: VerifyTokenOwnershipOptions
): Promise<TokenOwnershipCheckResult> {
  const tokenId = parseLoreSubmissionTokenId(options.tokenId, {
    minTokenId: options.minTokenId,
    maxTokenId: options.maxTokenId,
  });
  if (tokenId === null) return resultForInvalid('invalid_token_id');

  const walletAddress = normalizeLoreSubmissionWalletAddress(options.walletAddress);
  if (walletAddress === null) return resultForInvalid('invalid_address');

  const supabase = options.supabaseClient ?? await getDefaultOwnershipClient();
  if (!supabase) {
    return {
      tokenId,
      walletAddress,
      owns: false,
      reason: 'client_unavailable',
      ownerAddress: null,
      stakerAddress: null,
    };
  }

  const { data, error } = await supabase
    .from(CHARACTERS_TABLE)
    .select('token_id, owner_address, staker_address')
    .eq('token_id', tokenId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify token ownership: ${error.message}`);
  }

  if (!data) {
    return {
      tokenId,
      walletAddress,
      owns: false,
      reason: 'not_found',
      ownerAddress: null,
      stakerAddress: null,
    };
  }

  const row = data as CharacterOwnershipRow;
  const ownerAddress = row.owner_address?.toLowerCase() ?? null;
  const stakerAddress = row.staker_address?.toLowerCase() ?? null;

  if (addressesMatch(ownerAddress, walletAddress)) {
    return {
      tokenId,
      walletAddress,
      owns: true,
      reason: 'owned',
      ownerAddress,
      stakerAddress,
    };
  }

  if (addressesMatch(stakerAddress, walletAddress)) {
    return {
      tokenId,
      walletAddress,
      owns: true,
      reason: 'staked',
      ownerAddress,
      stakerAddress,
    };
  }

  return {
    tokenId,
    walletAddress,
    owns: false,
    reason: 'not_owner',
    ownerAddress,
    stakerAddress,
  };
}
