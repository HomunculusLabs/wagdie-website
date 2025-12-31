// Infection Indexer - Entry Point
// Uses Etherscan API for fast backfill, WebSocket for live events

import { createPublicClient, webSocket, type Log } from 'viem'
import { loadState, saveState, type IndexerState } from './block-tracker'
import {
  handleInfectionSpreadLogs,
  handleMushroomBurnLogs,
} from './infection-event-handler'

// Contract addresses on mainnet
const SPREAD_CONTRACT = '0xaCA80514986768F88F7d8E644546AB85383ddE7e' as const
const MUSHROOM_CONTRACT = '0x171a8518A1B75F9E26ea952728d4850BEf9B87d2' as const
const MUSHROOM_TOKEN_ID = 1n

// Event topic hashes
const INFECTION_SPREAD_TOPIC = '0xd7137f8a6563ec0e9c51c992d6758e22562332d1edb4367653058bf857658479'
const TRANSFER_SINGLE_TOPIC = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
const TRANSFER_BATCH_TOPIC = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'

const DEFAULT_STATE_FILE = 'scripts/indexer/infection-state.json'
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
let stopWatchingSpread: (() => void) | null = null
let stopWatchingMushroom: (() => void) | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let shuttingDown = false
let liveQueue = Promise.resolve()

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [infection-indexer] ${message}`)
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
    contract: SPREAD_CONTRACT,
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

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Etherscan API error: ${response.status}`)
  }

  const data: EtherscanResponse = await response.json()

  if (data.status !== '1') {
    // "No records found" is not an error
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

async function backfillWithEtherscan(params: {
  fromBlock: bigint
  toBlock: bigint
  stateFile: string
  chainId: number
}): Promise<void> {
  log(`Backfilling via Etherscan API from block ${params.fromBlock} to ${params.toBlock}`)

  // Fetch InfectionSpread events
  log('Fetching InfectionSpread events...')
  let infectionLogs: EtherscanLogResult[] = []
  let cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const logs = await fetchEtherscanLogs({
      address: SPREAD_CONTRACT,
      topic0: INFECTION_SPREAD_TOPIC,
      fromBlock: cursor,
      toBlock: params.toBlock,
    })

    infectionLogs = infectionLogs.concat(logs)
    log(`Fetched ${logs.length} InfectionSpread events (total: ${infectionLogs.length})`)

    // If we got max results, paginate from last block + 1
    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
      await delay(ETHERSCAN_RATE_LIMIT_MS)
    } else {
      break
    }
  }

  // Process infection events
  if (infectionLogs.length > 0) {
    const viemLogs = infectionLogs.map(etherscanLogToViemLog)
    const result = await handleInfectionSpreadLogs(viemLogs)
    log(`Processed ${result.processed} infection events`)
  }

  await delay(ETHERSCAN_RATE_LIMIT_MS)

  // Fetch TransferSingle burn events from Mushroom contract
  log('Fetching mushroom TransferSingle events...')
  let mushroomSingleLogs: EtherscanLogResult[] = []
  cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const logs = await fetchEtherscanLogs({
      address: MUSHROOM_CONTRACT,
      topic0: TRANSFER_SINGLE_TOPIC,
      fromBlock: cursor,
      toBlock: params.toBlock,
    })

    mushroomSingleLogs = mushroomSingleLogs.concat(logs)
    log(`Fetched ${logs.length} TransferSingle events (total: ${mushroomSingleLogs.length})`)

    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
      await delay(ETHERSCAN_RATE_LIMIT_MS)
    } else {
      break
    }
  }

  await delay(ETHERSCAN_RATE_LIMIT_MS)

  // Fetch TransferBatch burn events from Mushroom contract
  log('Fetching mushroom TransferBatch events...')
  let mushroomBatchLogs: EtherscanLogResult[] = []
  cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const logs = await fetchEtherscanLogs({
      address: MUSHROOM_CONTRACT,
      topic0: TRANSFER_BATCH_TOPIC,
      fromBlock: cursor,
      toBlock: params.toBlock,
    })

    mushroomBatchLogs = mushroomBatchLogs.concat(logs)
    log(`Fetched ${logs.length} TransferBatch events (total: ${mushroomBatchLogs.length})`)

    if (logs.length >= ETHERSCAN_MAX_RESULTS) {
      const lastBlock = BigInt(logs[logs.length - 1].blockNumber)
      cursor = lastBlock + 1n
      await delay(ETHERSCAN_RATE_LIMIT_MS)
    } else {
      break
    }
  }

  // Process mushroom burn events
  const allMushroomLogs = [...mushroomSingleLogs, ...mushroomBatchLogs]
  if (allMushroomLogs.length > 0) {
    const viemLogs = allMushroomLogs.map(etherscanLogToViemLog)
    const result = await handleMushroomBurnLogs(viemLogs, MUSHROOM_TOKEN_ID)
    log(`Processed ${result.processed} cure burn events`)
  }

  await persistState(params.stateFile, params.chainId, params.toBlock)
  log(`Backfill complete up to block ${params.toBlock}`)
}

// ABI items for live watching
const infectionSpreadEventAbi = {
  type: 'event',
  name: 'InfectionSpread',
  inputs: [
    { indexed: true, name: 'sender', type: 'address' },
    { indexed: true, name: 'infectedToken', type: 'uint256' },
    { indexed: false, name: 'time', type: 'uint256' },
  ],
  anonymous: false,
} as const

const transferSingleEventAbi = {
  type: 'event',
  name: 'TransferSingle',
  inputs: [
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'id', type: 'uint256' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
  anonymous: false,
} as const

const transferBatchEventAbi = {
  type: 'event',
  name: 'TransferBatch',
  inputs: [
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'ids', type: 'uint256[]' },
    { indexed: false, name: 'values', type: 'uint256[]' },
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

  if (stopWatchingSpread) {
    stopWatchingSpread()
    stopWatchingSpread = null
  }
  if (stopWatchingMushroom) {
    stopWatchingMushroom()
    stopWatchingMushroom = null
  }

  const restart = () => startLiveWatch(params)

  // Watch Spread contract for InfectionSpread events
  try {
    stopWatchingSpread = params.client.watchContractEvent({
      address: SPREAD_CONTRACT,
      abi: [infectionSpreadEventAbi],
      eventName: 'InfectionSpread',
      onLogs: (logs) => {
        liveQueue = liveQueue
          .then(async () => {
            if (shuttingDown) return
            const { highestBlock, processed } = await handleInfectionSpreadLogs(logs)
            if (processed > 0) {
              log(`Processed ${processed} live infections`)
            }
            if (highestBlock !== null) {
              await persistState(params.stateFile, params.chainId, highestBlock)
            }
            reconnectAttempts = 0
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error)
            log(`Live infection handling error: ${message}`)
          })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Spread watch error: ${message}`)
        scheduleReconnect(restart, message)
      },
    })

    log('Live InfectionSpread watch started')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Failed to start Spread watch: ${message}`)
    scheduleReconnect(restart, message)
  }

  // Watch Mushroom contract for burn events
  try {
    stopWatchingMushroom = params.client.watchContractEvent({
      address: MUSHROOM_CONTRACT,
      abi: [transferSingleEventAbi, transferBatchEventAbi],
      onLogs: (logs) => {
        liveQueue = liveQueue
          .then(async () => {
            if (shuttingDown) return
            const { highestBlock, processed } = await handleMushroomBurnLogs(
              logs,
              MUSHROOM_TOKEN_ID
            )
            if (processed > 0) {
              log(`Processed ${processed} live cure burns`)
            }
            if (highestBlock !== null) {
              await persistState(params.stateFile, params.chainId, highestBlock)
            }
            reconnectAttempts = 0
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error)
            log(`Live burn handling error: ${message}`)
          })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Mushroom watch error: ${message}`)
      },
    })

    log('Live Mushroom burn watch started')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Failed to start Mushroom watch: ${message}`)
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

  if (stopWatchingSpread) {
    stopWatchingSpread()
    stopWatchingSpread = null
  }
  if (stopWatchingMushroom) {
    stopWatchingMushroom()
    stopWatchingMushroom = null
  }

  if (lastIndexedBlock !== null) {
    await saveState(stateFile, buildState(chainId, lastIndexedBlock))
  }

  process.exit(0)
}

async function main(): Promise<void> {
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
    loadedState.contract.toLowerCase() === SPREAD_CONTRACT.toLowerCase() &&
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

  log(`Spread contract: ${SPREAD_CONTRACT}`)
  log(`Mushroom contract: ${MUSHROOM_CONTRACT}`)

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

  log('Infection indexer running')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  log(`Fatal error: ${message}`)
  process.exit(1)
})
