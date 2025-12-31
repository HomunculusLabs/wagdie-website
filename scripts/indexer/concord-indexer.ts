// Concord Indexer - Entry Point
// Indexes ERC1155 transfers from TokensOfConcord contract
// Uses HTTP RPC for backfill, WebSocket for live events

import { createPublicClient, http, webSocket, type Log } from 'viem'
import { mainnet } from 'viem/chains'
import { loadState, saveState, type IndexerState } from './block-tracker'
import { handleConcordTransferLogs, CONCORD_TOPICS } from './concord-transfer-handler'

// TokensOfConcord contract address on mainnet
const CONCORD_CONTRACT = '0x1d38150f1fd989fb89ab19518a9c4e93c5554634' as const

const DEFAULT_STATE_FILE = 'scripts/indexer/concord-state.json'
const BASE_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000

// RPC block range limit
const BLOCKS_PER_REQUEST = 1000n
const REQUEST_DELAY_MS = 50

type PublicClient = ReturnType<typeof createPublicClient>

let lastIndexedBlock: bigint | null = null
let stopWatching: (() => void)[] = []
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let shuttingDown = false
let liveQueue = Promise.resolve()

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [concord-indexer] ${message}`)
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
    contract: CONCORD_CONTRACT,
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

async function fetchLogsWithRpc(params: {
  client: PublicClient
  topic: `0x${string}`
  topicName: string
  fromBlock: bigint
  toBlock: bigint
}): Promise<Log[]> {
  let allLogs: Log[] = []
  let cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const endBlock = cursor + BLOCKS_PER_REQUEST - 1n > params.toBlock
      ? params.toBlock
      : cursor + BLOCKS_PER_REQUEST - 1n

    try {
      const logs = await params.client.getLogs({
        address: CONCORD_CONTRACT,
        fromBlock: cursor,
        toBlock: endBlock,
      })

      // Filter to just our topic
      const filteredLogs = logs.filter(l => l.topics[0] === params.topic)
      allLogs = allLogs.concat(filteredLogs)

      if (filteredLogs.length > 0) {
        log(`Fetched ${filteredLogs.length} ${params.topicName} events (blocks ${cursor}-${endBlock})`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log(`Error fetching ${params.topicName} logs (blocks ${cursor}-${endBlock}): ${message}`)
      await delay(1000)
      continue
    }

    cursor = endBlock + 1n
    if (cursor <= params.toBlock) {
      await delay(REQUEST_DELAY_MS)
    }
  }

  return allLogs
}

async function backfillWithRpc(params: {
  client: PublicClient
  fromBlock: bigint
  toBlock: bigint
  stateFile: string
  chainId: number
}): Promise<void> {
  const totalBlocks = params.toBlock - params.fromBlock
  log(`Backfilling via RPC from block ${params.fromBlock} to ${params.toBlock} (${totalBlocks} blocks)`)

  const eventTopics: { topic: `0x${string}`; name: string }[] = [
    { topic: CONCORD_TOPICS.TransferSingle as `0x${string}`, name: 'TransferSingle' },
    { topic: CONCORD_TOPICS.TransferBatch as `0x${string}`, name: 'TransferBatch' },
  ]

  let allLogs: Log[] = []

  for (const { topic, name } of eventTopics) {
    if (shuttingDown) break

    log(`Fetching ${name} events...`)
    const logs = await fetchLogsWithRpc({
      client: params.client,
      topic,
      topicName: name,
      fromBlock: params.fromBlock,
      toBlock: params.toBlock,
    })
    allLogs = allLogs.concat(logs)
    log(`Total ${name} events: ${logs.length}`)
  }

  if (allLogs.length > 0) {
    log(`Processing ${allLogs.length} total transfer events...`)
    const result = await handleConcordTransferLogs(allLogs)
    log(`Processed ${result.processed} transfer events`)
  } else {
    log('No transfer events found')
  }

  await persistState(params.stateFile, params.chainId, params.toBlock)
  log(`Backfill complete up to block ${params.toBlock}`)
}

// Event ABIs for live watching
const transferSingleAbi = {
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

const transferBatchAbi = {
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

  for (const stop of stopWatching) {
    stop()
  }
  stopWatching = []

  const restart = () => startLiveWatch(params)

  const handleLogs = (eventName: string) => (logs: Log[]) => {
    liveQueue = liveQueue
      .then(async () => {
        if (shuttingDown) return
        const { highestBlock, processed } = await handleConcordTransferLogs(logs)
        if (processed > 0) {
          log(`Processed ${processed} live ${eventName} events`)
        }
        if (highestBlock !== null) {
          await persistState(params.stateFile, params.chainId, highestBlock)
        }
        reconnectAttempts = 0
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Live ${eventName} handling error: ${message}`)
      })
  }

  const handleError = (eventName: string) => (error: Error) => {
    const message = error instanceof Error ? error.message : String(error)
    log(`${eventName} watch error: ${message}`)
    scheduleReconnect(restart, message)
  }

  const events = [
    { abi: transferSingleAbi, name: 'TransferSingle' },
    { abi: transferBatchAbi, name: 'TransferBatch' },
  ]

  try {
    for (const { abi, name } of events) {
      const stop = params.client.watchContractEvent({
        address: CONCORD_CONTRACT,
        abi: [abi],
        eventName: name as 'TransferSingle' | 'TransferBatch',
        onLogs: handleLogs(name),
        onError: handleError(name),
      })
      stopWatching.push(stop)
    }

    log('Live transfer event watches started')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`Failed to start transfer watches: ${message}`)
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

  for (const stop of stopWatching) {
    stop()
  }
  stopWatching = []

  if (lastIndexedBlock !== null) {
    await saveState(stateFile, buildState(chainId, lastIndexedBlock))
  }

  process.exit(0)
}

async function main(): Promise<void> {
  const wsUrl = process.env.WS_RPC_URL
  const httpUrl = process.env.HTTP_RPC_URL

  if (!wsUrl) {
    log('WS_RPC_URL is required')
    process.exit(1)
  }

  if (!httpUrl) {
    log('HTTP_RPC_URL is required for backfill')
    process.exit(1)
  }

  const stateFile = process.env.STATE_FILE || DEFAULT_STATE_FILE
  const chainId = parseEnvNumber('CHAIN_ID', 1)
  // TokensOfConcord deployed around block 15400000
  const startBlock = parseEnvBigInt('START_BLOCK', 15400000n)

  const httpClient = createPublicClient({
    chain: mainnet,
    transport: http(httpUrl),
  })

  const wsClient = createPublicClient({
    chain: mainnet,
    transport: webSocket(wsUrl),
  })

  process.on('SIGINT', () => {
    void shutdown('SIGINT', stateFile, chainId)
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM', stateFile, chainId)
  })

  const loadedState = await loadState(stateFile)
  if (
    loadedState &&
    loadedState.contract.toLowerCase() === CONCORD_CONTRACT.toLowerCase() &&
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
  const latestBlock = await httpClient.getBlockNumber()

  log(`TokensOfConcord contract: ${CONCORD_CONTRACT}`)

  if (fromBlock <= latestBlock) {
    await backfillWithRpc({
      client: httpClient,
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

  log('Concord indexer running')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  log(`Fatal error: ${message}`)
  process.exit(1)
})
