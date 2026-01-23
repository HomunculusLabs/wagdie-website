# Quickstart: Phaser Map & Contract Integration

**Feature**: 011-phaser-contract-integration
**Date**: 2025-11-29

## Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- ETH for gas fees (mainnet)

## Quick Setup

### 1. Install Dependencies

```bash
# From project root
npm install

# Remove Leaflet dependencies (will be done as part of implementation)
npm uninstall leaflet react-leaflet react-leaflet-markercluster @types/leaflet @types/leaflet.markercluster
```

### 2. Environment Variables

Ensure `.env.local` has the following:

```bash
# Alchemy RPC (required for mainnet)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_api_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key

# Wallet Connect (optional, for additional wallet support)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/map` to see the Phaser map.

---

## Contract Addresses

### Mainnet (Production)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| WAGDIE NFT | `0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A` | [View](https://etherscan.io/address/0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A) |
| Tokens Of Concord | `0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634` | [View](https://etherscan.io/address/0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634) |

### Token IDs (Tokens Of Concord)

| Token | ID | Purpose |
|-------|-----|---------|
| Strange Mushroom | 15 | Used for spreading infections |
| Her Ash | 3 | Concord item |
| Artificer's Crystal | 7 | Concord item |
| Seer's Gem | 30 | Concord item |
| Monad Carving | 36 | Concord item |

---

## Development Tasks

### Task 1: Remove Leaflet Components

Delete the following directories/files:

```bash
# Components to delete
rm -rf components/map/SimpleMap.tsx
rm -rf components/map/LeafletMapWrapper.tsx
rm -rf components/map/IconFactory.ts
rm -rf components/map/LayerController.tsx
rm -rf components/map/LayerControls.tsx
rm -rf components/map/MarkerComponent.tsx
rm -rf components/map/PopupRenderer.tsx
rm -rf components/map/TooltipRenderer.tsx
rm -rf components/map/MapPopup.tsx
rm -rf components/map/MapTooltip.tsx
rm -rf components/map/MarkerCluster.css
rm -rf components/map/markers/

# Also delete backup files
rm -f components/map/*.backup

# Delete associated story files
rm -f components/map/*.stories.tsx
rm -f components/map/markers/*.stories.tsx
```

### Task 2: Create Contract Hooks

Create new hooks in `hooks/`:

```typescript
// hooks/useTokenBalances.ts
export function useTokenBalances() {
  // Implementation using wagmi useReadContracts
}

// hooks/useBurnCorpses.ts
export function useBurnCorpses() {
  // Implementation using wagmi useWriteContract
}

// ... etc for each operation
```

### Task 3: Update Map Page

The map page (`app/map/page.tsx`) already uses Phaser. Verify:

1. Phaser loads correctly
2. Markers display for locations and characters
3. Layer controls work
4. EventBus communication works

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Specific Tests

```bash
# Test contract hooks
npm test -- --testPathPattern="hooks/contracts"

# Test map components
npm test -- --testPathPattern="map"
```

### Manual Testing Checklist

- [ ] Map loads and displays WAGDIE world image
- [ ] Zoom in/out works (scroll wheel)
- [ ] Pan works (click and drag)
- [ ] Location markers display
- [ ] Character markers display at staked locations
- [ ] Layer toggle controls work
- [ ] Wallet connects via RainbowKit
- [ ] Token balances display correctly
- [ ] Burn corpse transaction works (requires corpse tokens)
- [ ] Spread infection works (requires mushroom tokens)
- [ ] Toast notifications show for transactions

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                             │
├─────────────────────────────────────────────────────────────┤
│  app/map/page.tsx                                           │
│    └── PhaserGame.tsx                                       │
│          └── MapScene.ts (Phaser)                           │
├─────────────────────────────────────────────────────────────┤
│  hooks/                                                      │
│    ├── useTokenBalances.ts  ──────┐                         │
│    ├── useBurnCorpses.ts    ──────┤                         │
│    ├── useSpreadInfections.ts ────┼──► wagmi/viem           │
│    ├── useInfectCharacter.ts ─────┤                         │
│    ├── useCureCharacter.ts  ──────┤                         │
│    └── useSearConcord.ts    ──────┘                         │
├─────────────────────────────────────────────────────────────┤
│  lib/contracts/                                              │
│    ├── addresses.ts         (mainnet addresses)             │
│    ├── abis/                (contract ABIs)                 │
│    └── chains.ts            (chain configuration)           │
├─────────────────────────────────────────────────────────────┤
│                     Ethereum Mainnet                         │
│    ├── WAGDIE NFT (ERC-721A)                                │
│    └── Tokens Of Concord (ERC-1155)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Issues

### Map Not Loading

1. Check browser console for Phaser errors
2. Verify `/public/images/wagdiemap.png` exists
3. Check for CORS issues with assets

### Wallet Not Connecting

1. Ensure MetaMask is installed
2. Check network is Ethereum Mainnet
3. Verify RPC URL in environment

### Transaction Failing

1. Check wallet has sufficient ETH for gas
2. Verify token balances before transaction
3. Check contract is not paused
4. Review error message in toast notification

---

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [wagmi Documentation](https://wagmi.sh/)
- [viem Documentation](https://viem.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [WAGDIE OpenSea](https://opensea.io/collection/we-are-all-going-to-die)
- [Tokens Of Concord OpenSea](https://opensea.io/collection/we-are-all-going-to-die)
