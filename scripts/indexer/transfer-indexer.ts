// Transfer Indexer - Entry Point (Standalone)
import { createPublicClient, http, webSocket, type Log } from 'viem'
import { loadState, saveState, type IndexerState } from './block-tracker'
import { handleTransferLogs } from './event-handler'

// WAGDIE contract address on mainnet
const WAGDIE_CONTRACT = '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a' as const

const DEFAULT_STATE_FILE = 'scripts/indexer/state.json'
const CHUNK_SIZE = 10n
const BASE_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000

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

async function backfillRange(params: {
  client: PublicClient
  contract: `0x${string}`
  fromBlock: bigint
  toBlock: bigint
  stateFile: string
  chainId: number
}): Promise<void> {
  let cursor = params.fromBlock

  while (cursor <= params.toBlock && !shuttingDown) {
    const chunkEnd =
      cursor + CHUNK_SIZE - 1n > params.toBlock
        ? params.toBlock
        : cursor + CHUNK_SIZE - 1n

    log(`Backfilling blocks ${cursor} -> ${chunkEnd}`)

    let logs: Log[] = []
    try {
      logs = await params.client.getLogs({
        address: params.contract,
        event: transferEventAbi,
        fromBlock: cursor,
        toBlock: chunkEnd,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log(`Backfill error for ${cursor} -> ${chunkEnd}: ${message}`)
      throw error
    }

    const { processed } = await handleTransferLogs(logs)
    log(`Processed ${processed} transfers for ${cursor} -> ${chunkEnd}`)

    await persistState(params.stateFile, params.chainId, params.contract, chunkEnd)
    await new Promise((r) => setTimeout(r, 100))
    cursor = chunkEnd + 1n
  }
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
            const { highestBlock, processed } = await handleTransferLogs(logs)
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
  const wsUrl = process.env.WS_RPC_URL
  if (!wsUrl) {
    log('WS_RPC_URL is required')
    process.exit(1)
  }

  const httpUrl = process.env.HTTP_RPC_URL
  const stateFile = process.env.STATE_FILE || DEFAULT_STATE_FILE
  const chainId = parseEnvNumber('CHAIN_ID', 1)
  const startBlock = parseEnvBigInt('START_BLOCK', 0n)

  const contractAddress = WAGDIE_CONTRACT
  const wsClient = createPublicClient({ transport: webSocket(wsUrl) })
  const backfillClient = httpUrl
    ? createPublicClient({ transport: http(httpUrl) })
    : wsClient

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
  const latestBlock = await backfillClient.getBlockNumber()

  if (fromBlock <= latestBlock) {
    await backfillRange({
      client: backfillClient,
      contract: contractAddress,
      fromBlock,
      toBlock: latestBlock,
      stateFile,
      chainId,
    })
    log(`Backfill complete up to block ${latestBlock}`)
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
