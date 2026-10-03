/** @jest-environment node */
import { createPublicClient, ContractFunctionRevertedError } from 'viem';
import { mainnetAddresses } from '@/lib/contracts/addresses';
import { parseLoreSubmissionTokenId, verifyLoreSubmissionTokenOwnership } from '@/lib/lore/submissions/ownership';

jest.mock('viem', () => ({ ...jest.requireActual('viem'), createPublicClient: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: () => { throw new Error('DB must not authorize'); } }));
const wallet = '0x08DF3044b520Fd001c93e97041D3F257D8c0dB7B';
const other = '0x1111111111111111111111111111111111111111';
const zero = '0x0000000000000000000000000000000000000000';
const readContract = jest.fn();
const getChainId = jest.fn();
const getBlockNumber = jest.fn();
const verify = (walletAddress = wallet) => verifyLoreSubmissionTokenOwnership({ tokenId: 6334, walletAddress });

beforeEach(() => {
  jest.clearAllMocks();
  readContract.mockReset().mockResolvedValue(wallet);
  getChainId.mockReset().mockResolvedValue(1);
  getBlockNumber.mockReset().mockResolvedValue(123n);
  jest.mocked(createPublicClient).mockReturnValue({ readContract, getChainId, getBlockNumber } as never);
});

it('validates token and address format before network access', async () => {
  for (const id of ['0', '0001', '6667', '1.5', 'nope']) expect(parseLoreSubmissionTokenId(id)).toBeNull();
  expect(parseLoreSubmissionTokenId(6666)).toBe(6666);
  await expect(verifyLoreSubmissionTokenOwnership({ tokenId: 0, walletAddress: wallet })).resolves.toMatchObject({ reason: 'invalid_token_id', owns: false });
  await expect(verify('0x123')).resolves.toMatchObject({ reason: 'invalid_address', owns: false });
  expect(createPublicClient).not.toHaveBeenCalled();
});
it('authorizes live owner without a database row, case-insensitively', async () => {
  await expect(verify()).resolves.toMatchObject({ owns: true, reason: 'owned', ownerAddress: wallet.toLowerCase() });
  expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ address: mainnetAddresses.wagdie, functionName: 'ownerOf', args: [6334n], blockNumber: 123n }));
  expect(readContract).toHaveBeenCalledTimes(1);
});
it('rechecks every request and denies the former owner after a transfer', async () => {
  await expect(verify()).resolves.toMatchObject({ owns: true });
  readContract.mockResolvedValue(other);
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'not_owner' });
  expect(getBlockNumber).toHaveBeenCalledTimes(2);
});
it('authorizes only the live beneficiary in active World custody at the same block', async () => {
  readContract.mockResolvedValueOnce(mainnetAddresses.wagdieWorld).mockResolvedValueOnce({ locationIdCur: 8n, owner: wallet, emptySpace: 0 });
  await expect(verify()).resolves.toMatchObject({ owns: true, reason: 'staked', stakerAddress: wallet.toLowerCase() });
  expect(readContract).toHaveBeenLastCalledWith(expect.objectContaining({ address: mainnetAddresses.wagdieWorld, functionName: 'wagdieIdToInfo', args: [6334], blockNumber: 123n }));
});
it.each([[0n, wallet], [8n, zero], [8n, other]])('denies inactive, zero or different beneficiary (%s, %s)', async (locationIdCur, owner) => {
  readContract.mockResolvedValueOnce(mainnetAddresses.wagdieWorld).mockResolvedValueOnce({ locationIdCur, owner, emptySpace: 0 });
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'not_owner' });
});
it('does not grant ownership to the custody contract itself', async () => {
  readContract.mockResolvedValueOnce(mainnetAddresses.wagdieWorld).mockResolvedValueOnce({ locationIdCur: 8n, owner: wallet, emptySpace: 0 });
  await expect(verify(mainnetAddresses.wagdieWorld)).resolves.toMatchObject({ owns: false, reason: 'not_owner' });
});
it('ignores stale staking state when the NFT is no longer in World custody', async () => {
  readContract.mockResolvedValue(other);
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'not_owner' });
  expect(readContract).toHaveBeenCalledTimes(1);
});
it('recognizes the ERC721 nonexistent-token revert, not generic RPC failures', async () => {
  readContract.mockRejectedValue(new ContractFunctionRevertedError({ abi: [], functionName: 'ownerOf', message: 'ERC721: owner query for nonexistent token' }));
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'not_found' });
});
it.each(['timeout', 'execution reverted', 'ERC721: owner query for nonexistent token'])('fails closed on untyped RPC error: %s', async message => {
  readContract.mockRejectedValue(new Error(message));
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'rpc_unavailable' });
});
it('fails closed on staking RPC errors, not as not_found', async () => {
  readContract.mockResolvedValueOnce(mainnetAddresses.wagdieWorld).mockRejectedValueOnce(new ContractFunctionRevertedError({ abi: [], functionName: 'wagdieIdToInfo', message: 'ERC721: owner query for nonexistent token' }));
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'rpc_unavailable' });
});
it.each([undefined, 'garbage', zero])('fails closed on malformed or zero owner response: %s', async owner => {
  readContract.mockResolvedValue(owner);
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'rpc_unavailable' });
});
it('rejects wrong-chain RPC before contract reads', async () => {
  getChainId.mockResolvedValue(11155111);
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'rpc_unavailable' });
  expect(readContract).not.toHaveBeenCalled();
});
it('fails closed when getting the latest block fails', async () => {
  getBlockNumber.mockRejectedValue(new Error('offline'));
  await expect(verify()).resolves.toMatchObject({ owns: false, reason: 'rpc_unavailable' });
  expect(readContract).not.toHaveBeenCalled();
});
