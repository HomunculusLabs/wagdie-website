/**
 * Checkpoint management system for resumable migrations
 */

import { randomUUID } from 'crypto';
import { MigrationCheckpoint, EntityType } from '../types/MigrationTypes';
import { getDatabaseClient } from '../data/SupabaseClient';
import { migrationLogger } from './logger';

export interface CheckpointConfig {
  enabled: boolean;
  interval: number; // Records between checkpoints
  maxCheckpoints: number; // Maximum checkpoints to keep per migration
  persistToDatabase: boolean;
  persistToFile: boolean;
  checkpointDirectory: string;
}

export interface CheckpointState {
  migrationId: string;
  entityName: EntityType;
  lastProcessedIndex: number;
  totalRecords: number;
  batchId: string;
  createdAt: Date;
  processingTime: number;
  successCount: number;
  errorCount: number;
}

export class CheckpointManager {
  private config: CheckpointConfig;
  private checkpoints: Map<string, MigrationCheckpoint> = new Map();

  constructor(config: CheckpointConfig = {
    enabled: true,
    interval: 1000,
    maxCheckpoints: 50,
    persistToDatabase: true,
    persistToFile: true,
    checkpointDirectory: './checkpoints'
  }) {
    this.config = config;
  }

  /**
   * Create a new checkpoint
   */
  async createCheckpoint(state: CheckpointState): Promise<MigrationCheckpoint | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const checkpoint: MigrationCheckpoint = {
        id: randomUUID(),
        migrationId: state.migrationId,
        entityName: state.entityName,
        lastProcessedIndex: state.lastProcessedIndex,
        totalRecords: state.totalRecords,
        batchId: state.batchId,
        createdAt: new Date(),
        status: 'completed'
      };

      // Store in memory
      this.checkpoints.set(checkpoint.id, checkpoint);

      // Persist to database if enabled
      if (this.config.persistToDatabase) {
        await this.persistCheckpointToDatabase(checkpoint);
      }

      // Persist to file if enabled
      if (this.config.persistToFile) {
        await this.persistCheckpointToFile(checkpoint);
      }

      // Log checkpoint creation
      migrationLogger.logCheckpoint(
        state.migrationId,
        state.entityName,
        checkpoint.id,
        state.lastProcessedIndex,
        state.totalRecords
      );

      // Cleanup old checkpoints
      await this.cleanupOldCheckpoints(state.migrationId, state.entityName);

      return checkpoint;
    } catch (error) {
      console.error(`Failed to create checkpoint for ${state.entityName}:`, error);
      return null;
    }
  }

  /**
   * Get the latest checkpoint for a migration and entity
   */
  async getLatestCheckpoint(migrationId: string, entityName: EntityType): Promise<MigrationCheckpoint | null> {
    try {
      // First check database if enabled
      if (this.config.persistToDatabase) {
        const dbCheckpoint = await this.getLatestCheckpointFromDatabase(migrationId, entityName);
        if (dbCheckpoint) {
          return dbCheckpoint;
        }
      }

      // Then check files if enabled
      if (this.config.persistToFile) {
        const fileCheckpoint = await this.getLatestCheckpointFromFile(migrationId, entityName);
        if (fileCheckpoint) {
          return fileCheckpoint;
        }
      }

      // Finally check memory
      const memoryCheckpoint = this.getLatestCheckpointFromMemory(migrationId, entityName);
      return memoryCheckpoint;
    } catch (error) {
      console.error(`Failed to get latest checkpoint for ${migrationId}/${entityName}:`, error);
      return null;
    }
  }

  /**
   * Get all checkpoints for a migration
   */
  async getCheckpoints(migrationId: string, entityName?: EntityType): Promise<MigrationCheckpoint[]> {
    try {
      let checkpoints: MigrationCheckpoint[] = [];

      if (this.config.persistToDatabase) {
        checkpoints = await this.getCheckpointsFromDatabase(migrationId, entityName);
      } else if (this.config.persistToFile) {
        checkpoints = await this.getCheckpointsFromFile(migrationId, entityName);
      } else {
        checkpoints = Array.from(this.checkpoints.values())
          .filter(cp => cp.migrationId === migrationId && (!entityName || cp.entityName === entityName));
      }

      return checkpoints.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } catch (error) {
      console.error(`Failed to get checkpoints for ${migrationId}:`, error);
      return [];
    }
  }

  /**
   * Check if a checkpoint should be created
   */
  shouldCreateCheckpoint(
    migrationId: string,
    entityName: EntityType,
    currentRecordIndex: number,
    totalRecords: number
  ): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Create checkpoint at specified intervals
    if (currentRecordIndex % this.config.interval === 0) {
      return true;
    }

    // Always create checkpoint at the end
    if (currentRecordIndex === totalRecords - 1) {
      return true;
    }

    return false;
  }

  /**
   * Calculate resumption point from checkpoint
   */
  calculateResumptionPoint(checkpoint: MigrationCheckpoint): {
    startIndex: number;
    batchId: string;
    progress: number;
  } {
    const startIndex = checkpoint.lastProcessedIndex + 1;
    const progress = checkpoint.totalRecords > 0
      ? (checkpoint.lastProcessedIndex / checkpoint.totalRecords) * 100
      : 0;

    return {
      startIndex,
      batchId: checkpoint.batchId,
      progress: Math.round(progress)
    };
  }

  /**
   * Validate checkpoint integrity
   */
  async validateCheckpoint(checkpoint: MigrationCheckpoint): Promise<boolean> {
    try {
      // Check if checkpoint exists in database if persistence is enabled
      if (this.config.persistToDatabase) {
        const exists = await this.checkpointExistsInDatabase(checkpoint.id);
        if (!exists) {
          console.warn(`Checkpoint ${checkpoint.id} not found in database`);
          return false;
        }
      }

      // Validate checkpoint structure
      if (!checkpoint.id || !checkpoint.migrationId || !checkpoint.entityName) {
        console.warn(`Invalid checkpoint structure for ${checkpoint.id}`);
        return false;
      }

      // Validate data consistency
      if (checkpoint.lastProcessedIndex < 0 || checkpoint.totalRecords < 0) {
        console.warn(`Invalid checkpoint data for ${checkpoint.id}`);
        return false;
      }

      if (checkpoint.lastProcessedIndex > checkpoint.totalRecords) {
        console.warn(`Checkpoint data inconsistency for ${checkpoint.id}: processed > total`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Failed to validate checkpoint ${checkpoint.id}:`, error);
      return false;
    }
  }

  /**
   * Delete all checkpoints for a migration
   */
  async deleteCheckpoints(migrationId: string): Promise<void> {
    try {
      // Delete from database
      if (this.config.persistToDatabase) {
        await this.deleteCheckpointsFromDatabase(migrationId);
      }

      // Delete from files
      if (this.config.persistToFile) {
        await this.deleteCheckpointsFromFile(migrationId);
      }

      // Delete from memory
      for (const [id, checkpoint] of this.checkpoints.entries()) {
        if (checkpoint.migrationId === migrationId) {
          this.checkpoints.delete(id);
        }
      }

      console.log(`🗑️  Deleted all checkpoints for migration ${migrationId}`);
    } catch (error) {
      console.error(`Failed to delete checkpoints for ${migrationId}:`, error);
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getCheckpointStats(migrationId: string): Promise<CheckpointStats> {
    try {
      const checkpoints = await this.getCheckpoints(migrationId);
      const entityStats: Record<string, number> = {};

      checkpoints.forEach(checkpoint => {
        entityStats[checkpoint.entityName] = (entityStats[checkpoint.entityName] || 0) + 1;
      });

      return {
        totalCheckpoints: checkpoints.length,
        entityBreakdown: entityStats,
        oldestCheckpoint: checkpoints.length > 0 ? checkpoints[0].createdAt : null,
        newestCheckpoint: checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].createdAt : null
      };
    } catch (error) {
      console.error(`Failed to get checkpoint stats for ${migrationId}:`, error);
      return {
        totalCheckpoints: 0,
        entityBreakdown: {},
        oldestCheckpoint: null,
        newestCheckpoint: null
      };
    }
  }

  // Private helper methods

  private async persistCheckpointToDatabase(checkpoint: MigrationCheckpoint): Promise<void> {
    const dbClient = getDatabaseClient();
    const { error } = await dbClient.getClient()
      .from('migration_checkpoints')
      .insert({
        id: checkpoint.id,
        migration_id: checkpoint.migrationId,
        entity_name: checkpoint.entityName,
        last_processed_index: checkpoint.lastProcessedIndex,
        total_records: checkpoint.totalRecords,
        batch_id: checkpoint.batchId,
        status: checkpoint.status
      });

    if (error) {
      throw new Error(`Failed to persist checkpoint to database: ${error.message}`);
    }
  }

  private async persistCheckpointToFile(checkpoint: MigrationCheckpoint): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const filename = `${checkpoint.migrationId}_${checkpoint.entityName}_${checkpoint.id}.json`;
    const filepath = path.join(this.config.checkpointDirectory, filename);

    await fs.mkdir(this.config.checkpointDirectory, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2));
  }

  private async getLatestCheckpointFromDatabase(migrationId: string, entityName: EntityType): Promise<MigrationCheckpoint | null> {
    const dbClient = getDatabaseClient();
    const { data, error } = await dbClient.getClient()
      .from('migration_checkpoints')
      .select('*')
      .eq('migration_id', migrationId)
      .eq('entity_name', entityName)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      migrationId: data.migration_id,
      entityName: data.entity_name,
      lastProcessedIndex: data.last_processed_index,
      totalRecords: data.total_records,
      batchId: data.batch_id,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      status: data.status
    };
  }

  private async getLatestCheckpointFromFile(migrationId: string, entityName: EntityType): Promise<MigrationCheckpoint | null> {
    // Implementation would read from file system
    // For now, return null as database persistence is preferred
    return null;
  }

  private getLatestCheckpointFromMemory(migrationId: string, entityName: EntityType): MigrationCheckpoint | null {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter(cp => cp.migrationId === migrationId && cp.entityName === entityName && cp.status === 'completed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return checkpoints.length > 0 ? checkpoints[0] : null;
  }

  private async getCheckpointsFromDatabase(migrationId: string, entityName?: EntityType): Promise<MigrationCheckpoint[]> {
    const dbClient = getDatabaseClient();
    let query = dbClient.getClient()
      .from('migration_checkpoints')
      .select('*')
      .eq('migration_id', migrationId);

    if (entityName) {
      query = query.eq('entity_name', entityName);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(row => ({
      id: row.id,
      migrationId: row.migration_id,
      entityName: row.entity_name,
      lastProcessedIndex: row.last_processed_index,
      totalRecords: row.total_records,
      batchId: row.batch_id,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status
    }));
  }

  private async getCheckpointsFromFile(migrationId: string, entityName?: EntityType): Promise<MigrationCheckpoint[]> {
    // Implementation would read from file system
    return [];
  }

  private async checkpointExistsInDatabase(checkpointId: string): Promise<boolean> {
    const dbClient = getDatabaseClient();
    const { data, error } = await dbClient.getClient()
      .from('migration_checkpoints')
      .select('id')
      .eq('id', checkpointId)
      .single();

    return !error && !!data;
  }

  private async cleanupOldCheckpoints(migrationId: string, entityName: EntityType): Promise<void> {
    if (!this.config.persistToDatabase) {
      return;
    }

    const checkpoints = await this.getCheckpointsFromDatabase(migrationId, entityName);

    if (checkpoints.length <= this.config.maxCheckpoints) {
      return;
    }

    // Delete oldest checkpoints
    const toDelete = checkpoints.slice(0, checkpoints.length - this.config.maxCheckpoints);
    const dbClient = getDatabaseClient();

    for (const checkpoint of toDelete) {
      await dbClient.getClient()
        .from('migration_checkpoints')
        .delete()
        .eq('id', checkpoint.id);
    }
  }

  private async deleteCheckpointsFromDatabase(migrationId: string): Promise<void> {
    const dbClient = getDatabaseClient();
    await dbClient.getClient()
      .from('migration_checkpoints')
      .delete()
      .eq('migration_id', migrationId);
  }

  private async deleteCheckpointsFromFile(migrationId: string): Promise<void> {
    // Implementation would delete checkpoint files
  }
}

// Supporting interfaces
export interface CheckpointStats {
  totalCheckpoints: number;
  entityBreakdown: Record<string, number>;
  oldestCheckpoint: Date | null;
  newestCheckpoint: Date | null;
}

// Default checkpoint manager instance
export const checkpointManager = new CheckpointManager();