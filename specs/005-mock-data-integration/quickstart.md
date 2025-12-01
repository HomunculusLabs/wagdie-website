# Quickstart: Running the Database Seed Script

**Feature**: 005-mock-data-integration
**Date**: 2025-10-29

## Overview

This guide explains how to populate the database with sample data for testing and demonstration purposes.

## Prerequisites

Before running the seed script, ensure:

1. **Supabase is running** (local or remote instance)
2. **Database migrations are applied**
3. **Environment variables are configured**
4. **Node.js 18+ is installed**

## Step-by-Step Guide

### 1. Verify Database Migrations

Ensure all migrations have been applied:

```bash
# If using Supabase CLI locally
npx supabase db push

# Or check migration status
npx supabase migration list
```

Expected migrations:
- `20250101000000_initial_schema.sql` ✅
- `20251028000000_page_wireframes_schema.sql` ✅
- `20251029000000_blockchain_integration.sql` ✅

### 2. Configure Environment Variables

The seed script requires the service role key to bypass RLS policies:

```bash
# Option 1: Export in terminal (temporary)
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Option 2: Add to .env.local (persistent)
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env.local
```

**Where to find the service role key**:
- **Local Supabase**: Run `npx supabase status` → copy `service_role key`
- **Remote Supabase**: Project Settings → API → `service_role` secret key

**Security Note**: Never commit service role keys to version control!

### 3. Install Dependencies

Ensure `ts-node` is available:

```bash
npm install
# ts-node should be included in devDependencies
```

### 4. Run the Seed Script

```bash
# Using npm script (recommended)
npm run seed

# Or directly with ts-node
npx ts-node scripts/seed-database.ts

# Or with environment variable inline
SUPABASE_SERVICE_ROLE_KEY=your_key npx ts-node scripts/seed-database.ts
```

Expected output:
```
🌱 Starting database seed...

✅ Seeding users... 3 created
✅ Seeding characters... 50 created
✅ Seeding character concords... 10 created
✅ Seeding tweets... 60 created

📊 Seed Summary:
┌────────────────────┬─────────┬────────┬────────┐
│ Entity             │ Success │ Failed │ Skipped│
├────────────────────┼─────────┼────────┼────────┤
│ Users              │ 3       │ 0      │ 0      │
│ Characters         │ 50      │ 0      │ 0      │
│ Character Concords │ 10      │ 0      │ 0      │
│ Tweets             │ 60      │ 0      │ 0      │
└────────────────────┴─────────┴────────┴────────┘

✅ Seed completed successfully in 2.3s
```

### 5. Verify Data

Open your browser and verify sample data is visible:

**Characters Browse Page**:
```bash
# Visit http://localhost:3000/characters
# Expected: 50 characters displayed in grid
```

**Character Detail Page**:
```bash
# Visit http://localhost:3000/characters/1
# Expected: Grim Theron's character sheet with stats, equipment, story
```

**Lore Feed**:
```bash
# Visit http://localhost:3000/lore
# Expected: 60 tweets with text, images, and videos
```

**Filter Testing**:
- Click "Owned" tab → should show 40 characters (owned by test wallets)
- Click "Infected" tab → should show 17 infected characters
- Click "Staked" tab → should show 25 staked characters

### 6. Re-run Safely (Idempotency Test)

The seed script is idempotent - running it multiple times is safe:

```bash
npm run seed
```

Expected output:
```
🌱 Starting database seed...

⏭️  Skipping existing users... 3 already exist
⏭️  Skipping existing characters... 50 already exist
⏭️  Skipping existing character concords... 10 already exist
⏭️  Skipping existing tweets... 60 already exist

📊 Seed Summary:
┌────────────────────┬─────────┬────────┬────────┐
│ Entity             │ Success │ Failed │ Skipped│
├────────────────────┼─────────┼────────┼────────┤
│ Users              │ 0       │ 0      │ 3      │
│ Characters         │ 0       │ 0      │ 50     │
│ Character Concords │ 0       │ 0      │ 10     │
│ Tweets             │ 0       │ 0      │ 60     │
└────────────────────┴─────────┴────────┴────────┘

✅ Seed completed successfully in 0.8s
```

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Problem**: Environment variable not set

**Solution**:
```bash
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"
# Then run seed script again
```

### Error: "Connection refused to database"

**Problem**: Supabase is not running

**Solution**:
```bash
# If using local Supabase
npx supabase start

# Verify it's running
npx supabase status
```

### Error: "Constraint violation: duplicate key"

**Problem**: Data already exists (expected behavior)

**Solution**: This is normal! The script will skip existing records. Check the "Skipped" column in the summary report.

### Error: "Foreign key constraint violation"

**Problem**: Missing locations or concords (migrations not applied)

**Solution**:
```bash
# Apply migrations
npx supabase db push

# Verify locations exist
npx supabase db query "SELECT * FROM locations;"

# Verify concords exist
npx supabase db query "SELECT * FROM concords;"
```

### Warning: "Failed to insert X records"

**Problem**: Some records have invalid data

**Solution**: Check the detailed error log at the end of the script output. Fix the problematic records and re-run.

## Clearing Sample Data

To reset the database and re-seed from scratch:

```bash
# Option 1: Reset entire database (destructive!)
npx supabase db reset

# Option 2: Delete sample data only
npx ts-node scripts/clear-sample-data.ts  # (if implemented)

# Option 3: Manual deletion via SQL
npx supabase db query "DELETE FROM character_concords;"
npx supabase db query "DELETE FROM characters WHERE token_id BETWEEN 1 AND 50;"
npx supabase db query "DELETE FROM tweets;"
npx supabase db query "DELETE FROM users WHERE eth_address LIKE '0x%1111%';"
```

**Warning**: Be careful with database resets in production environments!

## Script Configuration

The seed script can be customized by editing `scripts/seed-database.ts`:

### Adjust Sample Data Volume

```typescript
// Change number of characters
const NUM_CHARACTERS = 50;  // Change to 20, 100, etc.

// Change number of tweets
const NUM_TWEETS = 60;      // Change to 30, 100, etc.
```

### Modify Character Distribution

```typescript
// Adjust infection status distribution
const infectionDistribution = {
  healthy: 0.33,   // 33%
  infected: 0.33,  // 33%
  cured: 0.34      // 34%
};
```

### Change Test Wallet Addresses

```typescript
const testWallets = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333'
];
```

## Next Steps

After seeding data:

1. **Manual Testing**: Walk through all pages and verify functionality
2. **Filter Testing**: Test all filter combinations on characters page
3. **Edit Testing**: Try editing a character sheet and saving
4. **Performance Testing**: Check page load times meet success criteria (<2s)
5. **Error Testing**: Test edge cases (non-existent character, invalid filters)

## Additional Resources

- **Data Model**: See [data-model.md](./data-model.md) for complete schema
- **Research**: See [research.md](./research.md) for technical decisions
- **Implementation Plan**: See [plan.md](./plan.md) for architecture details

## Support

If you encounter issues:

1. Check the error message in the seed script output
2. Verify environment variables are set correctly
3. Ensure migrations are applied
4. Check Supabase logs: `npx supabase logs`
5. Open an issue on GitHub with error details

---

**Script Location**: `scripts/seed-database.ts`
**Estimated Runtime**: 2-5 seconds (50 characters + 60 tweets)
**Database Impact**: Inserts ~123 records total
**Disk Usage**: ~5MB (including image references)
