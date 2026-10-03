import { BaseError, ContractFunctionRevertedError, createPublicClient, fallback, http, zeroAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { getContractAddresses } from '@/lib/contracts/addresses';
import { wagdieABI } from '@/lib/contracts/abis/wagdie';
import { wagdieWorldABI } from '@/lib/contracts/abis/wagdie-world';

export type TokenOwnershipReason =
  | 'owned' | 'staked' | 'not_owner' | 'not_found'
  | 'invalid_token_id' | 'invalid_address' | 'rpc_unavailable';

export interface TokenOwnershipCheckResult {
  tokenId: number | null;
  walletAddress: string | null;
  owns: boolean;
  reason: TokenOwnershipReason;
  ownerAddress: string | null;
  stakerAddress: string | null;
}

export interface VerifyTokenOwnershipOptions {
  tokenId: string | number;
  walletAddress: string;
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

function getLiveOwnershipClient() {
  // Only the server may resolve private RPC configuration. No DB or ownership cache.
  if (typeof window !== 'undefined') throw new Error('Server-only ownership verification');
  const alchemyKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const rpcUrl = process.env.HTTP_RPC_URL || process.env.RPC_URL || process.env.ETH_RPC_URL ||
    process.env.MAINNET_RPC_URL || process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
    process.env.ALCHEMY_RPC_URL || process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    (alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://ethereum.publicnode.com');
  return createPublicClient({
    chain: mainnet,
    cacheTime: 0,
    transport: fallback([...new Set([rpcUrl, 'https://ethereum.publicnode.com', 'https://rpc.flashbots.net'])]
      .map(url => http(url, { timeout: 5000, retryCount: 0 })), { retryCount: 0 }),
  });
}

function isNonexistentToken(error: unknown): boolean {
  if (!(error instanceof BaseError)) return false;
  const revert = error.walk(cause => cause instanceof ContractFunctionRevertedError);
  // Do not interpret a timeout, generic revert or undecodable response as a missing NFT.
  return revert instanceof ContractFunctionRevertedError &&
    (revert.reason === 'ERC721: owner query for nonexistent token' ||
      revert.reason === 'ERC721: invalid token ID' ||
      revert.data?.errorName === 'ERC721NonexistentToken');
}

export async function verifyLoreSubmissionTokenOwnership(
  options: VerifyTokenOwnershipOptions
): Promise<TokenOwnershipCheckResult> {
  const tokenId = parseLoreSubmissionTokenId(options.tokenId, options);
  if (tokenId === null) return resultForInvalid('invalid_token_id');
  const walletAddress = normalizeLoreSubmissionWalletAddress(options.walletAddress);
  if (walletAddress === null) return resultForInvalid('invalid_address');

  let ownerAddress: string | null = null;
  let stakerAddress: string | null = null;
  const result = (reason: TokenOwnershipReason): TokenOwnershipCheckResult => ({
    tokenId, walletAddress, owns: reason === 'owned' || reason === 'staked', reason,
    ownerAddress, stakerAddress,
  });

  try {
    const client = getLiveOwnershipClient();
    // Lore's WAGDIE collection is on Ethereum mainnet, never a wallet-selected chain.
    if (await client.getChainId() !== mainnet.id) return result('rpc_unavailable');
    const addresses = getContractAddresses(mainnet.id);
    // Pin both reads to one fresh block to avoid combining pre/post-unstake state.
    const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
    let owner: string;
    try {
      owner = await client.readContract({
        address: addresses.wagdie, abi: wagdieABI, functionName: 'ownerOf',
        args: [BigInt(tokenId)], blockNumber,
      });
    } catch (error) {
      return result(isNonexistentToken(error) ? 'not_found' : 'rpc_unavailable');
    }
    ownerAddress = normalizeLoreSubmissionWalletAddress(owner);
    if (!ownerAddress || ownerAddress === zeroAddress) return result('rpc_unavailable');

    if (ownerAddress !== addresses.wagdieWorld.toLowerCase()) {
      return result(ownerAddress === walletAddress ? 'owned' : 'not_owner');
    }

    // Custody alone is not ownership: World records the beneficiary in WagdieInfo.owner,
    // NOT the location owner, an operator approval, or the cached staker_address column.
    const info = await client.readContract({
      address: addresses.wagdieWorld, abi: wagdieWorldABI, functionName: 'wagdieIdToInfo',
      args: [tokenId], blockNumber,
    });
    stakerAddress = normalizeLoreSubmissionWalletAddress(info.owner);
    if (!stakerAddress || typeof info.locationIdCur !== 'bigint') return result('rpc_unavailable');
    return result(info.locationIdCur > 0n && stakerAddress !== zeroAddress &&
      stakerAddress === walletAddress && walletAddress !== ownerAddress ? 'staked' : 'not_owner');
  } catch {
    // Never leak RPC URLs/API keys through error bodies or log raw provider errors.
    return result('rpc_unavailable');
  }
}
