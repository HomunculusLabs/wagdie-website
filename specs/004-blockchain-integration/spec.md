# Feature Specification: Blockchain Integration

**Feature Branch**: `004-blockchain-integration`
**Created**: 2025-10-28
**Status**: Draft
**Input**: User description: "Phase 4 - Implement real blockchain integration for character searing, infection mechanics, corpse burning, staking system, and ownership verification"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify NFT Ownership Before Actions (Priority: P1)

Users connect their wallet and see which WAGDIE characters they own. The application verifies ownership in real-time from the blockchain before allowing any character editing or game actions.

**Why this priority**: This is the foundation for all other blockchain features. Without proper ownership verification, users could edit characters they don't own, breaking the core trust model of the application.

**Independent Test**: Can be fully tested by connecting a wallet with known token IDs and verifying that only owned characters show "Yours" badge and enable edit capabilities. Delivers immediate security value by preventing unauthorized edits.

**Acceptance Scenarios**:

1. **Given** a user connects a wallet that owns token #1234, **When** they view the characters page, **Then** token #1234 displays a "Yours" badge and other tokens do not
2. **Given** a user connects a wallet that owns token #1234, **When** they navigate to the character detail page for token #1234, **Then** the Edit button is enabled
3. **Given** a user connects a wallet that does not own token #5678, **When** they navigate to the character detail page for token #5678, **Then** the Edit button is disabled
4. **Given** a user has their wallet connected, **When** they transfer a character to another wallet, **Then** the ownership badge updates within 30 seconds
5. **Given** a user disconnects their wallet, **When** they view any character page, **Then** no ownership badges are shown and all edit buttons are disabled

---

### User Story 2 - Check Token Balances for Game Actions (Priority: P1)

Users view their current balances of Tokens of Concord, Corpse tokens, and Mushroom tokens in real-time. The application reads these balances from the blockchain to enable or disable game actions based on available resources.

**Why this priority**: Users need to know what resources they have before attempting game actions. This prevents failed transactions and provides transparency about what actions are possible.

**Independent Test**: Can be tested by checking wallet balances against blockchain state and verifying UI accurately reflects available tokens. Delivers value by showing users what they can do.

**Acceptance Scenarios**:

1. **Given** a connected wallet owns 3 Tokens of Concord, **When** viewing a character detail page, **Then** the character sheet displays "3 Concords Available"
2. **Given** a connected wallet owns 0 Corpse tokens, **When** viewing the Spread page, **Then** the corpse burning action is disabled with message "No corpses to burn"
3. **Given** a connected wallet owns 5 Mushroom tokens, **When** initiating infection spread, **Then** the UI shows "5 mushrooms available" and allows selection up to that amount
4. **Given** a user's token balance changes on-chain, **When** the page is refreshed, **Then** the updated balance is displayed
5. **Given** a wallet is not connected, **When** viewing any game action page, **Then** token balances show as "--" or "Connect wallet to view"

---

### User Story 3 - Sear Characters by Burning Concords (Priority: P2)

Users who own a character and sufficient Tokens of Concord can permanently transform their character through the searing process. The transaction burns the required Concord tokens and updates the character's on-chain state.

**Why this priority**: Character searing is a core game mechanic that permanently alters character state. It's prioritized after ownership verification since it depends on knowing what the user owns.

**Independent Test**: Can be tested on testnet by owning a character and Concords, initiating searing, approving the transaction, and verifying the character's seared status updates. Delivers the first transformative game action.

**Acceptance Scenarios**:

1. **Given** a user owns character #1234 and 3 Tokens of Concord, **When** they click "Sear Character" and approve both token approval and searing transactions, **Then** the character's seared status updates to true
2. **Given** a user owns character #1234 but 0 Tokens of Concord, **When** they view the character detail page, **Then** the "Sear Character" button is disabled with message "Insufficient Concords"
3. **Given** a user initiates searing, **When** they reject the token approval transaction, **Then** the searing process stops and the character remains unchanged
4. **Given** a searing transaction is in progress, **When** viewing the character, **Then** a loading indicator shows "Searing in progress..."
5. **Given** a searing transaction fails, **When** the error is detected, **Then** an error message displays explaining the failure reason
6. **Given** a character is already seared, **When** viewing the character detail, **Then** the "Sear Character" button is hidden or disabled

---

### User Story 4 - Spread Infection by Paying ETH and Burning Mushrooms (Priority: P2)

Users can spread infection from an infected character to another character by paying ETH and burning Mushroom tokens. The transaction updates both characters' infection status on-chain.

**Why this priority**: Infection spreading is a key game mechanic for player interaction. It's P2 because it depends on ownership verification but can be developed independently of searing.

**Independent Test**: Can be tested by having an infected character, ETH, and mushrooms, then spreading infection to a target character and verifying both characters update their infection status.

**Acceptance Scenarios**:

1. **Given** a user owns infected character #1234, has sufficient ETH and mushrooms, **When** they select target character #5678, approve the transaction, and pay the required ETH, **Then** character #5678 becomes infected
2. **Given** a user owns infected character #1234 but has insufficient ETH, **When** they attempt to spread infection, **Then** the action is disabled with message "Insufficient ETH"
3. **Given** a user owns infected character #1234 but has 0 mushrooms, **When** they view the spread page, **Then** the spread action is disabled with message "No mushrooms available"
4. **Given** a user selects an already infected target character, **When** they attempt to spread, **Then** the UI shows "Target already infected"
5. **Given** an infection spread transaction is pending, **When** viewing the spread page, **Then** a loading indicator shows "Spreading infection..."
6. **Given** a user owns character #1234 but it is not infected, **When** they view the spread page, **Then** character #1234 is not selectable as a source

---

### User Story 5 - Burn Corpse Tokens (Priority: P2)

Users who own Corpse tokens can burn them through the application. This requires approving the ERC1155 token for the burning contract, then executing the burn transaction.

**Why this priority**: Corpse burning is part of the core game loop but is independent of other mechanics. It's P2 because it's a standalone action.

**Independent Test**: Can be tested by owning corpse tokens, approving the contract, burning tokens, and verifying the balance decreases.

**Acceptance Scenarios**:

1. **Given** a user owns 5 Corpse tokens, **When** they select quantity 2 and approve both approval and burn transactions, **Then** their corpse balance decreases by 2
2. **Given** a user owns 3 Corpse tokens, **When** they attempt to burn 5 corpses, **Then** the transaction is prevented with message "Insufficient corpse tokens"
3. **Given** a user has not approved the burn contract, **When** they initiate burning, **Then** an approval transaction is requested first
4. **Given** a user rejects the approval transaction, **When** the rejection is detected, **Then** the burn process stops and shows "Approval required to burn"
5. **Given** a burn transaction is in progress, **When** viewing the spread page, **Then** a loading indicator shows "Burning corpses..."
6. **Given** a burn transaction completes, **When** the transaction confirms, **Then** a success message displays "Successfully burned X corpses"

---

### User Story 6 - Stake Characters at Locations (Priority: P3)

Users can stake their characters at specific game locations. Staking locks the character in a contract and associates it with a location. Users can later unstake to retrieve their character.

**Why this priority**: Character staking enables location-based gameplay but is less critical than the core transformation mechanics. It's P3 because it's a complex feature that can be added after the MVP is functional.

**Independent Test**: Can be tested by staking a character at a location, verifying the staking status shows correctly, then unstaking and verifying the character returns to the wallet.

**Acceptance Scenarios**:

1. **Given** a user owns character #1234, **When** they select a location and approve the staking transaction, **Then** the character shows as staked at that location
2. **Given** a user's character #1234 is staked, **When** they view the character detail page, **Then** an "Unstake" button is shown instead of "Stake"
3. **Given** a character is staked at "The Concord", **When** viewing the characters list with location filter "The Concord", **Then** the character appears in the filtered results
4. **Given** a user attempts to stake a character they don't own, **When** the ownership check runs, **Then** the stake button is disabled
5. **Given** a user initiates unstaking, **When** they approve the transaction, **Then** the character's staked status updates to false
6. **Given** multiple characters are staked, **When** viewing the characters page with "staked" filter, **Then** only staked characters are displayed

---

### User Story 7 - Cure Infected Characters (Priority: P3)

Users can cure their infected characters by executing a cure transaction. The cure action removes the infection status from the character.

**Why this priority**: Curing infection provides reversibility to the infection mechanic. It's P3 because infection spreading is more critical, and cure can be added after the core infection loop works.

**Independent Test**: Can be tested by having an infected character, executing the cure transaction, and verifying the infection status clears.

**Acceptance Scenarios**:

1. **Given** a user owns infected character #1234, **When** they click "Cure Infection" and approve the transaction, **Then** the character's infected status updates to false
2. **Given** a user's character #1234 is not infected, **When** viewing the character detail, **Then** no "Cure Infection" button is shown
3. **Given** a cure transaction is in progress, **When** viewing the character, **Then** a loading indicator shows "Curing infection..."
4. **Given** a cure transaction fails, **When** the error is detected, **Then** an error message explains the failure
5. **Given** a cure transaction succeeds, **When** the transaction confirms, **Then** a success message displays "Infection cured successfully"

---

### Edge Cases

- What happens when a user initiates a transaction but their wallet balance becomes insufficient before confirmation?
- How does the system handle network congestion causing transaction delays of 5+ minutes?
- What happens when a user closes the browser tab while a transaction is pending?
- How does the application handle chain reorganizations that might temporarily reverse a confirmed transaction?
- What happens when a user attempts to execute multiple game actions simultaneously?
- How does the system handle contracts that are paused or deprecated?
- What happens when RPC endpoints are down or rate-limited?
- How does the application handle users on unsupported networks?
- What happens when a user's wallet is disconnected mid-transaction?
- How does the system handle stale token approval amounts?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify character ownership by reading the WAGDIE ERC721 contract before allowing any character edits
- **FR-002**: System MUST display real-time token balances for Tokens of Concord, Corpse tokens, and Mushroom tokens by reading ERC721/ERC1155 contracts
- **FR-003**: System MUST execute character searing by calling the searing contract with appropriate token approvals
- **FR-004**: System MUST execute infection spreading by calling the spread contract with ETH payment and mushroom burn
- **FR-005**: System MUST execute corpse burning by calling the burn contract with ERC1155 approval
- **FR-006**: System MUST execute character staking by calling the staking contract and associating characters with locations
- **FR-007**: System MUST execute character unstaking by calling the staking contract to release characters
- **FR-008**: System MUST execute cure transactions to remove infection status from characters
- **FR-009**: System MUST request user approval for token spending before any action that requires token burns
- **FR-010**: System MUST display transaction status (pending, confirmed, failed) in real-time
- **FR-011**: System MUST update character state in the database after blockchain transactions confirm
- **FR-012**: System MUST validate user has sufficient token balances before enabling transaction buttons
- **FR-013**: System MUST validate user is connected to the correct blockchain network before allowing transactions
- **FR-014**: System MUST persist pending transaction hashes to allow users to resume after page refresh
- **FR-015**: System MUST display gas estimates for transactions before user approval
- **FR-016**: System MUST handle transaction failures with user-friendly error messages
- **FR-017**: System MUST wait for transaction confirmations before updating UI state
- **FR-018**: System MUST prevent users from editing characters they do not own
- **FR-019**: System MUST prevent users from executing game actions on characters they do not own
- **FR-020**: System MUST display ownership badges ("Yours") only for characters owned by the connected wallet

### Key Entities

- **Character Ownership**: The verified ownership state of a WAGDIE NFT token by a wallet address, read from the blockchain
- **Token Balance**: The quantity of ERC721 or ERC1155 tokens owned by a wallet address for Concords, Corpses, and Mushrooms
- **Searing Transaction**: A blockchain transaction that burns Tokens of Concord and updates a character's seared status permanently
- **Infection Spread Transaction**: A blockchain transaction that pays ETH, burns mushrooms, and updates infection status for source and target characters
- **Corpse Burn Transaction**: A blockchain transaction that burns ERC1155 corpse tokens
- **Staking Transaction**: A blockchain transaction that locks a character in a staking contract and associates it with a location
- **Unstaking Transaction**: A blockchain transaction that releases a staked character back to the owner's wallet
- **Cure Transaction**: A blockchain transaction that removes infection status from a character
- **Token Approval**: An ERC721/ERC1155 approval transaction that grants a contract permission to spend user tokens
- **Transaction Status**: The current state of a blockchain transaction (pending, confirmed, failed) tracked in real-time

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can verify ownership of their characters within 5 seconds of wallet connection
- **SC-002**: Users can view real-time token balances with no more than 15 seconds latency from blockchain state
- **SC-003**: Users can complete a character searing transaction in under 3 minutes including approval steps
- **SC-004**: Users can spread infection between characters in under 3 minutes including approval and payment
- **SC-005**: Users can burn corpse tokens in under 2 minutes including approval
- **SC-006**: Users can stake and unstake characters in under 2 minutes per action
- **SC-007**: Transaction failures provide clear error messages that 90% of users can understand without technical knowledge
- **SC-008**: The application correctly prevents unauthorized actions in 100% of cases where users don't own the required tokens or characters
- **SC-009**: Transaction status updates appear in the UI within 10 seconds of on-chain confirmation
- **SC-010**: Users can resume pending transactions after browser refresh without losing transaction state
- **SC-011**: The application handles network switches and shows appropriate warnings within 3 seconds
- **SC-012**: 95% of blockchain operations succeed on first attempt when users have sufficient balances and gas
- **SC-013**: Users successfully complete their first game action (sear, spread, or burn) with no more than 2 approval transactions
- **SC-014**: Zero cases of users editing characters they don't own after blockchain verification is implemented

## Assumptions

1. **Network Assumptions**: Users are expected to connect to Ethereum mainnet (or configured network). The application will support standard Ethereum RPC endpoints.
2. **Contract Addresses**: All smart contract addresses are provided in environment configuration and are already deployed and verified.
3. **Token Standards**: WAGDIE uses ERC721, Corpse and Mushroom tokens use ERC1155, Tokens of Concord use ERC721.
4. **Wallet Support**: Users have a web3 wallet compatible with RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, etc.).
5. **Gas Handling**: Users are responsible for having sufficient ETH for gas fees. The application will estimate gas but not provide gas tokens.
6. **Confirmation Depth**: Transactions are considered final after 1 block confirmation for UI updates (standard practice for non-critical operations).
7. **Transaction Replacement**: Users can replace pending transactions using their wallet's built-in functionality if transactions are stuck.
8. **Contract State**: Smart contracts are assumed to be in active (not paused) state. If contracts are paused, transactions will fail with appropriate error messages.
9. **Blockchain Sync**: RPC endpoints are assumed to be synced and reliable. Stale data handling will use standard retry mechanisms.
10. **Token Metadata**: Character and token metadata is stored in the database and synchronized through separate processes (out of scope for this feature).

## Dependencies

1. **External Dependencies**:
   - RainbowKit wallet connection (already configured)
   - wagmi v2 and viem v2 (already installed)
   - Ethereum RPC endpoints (Alchemy, Infura, or similar)
   - Smart contract ABIs for: WAGDIE, Concord, Corpse, Mushroom, Searing, Spread, Staking contracts

2. **Internal Dependencies**:
   - User authentication system (SIWE) must be functional
   - Character database schema must include fields for: seared status, infected status, staked status, location
   - Existing UI components for character display and editing
   - Wallet connection state management

3. **Data Dependencies**:
   - Contract addresses must be configured in environment variables
   - Contract ABIs must be available (either as JSON files or generated TypeScript types)
   - Database must track transaction hashes for pending operations

## Out of Scope

1. **NFT Minting**: Creating new WAGDIE characters is not part of this feature
2. **Contract Deployment**: All contracts are assumed to be already deployed
3. **Gas Optimization**: Advanced gas optimization strategies are not included in initial implementation
4. **Layer 2 Support**: Only Ethereum mainnet (or configured L1) is supported initially
5. **Multi-chain Support**: No cross-chain operations or multi-network support
6. **Transaction Bundling**: Batching multiple operations into single transactions is not included
7. **Gasless Transactions**: Meta-transactions or gasless relaying is not included
8. **Smart Contract Development**: Modifying or creating smart contracts is out of scope
9. **Advanced Error Recovery**: Automatic transaction retry or replacement logic is not included
10. **Historical Transaction Viewing**: Displaying transaction history beyond current pending transactions is out of scope

## Technical Constraints

1. **Performance**: Blockchain read operations (ownership checks, balance queries) must use caching to avoid rate limits
2. **User Experience**: All blockchain operations must provide clear loading states and progress indicators
3. **Security**: Private keys must never be transmitted or stored; all signing happens in user's wallet
4. **Compatibility**: Must work with standard web3 wallets; no custom wallet implementations
5. **Error Handling**: All transaction failures must be caught and displayed with actionable user guidance
6. **State Management**: Transaction state must persist across page refreshes using browser storage
7. **Network Switching**: Application must detect and prompt users when on wrong network
8. **Rate Limiting**: Must handle RPC rate limits gracefully with appropriate retry logic and user feedback
