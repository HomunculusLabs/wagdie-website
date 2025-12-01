# Feature Specification: Phaser Map & Contract Integration

**Feature Branch**: `011-phaser-contract-integration`
**Created**: 2025-11-29
**Status**: Draft
**Input**: User description: "We are going to use the phaser map and lets get the contract hooks integrated."

## Clarifications

### Session 2025-11-29

- Q: Legacy Code Cleanup Strategy → A: Complete removal - delete all Leaflet map components and dependencies
- Q: Contract Address Source → A: Hardcode verified mainnet addresses directly in a constants file
- Q: Transaction Failure Recovery UX → B: Toast notification with retry button, auto-dismiss after 10 seconds

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Interactive World Map (Priority: P1)

Users can view and navigate the WAGDIE world map using the Phaser-based implementation, with smooth zoom and pan controls, and see markers for locations, characters, and events.

**Why this priority**: The map is the core navigation interface for the WAGDIE world. Without a functioning map, users cannot explore or interact with the game world. This is the foundational feature that all other interactions build upon.

**Independent Test**: Can be fully tested by loading the map page and verifying zoom/pan controls work, markers display correctly, and the map image renders without errors.

**Acceptance Scenarios**:

1. **Given** the user navigates to the map page, **When** the page loads, **Then** the WAGDIE world map image displays centered on screen with default zoom level
2. **Given** the map is displayed, **When** the user uses scroll wheel or pinch gesture, **Then** the map zooms in/out smoothly within defined bounds
3. **Given** the map is displayed, **When** the user clicks and drags, **Then** the map pans to follow the drag direction
4. **Given** location data exists, **When** the map renders, **Then** location markers appear at correct coordinates with tooltips on hover
5. **Given** character location data exists, **When** the map renders, **Then** character markers appear at their staked locations

---

### User Story 2 - Burn Corpses for Mushrooms (Priority: P2)

Users who own corpse tokens can burn them to receive Strange Mushroom concords, which are used for spreading infections and other game mechanics.

**Why this priority**: This is the entry point for the spread mechanic - users need mushrooms to participate in infections. It's the first write transaction users typically perform.

**Independent Test**: Can be fully tested by connecting a wallet with corpse tokens, initiating a burn transaction, and verifying the transaction completes with the correct mushroom balance update.

**Acceptance Scenarios**:

1. **Given** a connected wallet with corpse tokens, **When** the user initiates a burn transaction with a valid amount, **Then** a blockchain transaction is submitted and the user sees a pending state
2. **Given** a burn transaction is pending, **When** the transaction confirms, **Then** the user receives confirmation and their mushroom balance updates
3. **Given** a connected wallet with zero corpse tokens, **When** the user attempts to burn, **Then** the system prevents the action and displays an appropriate message
4. **Given** a burn transaction fails, **When** the error occurs, **Then** the user sees a clear error message and can retry the action

---

### User Story 3 - Spread Infections Randomly (Priority: P2)

Users with Strange Mushroom tokens can spend them to spread infections to random WAGDIE characters, participating in the game's spread mechanic.

**Why this priority**: This is a core game mechanic that creates engagement and drives the infection spread gameplay. Equal priority with burning as both are essential to the game loop.

**Independent Test**: Can be fully tested by connecting a wallet with mushroom balance, executing a spread transaction, and verifying the infection spreads to random characters.

**Acceptance Scenarios**:

1. **Given** a connected wallet with mushroom tokens, **When** the user selects a number of mushrooms and initiates spread, **Then** a blockchain transaction is submitted
2. **Given** a spread transaction confirms, **When** the user views the result, **Then** they see which characters were infected
3. **Given** insufficient mushroom balance, **When** the user attempts to spread more mushrooms than they own, **Then** the system prevents the action with a clear message

---

### User Story 4 - Infect Specific Character (Priority: P3)

Users can target and infect a specific WAGDIE character by paying the infection price in ETH plus spending a mushroom token.

**Why this priority**: Targeted infection is an advanced mechanic that requires both mushrooms and ETH. It's valuable but less frequently used than random spreading.

**Independent Test**: Can be fully tested by selecting a target character, paying the required ETH amount, and verifying the specific character becomes infected.

**Acceptance Scenarios**:

1. **Given** a connected wallet with mushrooms and sufficient ETH, **When** the user selects a character to infect and confirms, **Then** a payable transaction is submitted with the correct ETH amount
2. **Given** a targeted infection succeeds, **When** the user views the character, **Then** the character shows as infected
3. **Given** insufficient ETH for infection price, **When** the user attempts targeted infection, **Then** the system displays the required amount and prevents the action

---

### User Story 5 - Cure Infected Character (Priority: P3)

Owners of infected WAGDIE characters can cure them by initiating a cure transaction.

**Why this priority**: Curing is the counter-mechanic to infection. It's important for character owners but less frequently used than spread mechanics.

**Independent Test**: Can be fully tested by owning an infected character, initiating a cure, and verifying the character's infection status clears.

**Acceptance Scenarios**:

1. **Given** a user owns an infected character, **When** they initiate a cure transaction, **Then** the blockchain transaction is submitted
2. **Given** a cure transaction confirms, **When** the user views their character, **Then** the infection status is cleared
3. **Given** a user attempts to cure a character they don't own, **When** they initiate cure, **Then** the system prevents the action with an ownership error

---

### User Story 6 - Sear Concords (Priority: P4)

Users can sear (burn) a concord attached to their character for permanent effects, sacrificing the concord.

**Why this priority**: Searing is an advanced mechanic with permanent consequences. It's the lowest frequency action and requires careful user consideration.

**Independent Test**: Can be fully tested by having a character with a concord, initiating sear, and verifying the concord is burned with appropriate effects applied.

**Acceptance Scenarios**:

1. **Given** a character with an attached concord, **When** the owner initiates sear, **Then** a confirmation dialog warns about the permanent action
2. **Given** the user confirms searing, **When** the transaction completes, **Then** the concord is permanently removed and effects are applied
3. **Given** a character without concords, **When** the user views sear options, **Then** no searing action is available

---

### Edge Cases

- **Transaction failure (gas issues, reverts)**: Display toast notification with error message and retry button; auto-dismiss after 10 seconds if no action taken
- **Wallet disconnection during pending transaction**: Show reconnect prompt; transaction status will update when wallet reconnects and checks blockchain state
- **Contract paused or maintenance mode**: Display user-friendly message indicating temporary unavailability; disable transaction buttons
- **Pending transactions on page navigation**: Transaction state persists; toast notifications resume on return to show completion or failure
- **Concurrent infection attempts**: Blockchain handles race condition; second transaction will fail with "already infected" error shown via toast

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the WAGDIE world map using the Phaser-based rendering implementation
- **FR-002**: System MUST completely remove all legacy Leaflet map components, hooks, and dependencies (react-leaflet, leaflet) to reduce bundle size and establish Phaser as the single canonical map implementation
- **FR-003**: System MUST allow users to zoom the map between defined minimum and maximum bounds
- **FR-004**: System MUST allow users to pan the map using click-and-drag or touch gestures
- **FR-005**: System MUST display location markers at their correct map coordinates
- **FR-006**: System MUST display character markers at their staked location coordinates
- **FR-007**: System MUST display event markers (burns, deaths, fights) when layer is enabled
- **FR-008**: System MUST provide layer toggle controls for showing/hiding marker types
- **FR-009**: System MUST connect to Ethereum mainnet to interact with WAGDIE smart contracts
- **FR-010**: System MUST allow users to burn corpse tokens to receive mushroom concords
- **FR-011**: System MUST allow users to spread infections using mushroom tokens
- **FR-012**: System MUST allow users to infect specific characters by paying ETH plus mushroom
- **FR-013**: System MUST allow character owners to cure their infected characters
- **FR-014**: System MUST allow users to sear concords attached to their characters
- **FR-015**: System MUST display transaction status (pending, confirmed, failed) for all blockchain operations
- **FR-016**: System MUST read token balances (corpses, mushrooms) from the blockchain
- **FR-017**: System MUST read infection price from the smart contract
- **FR-018**: System MUST validate user ownership before allowing character-specific actions
- **FR-019**: System MUST store verified mainnet contract addresses in a dedicated constants file with addresses sourced from Etherscan-verified contracts
- **FR-020**: System MUST handle transaction errors gracefully with user-friendly messages

### Key Entities

- **Map**: The WAGDIE world visual representation with 2222x2222 pixel dimensions, supporting zoom/pan navigation
- **Location**: Named areas on the map where characters can be staked, with defined coordinate bounds
- **Character**: WAGDIE NFT (token ID 1-6666) that can be staked at locations, infected, cured, and have concords attached
- **Marker**: Visual indicator on the map representing locations, characters, or events (burns, deaths, fights)
- **Corpse Token**: ERC-1155 token that can be burned to receive mushroom concords
- **Mushroom/Concord**: Token received from burning corpses, used for spreading infections
- **Transaction**: Blockchain operation with states: pending, confirmed, failed, including hash and error information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load and interact with the map within 3 seconds on standard broadband connections
- **SC-002**: Map zoom and pan interactions respond within 100ms of user input (60fps target)
- **SC-003**: All five contract operations (burn, spread, infect, cure, sear) execute successfully when provided valid inputs
- **SC-004**: Transaction confirmation displays to users within 2 seconds of blockchain confirmation
- **SC-005**: 100% of contract interactions include proper error handling with user-friendly messages
- **SC-006**: Token balance reads update within 5 seconds of any balance-changing transaction
- **SC-007**: System prevents 100% of invalid transactions (insufficient balance, non-owner actions) before submission
- **SC-008**: Map markers load and display for 50+ simultaneous markers without performance degradation

## Assumptions

- WAGDIE smart contracts are deployed on Ethereum mainnet and their addresses are available
- Contract ABIs are available or can be obtained from verified contracts on Etherscan
- The existing wagmi/viem setup is functional and can be extended for contract interactions
- Users have MetaMask or compatible Web3 wallet for transactions
- The Phaser implementation (`game/scenes/MapScene.ts`) is the canonical map going forward
- Network: Ethereum mainnet (not testnet) for production use

## Out of Scope

- Mobile-specific touch optimization (standard responsive design only)
- Contract deployment or migration
- New smart contract development
- Multi-chain support (Ethereum mainnet only)
- Fiat payment integration
- Admin/governance functions
