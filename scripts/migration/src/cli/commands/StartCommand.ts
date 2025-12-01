/**
 * CLI Command: Start a new migration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { MigrationService } from '../../services/MigrationService.js';
import { MigrationConfig, MigrationRequest, EntityType } from '../../types/MigrationTypes.js';

export class StartCommand extends Command {
  constructor() {
    super('start');

    this.description('Start a new database migration')
      .argument('<sourceFile>', 'Path to JSON source file')
      .option('-e, --entities <entities>', 'Comma-separated list of entities to migrate', 'character_sheets,metadata,tokens,tweets,tweet_authors,login_records')
      .option('-b, --batch-size <size>', 'Number of records per batch', '100')
      .option('-p, --parallel-batches <count>', 'Number of parallel batch processors', '2')
      .option('-c, --checkpoint-interval <interval>', 'Records between checkpoints', '1000')
      .option('--max-error-rate <rate>', 'Maximum allowed error rate (0.0-1.0)', '0.01')
      .option('--timeout-minutes <minutes>', 'Migration timeout in minutes', '30')
      .option('--dry-run', 'Validate without importing data', false)
      .option('--no-validation', 'Skip data validation', false)
      .action(this.handleCommand.bind(this));
  }

  private async handleCommand(
    sourceFile: string,
    options: {
      entities: string;
      batchSize: string;
      parallelBatches: string;
      checkpointInterval: string;
      maxErrorRate: string;
      timeoutMinutes: string;
      dryRun: boolean;
      noValidation: boolean;
    }
  ): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting WAGDIE Database Migration'));
      console.log(chalk.gray(`Source file: ${sourceFile}`));

      // Parse entities
      const entities: EntityType[] = options.entities.split(',').map(e => e.trim() as EntityType);

      // Create migration configuration
      const config: MigrationConfig = {
        sourceFile,
        entities,
        batchSize: parseInt(options.batchSize),
        parallelBatches: parseInt(options.parallelBatches),
        checkpointInterval: parseInt(options.checkpointInterval),
        maxErrorRate: parseFloat(options.maxErrorRate),
        timeoutMinutes: parseInt(options.timeoutMinutes),
        validateBeforeImport: !options.noValidation,
        dryRun: options.dryRun
      };

      // Create migration request
      const request: MigrationRequest = {
        sourceFile,
        entities,
        config,
        dryRun: options.dryRun
      };

      console.log(chalk.gray(`Entities: ${entities.join(', ')}`));
      console.log(chalk.gray(`Batch size: ${config.batchSize}`));
      console.log(chalk.gray(`Parallel batches: ${config.parallelBatches}`));
      console.log(chalk.gray(`Dry run: ${config.dryRun ? 'Yes' : 'No'}`));

      if (config.dryRun) {
        console.log(chalk.yellow('⚠️  DRY RUN MODE - No data will be imported'));
      }

      console.log();

      // Start migration
      const migrationService = new MigrationService(config);
      const result = await migrationService.startMigration(request);

      if (result.status === 'completed') {
        console.log(chalk.green('✅ Migration completed successfully!'));
        console.log(chalk.gray(`Migration ID: ${result.migrationId}`));
        if (result.totalRecords) {
          console.log(chalk.gray(`Total records processed: ${result.totalRecords}`));
        }
      } else {
        console.log(chalk.red('❌ Migration failed'));
        console.log(chalk.red(`Error: ${result.message}`));
        process.exit(1);
      }

    } catch (error) {
      console.log(chalk.red('❌ Migration failed to start'));
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }
}