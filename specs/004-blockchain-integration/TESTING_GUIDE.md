# Blockchain Integration - Testing Guide

Comprehensive guide for testing all blockchain features.

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure environment
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia testnet
```

### Test Wallet Setup

1. **Install MetaMask or Rainbow Wallet**
2. **Switch to Sepolia testnet**
3. **Get test ETH**: https://sepoliafaucet.com/
4. **Get test NFTs** (if available on Sepolia):
   - WAGDIE testnet contract
   - Mint test Concords, Corpses, Mushrooms

---

## Testing Checklist

### Phase 1-2: Foundation ✓

#### Environment Configuration
- [ ] `.env.local` configured correctly
- [ ] Alchemy API key working
- [ ] WalletConnect project ID valid
- [ ] Chain ID set correctly (1 or 11155111)

#### Wallet Connection
- [ ] Connect wallet with RainbowKit
- [ ] Switch networks (mainnet ↔ Sepolia)
- [ ] Disconnect and reconnect
- [ ] Multiple wallet types (MetaMask, Rainbow, Coinbase)
- [ ] Wallet connection persists on refresh

#### Error Handling
- [ ] User rejects transaction → shows friendly error
- [ ] Insufficient gas → shows balance error
- [ ] Network error → shows retry option
- [ ] Contract error → shows specific message

---

### Phase 3: Ownership Verification ✓

#### Character Ownership
- [ ] Load character detail page
- [ ] See ownership banner for owned characters
- [ ] See "owned by other" for non-owned characters
- [ ] Ownership badge appears on character cards
- [ ] Ownership updates when switching wallets

#### Test Cases

**Test 1: Owned Character**
```
1. Connect wallet with WAGDIEs
2. Navigate to character you own
3. Verify green "You own this character" banner
4. Verify green "Owned" badge
```

**Test 2: Non-Owned Character**
```
1. Navigate to character you don't own
2. Verify yellow "Owned by another wallet" banner
3. Verify no ownership badge
4. Show owner address (shortened)
```

**Test 3: Wallet Switch**
```
1. View owned character
2. Switch to different wallet
3. Verify ownership status updates immediately
```

#### API Tests

```typescript
// Manual console testing
import { OwnershipService } from '@/lib/services/blockchain/ownership'

const service = new OwnershipService({ publicClient, walletClient })
await service.initialize()

// Test ownership check
const result = await service.checkOwnership(BigInt(1234), address)
console.log('Ownership:', result.data)

// Test batch checks
const batch = await service.checkMultipleOwnership([1n, 2n, 3n], address)
console.log('Batch results:', batch.data)
```

---

### Phase 4: Token Balances ✓

#### Balance Display
- [ ] Token Balances Card shows on character page
- [ ] Displays correct balance for each token type
- [ ] Balances update after transactions
- [ ] Refresh button works
- [ ] Loading states display correctly
- [ ] Zero balances show as "0"

#### Test Cases

**Test 1: Initial Load**
```
1. Connect wallet
2. Navigate to character page
3. Verify Token Balances Card appears
4. Check balances match your wallet
```

**Test 2: Balance Updates**
```
1. Note current balances
2. Perform transaction (burn corpse)
3. Wait for confirmation
4. Verify balances update automatically
```

**Test 3: Multiple Tokens**
```
1. Wallet with all three tokens (Concord, Corpse, Mushroom)
2. Verify all three display correctly
3. Icons and colors display properly
```

#### API Tests

```typescript
const { balances, isLoading, error, refetch } = useTokenBalances()

// Test balances fetch
console.log('Concord:', balances.concord?.balance.toString())
console.log('Corpse:', balances.corpse?.balance.toString())
console.log('Mushroom:', balances.mushroom?.balance.toString())

// Test refetch
await refetch()
console.log('Refetched:', balances)
```

---

### Phase 5: Searing Mechanics ✓

#### Searing Flow
- [ ] Click "Sear Concords" button
- [ ] Modal opens with balance display
- [ ] Approval step shows if not approved
- [ ] Approve button works
- [ ] Approval transaction confirms
- [ ] Searing input accepts Concord ID
- [ ] Sear button enables after approval
- [ ] Transaction submits successfully
- [ ] Success toast shows with Etherscan link
- [ ] Modal auto-closes on success

#### Test Cases

**Test 1: Full Searing Flow (First Time)**
```
1. Click "Sear Concords"
2. See approval required warning
3. Click "Approve Contract"
4. Confirm approval in wallet
5. Wait for confirmation
6. Enter Concord ID (e.g., 1)
7. Click "Sear Concords"
8. Confirm transaction
9. Wait for success
10. Verify modal closes
11. Verify success toast
```

**Test 2: Searing (Already Approved)**
```
1. Click "Sear Concords"
2. No approval step (already approved)
3. Enter Concord ID
4. Sear immediately
```

**Test 3: Error Handling**
```
// Insufficient balance
1. Try to sear without Concords
2. See error message

// Invalid Concord ID
1. Enter blocked Concord ID
2. See error message

// User rejection
1. Start searing
2. Reject in wallet
3. See "Transaction cancelled" message
```

#### API Tests

```typescript
const { searConcords, checkApproval, isSearing } = useSearing()

// Check approval
const approved = await checkApproval()
console.log('Approved:', approved)

// Sear
await searConcords(1234, 5678) // wagdieId, concordId
```

---

### Phase 6: Infection Spreading ✓

#### Infection Flow
- [ ] Click "Infect Character" button
- [ ] Modal shows infection price in ETH
- [ ] ETH balance displays correctly
- [ ] Insufficient balance warning shows
- [ ] Transaction price calculation correct
- [ ] Random mode: quantity selector works
- [ ] Specific mode: character info shows
- [ ] Transaction submits with correct ETH value
- [ ] Success notification appears

#### Test Cases

**Test 1: Infect Specific Character**
```
1. On character page, click "Infect Character"
2. See character info in modal
3. See infection price (e.g., 0.0025 ETH)
4. Verify ETH balance sufficient
5. Click "Infect Character"
6. Confirm transaction with ETH payment
7. Wait for confirmation
8. See success toast
```

**Test 2: Random Infection (Spread Page)**
```
1. Go to Spread page
2. Select "Release Spores"
3. Enter quantity (e.g., 5)
4. See total cost (5 × infection price)
5. Verify balance sufficient
6. Click spread button
7. Confirm transaction
8. See success toast
```

**Test 3: Insufficient ETH**
```
1. Try to infect with low ETH balance
2. See "Insufficient ETH" error
3. Show required amount
```

#### API Tests

```typescript
const { infectWagdie, spreadInfections, infectionPrice } = useSpread()

// Get price
console.log('Price:', formatEther(infectionPrice))

// Infect specific
await infectWagdie(BigInt(1234))

// Random spread
await spreadInfections(BigInt(5)) // 5 infections
```

---

### Phase 7: Corpse Burning ✓

#### Corpse Burning Flow
- [ ] Click "Touch Corpse" on Spread page
- [ ] Modal shows corpse and mushroom balances
- [ ] Max button fills available corpses
- [ ] Amount input validates (positive numbers)
- [ ] Approval step if needed
- [ ] Burn transaction executes
- [ ] Balances update after burn
- [ ] 1:1 ratio verified (1 corpse = 1 mushroom)

#### Test Cases

**Test 1: First Burn (With Approval)**
```
1. Go to Spread page
2. Click "Touch Corpse"
3. See current corpse balance
4. See approval warning
5. Click "Approve Contract"
6. Confirm approval
7. Enter burn amount (e.g., 2)
8. Click "Touch Corpse"
9. Confirm burn transaction
10. Verify balances update:
    - Corpse: -2
    - Mushroom: +2
```

**Test 2: Burn Multiple Times**
```
1. Burn 1 corpse → +1 mushroom
2. Burn 5 corpses → +5 mushrooms
3. Verify 1:1 ratio maintained
```

**Test 3: Max Button**
```
1. Have 10 corpses
2. Click "Max" button
3. See "10" in amount field
4. Burn all 10
5. Verify balance = 0
```

#### API Tests

```typescript
const { burnCorpse, corpseBalance, mushroomBalance } = useCorpseBurning()

console.log('Corpse:', corpseBalance?.toString())
console.log('Mushroom:', mushroomBalance?.toString())

await burnCorpse(BigInt(5)) // Burn 5
```

---

### Phase 8: Character Staking ✓

#### Staking Flow
- [ ] Staking status card shows on character page
- [ ] Shows "Not Staked" for unstaked characters
- [ ] Shows "Staked" with location for staked characters
- [ ] Location name displays
- [ ] Location owner displays
- [ ] Locked status shows warning
- [ ] Status updates after stake/unstake

#### Test Cases

**Test 1: Check Staking Status**
```
1. View character detail page
2. See Staking Status Card in sidebar
3. For unstaked: "Not Staked" + house icon
4. For staked: "Staked" + location details
```

**Test 2: Staked Character Details**
```
1. View staked character
2. See location name (e.g., "The Sanctuary")
3. See location ID
4. See location owner address
5. If locked, see warning message
```

**Test 3: Status Updates**
```
1. Note unstaked character
2. Stake character (via contract)
3. Refresh page
4. Verify status changed to "Staked"
```

#### API Tests

```typescript
const { status, isLoading } = useStakingStatus(1234)

console.log('Is staked:', status?.isStaked)
console.log('Location:', status?.locationName)
console.log('Locked:', status?.nftsLocked)
```

---

### Phase 9: Cure Mechanics ✓

#### Cure Flow
- [ ] Cure button shows for infected characters
- [ ] Cure button hidden for non-infected
- [ ] Modal shows mushroom balance
- [ ] Shows mushrooms required (typically 1)
- [ ] Insufficient balance warning shows
- [ ] Burn transaction executes
- [ ] Success notification appears
- [ ] Character status updates (off-chain)

#### Test Cases

**Test 1: Cure Infected Character**
```
1. View infected character (owner)
2. See "Cure Character" button
3. Click button
4. See Cure Modal
5. Verify mushroom balance ≥ 1
6. Click "Cure for 1 Mushroom"
7. Confirm transaction
8. Wait for confirmation
9. See success toast
10. Mushroom balance -1
```

**Test 2: Insufficient Mushrooms**
```
1. Try to cure with 0 mushrooms
2. See error: "You need 1 mushroom to cure"
3. Button disabled
4. Link to "burn corpses to get mushrooms"
```

**Test 3: Non-Infected Character**
```
1. View non-infected character
2. Verify no "Cure Character" button
```

#### API Tests

```typescript
const { cureCharacter, cureStatus } = useCure()

console.log('Can cure:', cureStatus?.canCure)
console.log('Mushroom balance:', cureStatus?.mushroomBalance.toString())
console.log('Required:', cureStatus?.mushroomsRequired.toString())

await cureCharacter(1234)
```

---

## Integration Tests

### End-to-End Workflows

#### Workflow 1: New Player Complete Flow
```
1. Connect wallet (no tokens)
2. View character ownership (see others' characters)
3. Acquire test tokens from faucet
4. Burn corpses to get mushrooms
5. Use mushrooms to cure character
6. Verify balance updates throughout
```

#### Workflow 2: Infection Campaign
```
1. Get ETH for infections
2. Infect specific character
3. Spread random infections
4. Verify ETH spent correctly
5. Verify multiple transactions tracked
```

#### Workflow 3: Character Transformation
```
1. Own a WAGDIE
2. Get Tokens of Concord
3. Approve searing contract
4. Sear Concords
5. Verify character seared status
6. Verify balance updated
```

### Multi-Wallet Testing

```
Test 1: Switch Wallets Mid-Session
1. Connect Wallet A
2. Perform transactions
3. Switch to Wallet B
4. Verify all states update
5. Verify transaction history separate

Test 2: Multiple Windows
1. Open app in two browser windows
2. Connect different wallets
3. Perform transactions in each
4. Verify independent state management
```

---

## Performance Tests

### Load Time Testing

```bash
# Measure initial load
1. Clear cache
2. Load character page
3. Measure time to display balances
Target: <500ms

# Measure transaction time
1. Start transaction
2. Measure to confirmation
3. Compare actual vs estimated gas
```

### RPC Call Optimization

```bash
# Count RPC calls with browser DevTools
1. Open Network tab
2. Filter: alchemy.com
3. Load character page
4. Count calls

Expected with multicall:
- Initial load: ~2-3 calls
- Without multicall: ~8-10 calls
Optimization: ~70% reduction
```

---

## Regression Testing

### Before Each Release

- [ ] Run through all Phase 3-9 test cases
- [ ] Test on both mainnet and Sepolia
- [ ] Test with multiple wallet types
- [ ] Verify all modals open/close correctly
- [ ] Check all transaction toasts
- [ ] Verify balance updates
- [ ] Test error scenarios
- [ ] Check mobile responsive design
- [ ] Verify transaction persistence
- [ ] Test edge cases (0 balance, max values)

---

## Automated Testing (Future)

### Unit Tests (To Implement)

```typescript
// Example test structure
describe('OwnershipService', () => {
  it('should check ownership correctly', async () => {
    const service = new OwnershipService(mockConfig)
    const result = await service.checkOwnership(1n, '0x...')
    expect(result.data?.isOwned).toBe(true)
  })
})

describe('useTokenBalances', () => {
  it('should fetch balances', async () => {
    const { result } = renderHook(() => useTokenBalances())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.balances.concord).toBeDefined()
  })
})
```

### E2E Tests (To Implement)

```typescript
// Cypress/Playwright example
describe('Searing Flow', () => {
  it('should complete full searing', () => {
    cy.visit('/characters/1234')
    cy.contains('Sear Concords').click()
    cy.contains('Approve Contract').click()
    // ... interact with MetaMask
    cy.contains('Success')
  })
})
```

---

## Troubleshooting

### Common Issues

**Issue: Transactions Fail Silently**
```
Solution:
1. Open browser console
2. Check for errors
3. Verify contract addresses
4. Check RPC endpoint status
```

**Issue: Balances Not Updating**
```
Solution:
1. Click refresh button
2. Check Alchemy API limits
3. Verify RPC URL in config
4. Clear localStorage
```

**Issue: Approval Not Working**
```
Solution:
1. Check if already approved (read contract)
2. Verify operator address correct
3. Try revoking and re-approving
4. Check gas settings
```

**Issue: Modal Doesn't Close**
```
Solution:
1. Check transaction status in store
2. Verify onSuccess callback
3. Clear transaction store
4. Hard refresh page
```

---

## Test Data

### Sepolia Testnet Addresses

```typescript
// Test contracts (if deployed)
export const SEPOLIA_TEST_DATA = {
  wagdie: '0x5d3dc394D8C8310Af31e089460F7FcdC7F527604',
  tokensOfConcord: '0x4FBF88AC8C15f1Ea0d0022e3BfEbf7338483aE30',
  // Add more as available
}

// Test token IDs
export const TEST_TOKEN_IDS = {
  ownedWagdie: 1234n,
  notOwnedWagdie: 5678n,
  concordId: 1n,
}
```

### Mock Data for Development

```typescript
// Use in development mode
const MOCK_BALANCES = {
  concord: 10n,
  corpse: 5n,
  mushroom: 3n,
}

const MOCK_OWNERSHIP = {
  tokenId: 1234n,
  owner: '0x...',
  isOwned: true,
}
```

---

## Success Criteria

### Feature Complete Checklist

- [x] All 7 contracts integrated
- [x] All user stories implemented
- [x] Error handling comprehensive
- [x] Transaction tracking working
- [x] UI/UX polished
- [x] Mobile responsive
- [x] Performance optimized
- [x] Documentation complete

### Quality Metrics

- Transaction success rate: >95%
- Error handling coverage: 100%
- Load time: <2s
- RPC calls optimized: ~70% reduction
- User satisfaction: Friendly error messages
- Code coverage (target): >80%

---

## Next Steps

1. Complete remaining automated tests
2. Deploy to Sepolia for full testing
3. Conduct user acceptance testing (UAT)
4. Security audit smart contract interactions
5. Load testing with multiple concurrent users
6. Monitor production metrics

---

## Support

For testing issues:
1. Check browser console for errors
2. Verify environment configuration
3. Test with different wallets
4. Check Etherscan for transaction status
5. Review Alchemy dashboard for API issues
