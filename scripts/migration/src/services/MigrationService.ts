/**
 * Core migration service for processing data from JSON to Supabase
 */

import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import {
  MigrationConfig,
  MigrationRequest,
  MigrationResponse,
  MigrationState,
  ProgressInfo,
  EntityProgress,
  MigrationResult,
  MigrationStatus,
  EntityType
} from '../types/MigrationTypes';
import { getDatabaseClient } from '../data/SupabaseClient';
import { migrationLogger } from '../utils/logger';
import { performanceMonitor, PerformanceThresholds } from '../utils/PerformanceMonitor';
import { checkpointManager, CheckpointState } from '../utils/CheckpointManager';
import { ValidationService } from './ValidationService';
import { DataTransformer } from '../data/transformers/DataTransformer';
import { CharacterTransformer } from '../data/transformers/CharacterTransformer';
import { TokenTransformer } from '../data/transformers/TokenTransformer';
import { MetadataTransformer } from '../data/transformers/MetadataTransformer';
import { LoginTransformer } from '../data/transformers/LoginTransformer';
import { TweetTransformer } from '../data/transformers/TweetTransformer';

export class MigrationService {
  private config: MigrationConfig;
  private validationService: ValidationService;
  private transformers: Map<EntityType, any>;
  private currentState?: MigrationState;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.validationService = new ValidationService();
    this.initializeTransformers();
  }

  /**
   * Start migration process
   */
  async startMigration(request: MigrationRequest): Promise<MigrationResponse> {
    const migrationId = randomUUID();
    const startTime = Date.now();

    try {
      // Load and validate source file
      const sourceData = this.loadSourceFile(request.sourceFile);

      // Initialize migration state
      this.currentState = {
        migrationId,
        status: 'started',
        progress: this.createInitialProgress(request.entities, sourceData),
        startedAt: new Date(),
        updatedAt: new Date(),
        config: { ...this.config, ...request.config, ...request }
      };

      // Log migration start
      migrationLogger.logMigrationStart(
        migrationId,
        request.sourceFile,
        this.calculateTotalRecords(sourceData, request.entities)
      );

      // Start performance monitoring
      performanceMonitor.startMonitoring();

      // Process entities in dependency order
      await this.processEntities(migrationId, sourceData, request.entities);

      // Complete migration
      const endTime = Date.now();
      const finalMetrics = performanceMonitor.stopMonitoring();

      this.currentState.status = 'completed';
      this.currentState.updatedAt = new Date();
      this.currentState.completedAt = new Date();

      migrationLogger.logMigrationCompletion(
        migrationId,
        this.currentState.progress.totalRecords,
        this.currentState.progress.processedRecords,
        this.currentState.progress.failedRecords,
        endTime - startTime,
        this.calculateSuccessRate()
      );

      return {
        migrationId,
        status: 'completed',
        message: 'Migration completed successfully',
        totalRecords: this.currentState.progress.totalRecords,
        startedAt: this.currentState.startedAt
      };

    } catch (error) {
      if (this.currentState) {
        this.currentState.status = 'failed';
        this.currentState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.currentState.updatedAt = new Date();
      }

      migrationLogger.logDatabaseError(
        migrationId,
        'migration',
        'startMigration',
        error instanceof Error ? error : error
      );

      return {
        migrationId,
        status: 'failed',
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startedAt: new Date(startTime)
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrationId: string): Promise<MigrationState | null> {
    // In a real implementation, this would load from persistence
    return this.currentState?.migrationId === migrationId ? this.currentState : null;
  }

  /**
   * Resume migration from checkpoint
   */
  async resumeMigration(migrationId: string, fromCheckpoint: boolean = true): Promise<MigrationResponse> {
    try {
      // Load migration state and checkpoint logic
      // For now, return a placeholder response
      return {
        migrationId,
        status: 'running',
        message: 'Migration resumed from checkpoint',
        startedAt: new Date()
      };
    } catch (error) {
      return {
        migrationId,
        status: 'failed',
        message: `Failed to resume migration: ${error}`,
        startedAt: new Date()
      };
    }
  }

  /**
   * Process all entities in dependency order
   */
  private async processEntities(
    migrationId: string,
    sourceData: any,
    entities: EntityType[]
  ): Promise<void> {
    const processingOrder = this.getDependencyOrder(entities);

    for (const entityType of processingOrder) {
      if (!entities.includes(entityType)) {
        continue;
      }

      await this.processEntity(migrationId, entityType, sourceData);
    }
  }

  /**
   * Process a single entity type
   */
  private async processEntity(
    migrationId: string,
    entityType: EntityType,
    sourceData: any
  ): Promise<void> {
    const startTime = Date.now();
    const entityRecords = this.extractEntityRecords(sourceData, entityType);

    if (entityRecords.length === 0) {
      console.log(`⚠️  No records found for ${entityType}`);
      return;
    }

    console.log(`🔄 Processing ${entityType}: ${entityRecords.length} records`);

    // Get correct table name for database and check if it exists
    const tableName = this.mapEntityTypeToTable(entityType);
    if (tableName === 'skip') {
      console.log(`⏭️  Skipping ${entityType} - no corresponding table exists`);
      return;
    }

    const transformer = this.transformers.get(entityType);
    if (!transformer) {
      throw new Error(`No transformer found for entity type: ${entityType}`);
    }

    const dbClient = getDatabaseClient();
    const batchSize = this.config.batchSize;
    let processedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < entityRecords.length; i += batchSize) {
      const batch = entityRecords.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      try {
        // Transform batch
        const transformedBatch = await this.transformBatch(batch, transformer, entityType);

        // Validate batch
        const validation = this.validationService.validateBatch(entityType, transformedBatch);
        if (!validation.isValid) {
          console.warn(`⚠️  Batch ${Math.floor(i/batchSize)} has ${validation.errors.length} validation errors`);
        }

        // Insert batch to database
        if (!this.config.dryRun) {
          const { error } = await dbClient.batchInsert(tableName as any, transformedBatch);
          if (error) {
            throw new Error(`Failed to insert batch into ${tableName}: ${error.message}`);
          }
        }

        processedCount += transformedBatch.length;

        // Update progress
        this.updateProgress(entityType, processedCount, entityRecords.length);

        // Log batch processing
        const processingTime = Date.now() - batchStartTime;
        migrationLogger.logBatchProcessing(
          migrationId,
          entityType,
          `batch_${Math.floor(i/batchSize)}`,
          batch.length,
          processingTime,
          transformedBatch.length,
          0
        );

        // Check for checkpoint creation
        if (checkpointManager.shouldCreateCheckpoint(migrationId, entityType, i, entityRecords.length)) {
          await checkpointManager.createCheckpoint({
            migrationId,
            entityName: entityType,
            lastProcessedIndex: i + batch.length - 1,
            totalRecords: entityRecords.length,
            batchId: `batch_${Math.floor(i/batchSize)}`,
            createdAt: new Date(),
            processingTime,
            successCount: transformedBatch.length,
            errorCount: 0
          });
        }

      } catch (error) {
        errorCount += batch.length;
        processedCount += batch.length;

        migrationLogger.logDatabaseError(
          migrationId,
          entityType,
          `batch_${Math.floor(i/batchSize)}`,
          error instanceof Error ? error : error
        );

        if (this.config.maxErrorRate > 0 && (errorCount / processedCount) > this.config.maxErrorRate) {
          throw new Error(`Error rate exceeded threshold: ${((errorCount / processedCount) * 100).toFixed(2)}%`);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const recordsPerSecond = (processedCount / totalTime) * 1000;

    console.log(`✅ Completed ${entityType}: ${processedCount}/${entityRecords.length} (${Math.round(recordsPerSecond)} rec/s)`);
  }

  /**
   * Transform a batch of records
   */
  private async transformBatch(batch: any[], transformer: any, entityType: EntityType): Promise<any[]> {
    const transformed: any[] = [];

    for (const [index, record] of batch.entries()) {
      try {
        let transformedRecord;

        switch (entityType) {
          case 'character_sheets':
            transformedRecord = transformer.transform(record);
            break;
          case 'tokens':
            transformedRecord = transformer.transform({ id: record.id, data: record });
            break;
          case 'metadata':
            transformedRecord = transformer.transform(record);
            break;
          case 'login_records':
            transformedRecord = transformer.transform({ id: record.id, data: record });
            break;
          case 'tweets':
            transformedRecord = transformer.transform(record);
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        transformed.push(transformedRecord);
      } catch (error) {
        migrationLogger.logValidationError(
          'migration',
          entityType,
          `batch_index_${index}`,
          'transformation',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return transformed;
  }

  /**
   * Load and parse source JSON file
   */
  private loadSourceFile(filePath: string): any {
    try {
      const fileContent = readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to load source file ${filePath}: ${error}`);
    }
  }

  /**
   * Extract records for specific entity type from source data
   */
  private extractEntityRecords(sourceData: any, entityType: EntityType): any[] {
    const entityKey = `dev:${entityType}`;
    const records: any[] = [];

    for (const [key, value] of Object.entries(sourceData)) {
      if (key.startsWith(entityKey)) {
        records.push({ id: key, data: value });
      }
    }

    return records;
  }

  /**
   * Map framework entity types to existing database tables
   */
  private mapEntityTypeToTable(entityType: EntityType): string {
    const mapping: Record<EntityType, string> = {
      'character_sheets': 'characters',
      'login_records': 'users',
      'metadata': 'metadata',
      'tokens': 'tokens', // Note: tokens table doesn't exist in current schema
      'tweets': 'tweets',
      'tweet_authors': 'tweet_authors' // Note: tweet_authors table doesn't exist in current schema
    };

    // Handle entities that don't have corresponding tables
    if (entityType === 'tokens' || entityType === 'tweet_authors') {
      console.warn(`⚠️  Table for ${entityType} does not exist in current schema - skipping migration`);
      return 'skip';
    }

    return mapping[entityType] || entityType;
  }

  /**
   * Get dependency order for entities based on existing schema
   */
  private getDependencyOrder(entities: EntityType[]): EntityType[] {
    // Based on existing database schema
    const dependencyMap: Record<EntityType, EntityType[]> = {
      'login_records': [],
      'locations': [],
      'metadata': [],
      'character_sheets': [], // Can stand alone
      'tokens': ['character_sheets', 'metadata'], // Links to both
      'tweets': [], // Can stand alone
      'tweet_authors': [] // Would need to be created
    };

    const ordered: EntityType[] = [];
    const visited = new Set<EntityType>();

    const visit = (entity: EntityType) => {
      if (visited.has(entity)) return;
      if (!entities.includes(entity)) return;

      const dependencies = dependencyMap[entity] || [];
      dependencies.forEach(dep => visit(dep));

      visited.add(entity);
      ordered.push(entity);
    };

    entities.forEach(entity => visit(entity));
    return ordered;
  }

  /**
   * Initialize transformers
   */
  private initializeTransformers(): void {
    this.transformers = new Map([
      ['character_sheets', new CharacterTransformer()],
      ['tokens', new TokenTransformer()],
      ['metadata', new MetadataTransformer()],
      ['login_records', new LoginTransformer()],
      ['tweets', new TweetTransformer()]
    ]);
  }

  /**
   * Create initial progress object
   */
  private createInitialProgress(entities: EntityType[], sourceData: any): ProgressInfo {
    const entityProgress: Record<string, EntityProgress> = {};
    let totalRecords = 0;

    for (const entityType of entities) {
      const records = this.extractEntityRecords(sourceData, entityType);
      entityProgress[entityType] = {
        entityName: entityType,
        total: records.length,
        processed: 0,
        failed: 0,
        status: 'pending'
      };
      totalRecords += records.length;
    }

    return {
      totalRecords,
      processedRecords: 0,
      failedRecords: 0,
      percentage: 0,
      recordsPerSecond: 0,
      estimatedRemainingSeconds: 0,
      currentEntity: entities[0] || '',
      entityProgress
    };
  }

  /**
   * Calculate total records for entities
   */
  private calculateTotalRecords(sourceData: any, entities: EntityType[]): number {
    return entities.reduce((total, entityType) => {
      return total + this.extractEntityRecords(sourceData, entityType).length;
    }, 0);
  }

  /**
   * Update migration progress
   */
  private updateProgress(entityType: EntityType, processed: number, total: number): void {
    if (!this.currentState) return;

    this.currentState.progress.entityProgress[entityType].processed = processed;
    this.currentState.progress.entityProgress[entityType].status = 'running';

    const totalProcessed = Object.values(this.currentState.progress.entityProgress)
      .reduce((sum, ep) => sum + ep.processed, 0);

    this.currentState.progress.processedRecords = totalProcessed;
    this.currentState.progress.percentage = (totalProcessed / this.currentState.progress.totalRecords) * 100;
    this.currentState.updatedAt = new Date();

    // Update current entity
    if (processed < total) {
      this.currentState.progress.currentEntity = entityType;
    }
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(): number {
    if (!this.currentState) return 0;

    const { processedRecords, failedRecords } = this.currentState.progress;
    return processedRecords > 0 ? ((processedRecords - failedRecords) / processedRecords) * 100 : 0;
  }
}