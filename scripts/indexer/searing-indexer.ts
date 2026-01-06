// Searing Indexer - Entry Point
// Uses Etherscan API for fast backfill, WebSocket for live events

import { createPublicClient, webSocket, type Log } from 'viem'
import { loadState, saveState, type IndexerState } from './block-tracker'
import { handleSearConcordsLogs } from './searing-event-handler'
import {
  rateLimitedFetch,
  isEtherscanRateLimitResponse,
  getStartupDelay,
} from './etherscan-rate-limiter'

const INDEXER_NAME = 'searing-indexer'

// Contract address on mainnet
const SEARING_CONTRACT = '0x5156A7F668E59119db23a264502F40407CDa076F' as const

// Event topic hash for ConcordSeared(uint16,uint16,address)
const CONCORD_SEARED_TOPIC = '0x264071db4c9b45acadae999c5940b63d7f4c982f1d0342dac85d0457f69a167f'

const DEFAULT_STATE_FILE = 'scripts/indexer/searing-state.json'
const BASE_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000
const ETHERSCAN_RATE_LIMIT_MS = 250 // 5 calls/sec on free tier

// Etherscan API V2
const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const ETHERSCAN_MAX_RESULTS = 1000
const ETHERSCAN_CHAIN_ID = '1' // Ethereum mainnet

type PublicClient = ReturnType<typeof createPublicClient>

interface EtherscanLogResult {
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

interface EtherscanResponse {
  status: string
  message: string
  result: EtherscanLogResult[] | string
}

let lastIndexedBlock: bigint | null = null
let stopWatchingSearing: (() => void) | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let shuttingDown = false
let liveQueue = Promise.resolve()

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [searing-indexer] ${message}`)
}

function parseEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseEnvBigInt(name: string, fallback: bigint): bigint {
  const raw = process.env[name]
  if (!raw) return fallback
  try {
    const value = BigInt(raw)
    return value >= 0n ? value : fallback
  } catch {
    return fallback
  }
}

function buildState(chainId: number, block: bigint): IndexerState {
  return {
    chainId,
    contract: SEARING_CONTRACT,
    lastIndexedBlock: block.toString(),
  }
}

async function persistState(
  stateFile: string,
  chainId: number,
  block: bigint
): Promise<void> {
  lastIndexedBlock = block
  await saveState(stateFile, buildState(chainId, block))
}

function backoffDelay(attempt: number): number {
  const delay = BASE_BACKOFF_MS * 2 ** attempt
  return Math.min(delay, MAX_BACKOFF_MS)
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function etherscanLogToViemLog(ethLog: EtherscanLogResult): Log {
  return {
    address: ethLog.address.toLowerCase() as `0x${string}`,
    topics: ethLog.topics as [`0x${string}`, ...`0x${string}`[]],
    data: ethLog.data as `0x${string}`,
    blockNumber: BigInt(ethLog.blockNumber),
    transactionHash: ethLog.transactionHash as `0x${string}`,
    transactionIndex: parseInt(ethLog.transactionIndex, 16),
    blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
    logIndex: parseInt(ethLog.logIndex, 16),
    removed: false,
  }
}

async function fetchEtherscanLogs(params: {
  address: string
  topic0: string
  fromBlock: bigint
  toBlock: bigint | 'latest'
}): Promise<EtherscanLogResult[]> {
  const url = new URL(ETHERSCAN_API_URL)
  url.searchParams.set('chainid', ETHERSCAN_CHAIN_ID)
  url.searchParams.set('module', 'logs')
  url.searchParams.set('action', 'getLogs')
  url.searchParams.set('address', params.address)
  url.searchParams.set('topic0', params.topic0)
  url.searchParams.set('fromBlock', params.fromBlock.toString())
  url.searchParams.set('toBlock', params.toBlock === 'latest' ? 'latest' : params.toBlock.toString())
  if (ETHERSCAN_API_KEY) {
    url.searchParams.set('apikey', ETHERSCAN_API_KEY)
  }

  const doFetch = async (): Promise<EtherscanLogResult[]> => {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`)
    }

    const data: EtherscanResponse = await response.json()

    if (isEtherscanRateLimitResponse(data)) {
      throw new Error(`Etherscan rate limit: ${data.result}`)
    }

    if (data.status !== '1') {
      if (data.message === 'No records found' || data.result === 'No records found') {
        return []
      }
      throw new Error(`Etherscan API error: ${data.message} - ${data.result}`)
    }

    if (!Array.isArray(data.result)) {
      return []
    }

    return data.result
  }

  const result = await rateLimitedFetch(INDEXER_NAME, doFetch, (error) => {
    if (error instanceof Error) {
      return error.message.includes('rate limit') ||
             error.message.includes('Max calls per sec')
    }
    return false
  })

  if (result.retryCount > 0) {
    log(`Recovered from rate limit after ${result.retryCount} retries`)
  }

  return result.data
}

async function backfillWithEtherscan(params: {
  fromBlock: bigint
  toBlock: bigint
  stateFile: string
  chainId: number
}): Promise<void> {
  log(`Backfilling via Etherscan API from block ${params.fromBlock} to ${params.toBlock}`)

  // Fetch ConcordSeared events
  log('Fetching ConcordSeared events...')
  let searingLogs: EtherscanLogResult[] = []
  let cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const logs = await fetchEtherscanLogs({
      address: SEARING_CONTRACT,
      topic0: CONCORD_SEARED_TOPIC,
      fromBlock: cursor,
      toBlock: params.toBlock,
    })

    searingLogs = searingLogs.concat(logs)
    log(`Fetched ${logs.length} ConcordSeared events (total: ${searingLogs.length})`)

    // If we got max results, paginate from last block + 1
    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
      // Rate limiter handles delays between calls
    } else {
      break
    }
  }

  // Process searing events
  if (searingLogs.length > 0) {
    const viemLogs = searingLogs.map(etherscanLogToViemLog)
    const result = await handleSearConcordsLogs(viemLogs, { source: 'backfill', chainId: params.chainId })
    log(`Processed ${result.processed} searing events`)
  }

  await persistState(params.stateFile, params.chainId, params.toBlock)
  log(`Backfill complete up to block ${params.toBlock}`)
}

// ABI for live watching
// event ConcordSeared(uint16 wagdieId, uint16 tokenId, address owner)
const concordSearedEventAbi = {
  type: 'event',
  name: 'ConcordSeared',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'tokenId', type: 'uint16' },
    { indexed: false, name: 'owner', type: 'address' },
  ],
  anonymous: false,
} as const

function scheduleReconnect(start: () => void, reason: string): void {
  if (shuttingDown) return
  if (reconnectTimer) return

  const delayMs = backoffDelay(reconnectAttempts)
  log(`Reconnecting in ${delayMs}ms (${reason})`)

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    reconnectAttempts += 1
    start()
  }, delayMs)
}

function startLiveWatch(params: {
  client: PublicClient
  stateFile: string
  chainId: number
}): void {
  if (shuttingDown) return

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (stopWatchingSearing) {
    stopWatchingSearing()
    stopWatchingSearing = null
  }

  const restart = () => startLiveWatch(params)

  // Watch Searing contract for ConcordSeared events
  try {
    stopWatchingSearing = params.client.watchContractEvent({
      address: SEARING_CONTRACT,
      abi: [concordSearedEventAbi],
      eventName: 'ConcordSeared',
      onLogs: (logs) => {
        liveQueue = liveQueue
          .then(async () => {
            if (shuttingDown) return
            const { highestBlock, processed } = await handleSearConcordsLogs(logs, { source: 'live', chainId: params.chainId })
            if (processed > 0) {
              log(`Processed ${processed} live searing events`)
            }
            if (highestBlock !== null) {
              await persistState(params.stateFile, params.chainId, highestBlock)
            }
            reconnectAttempts = 0
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error)
            log(`Live searing handling error: ${message}`)
          })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Searing watch error: ${message}`)
        scheduleReconnect(restart, message)
      },
    })

    log('Live ConcordSeared watch started')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Failed to start Searing watch: ${message}`)
    scheduleReconnect(restart, message)
  }
}

async function shutdown(
  signal: string,
  stateFile: string,
  chainId: number
): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  log(`Received ${signal}. Shutting down.`)

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (stopWatchingSearing) {
    stopWatchingSearing()
    stopWatchingSearing = null
  }

  if (lastIndexedBlock !== null) {
    await saveState(stateFile, buildState(chainId, lastIndexedBlock))
  }

  process.exit(0)
}

async function main(): Promise<void> {
  // Stagger startup to prevent all indexers hitting Etherscan at once
  const startupDelay = getStartupDelay(INDEXER_NAME)
  if (startupDelay > 0) {
    log(`Waiting ${startupDelay}ms before starting (staggered startup)`)
    await delay(startupDelay)
  }

  const wsUrl = process.env.WS_RPC_URL
  if (!wsUrl) {
    log('WS_RPC_URL is required')
    process.exit(1)
  }

  if (!ETHERSCAN_API_KEY) {
    log('Warning: ETHERSCAN_API_KEY not set, rate limits will be stricter')
  }

  const stateFile = process.env.STATE_FILE || DEFAULT_STATE_FILE
  const chainId = parseEnvNumber('CHAIN_ID', 1)
  // WAGDIE contract deployed at block 15422334
  const startBlock = parseEnvBigInt('START_BLOCK', 15422334n)

  const wsClient = createPublicClient({ transport: webSocket(wsUrl) })

  process.on('SIGINT', () => {
    void shutdown('SIGINT', stateFile, chainId)
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM', stateFile, chainId)
  })

  const loadedState = await loadState(stateFile)
  if (
    loadedState &&
    loadedState.contract.toLowerCase() === SEARING_CONTRACT.toLowerCase() &&
    loadedState.chainId === chainId
  ) {
    try {
      lastIndexedBlock = BigInt(loadedState.lastIndexedBlock)
      log(`Loaded state at block ${lastIndexedBlock}`)
    } catch {
      log('State file is invalid, starting from START_BLOCK')
      lastIndexedBlock = startBlock > 0n ? startBlock - 1n : null
    }
  } else {
    if (loadedState) {
      log('State file does not match chain or contract, starting from START_BLOCK')
    } else {
      log('No state file found, starting from START_BLOCK')
    }
    lastIndexedBlock = startBlock > 0n ? startBlock - 1n : null
  }

  const fromBlock = lastIndexedBlock === null ? startBlock : lastIndexedBlock + 1n
  const latestBlock = await wsClient.getBlockNumber()

  log(`Searing contract: ${SEARING_CONTRACT}`)

  if (fromBlock <= latestBlock) {
    await backfillWithEtherscan({
      fromBlock,
      toBlock: latestBlock,
      stateFile,
      chainId,
    })
  } else {
    log(`No backfill needed (from ${fromBlock} > latest ${latestBlock})`)
  }

  startLiveWatch({
    client: wsClient,
    stateFile,
    chainId,
  })

  log('Searing indexer running')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  log(`Fatal error: ${message}`)
  process.exit(1)
})
