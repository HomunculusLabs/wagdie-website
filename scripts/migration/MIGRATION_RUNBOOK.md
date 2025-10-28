# WAGDIE Migration Runbook

**Version:** 1.0.0
**Last Updated:** 2025-10-27
**Estimated Duration:** 2-4 hours (depending on data size)

## Pre-Migration Checklist

### 1. Environment Preparation

- [ ] Node.js 18+ installed
- [ ] Firebase Admin SDK credentials available
- [ ] Supabase project created with schema deployed
- [ ] `.env` file configured with credentials
- [ ] Migration scripts built (`npm run build`)
- [ ] Test environment available for dry run

### 2. Backup & Safety

- [ ] **CRITICAL:** Backup Firestore data using Firebase export
- [ ] Document current Firestore record counts
- [ ] Create Supabase database snapshot/backup
- [ ] Notify team of migration window
- [ ] Plan rollback strategy
- [ ] Set up monitoring/alerts

### 3. Validation

- [ ] Run migration on test environment first
- [ ] Verify application works with test data
- [ ] Review all error logs from test run
- [ ] Confirm performance is acceptable

---

## Migration Steps

### Step 1: Pre-Migration Snapshot

**Duration:** 5-10 minutes

Document current state for comparison:

```bash
# Record Firestore counts
firebase firestore:indexes | grep "users\|characters\|tweets\|locations"

# Or use Firebase Console to manually record counts:
# - users: _____
# - characters: _____
# - tweets: _____
# - locations: _____
```

**Checkpoint:** Save counts to `pre-migration-counts.txt`

---

### Step 2: Export from Firestore

**Duration:** 5-15 minutes (depending on data size)

```bash
cd scripts/migration

# Export with validation
npm run export -- \
  --output ./data/export \
  --service-account $FIREBASE_SERVICE_ACCOUNT \
  --validate

# WAIT FOR: "✅ Export completed successfully"
```

**Expected Output:**
```
=== Export Summary ===
Status: ✅ SUCCESS
Total Records: 11,234

Collections:
  - users: 1,000 records (2345ms)
  - characters: 10,000 records (12890ms)
  - tweets: 200 records (456ms)
  - locations: 34 records (123ms)

=== Validation Summary ===
Status: ✅ PASSED

Record Counts:
  ✅ users: exported=1000, source=1000
  ✅ characters: exported=10000, source=10000
  ✅ tweets: exported=200, source=200
  ✅ locations: exported=34, source=34

Checksums:
  - users: a7f3c9d... (1000 records)
  - characters: b4e8f2a... (10000 records)
  - tweets: c9d5e1b... (200 records)
  - locations: d1a2b3c... (34 records)

📄 Validation report saved: ./data/export/validation-report_2024-01-15T10-30-00-000Z.json
```

**Verification Steps:**

1. Check that all 4 JSON files were created:
   ```bash
   ls -lh data/export/
   # Should see: users_*, characters_*, tweets_*, locations_*
   ```

2. Verify file sizes are reasonable:
   ```bash
   # Users: ~50 KB per 1000 users
   # Characters: ~500 KB per 1000 characters
   # Tweets: ~20 KB per 100 tweets
   # Locations: ~5 KB per 10 locations
   ```

3. Open validation report and confirm:
   - All record counts match
   - No warnings or errors
   - Checksums are generated

**⚠️ STOP CONDITIONS:**
- Record count mismatch → Investigate and re-export
- Export errors → Check Firestore permissions
- Missing collections → Verify collection names

**Checkpoint:** Export validated ✅

---

### Step 3: Transform to PostgreSQL Format

**Duration:** 2-5 minutes

```bash
# Note the timestamp from Step 2 (from filename)
export TIMESTAMP="2024-01-15T10-30-00-000Z"

npm run transform -- \
  --input ./data/export \
  --output ./data/transformed \
  --timestamp $TIMESTAMP \
  --validate

# WAIT FOR: "✅ Transform completed successfully"
```

**Expected Output:**
```
=== Transform Summary ===
Status: ✅ SUCCESS

Collections:
  ✅ users: 1000 → 1000 records
  ✅ characters: 10000 → 10000 records
  ✅ tweets: 200 → 200 records
  ✅ locations: 34 → 34 records

Edge Cases:
  - Orphaned characters: 3 synthetic users created
  - Duplicate addresses: 2 groups found
  - Burned characters: 15 handled
  - Invalid location refs: 0 found

📄 Transform summary saved: ./data/transformed/transform-summary_2024-01-15T10-30-00-000Z.json
```

**Verification Steps:**

1. Review edge cases in transform summary:
   ```bash
   cat data/transformed/transform-summary_$TIMESTAMP.json | jq '.edgeCases'
   ```

2. **Orphaned characters:** Review synthetic users created:
   ```bash
   # Check logs for: "Created synthetic user records for orphaned character owners"
   grep "orphaned" data/transformed/transform-summary_$TIMESTAMP.json
   ```

3. **Duplicate addresses:** Review duplicates for manual merging:
   ```bash
   # Check logs for: "Duplicate user addresses detected"
   grep "duplicateAddresses" data/transformed/transform-summary_$TIMESTAMP.json
   ```

4. **Burned characters:** Verify count matches expectations:
   ```bash
   # Check: "Burned characters: N handled"
   grep "burnedCharacters" data/transformed/transform-summary_$TIMESTAMP.json
   ```

**⚠️ STOP CONDITIONS:**
- Transformation errors → Check data format issues
- Unexpected orphaned characters → Verify user export completeness
- High duplicate address count → May require manual deduplication

**Checkpoint:** Transformation validated ✅

---

### Step 4: Dry Run Import (CRITICAL)

**Duration:** 3-5 minutes

**⚠️ DO NOT SKIP THIS STEP**

```bash
npm run import -- \
  --input ./data/transformed \
  --timestamp $TIMESTAMP \
  --dry-run

# WAIT FOR: "✅ DRY RUN completed"
```

**Expected Output:**
```
=== Import Summary ===
Status: ✅ SUCCESS
Mode: 🔍 DRY RUN

Totals:
  - Attempted: 11,003
  - Inserted: 0 (dry run)
  - Failed: 0
```

**Verification Steps:**

1. Confirm no errors in dry run
2. Verify foreign key validation passed
3. Check estimated import time

**⚠️ STOP CONDITIONS:**
- Foreign key violations → Fix in transform step
- Validation errors → Check data integrity
- Connection issues → Verify Supabase credentials

**Checkpoint:** Dry run passed ✅

---

### Step 5: Production Import

**Duration:** 5-20 minutes (depending on data size)

**⚠️ POINT OF NO RETURN (without rollback)**

```bash
npm run import -- \
  --input ./data/transformed \
  --timestamp $TIMESTAMP \
  --validate

# WAIT FOR: "✅ Import completed successfully"
```

**Expected Output:**
```
=== Import Summary ===
Status: ✅ SUCCESS
Mode: 💾 PRODUCTION

Totals:
  - Attempted: 11,003
  - Inserted: 11,003
  - Failed: 0

Tables:
  ✅ users: 1003/1003 inserted (2345ms)
  ✅ locations: 34/34 inserted (123ms)
  ✅ characters: 10000/10000 inserted (12890ms)
  ✅ tweets: 200/200 inserted (567ms)

=== Post-Import Validation ===
✅ Validation passed - record counts match

📄 Import report saved: ./data/transformed/import-report_2024-01-15T10-30-00-000Z.json
```

**Verification Steps:**

1. Verify all tables imported successfully:
   ```bash
   cat data/transformed/import-report_$TIMESTAMP.json | jq '.tables'
   ```

2. Check Supabase dashboard for record counts:
   - Go to Table Editor
   - Verify counts match import report

3. Sample query in Supabase SQL Editor:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM characters;
   SELECT COUNT(*) FROM tweets;
   SELECT COUNT(*) FROM locations;
   ```

**⚠️ ERROR RECOVERY:**

If import fails partway through:

```bash
# Rollback and retry
npm run import -- --rollback

# Fix any issues in transformed data

# Re-run import
npm run import -- \
  --input ./data/transformed \
  --timestamp $TIMESTAMP \
  --validate
```

**Checkpoint:** Import completed ✅

---

### Step 6: Comprehensive Verification

**Duration:** 5-10 minutes

**⚠️ CRITICAL VALIDATION STEP**

```bash
npm run verify -- \
  --export-dir ./data/export \
  --timestamp $TIMESTAMP

# WAIT FOR: "✅ Verification passed"
```

**Expected Output:**
```
=== Verification Results ===
Status: ✅ PASSED

Summary:
  - Total records verified: 11,003
  - Critical issues: 0
  - Warnings: 0
  - Total discrepancies: 0

=== Record Count Validation ===
✅ users: export=1003, database=1003
✅ characters: export=10000, database=10000
✅ tweets: export=200, database=200
✅ locations: export=34, database=34

=== Checksum Validation ===
✅ users:
     Export:   a7f3c9d...
     Database: a7f3c9d...
✅ characters:
     Export:   b4e8f2a...
     Database: b4e8f2a...
✅ tweets:
     Export:   c9d5e1b...
     Database: c9d5e1b...
✅ locations:
     Export:   d1a2b3c...
     Database: d1a2b3c...

=== Foreign Key Validation ===
✅ All foreign key relationships valid

=== Data Type Validation ===
✅ All data types valid

📄 Verification report saved: ./data/export/verification-report_2024-01-15T10-30-00-000Z.json
```

**Verification Steps:**

1. **Record Counts:** All must match
   - If mismatch → Check import logs for skipped records

2. **Checksums:** All must match
   - If mismatch → Data corruption occurred, rollback and re-import

3. **Foreign Keys:** Zero violations
   - If violations → Transform step had issues, rollback and fix

4. **Data Types:** Zero violations
   - If violations → Format issues, may be warnings only

**⚠️ ROLLBACK CONDITIONS:**
- Checksum mismatch (data corruption)
- Foreign key violations
- Record count mismatch >1%

```bash
# ROLLBACK PROCEDURE
npm run import -- --rollback

# Then:
# 1. Review errors in verification report
# 2. Fix issues in transform or import steps
# 3. Re-run from Step 4 (dry run)
```

**Checkpoint:** Verification passed ✅

---

### Step 7: Application Testing

**Duration:** 30-60 minutes

Test critical application features:

#### User Authentication
- [ ] Users can log in with their wallet
- [ ] Login count increments correctly
- [ ] User profile loads correctly

#### Character Display
- [ ] Character listings load
- [ ] Character details (metadata) display correctly
- [ ] Burned characters show as burned
- [ ] Infected status displays correctly
- [ ] Character location displays (if applicable)

#### Tweets/Social
- [ ] Tweets display with correct author
- [ ] Tweet timestamps are correct
- [ ] Character tweets load on profile pages

#### Locations
- [ ] Location listings load
- [ ] Location details display
- [ ] Character counts per location are correct

**Test Queries:**

```sql
-- Verify user with most characters
SELECT
  u.eth_address,
  COUNT(c.token_id) as character_count
FROM users u
LEFT JOIN characters c ON c.owner_address = u.eth_address
GROUP BY u.eth_address
ORDER BY character_count DESC
LIMIT 10;

-- Verify burned characters have no owner
SELECT COUNT(*) FROM characters
WHERE burned = true AND owner_address IS NOT NULL;
-- Should return: 0

-- Verify all tweets have valid authors
SELECT COUNT(*) FROM tweets t
LEFT JOIN characters c ON c.token_id = CAST(SPLIT_PART(t.author_id, '_', 2) AS INTEGER)
WHERE c.token_id IS NULL;
-- Should return: 0

-- Verify address checksumming
SELECT eth_address FROM users LIMIT 10;
-- All should have mixed case (EIP-55)
```

**Checkpoint:** Application testing passed ✅

---

### Step 8: Production Cutover

**Duration:** 5 minutes

1. Update application environment variables:
   ```env
   # OLD (Firestore)
   USE_FIRESTORE=true
   FIREBASE_PROJECT_ID=wagdie-prod

   # NEW (Supabase)
   USE_FIRESTORE=false
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. Deploy application with Supabase configuration

3. Monitor for errors:
   - Check application logs
   - Monitor Supabase dashboard for unusual queries
   - Watch for user-reported issues

4. **Keep Firestore running** for 7-14 days as backup

**Checkpoint:** Cutover complete ✅

---

## Post-Migration

### Monitoring (First 24 Hours)

- [ ] Monitor Supabase query performance
- [ ] Watch for database errors in application logs
- [ ] Check user authentication success rate
- [ ] Verify data loads are fast enough
- [ ] Monitor memory/CPU usage

### Validation (First Week)

- [ ] Spot-check data daily
- [ ] Compare key metrics (user counts, character counts)
- [ ] Verify no data drift
- [ ] Test edge cases (new users, character transfers, etc.)

### Cleanup (After 2 Weeks)

- [ ] Firestore data can be archived/deleted
- [ ] Remove Firebase dependencies from application
- [ ] Update documentation
- [ ] Archive migration scripts and reports

---

## Rollback Procedure

**If critical issues are discovered post-cutover:**

### Immediate Rollback (< 1 hour after cutover)

1. Revert application to Firestore:
   ```env
   USE_FIRESTORE=true
   ```

2. Deploy reverted application

3. Investigate issues in Supabase data

### Data Rollback (> 1 hour after cutover)

**⚠️ WARNING:** This deletes all migrated data

1. Run rollback command:
   ```bash
   npm run import -- --rollback
   ```

2. Verify tables are empty:
   ```sql
   SELECT COUNT(*) FROM users;     -- Should be 0
   SELECT COUNT(*) FROM characters; -- Should be 0
   SELECT COUNT(*) FROM tweets;     -- Should be 0
   SELECT COUNT(*) FROM locations;  -- Should be 0
   ```

3. Re-run migration from Step 1

---

## Troubleshooting

### Issue: "Record count mismatch"

**Symptoms:** Export count ≠ Database count

**Diagnosis:**
```bash
# Check import report for failed inserts
cat data/transformed/import-report_$TIMESTAMP.json | jq '.tables[] | select(.failed > 0)'
```

**Resolution:**
- Review error logs for specific failures
- Check for duplicate key violations
- Verify foreign key constraints
- Re-run import if < 1% failure rate

---

### Issue: "Checksum mismatch"

**Symptoms:** Export checksum ≠ Database checksum

**Diagnosis:**
```bash
# Compare checksums
cat data/export/verification-report_$TIMESTAMP.json | jq '.checksums'
```

**Resolution:**
- **CRITICAL:** Data corruption detected
- Rollback immediately
- Do not proceed with cutover
- Investigate transformation or import errors
- Re-run migration after fix

---

### Issue: "Foreign key violations"

**Symptoms:** Orphaned records detected

**Diagnosis:**
```bash
# Check violation details
cat data/export/verification-report_$TIMESTAMP.json | jq '.foreignKeys.violations'
```

**Resolution:**
- Review transform step logs
- Check orphaned character handling
- Verify synthetic user creation
- May require manual data cleanup

---

### Issue: "Application performance slow"

**Symptoms:** Queries taking too long

**Diagnosis:**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM characters WHERE owner_address = '0x...';
```

**Resolution:**
- Verify PostgreSQL indexes are created
- Check Supabase query optimization
- Monitor connection pool usage
- Consider adding missing indexes

---

## Emergency Contacts

- **Migration Lead:** [Name]
- **Database Admin:** [Name]
- **Application Team:** [Team Channel]
- **Supabase Support:** https://supabase.com/support

---

## Success Criteria

Migration is considered successful when:

- ✅ All record counts match (100%)
- ✅ All checksums match
- ✅ Zero foreign key violations
- ✅ Zero critical data type issues
- ✅ Application features work correctly
- ✅ Performance is acceptable (< 500ms query times)
- ✅ No user-reported data issues for 7 days

---

## Appendix: Quick Reference

### File Locations

```
scripts/migration/data/
├── export/
│   ├── users_<timestamp>.json
│   ├── characters_<timestamp>.json
│   ├── tweets_<timestamp>.json
│   ├── locations_<timestamp>.json
│   └── validation-report_<timestamp>.json
├── transformed/
│   ├── users_transformed_<timestamp>.json
│   ├── characters_transformed_<timestamp>.json
│   ├── tweets_transformed_<timestamp>.json
│   ├── locations_transformed_<timestamp>.json
│   ├── transform-summary_<timestamp>.json
│   └── import-report_<timestamp>.json
```

### Command Cheat Sheet

```bash
# Export
npm run export -- --output ./data/export --validate

# Transform
npm run transform -- --input ./data/export --output ./data/transformed --timestamp <TS> --validate

# Import (dry run)
npm run import -- --input ./data/transformed --timestamp <TS> --dry-run

# Import (production)
npm run import -- --input ./data/transformed --timestamp <TS> --validate

# Verify
npm run verify -- --export-dir ./data/export --timestamp <TS>

# Rollback
npm run import -- --rollback
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-27
**Next Review:** After first production migration
