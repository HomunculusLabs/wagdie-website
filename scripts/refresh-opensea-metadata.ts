import { config } from 'dotenv';

config({ path: '.env.local' });
config();

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { mainnetAddresses } from '../lib/contracts/addresses';

type Args = Record<string, string | boolean>;

type Manifest = {
  items?: Array<{
    token_id?: unknown;
  }>;
};

type RefreshResult = {
  tokenId: number;
  ok: boolean;
  status?: number;
  detail: string;
};

const API_BASE_URL = 'https://api.opensea.io/api/v2';
const MANIFEST_PATH = path.join(process.cwd(), 'public/metadata/characters/manifest.json');
const DEFAULT_DELAY_MS = 1000;
const DEFAULT_CONCURRENCY = 1;
const LARGE_BATCH_THRESHOLD = 100;

function usage(): string {
  return `Refresh WAGDIE NFT metadata on OpenSea\n\nUsage:\n  bun run opensea:refresh -- --token 1\n  bun run opensea:refresh -- --tokens 1,2,3\n  bun run opensea:refresh -- --range 1-100 --yes\n  bun run opensea:refresh -- --all --yes\n  bun run opensea:refresh -- --range 1-10 --dry-run\n\nRequired for non-dry runs:\n  OPENSEA_API_KEY                OpenSea API key sent as x-api-key\n\nOptions:\n  --token <id>                   Refresh one token\n  --tokens <ids>                 Comma-separated token ids\n  --range <from-to>              Inclusive token id range, e.g. 1-100\n  --from <id> --to <id>          Inclusive token id range alternative\n  --all                          Refresh every token id from public metadata manifest\n  --yes                          Required for batches larger than ${LARGE_BATCH_THRESHOLD} tokens or --all\n  --dry-run                      Print requests without calling OpenSea\n  --chain <chain>                OpenSea chain slug. Default: ethereum\n  --contract <address>           NFT contract address. Default: WAGDIE mainnet contract\n  --delay-ms <ms>                Delay after each request. Default: ${DEFAULT_DELAY_MS}\n  --concurrency <n>              Parallel requests. Default: ${DEFAULT_CONCURRENCY}\n  --ignore-cached-item-urls      Ask OpenSea to bypass cached item URLs. Default: true\n  --no-ignore-cached-item-urls   Do not send ignoreCachedItemUrls=true\n  --help                         Show this message\n`;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    const equalsIndex = arg.indexOf('=');
    if (equalsIndex !== -1) {
      args[arg.slice(2, equalsIndex)] = arg.slice(equalsIndex + 1);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function getStringArg(args: Args, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumberArg(args: Args, key: string, fallback: number): number {
  const value = getStringArg(args, key);
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`--${key} must be a non-negative integer`);
  }

  return parsed;
}

function parseTokenId(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }

  return parsed;
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function range(from: number, to: number): number[] {
  if (to < from) {
    throw new Error(`Invalid range: ${from}-${to}`);
  }

  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

async function tokenIdsFromManifest(): Promise<number[]> {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw) as Manifest;
  const tokenIds = (manifest.items || [])
    .map((item) => item.token_id)
    .filter((tokenId): tokenId is number => Number.isInteger(tokenId) && Number(tokenId) > 0);

  if (tokenIds.length === 0) {
    throw new Error(`No token ids found in ${MANIFEST_PATH}`);
  }

  return uniqueSorted(tokenIds);
}

async function resolveTokenIds(args: Args): Promise<number[]> {
  const tokenIds: number[] = [];

  const token = getStringArg(args, 'token');
  if (token) {
    tokenIds.push(parseTokenId(token, '--token'));
  }

  const tokens = getStringArg(args, 'tokens');
  if (tokens) {
    for (const value of tokens.split(',')) {
      const trimmed = value.trim();
      if (trimmed) tokenIds.push(parseTokenId(trimmed, '--tokens value'));
    }
  }

  const rangeArg = getStringArg(args, 'range');
  if (rangeArg) {
    const match = /^(\d+)-(\d+)$/.exec(rangeArg.trim());
    if (!match) {
      throw new Error('--range must look like 1-100');
    }

    tokenIds.push(...range(parseTokenId(match[1], '--range start'), parseTokenId(match[2], '--range end')));
  }

  const from = getStringArg(args, 'from');
  const to = getStringArg(args, 'to');
  if (from || to) {
    if (!from || !to) {
      throw new Error('Use --from and --to together');
    }

    tokenIds.push(...range(parseTokenId(from, '--from'), parseTokenId(to, '--to')));
  }

  if (args.all === true) {
    tokenIds.push(...await tokenIdsFromManifest());
  }

  const resolved = uniqueSorted(tokenIds);
  if (resolved.length === 0) {
    throw new Error('No token ids selected. Use --token, --tokens, --range, --from/--to, or --all.');
  }

  return resolved;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function responseDetail(text: string): string {
  if (!text.trim()) return 'No response body';

  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text.trim();
  }
}

async function refreshToken(options: {
  tokenId: number;
  apiKey: string;
  chain: string;
  contract: string;
  ignoreCachedItemUrls: boolean;
  dryRun: boolean;
}): Promise<RefreshResult> {
  const { tokenId, apiKey, chain, contract, ignoreCachedItemUrls, dryRun } = options;
  const url = new URL(`${API_BASE_URL}/chain/${encodeURIComponent(chain)}/contract/${encodeURIComponent(contract)}/nfts/${tokenId}/refresh`);

  if (ignoreCachedItemUrls) {
    url.searchParams.set('ignoreCachedItemUrls', 'true');
  }

  if (dryRun) {
    return {
      tokenId,
      ok: true,
      detail: `DRY RUN ${url.toString()}`,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey,
    },
  });
  const text = await response.text();
  const detail = responseDetail(text);

  return {
    tokenId,
    ok: response.ok || response.status === 409,
    status: response.status,
    detail: response.status === 409 ? `Refresh already queued or temporarily conflicted: ${detail}` : detail,
  };
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, runWorker));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === true) {
    console.log(usage());
    return;
  }

  const tokenIds = await resolveTokenIds(args);
  const dryRun = args['dry-run'] === true;
  const apiKey = process.env.OPENSEA_API_KEY || '';

  if (!dryRun && !apiKey.trim()) {
    throw new Error('Missing OPENSEA_API_KEY. Use --dry-run to preview without an API key.');
  }

  if ((args.all === true || tokenIds.length > LARGE_BATCH_THRESHOLD) && args.yes !== true) {
    throw new Error(`Refusing to queue ${tokenIds.length} refreshes without --yes.`);
  }

  const chain = getStringArg(args, 'chain') || process.env.OPENSEA_CHAIN || 'ethereum';
  const contract = getStringArg(args, 'contract') || process.env.OPENSEA_CONTRACT_ADDRESS || mainnetAddresses.wagdie;
  const delayMs = getNumberArg(args, 'delay-ms', DEFAULT_DELAY_MS);
  const concurrency = Math.max(1, getNumberArg(args, 'concurrency', DEFAULT_CONCURRENCY));
  const ignoreCachedItemUrls = args['no-ignore-cached-item-urls'] === true ? false : true;
  const results: RefreshResult[] = [];

  console.log(`Queueing OpenSea metadata refresh for ${tokenIds.length} token(s).`);
  console.log(`Chain: ${chain}`);
  console.log(`Contract: ${contract}`);
  console.log(`ignoreCachedItemUrls: ${ignoreCachedItemUrls}`);
  if (dryRun) console.log('Dry run: no requests will be sent.');

  await runPool(tokenIds, concurrency, async (tokenId) => {
    try {
      const result = await refreshToken({
        tokenId,
        apiKey,
        chain,
        contract,
        ignoreCachedItemUrls,
        dryRun,
      });
      results.push(result);

      const marker = result.status === 409 ? '⚠️' : result.ok ? '✅' : '❌';
      const status = result.status ? ` ${result.status}` : '';
      console.log(`${marker} #${tokenId}${status} ${result.detail}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      results.push({ tokenId, ok: false, detail });
      console.error(`❌ #${tokenId} ${detail}`);
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  });

  const successes = results.filter((result) => result.ok).length;
  const failures = results.length - successes;
  console.log(`\nDone. Successful: ${successes}. Failed: ${failures}.`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error('\n' + usage());
  process.exit(1);
});
