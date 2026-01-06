/**
 * Pagination Utilities for Etherscan API
 * Implements binary block range subdivision to capture all events
 * when Etherscan returns max results (1000)
 * Feature: 021-indexer-fixes
 */

export const ETHERSCAN_MAX_RESULTS = 1000

export interface EtherscanLogResult {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  timeStamp: string
  gasPrice: string
  gasUsed: string
  logIndex: string
  transactionHash: string
  transactionIndex: string
}

export interface FetchLogsParams {
  address: string
  topic0: string
  fromBlock: bigint
  toBlock: bigint
}

export interface SubdivisionStats {
  /** Total logs fetched */
  totalLogs: number
  /** Number of API calls made */
  apiCalls: number
  /** Number of times block range was subdivided */
  subdivisions: number
  /** Warning if single block had too many events */
  singleBlockOverflow: boolean
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [pagination] ${message}`)
}

/**
 * Fetch logs with automatic block range subdivision when Etherscan returns max results.
 *
 * When Etherscan returns 1000 results (max), this function checks if they span
 * multiple blocks. If so, it subdivides the range and recursively fetches both halves.
 * This ensures no events are skipped due to pagination limits.
 *
 * @param fetchFn - Function to call Etherscan API
 * @param params - Address, topic, and block range
 * @param onProgress - Optional callback for progress updates
 * @returns All logs in the range plus stats
 */
export async function fetchLogsWithSubdivision(
  fetchFn: (params: FetchLogsParams) => Promise<EtherscanLogResult[]>,
  params: FetchLogsParams,
  onProgress?: (msg: string) => void
): Promise<{ logs: EtherscanLogResult[]; stats: SubdivisionStats }> {
  const stats: SubdivisionStats = {
    totalLogs: 0,
    apiCalls: 0,
    subdivisions: 0,
    singleBlockOverflow: false,
  }

  const allLogs = await fetchRecursive(fetchFn, params, stats, onProgress)

  return { logs: allLogs, stats }
}

async function fetchRecursive(
  fetchFn: (params: FetchLogsParams) => Promise<EtherscanLogResult[]>,
  params: FetchLogsParams,
  stats: SubdivisionStats,
  onProgress?: (msg: string) => void
): Promise<EtherscanLogResult[]> {
  const { fromBlock, toBlock } = params

  // Fetch logs for current range
  stats.apiCalls++
  const logs = await fetchFn(params)

  // If we got fewer than max results, we have all events for this range
  if (logs.length < ETHERSCAN_MAX_RESULTS) {
    stats.totalLogs += logs.length
    return logs
  }

  // We got max results - check if we need to subdivide
  const firstBlock = BigInt(logs[0].blockNumber)
  const lastBlock = BigInt(logs[logs.length - 1].blockNumber)

  // If all events are in a single block, we can't subdivide further
  if (firstBlock === lastBlock) {
    // This is extremely rare - a single block with >1000 events for one contract
    log(`WARNING: Single block ${firstBlock} has ${logs.length}+ events - some may be missed`)
    stats.singleBlockOverflow = true
    stats.totalLogs += logs.length
    return logs
  }

  // Subdivide the block range
  stats.subdivisions++
  const midBlock = fromBlock + (toBlock - fromBlock) / 2n

  if (onProgress) {
    onProgress(`Block range subdivision: [${fromBlock}-${toBlock}] → [${fromBlock}-${midBlock}] + [${midBlock + 1n}-${toBlock}]`)
  } else {
    log(`Block range subdivision: [${fromBlock}-${toBlock}] → [${fromBlock}-${midBlock}] + [${midBlock + 1n}-${toBlock}]`)
  }

  // Recursively fetch both halves
  const [leftLogs, rightLogs] = await Promise.all([
    fetchRecursive(
      fetchFn,
      { ...params, fromBlock, toBlock: midBlock },
      stats,
      onProgress
    ),
    fetchRecursive(
      fetchFn,
      { ...params, fromBlock: midBlock + 1n, toBlock },
      stats,
      onProgress
    ),
  ])

  return [...leftLogs, ...rightLogs]
}

/**
 * Simple cursor-based pagination (original behavior).
 * Moves cursor to lastBlock + 1 when max results are returned.
 * May skip events when max results are from a single block.
 *
 * @deprecated Use fetchLogsWithSubdivision for complete coverage
 */
export async function fetchLogsWithCursor(
  fetchFn: (params: FetchLogsParams) => Promise<EtherscanLogResult[]>,
  params: FetchLogsParams,
  onProgress?: (msg: string) => void
): Promise<EtherscanLogResult[]> {
  const allLogs: EtherscanLogResult[] = []
  let cursor = params.fromBlock

  while (cursor <= params.toBlock) {
    const logs = await fetchFn({
      ...params,
      fromBlock: cursor,
    })

    allLogs.push(...logs)

    if (onProgress) {
      onProgress(`Fetched ${logs.length} events (total: ${allLogs.length})`)
    }

    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
    } else {
      break
    }
  }

  return allLogs
}
