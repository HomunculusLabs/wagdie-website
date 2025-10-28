# Migration Quickstart Guide

**Feature**: Data Migration from Legacy WAGDIE
**Date**: 2025-10-27
**Audience**: WAGDIE Administrators

## Overview

This guide provides step-by-step instructions for executing the WAGDIE data migration from Firestore to Supabase PostgreSQL. Follow these steps in order to ensure a safe, successful migration with zero data loss.

---

## Prerequisites

Before starting the migration, ensure you have:

### 1. Access Credentials

- [ ] **Firebase Service Account Key**: JSON file with read access to legacy Firestore database
- [ ] **Supabase Service Role Key**: Admin key with full database access (NOT the anon key)
- [ ] **Project URLs**: Firestore project ID and Supabase project URL

### 2. Software Requirements

- [ ] **Node.js 18+** installed (`node --version` to check)
- [ ] **npm** or **yarn** installed
- [ ] **Git** installed (to clone repository if needed)
- [ ] **Terminal/Command Line** access

### 3. Preparation

- [ ] **Backup Firestore Database**: Verify a recent backup exists
- [ ] **Test Supabase Instance**: Create a free-tier test project for dry-run
- [ ] **Maintenance Window**: Schedule 4-hour window with user notification
- [ ] **Rollback Plan**: Document how to revert if critical issues occur

---

## Step 1: Setup Migration Scripts

### 1.1 Navigate to Migration Directory

```bash
cd wagdie-simplified/scripts/migration
```

### 1.2 Install Dependencies

```bash
npm install
```

Expected dependencies:
- `firebase-admin` (Firestore SDK)
- `@supabase/supabase-js` (Supabase client)
- `ethers` (Address normalization)
- `pino` (Logging)
- `dotenv` (Environment variables)

### 1.3 Configure Credentials

Create a `.env` file in `scripts/migration/`:

```bash
# Firestore Source
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-service-account.json
FIRESTORE_PROJECT_ID=wagdie-legacy

# Supabase Target
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

⚠️ **Security**: NEVER commit `.env` file to git!

### 1.4 Verify Connection

Test that credentials work:

```bash
npm run test:connection
```

Expected output:
```
✓ Firestore connected: wagdie-legacy
✓ Supabase connected: https://xxxxx.supabase.co
✓ PostgreSQL schema validated
```

---

## Step 2: Dry Run on Test Instance

**CRITICAL**: Always run on test instance first!

### 2.1 Switch to Test Supabase

In `.env`, temporarily change to test instance:

```bash
SUPABASE_URL=https://test-xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 2.2 Run Full Migration

```bash
npm run migrate -- --dry-run
```

This will:
1. Export all Firestore data
2. Validate exported data
3. Transform to PostgreSQL format
4. Import to test Supabase
5. Verify data integrity
6. Generate report

### 2.3 Review Dry Run Report

Check `scripts/migration/data/reports/migration-report-{timestamp}.json`:

```json
{
  "status": "success",
  "timestamp": "2025-10-27T10:30:00Z",
  "duration_ms": 180000,
  "records": {
    "users": { "exported": 1000, "imported": 1000, "checksum_match": true },
    "characters": { "exported": 10000, "imported": 10000, "checksum_match": true },
    "tweets": { "exported": 5000, "imported": 5000, "checksum_match": true },
    "locations": { "exported": 10, "imported": 10, "checksum_match": true }
  },
  "errors": [],
  "warnings": [
    "Character 1234: owner address not found in users, created user record"
  ]
}
```

✅ **Success Criteria**: All checksums match, zero errors, warnings reviewed

### 2.4 Verify Test Data

Manually spot-check a few records in test Supabase:

```bash
npm run verify -- --sample-size 100
```

---

## Step 3: Production Migration

**IMPORTANT**: Only proceed if dry run succeeded!

### 3.1 Announce Maintenance Window

Notify users via:
- Discord/community channels
- Website banner
- Twitter/X announcement

Example message:
> WAGDIE is undergoing a migration to simplified infrastructure. The platform will be in read-only mode for up to 4 hours starting at [TIME]. Thank you for your patience!

### 3.2 Set Production Credentials

In `.env`, update to production Supabase:

```bash
SUPABASE_URL=https://prod-xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NODE_ENV=production
```

### 3.3 Final Backup Check

Verify Firestore backup is current:

```bash
npm run backup:verify
```

### 3.4 Execute Migration

```bash
npm run migrate
```

**Phases** (estimated times):
1. **Export** (~10-15 min): Fetch all Firestore data
2. **Validate** (~5 min): Verify export completeness
3. **Transform** (~5-10 min): Map to PostgreSQL schema
4. **Import** (~20-30 min): Insert into Supabase
5. **Verify** (~10 min): Validate data integrity

**Total**: 50-70 minutes

### 3.5 Monitor Progress

Watch live logs:

```bash
tail -f scripts/migration/data/reports/migration-{timestamp}.log
```

Key milestones:
- ✓ Export phase complete
- ✓ Validation passed
- ✓ Transformation complete
- ✓ Import phase started
- ✓ Import phase complete
- ✓ Verification passed

---

## Step 4: Post-Migration Verification

### 4.1 Run Comprehensive Verification

```bash
npm run verify:full
```

Checks:
- [ ] Record counts match (Firestore vs Supabase)
- [ ] Checksums match for all entities
- [ ] Foreign key relationships valid
- [ ] No orphaned records
- [ ] Spot-check 1% random sample

### 4.2 Test Application Functions

Manually test critical paths:
- [ ] User can connect wallet and login
- [ ] User sees their NFT characters
- [ ] Character metadata displays correctly
- [ ] Game state (burned, infected, location) is accurate
- [ ] Tweets load correctly

### 4.3 Review Migration Report

Examine final report at `data/reports/migration-report-{timestamp}.json`:

**Success Indicators**:
- `status: "success"`
- `errors: []` (empty array)
- All `checksum_match: true`
- Warnings reviewed and acceptable

**Failure Indicators**:
- `status: "failed"`
- Non-empty `errors` array
- Checksum mismatches
- Significant data loss

### 4.4 Decision Point: Commit or Rollback

**If verification passed**:
- ✅ Proceed to Step 5 (Cutover)

**If verification failed**:
- ❌ Execute rollback (see Step 6)
- Investigate errors
- Fix issues and retry

---

## Step 5: Production Cutover

### 5.1 Update Application Environment Variables

In Vercel dashboard, update:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 5.2 Deploy New Application Version

```bash
git push origin main
```

Vercel will auto-deploy. Wait for deployment to complete (~2-3 minutes).

### 5.3 Verify Production Application

- [ ] Visit production URL
- [ ] Connect wallet and authenticate
- [ ] Verify user data loads correctly
- [ ] Check character display
- [ ] Test all major features

### 5.4 Announce Completion

Notify users:
> WAGDIE migration complete! The platform is back online with improved infrastructure. Thank you for your patience!

---

## Step 6: Rollback Procedure (If Needed)

If critical issues are discovered:

### 6.1 Revert Application Environment

In Vercel dashboard, revert to old Firestore config:

```bash
# (Previous Firestore environment variables)
```

### 6.2 Rollback Database (If Import Ran)

If import transaction is still active:

```bash
npm run rollback
```

This triggers PostgreSQL transaction rollback, returning database to pre-migration state.

⏱️ **Rollback Time**: <30 minutes (usually <1 minute if transaction-based)

### 6.3 Verify Rollback Success

Check that Supabase database is empty or in pre-migration state:

```bash
npm run verify:empty
```

### 6.4 Investigate Issues

Review error logs:

```bash
cat scripts/migration/data/reports/migration-{timestamp}.log | grep ERROR
```

Fix issues, test on test instance, then retry production migration.

---

## Step 7: Post-Migration Monitoring

### First 24 Hours

- [ ] Monitor user-reported issues (Discord, support channels)
- [ ] Check database performance metrics
- [ ] Verify no data discrepancies reported
- [ ] Track authentication success rate

### First Week

- [ ] Zero critical data issues reported
- [ ] Performance meets expectations (<3s page loads)
- [ ] No increase in error rates
- [ ] Community feedback positive

### Cleanup (After 1 Week)

If all is stable:
- [ ] Archive Firestore data (keep as backup)
- [ ] Document any edge cases encountered
- [ ] Update migration runbook with lessons learned
- [ ] Consider decommissioning legacy Firestore project (after 30 days)

---

## Troubleshooting

### Issue: "Invalid Ethereum address" errors during transformation

**Cause**: Firestore has malformed addresses (not 0x + 40 hex chars)

**Solution**:
1. Review error log for specific document IDs
2. Manually inspect those documents in Firestore
3. Either fix in Firestore and re-export, or add data cleaning step

---

### Issue: Checksum mismatch after import

**Cause**: Data modified during migration (race condition) or transformation bug

**Solution**:
1. Check if Firestore is truly read-only during migration
2. Review transformation logic for specific entity type
3. Run spot-check to identify discrepancies
4. Fix transformation logic and retry

---

### Issue: Orphaned characters (no matching user)

**Cause**: NFT owner never logged into legacy system

**Solution** (already handled automatically):
- Migration script creates user record for orphaned character owners
- Review warnings in report to see how many were created
- No action needed unless count seems abnormally high

---

### Issue: Migration timeout (exceeds 4 hours)

**Cause**: Data volume larger than expected or network issues

**Solution**:
1. Check network latency to Firestore/Supabase
2. Increase batch sizes in export/import scripts
3. Consider running migration from server closer to GCP/Supabase regions
4. If necessary, split migration into multiple batches (by entity type)

---

## Command Reference

| Command | Description | Estimated Time |
|---------|-------------|----------------|
| `npm run test:connection` | Verify credentials | 10 seconds |
| `npm run migrate -- --dry-run` | Test migration | 50-70 minutes |
| `npm run migrate` | Production migration | 50-70 minutes |
| `npm run verify` | Quick verification | 5 minutes |
| `npm run verify:full` | Comprehensive verification | 10 minutes |
| `npm run rollback` | Revert database | <1 minute |
| `npm run backup:verify` | Check Firestore backup | 30 seconds |

---

## Success Checklist

Before marking migration complete, verify:

- [ ] All record counts match (Firestore → Supabase)
- [ ] All checksums validated
- [ ] Zero critical errors
- [ ] Application functions correctly
- [ ] Users can authenticate and see data
- [ ] Performance metrics acceptable
- [ ] Warnings reviewed and documented
- [ ] Rollback procedure tested (on test instance)
- [ ] Community notified of completion

---

## Support

If you encounter issues during migration:

1. **Check migration report**: `data/reports/migration-report-{timestamp}.json`
2. **Review logs**: `data/reports/migration-{timestamp}.log`
3. **Consult troubleshooting section** above
4. **Open GitHub issue** with:
   - Migration report (redact sensitive data)
   - Error logs
   - Steps to reproduce
5. **Contact maintainers** via Discord/community channels

---

**Migration Quickstart Complete**

You're now ready to execute the WAGDIE data migration safely and efficiently!
