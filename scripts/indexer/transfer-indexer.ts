// Transfer Indexer - Entry Point (Standalone)
// Uses Etherscan API for fast backfill, WebSocket for live events
import { createPublicClient, webSocket, type Log } from 'viem'
import { loadState, saveState, type IndexerState } from './block-tracker'
import { handleTransferLogs } from './event-handler'
import {
  rateLimitedFetch,
  isEtherscanRateLimitResponse,
  getStartupDelay,
} from './etherscan-rate-limiter'

const INDEXER_NAME = 'transfer-indexer'

// WAGDIE contract address on mainnet
const WAGDIE_CONTRACT = '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a' as const

// ERC721 Transfer event topic: keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const DEFAULT_STATE_FILE = 'scripts/indexer/state.json'
const BASE_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000

// Etherscan API V2
const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const ETHERSCAN_MAX_RESULTS = 1000
const ETHERSCAN_CHAIN_ID = '1'
const ETHERSCAN_RATE_LIMIT_MS = 250

const transferEventAbi = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
  anonymous: false,
} as const

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
let stopWatching: (() => void) | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let shuttingDown = false
let liveQueue = Promise.resolve()

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`)
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

function isSameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

function buildState(chainId: number, contract: string, block: bigint): IndexerState {
  return {
    chainId,
    contract,
    lastIndexedBlock: block.toString(),
  }
}

async function persistState(
  stateFile: string,
  chainId: number,
  contract: string,
  block: bigint
): Promise<void> {
  lastIndexedBlock = block
  await saveState(stateFile, buildState(chainId, contract, block))
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
  contract: `0x${string}`
  fromBlock: bigint
  toBlock: bigint
  stateFile: string
  chainId: number
}): Promise<void> {
  log(`Backfilling via Etherscan API from block ${params.fromBlock} to ${params.toBlock}`)

  let cursor = params.fromBlock
  let allLogs: EtherscanLogResult[] = []

  while (cursor <= params.toBlock && !shuttingDown) {
    const logs = await fetchEtherscanLogs({
      address: params.contract,
      topic0: TRANSFER_TOPIC,
      fromBlock: cursor,
      toBlock: params.toBlock,
    })

    allLogs = allLogs.concat(logs)
    log(`Fetched ${logs.length} Transfer events (total: ${allLogs.length})`)

    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
      // Rate limiter handles delays between calls
    } else {
      break
    }
  }

  if (allLogs.length > 0) {
    const viemLogs = allLogs.map(etherscanLogToViemLog)
    log(`Processing ${viemLogs.length} transfer events...`)
    const result = await handleTransferLogs(viemLogs, { source: 'backfill', chainId: params.chainId })
    log(`Processed ${result.processed} transfer events`)
  } else {
    log('No transfer events found')
  }

  await persistState(params.stateFile, params.chainId, params.contract, params.toBlock)
  log(`Backfill complete up to block ${params.toBlock}`)
}

function scheduleReconnect(start: () => void, reason: string): void {
  if (shuttingDown) return
  if (reconnectTimer) return

  const delay = backoffDelay(reconnectAttempts)
  log(`Reconnecting in ${delay}ms (${reason})`)

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    reconnectAttempts += 1
    start()
  }, delay)
}

function startLiveWatch(params: {
  client: PublicClient
  contract: `0x${string}`
  stateFile: string
  chainId: number
}): void {
  if (shuttingDown) return

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (stopWatching) {
    stopWatching()
    stopWatching = null
  }

  const restart = () => startLiveWatch(params)

  try {
    stopWatching = params.client.watchContractEvent({
      address: params.contract,
      abi: [transferEventAbi],
      eventName: 'Transfer',
      onLogs: (logs) => {
        liveQueue = liveQueue
          .then(async () => {
            if (shuttingDown) return
            const { highestBlock, processed } = await handleTransferLogs(logs, { source: 'live', chainId: params.chainId })
            if (processed > 0) {
              log(`Processed ${processed} live transfers`)
            }
            if (highestBlock !== null) {
              await persistState(params.stateFile, params.chainId, params.contract, highestBlock)
            }
            reconnectAttempts = 0
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error)
            log(`Live log handling error: ${message}`)
          })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Live watch error: ${message}`)
        scheduleReconnect(restart, message)
      },
    })

    log('Live Transfer watch started')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Failed to start live watch: ${message}`)
    scheduleReconnect(restart, message)
  }
}

async function shutdown(
  signal: string,
  stateFile: string,
  chainId: number,
  contract: string
): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  log(`Received ${signal}. Shutting down.`)

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (stopWatching) {
    stopWatching()
    stopWatching = null
  }

  if (lastIndexedBlock !== null) {
    await saveState(stateFile, buildState(chainId, contract, lastIndexedBlock))
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
  const startBlock = parseEnvBigInt('START_BLOCK', 15422334n)

  const contractAddress = WAGDIE_CONTRACT
  const wsClient = createPublicClient({ transport: webSocket(wsUrl) })

  process.on('SIGINT', () => {
    void shutdown('SIGINT', stateFile, chainId, contractAddress)
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM', stateFile, chainId, contractAddress)
  })

  const loadedState = await loadState(stateFile)
  if (loadedState && isSameAddress(loadedState.contract, contractAddress) && loadedState.chainId === chainId) {
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

  if (fromBlock <= latestBlock) {
    await backfillWithEtherscan({
      contract: contractAddress,
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
    contract: contractAddress,
    stateFile,
    chainId,
  })

  log('Transfer indexer running')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  log(`Fatal error: ${message}`)
  process.exit(1)
})
