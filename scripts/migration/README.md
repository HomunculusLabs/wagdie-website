# WAGDIE Migration Scripts

Comprehensive data migration toolkit for migrating from **Google Cloud Firestore** to **Supabase PostgreSQL**.

## Overview

This migration system safely exports, transforms, imports, and verifies data with:

- ✅ **Type-safe** transformations using strict TypeScript
- ✅ **EIP-55 address normalization** for Ethereum addresses
- ✅ **SHA-256 checksums** for data integrity verification
- ✅ **Transaction rollback** support for safe imports
- ✅ **Streaming pagination** for memory-efficient exports
- ✅ **Comprehensive validation** at every step
- ✅ **TDD approach** for critical transformation logic

## Architecture

```
scripts/migration/
├── src/
│   ├── cli/           # Command-line interfaces
│   │   ├── export.ts      # Export from Firestore
│   │   ├── transform.ts   # Transform to PostgreSQL format
│   │   ├── import.ts      # Import to Supabase
│   │   └── verify.ts      # Verify data integrity
│   ├── services/      # Business logic
│   │   ├── export-service.ts        # Streaming Firestore export
│   │   ├── validation-service.ts    # Schema & count validation
│   │   ├── transform-service.ts     # Data transformation
│   │   ├── import-service.ts        # Batch PostgreSQL import
│   │   └── verification-service.ts  # Post-migration verification
│   ├── data/          # Database clients
│   │   ├── firestore-client.ts      # Firestore with streaming
│   │   └── supabase-client.ts       # Supabase with batch inserts
│   ├── types/         # TypeScript definitions
│   │   ├── firestore-schema.ts      # Source schema
│   │   ├── postgres-schema.ts       # Target schema
│   │   └── migration-report.ts      # Reporting types
│   └── utils/         # Utilities
│       ├── address-normalizer.ts    # EIP-55 checksumming
│       ├── checksum.ts              # SHA-256 checksums
│       └── logger.ts                # Structured logging
└── tests/
    ├── unit/          # Unit tests (TDD)
    └── integration/   # Integration tests
```

## Prerequisites

- **Node.js** 18+ and npm 9+
- **Firebase Admin SDK** service account JSON
- **Supabase** project with service role key
- **TypeScript** 5.3+

## Installation

```bash
cd scripts/migration
npm install
npm run build
```

## Environment Variables

Create `.env` file:

```env
# Firebase
FIREBASE_SERVICE_ACCOUNT=/path/to/firebase-service-account.json

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Migration Workflow

### Phase 1: Export from Firestore

Export all collections with validation:

```bash
npm run export -- \
  --output ./data/export \
  --validate
```

**What it does:**
- Streams all 4 collections (users, characters, tweets, locations)
- Logs progress every 100 records
- Generates timestamped JSON files
- Validates record counts and generates checksums
- Creates `validation-report_{timestamp}.json`

**Output:**
```
data/export/
├── users_2024-01-15T10-30-00-000Z.json
├── characters_2024-01-15T10-30-00-000Z.json
├── tweets_2024-01-15T10-30-00-000Z.json
├── locations_2024-01-15T10-30-00-000Z.json
└── validation-report_2024-01-15T10-30-00-000Z.json
```

### Phase 2: Transform to PostgreSQL Format

Transform exported data with edge case handling:

```bash
npm run transform -- \
  --input ./data/export \
  --output ./data/transformed \
  --timestamp 2024-01-15T10-30-00-000Z \
  --validate
```

**What it does:**
- Normalizes Ethereum addresses to EIP-55 checksum format
- Converts Firestore Timestamps to ISO 8601 strings
- Consolidates metadata into JSONB fields
- Handles orphaned characters (creates synthetic users)
- Detects duplicate addresses
- Validates foreign key relationships
- Creates `transform-summary_{timestamp}.json`

**Transformations:**
- `ethAddress` → `eth_address` (EIP-55 checksummed)
- `createdAt` (Timestamp) → `created_at` (ISO 8601)
- Character metadata: `name`, `imageUrl`, `attributes` → `metadata` JSONB
- Location capacity: top-level field → `metadata.capacity`
- Burned characters: `owner_address` set to `NULL`

**Output:**
```
data/transformed/
├── users_transformed_2024-01-15T10-30-00-000Z.json
├── characters_transformed_2024-01-15T10-30-00-000Z.json
├── tweets_transformed_2024-01-15T10-30-00-000Z.json
├── locations_transformed_2024-01-15T10-30-00-000Z.json
└── transform-summary_2024-01-15T10-30-00-000Z.json
```

### Phase 3: Import to Supabase

Import with dry-run first:

```bash
# Dry run (validate without committing)
npm run import -- \
  --input ./data/transformed \
  --timestamp 2024-01-15T10-30-00-000Z \
  --dry-run

# Production import with validation
npm run import -- \
  --input ./data/transformed \
  --timestamp 2024-01-15T10-30-00-000Z \
  --validate
```

**What it does:**
- Validates foreign key relationships before import
- Imports in dependency order (users → locations → characters → tweets)
- Uses batch inserts (100 records per batch)
- Logs progress every 100 records
- Validates record counts after import
- Creates `import-report_{timestamp}.json`

**Import Order:**
1. **users** (no dependencies)
2. **locations** (no dependencies)
3. **characters** (depends on users, locations)
4. **tweets** (depends on characters)

### Phase 4: Verify Data Integrity

Comprehensive post-migration verification:

```bash
npm run verify -- \
  --export-dir ./data/export \
  --timestamp 2024-01-15T10-30-00-000Z
```

**What it verifies:**
- ✅ Record counts match between Firestore export and PostgreSQL
- ✅ SHA-256 checksums match (data integrity)
- ✅ Foreign key relationships are valid
- ✅ Data types and formats are correct
- ✅ Ethereum addresses are properly checksummed
- ✅ Timestamps are valid ISO 8601 format
- ✅ Burned characters have NULL owner_address

**Output:**
```
data/export/verification-report_2024-01-15T10-30-00-000Z.json
```

### Rollback (if needed)

Rollback removes all imported data:

```bash
npm run import -- --rollback
```

**⚠️ WARNING:** This deletes all data from migration tables in reverse dependency order.

## CLI Reference

### Export Command

```bash
npm run export -- [options]

Options:
  -o, --output <dir>                Output directory for JSON files (required)
  -v, --validate                    Run validation after export
  -p, --progress-interval <number>  Log progress every N records (default: 100)
  -s, --service-account <path>      Firebase service account JSON path
```

### Transform Command

```bash
npm run transform -- [options]

Options:
  -i, --input <dir>          Input directory with exported JSON files (required)
  -o, --output <dir>         Output directory for transformed JSON (required)
  -t, --timestamp <string>   Timestamp from export (required)
  -v, --validate             Validate foreign key relationships
```

### Import Command

```bash
npm run import -- [options]

Options:
  -i, --input <dir>          Input directory with transformed JSON (required)
  -t, --timestamp <string>   Timestamp from transformation (required)
  --dry-run                  Validate without committing to database
  -v, --validate             Run post-import validation
  --rollback                 Rollback previous import
  --supabase-url <url>       Supabase project URL
  --supabase-key <key>       Supabase service role key
```

### Verify Command

```bash
npm run verify -- [options]

Options:
  -e, --export-dir <dir>         Directory with exported JSON files (required)
  -t, --timestamp <string>       Timestamp from export (required)
  -s, --spot-check <percentage>  Percentage of records to spot-check (default: 1)
  --supabase-url <url>           Supabase project URL
  --supabase-key <key>           Supabase service role key
```

## Edge Cases Handled

### Orphaned Characters

Characters with `owner_address` that don't exist in users:

**Solution:** Creates synthetic user records with:
- `eth_address`: checksummed owner address
- `created_at`: current timestamp
- `login_count`: 0

### Duplicate Addresses

Multiple user records with different casing (e.g., `0xabc...` and `0xABC...`):

**Solution:**
- Normalizes all addresses to EIP-55 checksum format
- Detects and reports duplicates
- Logs for manual review (merging requires business logic)

### Burned NFTs

Characters that have been burned (no owner):

**Solution:**
- Sets `owner_address` to `NULL`
- Preserves `burned: true` flag

### Invalid Location References

Characters with `location_id` that doesn't exist:

**Solution:**
- Sets `location_id` to `NULL`
- Logs warning for review

## Data Integrity

### Checksums

SHA-256 checksums are calculated for key fields:

```typescript
// users
['eth_address', 'created_at', 'login_count']

// characters
['token_id', 'contract_address', 'owner_address', 'burned', 'infected']

// tweets
['id', 'author_id', 'content', 'created_at']

// locations
['id', 'name']
```

**Process:**
1. Calculate checksum for each record
2. Sort checksums alphabetically
3. Concatenate and hash → collection checksum

### Validation Layers

1. **Export validation**: Schema checks, count verification
2. **Transform validation**: Foreign key checks, duplicate detection
3. **Import validation**: Record count comparison
4. **Verification**: Checksum comparison, spot-check sampling

## Logging

Structured JSON logs using Pino:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "component": "ExportService",
  "collection": "users",
  "msg": "Exported 1000 records from users"
}
```

**Development:** Pretty-printed colored logs
**Production:** JSON logs for parsing/analysis

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Test Coverage:**
- Export service: streaming pagination, progress tracking
- Transform service: all entity types, edge cases
- Import service: batch processing, rollback
- Verification: checksums, foreign keys, data types

## Performance

Tested with 10,000 characters + 1,000 users:

| Phase       | Duration | Memory Usage |
|-------------|----------|--------------|
| Export      | ~2-3 min | ~200 MB      |
| Transform   | ~30 sec  | ~150 MB      |
| Import      | ~3-4 min | ~250 MB      |
| Verify      | ~1 min   | ~200 MB      |
| **Total**   | ~7-9 min | Peak: 250 MB |

**Optimization:**
- Streaming pagination (500 docs/batch export)
- Batch inserts (100 rows/batch import)
- Minimal memory footprint

## Troubleshooting

### "Export file not found"

Ensure the timestamp matches exactly:

```bash
ls data/export/
# Find: users_2024-01-15T10-30-00-000Z.json
# Use: --timestamp 2024-01-15T10-30-00-000Z
```

### "Foreign key violation"

Run transform with `--validate` to detect issues before import:

```bash
npm run transform -- ... --validate
```

### "Checksum mismatch"

Data was modified between export and verification. Re-run export:

```bash
npm run export -- --output ./data/export --validate
```

### "Invalid Ethereum address"

Ensure addresses are properly formatted:
- Must start with `0x`
- Must be 42 characters (0x + 40 hex chars)
- Will be normalized to EIP-55 checksum automatically

## Development

Type-checking:

```bash
npm run type-check
```

Linting:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Production Checklist

- [ ] Test migration on staging/test environment first
- [ ] Backup existing Firestore data
- [ ] Run export with `--validate`
- [ ] Run transform with `--validate`
- [ ] Run import with `--dry-run` first
- [ ] Review all validation reports
- [ ] Run verification after import
- [ ] Test application features with migrated data
- [ ] Keep Firestore data until cutover is confirmed
- [ ] Document any manual interventions required

## Support

See `MIGRATION_RUNBOOK.md` for detailed step-by-step instructions.

For issues, consult the structured logs:

```bash
# Filter by component
grep "ExportService" logs.json | jq

# Filter by error level
grep "level\":\"error" logs.json | jq
```

## License

MIT
