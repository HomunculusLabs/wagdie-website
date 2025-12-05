# Feature Specification: Code Complexity Refactoring

**Feature Branch**: `019-code-complexity-refactor`
**Created**: 2025-12-04
**Status**: Draft
**Input**: User description: "Fix all code complexity issues identified in analysis - character detail page, useSpread hook, MapScene switch statements, and useAIPersonaEditor setters"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Modifies Character Detail Page (Priority: P1)

A developer needs to add a new feature to the character detail page. Currently, the 737-line single component makes it difficult to understand where changes should go and increases risk of unintended side effects.

**Why this priority**: The character detail page is the most complex file (737 lines, 16 useState hooks) and is a high-traffic area for feature development. Reducing its complexity will have the highest impact on developer productivity and code maintainability.

**Independent Test**: Can be fully tested by verifying that all existing character detail functionality works identically after refactoring, and new developers can locate relevant code sections in under 2 minutes.

**Acceptance Scenarios**:

1. **Given** the character detail page is loaded, **When** a user views character stats, story, AI persona, equipment, or wallet tabs, **Then** all functionality works identically to before the refactor
2. **Given** a developer needs to modify the save functionality, **When** they search for save-related code, **Then** they find it in a dedicated module rather than buried in a 737-line file
3. **Given** a developer runs the test suite, **When** tests execute for character editing, **Then** individual components can be tested in isolation

---

### User Story 2 - Developer Adds New Blockchain Transaction (Priority: P2)

A developer needs to add a new blockchain transaction type (e.g., staking, unstaking). Currently, they must copy 100+ lines of duplicate code from useSpread hook and risk inconsistent behavior.

**Why this priority**: Transaction handling duplication affects 5+ hooks and is a common source of bugs when one is updated but not another. A shared utility would reduce code by 60% and ensure consistent behavior.

**Independent Test**: Can be fully tested by verifying all existing blockchain transactions (infect, spread) work identically, and adding a new transaction type requires less than 30 lines of code.

**Acceptance Scenarios**:

1. **Given** a user initiates an infection transaction, **When** the transaction is submitted, **Then** the behavior is identical to before the refactor (pending, confirming, success/error states)
2. **Given** a developer adds a new transaction type, **When** they implement it, **Then** they can reuse the shared transaction utility without copying 100+ lines
3. **Given** a transaction fails, **When** the error is displayed, **Then** error handling is consistent across all transaction types

---

### User Story 3 - Developer Adds New Marker Type to Map (Priority: P3)

A developer needs to add a new marker type (e.g., "quest" markers) to the map. Currently, they must update 4 separate switch statements and risk missing one.

**Why this priority**: Switch statement proliferation makes adding new types error-prone. Consolidating to a configuration object makes additions safer and self-documenting.

**Independent Test**: Can be fully tested by verifying all existing marker types render correctly, and adding a new marker type requires modifying only one location.

**Acceptance Scenarios**:

1. **Given** the map is loaded with locations, characters, burns, deaths, and fights, **When** markers render, **Then** all markers display with correct icons, scales, depths, and visibility
2. **Given** a developer adds a new marker type, **When** they configure it, **Then** they modify a single configuration object rather than 4 switch statements
3. **Given** layer visibility is toggled, **When** a marker type is hidden/shown, **Then** markers respond correctly based on the configuration

---

### User Story 4 - Developer Adds New AI Persona Field (Priority: P4)

A developer needs to add a new field to the AI persona editor. Currently, they must copy the same 4-line setter pattern for the 10th time.

**Why this priority**: While less impactful than other issues, repetitive setter boilerplate adds maintenance burden and increases bundle size unnecessarily.

**Independent Test**: Can be fully tested by verifying all existing AI persona fields save correctly, and adding a new field requires minimal boilerplate.

**Acceptance Scenarios**:

1. **Given** an AI persona editor is open, **When** the user modifies bio, lore, topics, adjectives, style, examples, or system prompt, **Then** changes are tracked and saved correctly
2. **Given** a developer adds a new persona field, **When** they implement it, **Then** they use a streamlined pattern rather than copying 4 lines of boilerplate
3. **Given** the persona has unsaved changes, **When** the user navigates away, **Then** draft persistence still works correctly

---

### Edge Cases

- What happens when a component import fails during the refactor? All existing functionality must continue to work through graceful degradation.
- How does the system handle partial refactoring? Each refactored area must be independently deployable without breaking other areas.
- What happens if the shared transaction utility encounters an unknown error type? Graceful fallback with generic error message displayed to user.
- How do we ensure backward compatibility for existing hooks that depend on refactored code? All public interfaces remain stable with no breaking changes.

## Requirements *(mandatory)*

### Functional Requirements

**Character Detail Page Decomposition:**
- **FR-001**: System MUST preserve all existing character detail functionality (stats editing, story editing, AI persona, equipment display, wallet display)
- **FR-002**: System MUST extract tab content into separate, focused components
- **FR-003**: System MUST consolidate editing state management into a reusable custom hook
- **FR-004**: System MUST maintain identical user experience before and after refactoring

**Blockchain Transaction Utility:**
- **FR-005**: System MUST provide a shared transaction execution utility for common patterns (pending, confirming, success/error)
- **FR-006**: System MUST support all existing transaction types (infect, spread) through the shared utility
- **FR-007**: System MUST maintain consistent error handling and toast notifications across all transaction types
- **FR-008**: System MUST support transaction store integration (addTransaction, updateTransaction)

**Map Scene Configuration:**
- **FR-009**: System MUST replace multiple switch statements with a single marker configuration object
- **FR-010**: System MUST preserve all existing marker behavior (icons, scales, depths, visibility)
- **FR-011**: System MUST support all existing marker types (location, character, burn, death, fight)
- **FR-012**: Configuration object MUST be easily extensible for new marker types

**AI Persona Editor State:**
- **FR-013**: System MUST reduce setter boilerplate through pattern consolidation
- **FR-014**: System MUST preserve all existing draft persistence functionality
- **FR-015**: System MUST maintain identical change tracking behavior

**General:**
- **FR-016**: All refactored code MUST pass existing tests
- **FR-017**: Refactoring MUST NOT introduce new external dependencies
- **FR-018**: Each refactored area MUST be independently deployable

### Key Entities

- **Character Editor State**: Consolidated state object containing all editable character fields (name, story, core stats, derived stats, level/experience)
- **Transaction Executor**: Shared utility handling blockchain transaction lifecycle (submit, confirm, success, error)
- **Marker Configuration**: Configuration object mapping marker types to their visual properties (icon, scale, depth, visibility key)
- **Persona State Manager**: Streamlined state management for AI persona editor fields

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Character detail page component reduced from 737 lines to under 300 lines, with logic distributed across focused modules
- **SC-002**: Developer can locate and understand character editing code in under 2 minutes (measured by code review)
- **SC-003**: Adding a new blockchain transaction type requires less than 30 lines of new code (compared to 100+ currently)
- **SC-004**: All existing blockchain transactions maintain identical behavior (verified by existing tests)
- **SC-005**: Adding a new marker type requires modifying exactly 1 location instead of 4
- **SC-006**: All existing map markers render identically (verified by visual inspection)
- **SC-007**: AI persona editor maintains 100% feature parity with current implementation
- **SC-008**: Overall code reduction of at least 200 lines across all refactored areas
- **SC-009**: 100% of existing tests pass after refactoring
- **SC-010**: No new external dependencies introduced

## Assumptions

- Existing test coverage is sufficient to verify behavior preservation
- The refactoring can be done incrementally without breaking changes
- Current component interfaces can be maintained during transition
- The team prefers configuration objects over switch statements for extensibility
