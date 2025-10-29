# Quickstart: Testing Blockchain Integration Locally

**Feature**: 004-blockchain-integration
**Purpose**: Guide developers through setting up and testing blockchain features locally

---

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **A wallet** (MetaMask, Coinbase Wallet, or similar)
3. **Testnet ETH** on Sepolia (from faucet)
4. **Alchemy API key** (free tier sufficient)
5. **Git access** to the WAGDIE simplified repository

---

## Step 1: Environment Setup

### 1.1 Clone and Install

```bash
# Navigate to project root
cd wagdie-simplified

# Install dependencies
npm install

# Or with pnpm
pnpm install
```

### 1.2 Configure Environment Variables

Create or update `.env.local`:

```bash
# Copy example
cp .env.example .env.local

# Edit .env.local with your values
```

**Required Variables**:

```env
# Alchemy RPC (get from https://alchemy.com)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Chain selection (1 = mainnet, 11155111 = sepolia)
NEXT_PUBLIC_CHAIN_ID=11155111

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 1.3 Run Database Migrations

```bash
# Apply blockchain integration migrations
npx supabase migration up
```

This creates the `pending_transactions` table and adds blockchain state columns to `characters`.

---

## Step 2: Get Testnet Assets

### 2.1 Get Sepolia ETH

Use a Sepolia faucet to get test ETH:
- **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/sepolia
- **Proof of Work Faucet**: https://sepolia-faucet.pk910.de/

You'll need ~0.5 Sepolia ETH for testing (enough for 50+ transactions).

### 2.2 Get Test WAGDIE NFTs (If Available)

If testnet WAGDIE NFTs are available:
1. Check the test deployment at `0x5d3dc394D8C8310Af31e089460F7FcdC7F527604`
2. Request test NFTs from the project maintainers
3. Or deploy your own test NFT contract for testing

**Alternative**: Test with mainnet in read-only mode (no transactions).

### 2.3 Get Test Tokens (Concords, Corpses, Mushrooms)

**Option A**: If deployed on Sepolia, use testnet faucet or minting function
**Option B**: Fork mainnet using Hardhat/Foundry for local testing with real balances

---

## Step 3: Start Development Server

```bash
# Start Next.js dev server
npm run dev

# Or with pnpm
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Step 4: Connect Wallet & Test Features

### 4.1 Connect Wallet

1. Click "Connect Wallet" in the top navigation
2. Select your wallet (MetaMask, Coinbase Wallet, etc.)
3. Approve the connection request
4. **Ensure you're on Sepolia network**

**Expected Result**:
- ✅ Wallet address displayed in header
- ✅ User dropdown shows "Sign In with Ethereum" option
- ✅ Network badge shows "Sepolia" (if on testnet)

### 4.2 Test Ownership Verification (P1)

1. Navigate to `/characters`
2. Browse characters
3. Check if "Yours" badge appears on owned characters

**Expected Result**:
- ✅ Characters you own show "Yours" badge
- ✅ Characters you don't own have no badge
- ✅ Edit button enabled only for owned characters

**Debug**:
```typescript
// Check ownership in browser console
import { publicClient } from '@/lib/wagmi'
import addresses from '@/specs/004-blockchain-integration/contracts/addresses.json'

const owner = await publicClient.readContract({
  address: addresses.networks.sepolia.contracts.wagdie.address,
  abi: wagdieABI,
  functionName: 'ownerOf',
  args: [BigInt(1234)],
})

console.log('Owner of token 1234:', owner)
console.log('Your address:', yourAddress)
console.log('Is owner:', owner.toLowerCase() === yourAddress.toLowerCase())
```

### 4.3 Test Token Balance Display (P1)

1. Navigate to `/characters/[tokenId]` for a character you own
2. Check the character sheet for token balance display

**Expected Result**:
- ✅ "Concords Available: X" displayed
- ✅ "Corpses Available: X" displayed
- ✅ "Mushrooms Available: X" displayed
- ✅ Balances refresh on page load

**Debug**:
```typescript
// Check balances in browser console
const concordBalance = await publicClient.readContract({
  address: addresses.networks.sepolia.contracts.tokensOfConcord.address,
  abi: erc1155ABI,
  functionName: 'balanceOf',
  args: [yourAddress, BigInt(1)],
})

console.log('Concord balance:', concordBalance.toString())
```

### 4.4 Test Character Searing (P2)

**Prerequisites**: You must own a character and have ≥1 Concord token.

1. Navigate to character detail page
2. Click "Sear Character" button
3. **Step 1 - Approve Concords**:
   - Click "Approve Concords"
   - Confirm transaction in wallet
   - Wait for confirmation (~15-30 seconds)
   - ✅ "Approval confirmed" message appears
4. **Step 2 - Execute Searing**:
   - Click "Confirm Searing"
   - Confirm transaction in wallet
   - Wait for confirmation (~15-30 seconds)
   - ✅ "Character seared!" success message

**Expected Result**:
- ✅ Two-step flow (approve → sear)
- ✅ Loading indicators during pending transactions
- ✅ Transaction hash displayed and clickable (links to Sepolia Etherscan)
- ✅ Character's "Seared" badge appears after confirmation
- ✅ Concord balance decreases by 1
- ✅ "Sear Character" button disabled (character already seared)

**Troubleshooting**:
- **"Insufficient Concords"**: Get test Concords from testnet faucet
- **Transaction fails**: Check Sepolia ETH balance for gas
- **Wrong network**: Switch to Sepolia in wallet
- **Approval stuck**: Check pending tx in wallet, can speed up or cancel

### 4.5 Test Infection Spreading (P2)

**Prerequisites**:
- Own an infected character (source)
- Have ≥1 Mushroom token
- Have sufficient Sepolia ETH for payment + gas

1. Navigate to `/spread`
2. Select your infected character as source
3. Enter target character token ID
4. Click "Spread Infection"
5. **Step 1 - Approve Mushrooms** (if not already approved)
6. **Step 2 - Execute Spread**:
   - Confirm ETH payment + tx in wallet
   - Wait for confirmation
   - ✅ "Infection spread!" success message

**Expected Result**:
- ✅ Source character must be infected
- ✅ Target character becomes infected
- ✅ Mushroom balance decreases
- ✅ ETH balance decreases (payment + gas)

### 4.6 Test Corpse Burning (P2)

**Prerequisites**: You must own ≥1 Corpse token.

1. Navigate to `/spread` page
2. Find "Burn Corpses" section
3. Enter quantity to burn
4. Click "Burn Corpses"
5. Approve and confirm transactions

**Expected Result**:
- ✅ Corpse balance decreases by burn quantity
- ✅ Transaction confirmed message
- ✅ Balance updates in UI

### 4.7 Test Character Staking (P3)

**Prerequisites**: You must own a character.

1. Navigate to character detail page
2. Click "Stake Character"
3. Select a location from dropdown
4. Approve NFT transfer to staking contract
5. Confirm staking transaction

**Expected Result**:
- ✅ Character moves to staking contract
- ✅ "Staked" badge appears
- ✅ Location displayed on character card
- ✅ "Unstake" button replaces "Stake" button

### 4.8 Test Character Unstaking (P3)

1. Navigate to staked character detail page
2. Click "Unstake"
3. Confirm transaction

**Expected Result**:
- ✅ Character returns to your wallet
- ✅ "Staked" badge removed
- ✅ "Stake" button reappears

### 4.9 Test Cure Infection (P3)

**Prerequisites**: You must own an infected character.

1. Navigate to infected character detail page
2. Click "Cure Infection"
3. Confirm transaction

**Expected Result**:
- ✅ Infected status cleared
- ✅ "Infected" badge removed
- ✅ Success message displayed

---

## Step 5: Test Error Scenarios

### 5.1 Wrong Network

1. Switch wallet to a different network (e.g., Polygon)
2. Try to execute any transaction

**Expected Result**:
- ✅ Yellow warning banner: "Wrong network - Switch to Sepolia"
- ✅ "Switch Network" button displayed
- ✅ Clicking button prompts wallet to switch
- ✅ Transaction buttons disabled until on correct network

### 5.2 Insufficient Funds

1. Execute transaction with insufficient ETH for gas

**Expected Result**:
- ✅ Error message: "Insufficient ETH for gas"
- ✅ Suggestion: "Add more ETH to your wallet"
- ✅ Transaction not submitted

### 5.3 User Rejection

1. Start any transaction
2. Reject it in your wallet

**Expected Result**:
- ✅ "Transaction cancelled" message
- ✅ No error thrown in console
- ✅ UI returns to idle state
- ✅ Can retry immediately

### 5.4 Insufficient Tokens

1. Try to sear without Concords
2. Try to spread infection without Mushrooms

**Expected Result**:
- ✅ Button disabled before transaction starts
- ✅ Clear message: "Insufficient [token type]"
- ✅ Suggestion: "Get tokens from [source]"

### 5.5 Transaction Timeout

1. Initiate transaction
2. Set very low gas price (if wallet allows)
3. Transaction takes >5 minutes

**Expected Result**:
- ✅ Transaction remains in "pending" state
- ✅ User can see transaction hash
- ✅ Can check status on Etherscan
- ✅ Can speed up or cancel in wallet
- ✅ App still functional (not blocked)

---

## Step 6: Test Transaction Persistence

### 6.1 Page Refresh During Pending Transaction

1. Initiate any transaction
2. While transaction is pending (not confirmed yet)
3. Refresh the page or navigate away

**Expected Result**:
- ✅ After refresh, pending transaction indicator appears
- ✅ Transaction status updates when confirmed
- ✅ Success message displayed after confirmation
- ✅ No data loss

**Debug**:
```typescript
// Check localStorage
const txs = JSON.parse(localStorage.getItem('wagdie-pending-txs') || '{}')
console.log('Pending transactions:', txs)
```

### 6.2 Multi-Tab Sync

1. Open app in two browser tabs
2. Execute transaction in Tab 1
3. Switch to Tab 2

**Expected Result**:
- ✅ Tab 2 shows transaction status (via React Query refetch on focus)
- ✅ Both tabs show updated state after confirmation

---

## Step 7: Performance Testing

### 7.1 RPC Caching

1. Navigate to characters page
2. Check browser Network tab for RPC calls
3. Navigate away and return

**Expected Result**:
- ✅ Initial load: Multiple RPC calls
- ✅ Second visit (within 30s): Cached, fewer RPC calls
- ✅ No redundant `ownerOf` calls for same token

### 7.2 Multi-Call Efficiency

1. Navigate to character detail page
2. Check Network tab for contract read calls

**Expected Result**:
- ✅ Token balances fetched in single multi-call (not 3 separate calls)
- ✅ < 5 RPC calls per page load
- ✅ Subsequent loads use cache

---

## Step 8: Debugging Tools

### 8.1 Enable wagmi Dev Tools

```typescript
// Add to app/providers.tsx (development only)
import { WagmiDevTools } from 'wagmi/dev'

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
          {process.env.NODE_ENV === 'development' && <WagmiDevTools />}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 8.2 Enable React Query Dev Tools

```typescript
// Add to app/providers.tsx (development only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
</QueryClientProvider>
```

### 8.3 Browser Console Debugging

```typescript
// Inspect wagmi config
console.log('wagmi config:', config)

// Check current chain
console.log('Current chain ID:', useChainId())

// Check wallet connection
console.log('Wallet state:', useAccount())

// Check token balances
const balances = useTokenBalances(address)
console.log('Token balances:', balances)

// Check pending transactions
const pending = usePendingTxStore((state) => state.transactions)
console.log('Pending txs:', pending)
```

### 8.4 Network Tab Monitoring

Monitor RPC calls in browser Network tab:
- Filter by "alchemy" or RPC endpoint URL
- Check for rate limiting (429 responses)
- Verify caching (304 responses or local cache hits)
- Monitor transaction submission (eth_sendTransaction)
- Check transaction receipts (eth_getTransactionReceipt)

---

## Step 9: Load Testing (Optional)

### 9.1 Concurrent Transactions

1. Open app in multiple tabs
2. Execute transactions simultaneously
3. Monitor for race conditions

**Expected Result**:
- ✅ Each transaction tracked independently
- ✅ No state conflicts between tabs
- ✅ All transactions appear in pending list

### 9.2 Rapid Actions

1. Rapidly click transaction buttons
2. Test double-click handling

**Expected Result**:
- ✅ Button disabled after first click
- ✅ Only one transaction submitted
- ✅ No duplicate transactions

---

## Step 10: Clean Up

### 10.1 Clear Test Data

```bash
# Clear pending transactions from Supabase
npm run db:reset

# Or manually in Supabase dashboard
DELETE FROM pending_transactions WHERE status IN ('confirmed', 'failed');
```

### 10.2 Clear Browser Storage

```javascript
// In browser console
localStorage.removeItem('wagdie-pending-txs')
```

### 10.3 Disconnect Wallet

1. Click user dropdown
2. Click "Disconnect"

**Expected Result**:
- ✅ Wallet disconnected
- ✅ All blockchain data cleared from UI
- ✅ Can reconnect without issues

---

## Troubleshooting

### Issue: "Call reverted" errors

**Cause**: Contract function failed (wrong parameters, state issue, etc.)

**Solution**:
1. Check contract on Etherscan for correct function signature
2. Verify you meet preconditions (ownership, balances, etc.)
3. Test with different parameters
4. Check if contract is paused

### Issue: Transactions stuck pending

**Cause**: Low gas price or network congestion

**Solution**:
1. Check transaction on Sepolia Etherscan
2. Use wallet's "Speed Up" feature to increase gas price
3. Or cancel and retry with higher gas

### Issue: RPC rate limiting (429 errors)

**Cause**: Exceeded Alchemy free tier rate limits

**Solution**:
1. Increase `staleTime` in React Query config (reduce queries)
2. Upgrade Alchemy plan (if needed)
3. Add retry logic with exponential backoff

### Issue: Wrong network switching doesn't work

**Cause**: Wallet doesn't support programmatic network switching

**Solution**:
1. Manually switch network in wallet
2. App should detect and update

### Issue: Token balances show as 0 but you have tokens

**Cause**: Wrong token ID or contract address

**Solution**:
1. Verify contract address in `addresses.json`
2. Verify token ID (should be `1` for ERC1155)
3. Check balances directly on Etherscan
4. Clear React Query cache and refetch

---

## Next Steps

After local testing:
1. ✅ Test all P1 features (ownership, balances)
2. ✅ Test all P2 features (sear, spread, burn)
3. ✅ Test all P3 features (stake, unstake, cure)
4. ✅ Test error scenarios
5. ✅ Write E2E tests using Playwright
6. ✅ Deploy to staging with testnet configuration
7. ✅ Final testing on mainnet (read-only mode first)
8. ✅ Deploy to production with mainnet configuration

---

## Support & Resources

- **Alchemy Dashboard**: https://dashboard.alchemy.com/
- **Sepolia Faucets**: https://sepoliafaucet.com/
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **wagmi Docs**: https://wagmi.sh/
- **RainbowKit Docs**: https://www.rainbowkit.com/docs/introduction
- **viem Docs**: https://viem.sh/

---

**Last Updated**: 2025-10-28
**Status**: Ready for use - Update as implementation progresses
