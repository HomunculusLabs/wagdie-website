# WAGDIE Simplified - Detailed Setup Guide

This guide walks you through setting up the WAGDIE Simplified project from scratch, including Supabase and Vercel configuration.

## Table of Contents

1. [Supabase Setup](#supabase-setup)
2. [Local Development Setup](#local-development-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Data Migration](#data-migration)
5. [Troubleshooting](#troubleshooting)

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `wagdie-simplified` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project" and wait for provisioning (1-2 minutes)

### Step 2: Get API Credentials

1. Once the project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. Copy the following values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (this is safe to use in the browser)
4. Save these for the next step

### Step 3: Run Database Migrations

1. In your Supabase dashboard, click on **SQL Editor** in the sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/20250101000000_initial_schema.sql` from this repository
4. Paste it into the SQL Editor
5. Click **Run** (bottom right)
6. You should see "Success. No rows returned" message

### Step 4: Verify Database Setup

1. Click on **Table Editor** in the sidebar
2. You should see 4 tables:
   - `users`
   - `characters`
   - `tweets`
   - `locations`
3. Click on each table to verify the schema matches the migration file

### Step 5: Configure Row Level Security (Optional)

The migration file already sets up basic RLS policies. To review or modify:

1. Go to **Authentication** > **Policies** in the sidebar
2. Review the policies for each table
3. Modify as needed for your security requirements

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/wagdie-simplified.git
cd wagdie-simplified

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. (Optional) Add blockchain RPC endpoints if you plan to fetch on-chain data:
   ```env
   NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
   NEXT_PUBLIC_WAGDIE_CONTRACT_ADDRESS=0x...
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Test Authentication

1. Connect a Web3 wallet (MetaMask, Rainbow, etc.)
2. Sign the SIWE message
3. Check the Supabase dashboard > Table Editor > `users` to see your entry

## Vercel Deployment

### Step 1: Prepare Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial WAGDIE simplified setup"
   git remote add origin https://github.com/your-org/wagdie-simplified.git
   git push -u origin main
   ```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

1. In the Vercel project settings, go to "Environment Variables"
2. Add the same variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Any other optional variables)
3. Set them for "Production", "Preview", and "Development" environments

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Your site will be live at `https://your-project.vercel.app`

### Step 5: Set Up Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `wagdie.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 24 hours)

## Data Migration

If you're migrating from the original WAGDIE Firestore database:

### Step 1: Export Firestore Data

```bash
# In the original project
npm run backup-firestore
```

This will create JSON exports of all collections.

### Step 2: Transform Data

Create transformation scripts to convert Firestore documents to PostgreSQL format:

```typescript
// Example: Transform characters collection
const transformedCharacters = firestoreCharacters.map(char => ({
  token_id: char.tokenId,
  contract_address: char.contractAddress,
  owner_address: char.owner,
  metadata: char.metadata,
  burned: char.burned || false,
  infected: char.infected || false,
  location_id: char.locationId || null,
}))
```

### Step 3: Import to Supabase

1. Use Supabase SQL Editor to insert data:
   ```sql
   INSERT INTO characters (token_id, contract_address, owner_address, metadata)
   VALUES ($1, $2, $3, $4);
   ```

2. Or use the Supabase JavaScript client:
   ```typescript
   await supabase.from('characters').insert(transformedCharacters)
   ```

3. For large datasets, use the Supabase CSV import feature:
   - Export data to CSV
   - Go to Table Editor > Import CSV
   - Map columns and import

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure you've created `.env.local` with the correct variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Issue: "Failed to fetch" when calling API routes

**Solution**:
1. Check that Supabase project is running (green status in dashboard)
2. Verify API credentials are correct
3. Check browser console for CORS errors
4. Ensure RLS policies allow the operation

### Issue: SIWE authentication not working

**Solution**:
1. Make sure you're using a supported wallet (MetaMask, Rainbow, etc.)
2. Check that the domain in the SIWE message matches your site
3. Verify nonce is being generated and stored correctly
4. Check API route logs in Vercel or terminal

### Issue: Database queries returning no data

**Solution**:
1. Check RLS policies - they might be blocking reads
2. Verify data was imported correctly in Table Editor
3. Check the Supabase logs for query errors
4. Test queries directly in SQL Editor

### Issue: Build failing on Vercel

**Solution**:
1. Make sure all environment variables are set in Vercel
2. Check build logs for specific errors
3. Verify `package.json` dependencies are correct
4. Try building locally first: `npm run build`

## Next Steps

1. **Add Authentication UI**: Create login button and wallet connection components
2. **Build Character Gallery**: Display user's NFT characters
3. **Implement Game Mechanics**: Add location staking, infection tracking, etc.
4. **Add Real-time Features**: Use Supabase real-time subscriptions
5. **Optimize Performance**: Add caching, image optimization, etc.

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **SIWE Docs**: [login.xyz/docs](https://login.xyz/docs)

## Resources

- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [SIWE Examples](https://docs.login.xyz/integrations/nextjs)
- [Wagmi Documentation](https://wagmi.sh)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
