import { promises as fs } from 'fs'
import path from 'path'

export interface IndexerState {
  chainId: number
  contract: string
  lastIndexedBlock: string
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}

function ensureValidState(value: unknown): IndexerState {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid indexer state format')
  }

  const state = value as IndexerState

  if (
    typeof state.chainId !== 'number' ||
    typeof state.contract !== 'string' ||
    typeof state.lastIndexedBlock !== 'string'
  ) {
    throw new Error('Invalid indexer state shape')
  }

  return state
}

export async function loadState(filePath: string): Promise<IndexerState | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    return ensureValidState(parsed)
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return null
    }
    console.warn(`[block-tracker] Failed to load state file ${filePath}, resetting:`, error)
    return null
  }
}

export async function saveState(filePath: string, state: IndexerState): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })

  const payload = JSON.stringify(state, null, 2) + '\n'
  const tempPath = path.join(
    dir,
    `${path.basename(filePath)}.${Date.now()}.tmp`
  )

  await fs.writeFile(tempPath, payload, 'utf8')
  await fs.rename(tempPath, filePath)
}