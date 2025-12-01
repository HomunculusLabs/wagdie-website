/**
 * Types for ownership sync operations
 */

export interface OwnershipChange {
  tokenId: number
  previousOwner: string | null
  newOwner: string | null
}

export interface SyncResult {
  success: boolean
  tokensProcessed: number
  tokensUpdated: number
  tokensFailed: number
  duration: number
  errors: string[]
  timestamp: string
}

export interface SyncJobStatus {
  isRunning: boolean
  lastSync: SyncResult | null
  nextScheduledSync?: string
}
