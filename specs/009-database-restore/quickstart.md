# Quickstart Guide: Database Migration Framework

**Purpose**: Get started with the WAGDIE database restoration migration framework quickly and efficiently.

## Prerequisites

### Environment Setup
```bash
# Node.js 18+ required
node --version  # Should be v18.x or higher

# Supabase CLI for local development
npm install -g @supabase/cli

# Verify Supabase setup
supabase --version
```

### Database Preparation
```bash
# Start WAGDIE Docker services (includes Supabase)
docker-compose up -d

# Verify Supabase services are running
curl http://localhost:8010/health

# Access Supabase Studio
# Open http://localhost:3012 in your browser

# Apply existing migrations if needed
# Migrations are in: supabase/migrations/
```

### Environment Variables
```bash
# Create .env.local
cp .env.example .env.local

# Required environment variables
# WAGDIE Local Docker Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8010
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Note: Port 8010 is used by WAGDIE Docker setup (Kong API Gateway)
# PostgreSQL database runs on port 5442 directly
# Supabase Studio UI is available at http://localhost:3012
```

## Installation

```bash
# Install dependencies
npm install

# Build migration framework
npm run build:migration

# Verify installation
npm run migration:help
```

## Basic Usage

### 1. Quick Migration (Default Settings)

```bash
# Migrate all entities with default configuration
npm run migration:start -- wagdie.json

# Migrate specific entities only
npm run migration:start -- wagdie.json --entities character_sheets,tokens,metadata
```

### 2. Custom Configuration

```bash
# Custom batch size and parallel processing
npm run migration:start -- wagdie.json \
  --batch-size 500 \
  --parallel-batches 4 \
  --checkpoint-interval 2000

# Dry run to validate without importing
npm run migration:start -- wagdie.json \
  --dry-run \
  --validate-only
```

### 3. Monitoring and Control

```bash
# Check migration status
npm run migration:status -- [migration-id]

# Pause running migration
npm run migration:pause -- [migration-id]

# Resume from checkpoint
npm run migration:resume -- [migration-id]

# View detailed logs
npm run migration:logs -- [migration-id] --level error
```

## Configuration Options

### Command Line Options

```bash
# Migration configuration
--source-file <path>           # JSON source file (default: wagdie.json)
--entities <list>             # Comma-separated entity list
--batch-size <number>         # Records per batch (default: 100)
--parallel-batches <number>   # Parallel processors (default: 2)
--checkpoint-interval <number> # Records between checkpoints (default: 1000)
--max-error-rate <decimal>    # Max error rate 0.0-1.0 (default: 0.01)
--timeout-minutes <number>    # Migration timeout (default: 30)

# Validation options
--validate-before-import      # Validate all data before importing
--skip-invalid-records        # Skip invalid records instead of failing
--strict-validation          # Enable strict validation mode

# Control options
--dry-run                    # Validate without importing
--resume-from-checkpoint     # Resume from last checkpoint
--force-rollback             # Rollback on any failure
```

### Configuration File

Create `migration.config.json`:

```json
{
  "sourceFile": "./wagdie.json",
  "entities": ["character_sheets", "tokens", "metadata"],
  "config": {
    "batchSize": 100,
    "parallelBatches": 2,
    "checkpointInterval": 1000,
    "maxErrorRate": 0.01,
    "timeoutMinutes": 30,
    "validateBeforeImport": true
  },
  "validation": {
    "strictMode": false,
    "skipInvalidRecords": true,
    "logValidationWarnings": true
  },
  "performance": {
    "enableParallelProcessing": true,
    "optimizeBatchSize": true,
    "memoryLimitMB": 100
  }
}
```

Usage with config file:

```bash
npm run migration:start -- --config migration.config.json
```

## Entity-Specific Migration

### Character Sheets Only

```bash
# Migrate character sheets with custom settings
npm run migration:start -- wagdie.json \
  --entities character_sheets \
  --batch-size 50 \
  --validate-before-import
```

### Large Datasets (5000+ records)

```bash
# Optimized for large datasets
npm run migration:start -- wagdie.json \
  --entities metadata,tokens \
  --batch-size 1000 \
  --parallel-batches 4 \
  --checkpoint-interval 500
```

## Advanced Usage

### 1. Web Interface

```bash
# Start migration web interface
npm run migration:web

# Access at http://localhost:3000/migration
# Features:
# - Upload JSON files
# - Configure migrations via UI
# - Monitor progress in real-time
# - View detailed logs and statistics
```

### 2. Programmatic API

```typescript
import { MigrationService } from '../services/MigrationService';

const migrationService = new MigrationService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Start migration
const migration = await migrationService.startMigration({
  sourceFile: './wagdie.json',
  entities: ['character_sheets', 'tokens', 'metadata'],
  config: {
    batchSize: 100,
    parallelBatches: 2,
    checkpointInterval: 1000
  }
});

// Monitor progress
migration.on('progress', (progress) => {
  console.log(`Progress: ${progress.percentage}% (${progress.processedRecords}/${progress.totalRecords})`);
});

migration.on('completed', async (result) => {
  console.log(`Migration completed: ${result.successRate}% success rate`);

  // Validate migration
  const validation = await migrationService.validateMigration(migration.id);
  console.log(`Validation: ${validation.overallStatus}`);
});
```

### 3. Error Recovery

```bash
# Check what failed
npm run migration:status -- [migration-id] --verbose

# Fix issues in source data if needed
# Then resume from checkpoint
npm run migration:resume -- [migration-id]

# Or restart with specific entity
npm run migration:start -- wagdie.json \
  --entities character_sheets \
  --resume-from-entity metadata
```

### 4. Performance Optimization

```bash
# High-performance mode (requires ample processing power)
npm run migration:start -- wagdie.json \
  --parallel-batches 8 \
  --batch-size 2000 \
  --checkpoint-interval 2000

# Memory-constrained mode
npm run migration:start -- wagdie.json \
  --parallel-batches 1 \
  --batch-size 50 \
  --checkpoint-interval 500
```

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```bash
# Increase timeout
npm run migration:start -- wagdie.json --timeout-minutes 60

# Use smaller batches
npm run migration:start -- wagdie.json --batch-size 50
```

#### 2. Memory Issues
```bash
# Reduce parallel processing
npm run migration:start -- wagdie.json --parallel-batches 1

# Smaller batch size
npm run migration:start -- wagdie.json --batch-size 25
```

#### 3. Validation Failures
```bash
# Check validation details
npm run migration:validate -- [migration-id] --verbose

# Skip invalid records
npm run migration:start -- wagdie.json --skip-invalid-records

# Disable strict validation
npm run migration:start -- wagdie.json --no-strict-validation
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=migration:* npm run migration:start -- wagdie.json

# Verbose output
npm run migration:start -- wagdie.json --verbose

# Log to file
npm run migration:start -- wagdie.json 2>&1 | tee migration.log
```

### Rollback

```bash
# Complete rollback
npm run migration:rollback -- [migration-id]

# Verify rollback
npm run migration:status -- [migration-id]
```

## Testing

### Unit Tests
```bash
# Run all migration tests
npm test -- migration

# Specific test suite
npm test -- MigrationService.test.ts
npm test -- DataValidation.test.ts
```

### Integration Tests
```bash
# Test with sample data
npm run test:integration -- --sample-data

# Performance tests
npm run test:performance -- --large-dataset

# Error recovery tests
npm run test:error-recovery
```

### Test with Custom Data
```bash
# Create test data file
echo '{"test": "data"}' > test-data.json

# Run test migration
npm run migration:start -- test-data.json --dry-run --verbose
```

## Monitoring and Metrics

### Real-time Monitoring
```bash
# Watch migration progress
npm run migration:watch -- [migration-id]

# Performance metrics
npm run migration:metrics -- [migration-id] --refresh 5
```

### Post-Migration Reports
```bash
# Generate validation report
npm run migration:report -- [migration-id] --output migration-report.json

# Performance analysis
npm run migration:analyze -- [migration-id] --detailed
```

## Best Practices

### 1. Preparation
- **Always backup** target database before migration
- **Validate JSON structure** with dry run first
- **Test with sample data** before full migration
- **Check database capacity** for additional records

### 2. Performance
- **Use appropriate batch sizes** based on record complexity
- **Monitor memory usage** during migration
- **Leverage parallel processing** when available
- **Set reasonable timeouts** for large datasets

### 3. Error Handling
- **Enable checkpointing** for resumable migrations
- **Set realistic error rate thresholds** (default 1%)
- **Monitor logs** for early error detection
- **Have rollback plan** ready

### 4. Validation
- **Always validate** after migration completion
- **Compare record counts** by entity type
- **Verify foreign key relationships**
- **Check data integrity** with checksums

## Support

### Getting Help
```bash
# Built-in help
npm run migration:help

# Command-specific help
npm run migration:start -- --help

# Version information
npm run migration:version
```

### Documentation
- **API Reference**: `/docs/migration-api.md`
- **Architecture Guide**: `/docs/migration-architecture.md`
- **Troubleshooting**: `/docs/migration-troubleshooting.md`

### Community
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Contributing**: See `/CONTRIBUTING.md` for guidelines

## Next Steps

1. **Run a test migration** with sample data
2. **Validate results** before production migration
3. **Monitor performance** during actual migration
4. **Verify data integrity** after completion
5. **Document any issues** for future improvements