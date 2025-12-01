# Research: WAGDIE Contract Integration

**Date**: 2025-11-29
**Feature**: 011-phaser-contract-integration
**Status**: Complete

## Contract Addresses (Verified on Etherscan)

### Main WAGDIE NFT Contract (ERC-721A)

| Field | Value |
|-------|-------|
| Address | `0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A` |
| Type | ERC-721A (optimized ERC-721) |
| Name | We Are All Going to Die |
| Symbol | WAGDIE |
| Total Supply | 6,666 NFTs |
| Compiler | Solidity 0.8.7 |
| Etherscan | [View Contract](https://etherscan.io/address/0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A) |

**Key Functions:**
```solidity
function mint() external
function tokenURI(uint256 tokenId) external view returns (string memory)
function ownerOf(uint256 tokenId) external view returns (address)
function balanceOf(address owner) external view returns (uint256)
```

---

### Tokens Of Concord (ERC-1155)

| Field | Value |
|-------|-------|
| Address | `0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634` |
| Type | ERC-1155 + ERC-2981 (royalties) |
| Name | WAGDIE: Tokens Of Concord |
| Symbol | CONCORD |
| Total Items | 43 unique token types |
| Total Supply | 1,543 tokens |
| Compiler | Solidity 0.8.9 |
| Etherscan | [View Contract](https://etherscan.io/address/0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634) |

**Notable Token IDs:**
| Token ID | Name | Supply | Purpose |
|----------|------|--------|---------|
| 15 | Strange Mushroom | 225 | Used for spreading infections |
| 3 | Her Ash | - | Concord item |
| 7 | Artificer's Crystal | - | Concord item |
| 30 | Seer's Gem | - | Concord item |
| 36 | Monad Carving | - | Concord item |

**Key Functions:**
```solidity
function balanceOf(address account, uint256 id) external view returns (uint256)
function burn(address account, uint256 id, uint256 value) external
function burnMany(address account, uint256[] ids, uint256[] values) external
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external
function setApprovalForAll(address operator, bool approved) external
```

---

## Research Findings

### Decision 1: Contract Architecture

**Decision**: Use the two verified contracts (WAGDIE NFT + Tokens Of Concord) as the core contract addresses.

**Rationale**:
- Both contracts are verified on Etherscan with source code available
- The Tokens Of Concord contract contains the mushroom tokens (Token ID 15) used for infections
- The main WAGDIE contract handles character ownership

**Alternatives Considered**:
- Searching for additional infection/spread contracts - none found publicly
- Using OpenSea's shared storefront - not project-specific

### Decision 2: Infection/Spread Mechanics

**Decision**: The infection spread mechanics appear to be handled either:
1. Through the Tokens Of Concord contract's burn functions
2. Through an undocumented contract not yet identified

**Rationale**:
- The existing codebase references `SPREAD` contract with functions like `spreadInfections(uint256)` and `infectWagdie(uint256) payable`
- No public contract matching these signatures was found
- The Tokens Of Concord contract has burn functions that may be the actual implementation

**Recommendation**:
- Start with read-only functions (balances, ownership) using verified contracts
- Investigate transaction history on Tokens Of Concord for infection patterns
- Contact WAGDIE community if spread contract needed

### Decision 3: Corpse Token Handling

**Decision**: Corpse tokens are likely within the Tokens Of Concord contract as a specific token ID.

**Rationale**:
- "Mysterious Corpse" was documented as extractable for Strange Mushrooms
- The corpse burning mechanic may use the existing `burn()` function on Tokens Of Concord
- No separate ERC-1155 corpse contract was identified

**Alternatives Considered**:
- Separate ERC-1155 contract - not found
- OpenSea-minted tokens - would use shared storefront

---

## Confirmed Contract Addresses

```typescript
// lib/contracts/addresses.ts
export const WAGDIE_CONTRACTS = {
  // Main NFT contract (ERC-721A) - VERIFIED
  WAGDIE_NFT: '0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A',

  // Tokens Of Concord (ERC-1155) - contains mushrooms, corpses, concords - VERIFIED
  TOKENS_OF_CONCORD: '0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634',

  // Token IDs within Tokens Of Concord
  TOKEN_IDS: {
    STRANGE_MUSHROOM: 15,
    // Other token IDs to be determined from contract exploration
  }
} as const;
```

---

## ABI Requirements

### For WAGDIE NFT (ERC-721A):
- Standard ERC-721 read functions: `ownerOf`, `balanceOf`, `tokenURI`
- No custom write functions needed (staking handled elsewhere)

### For Tokens Of Concord (ERC-1155):
- Standard ERC-1155: `balanceOf`, `balanceOfBatch`, `safeTransferFrom`
- Burn functions: `burn`, `burnMany`
- Approval: `setApprovalForAll`, `isApprovedForAll`

### Partial ABI (to be expanded):
```typescript
// ERC-1155 standard functions needed
export const TOKENS_OF_CONCORD_ABI = [
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
```

---

## Outstanding Questions

1. **Spread Contract Location**: The infection spread mechanics (`spreadInfections`, `infectWagdie`) are referenced in the codebase but no matching contract was found. Options:
   - These may be custom game functions not on-chain
   - May be in an unverified/proxy contract
   - May be handled server-side with database updates

2. **Cure Mechanics**: The `cure(uint256 tokenId)` function is referenced but not found. May be:
   - Part of an undocumented contract
   - Handled by burning a cure token through Tokens Of Concord

3. **Searing Mechanics**: `searConcord(uint256 tokenId, uint256 concordId)` - likely uses the `burn` function on Tokens Of Concord.

---

## Implementation Approach

Given the research findings, recommend a phased implementation:

### Phase 1: Read-Only Integration
- Implement balance reads using verified contracts
- Character ownership via WAGDIE NFT
- Mushroom balance via Tokens Of Concord (Token ID 15)

### Phase 2: Write Operations (Known Contracts)
- Implement mushroom burning via Tokens Of Concord `burn` function
- Implement concord searing via Tokens Of Concord `burn` function

### Phase 3: Game Mechanics (TBD)
- Infection spread - may need community/team input
- Cure mechanics - may need community/team input
- If no contracts exist, these may be database-driven mechanics

---

## Sources

- [Etherscan: WAGDIE NFT](https://etherscan.io/address/0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A)
- [Etherscan: Tokens Of Concord](https://etherscan.io/address/0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634)
- [OpenSea: WAGDIE Collection](https://opensea.io/collection/wagdie)
- [OpenSea: Tokens Of Concord](https://opensea.io/collection/wagdie-tokens-of-concord)
- [WAGDIE Wiki: Strange Mushroom](https://wagdie.wiki/tokens/strange_mushroom)
- [DappRadar: WAGDIE Analysis](https://dappradar.com/blog/new-dapps-report-we-are-all-going-to-die-embraces-uncertainty)
