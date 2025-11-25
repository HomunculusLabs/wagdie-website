/**
 * Core migration framework types
 */

export interface MigrationConfig {
  /** Path to JSON source file */
  sourceFile: string;
  /** Entity types to migrate */
  entities: EntityType[];
  /** Batch processing configuration */
  batchSize: number;
  /** Number of parallel batch processors */
  parallelBatches: number;
  /** Records between checkpoints */
  checkpointInterval: number;
  /** Maximum allowed error rate (0.0-1.0) */
  maxErrorRate: number;
  /** Migration timeout in minutes */
  timeoutMinutes: number;
  /** Validate all data before importing */
  validateBeforeImport: boolean;
  /** Run migration without importing data */
  dryRun: boolean;
}

export type EntityType =
  | 'character_sheets'
  | 'login_records'
  | 'metadata'
  | 'tokens'
  | 'tweets'
  | 'tweet_authors';

export interface MigrationRequest {
  sourceFile: string;
  entities: EntityType[];
  config?: Partial<MigrationConfig>;
  dryRun?: boolean;
}

export interface MigrationResponse {
  migrationId: string;
  status: MigrationStatus;
  message: string;
  estimatedDuration?: number;
  totalRecords?: number;
  startedAt: Date;
}

export type MigrationStatus =
  | 'pending'
  | 'started'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'rolled_back';

export interface MigrationState {
  migrationId: string;
  status: MigrationStatus;
  progress: ProgressInfo;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  config: MigrationConfig;
}

export interface ProgressInfo {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  percentage: number;
  recordsPerSecond: number;
  estimatedRemainingSeconds: number;
  currentEntity: string;
  entityProgress: Record<string, EntityProgress>;
}

export interface EntityProgress {
  entityName: string;
  total: number;
  processed: number;
  failed: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface MigrationCheckpoint {
  id: string;
  migrationId: string;
  entityName: string;
  lastProcessedIndex: number;
  totalRecords: number;
  batchId: string;
  createdAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface MigrationResult {
  entityName: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  successRate: number;
  durationMs: number;
  errorDetails: ValidationError[];
}

export interface ResumeRequest {
  fromCheckpoint?: boolean;
  fromEntity?: string;
  fromRecord?: number;
}

export interface ValidationError {
  recordId: string;
  field: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface RollbackResponse {
  migrationId: string;
  status: 'rollback_started' | 'rollback_completed' | 'rollback_failed';
  recordsRolledBack: number;
  rollbackStartedAt: Date;
  rollbackCompletedAt?: Date;
}

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  entity?: string;
  recordId?: string;
  details?: Record<string, any>;
}

export interface ValidationRule {
  entity: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'unique';
  validator: (value: any) => boolean;
  errorMessage: string;
}

// Data entity interfaces (will be expanded based on JSON analysis)
export interface CharacterSheetRecord {
  tokenId: number;
  name: string;
  level: number;
  origin: string;
  location: string;
  hitPoints: number;
  experiencePoints: number;
  equipment: Equipment;
  attributes: Attributes;
  backgroundStory?: string;
}

export interface Equipment {
  armor: string;
  back: string;
  mask: string;
}

export interface Attributes {
  dexterity: number;
  constitution: number;
  strength: number;
  charisma: number;
  wisdom: number;
  intelligence: number;
}

export interface LoginRecord {
  userAddress: string;
  lastLogin?: Date;
  loginCount: number;
}

export interface MetadataRecord {
  tokenId: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  attributes?: Record<string, any>;
}

export interface TokenRecord {
  tokenId: number;
  ownerAddress?: string;
  characterSheetId?: string;
  metadataId?: string;
}

export interface TweetRecord {
  content: string;
  tweetAuthorId: string;
  createdAt?: Date;
}

export interface TweetAuthorRecord {
  username: string;
  displayName?: string;
  profileImage?: string;
}