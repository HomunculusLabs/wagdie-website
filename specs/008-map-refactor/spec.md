# Feature Specification: Map Code Refactoring

**Feature Branch**: `008-map-refactor`
**Created**: 2025-11-05
**Status**: Draft
**Input**: User description: "Refactor the Map code"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Improved Code Maintainability (Priority: P1)

Developers can easily understand, modify, and extend the map codebase without introducing bugs or requiring extensive context switching.

**Why this priority**: The current SimpleMap component is 735 lines with mixed responsibilities, making it difficult to maintain. A cleaner architecture enables faster feature development and reduces bugs.

**Independent Test**: Can be tested by verifying that a developer can modify marker rendering for one event type (e.g., burn events) without affecting other event types, and by confirming tests run faster due to better separation of concerns.

**Acceptance Scenarios**:

1. **Given** a developer needs to update marker styling, **When** they locate the marker component, **Then** they find a dedicated, focused component under 200 lines
2. **Given** a developer wants to add a new marker type, **When** they follow the established pattern, **Then** they create a new marker component without modifying existing code
3. **Given** a developer reviews the map code structure, **When** they examine the codebase, **Then** they see clear separation between UI, business logic, and data handling
4. **Given** tests are run on the map components, **When** execution completes, **Then** tests run 40% faster due to better modularity and reduced re-renders

---

### User Story 2 - Eliminated Code Duplication (Priority: P2)

The codebase uses reusable components and abstractions instead of repeated code patterns across marker types.

**Why this priority**: Duplicate code increases maintenance burden and creates inconsistencies. Centralizing shared logic ensures uniform behavior and easier updates.

**Independent Test**: Can be tested by verifying that updating a shared style or behavior in one place automatically applies to all marker types.

**Acceptance Scenarios**:

1. **Given** the icon creation logic needs updates, **When** changes are made, **Then** all marker types use the updated logic automatically
2. **Given** a developer adds a new feature to tooltips, **When** implemented in the shared tooltip component, **Then** all marker types benefit without additional code changes
3. **Given** styling consistency is checked, **When** examining all marker popups, **Then** they follow the same design system without variation
4. **Given** marker click handling needs modification, **When** updated in the shared handler, **Then** the change applies uniformly across all types

---

### User Story 3 - Enhanced Testability (Priority: P3)

Each map component can be tested independently with clear input/output contracts and minimal setup required.

**Why this priority**: Better testability leads to higher confidence in changes, faster debugging, and prevents regressions. Modular components are easier to test in isolation.

**Independent Test**: Can be tested by running unit tests on individual marker components without needing to render the entire map.

**Acceptance Scenarios**:

1. **Given** a unit test for location markers, **When** executed, **Then** it completes in under 100ms without rendering the full map
2. **Given** testing character marker behavior, **When** the test runs, **Then** it uses mocked data and verifies output without external dependencies
3. **Given** edge case testing for icon creation, **When** tests execute, **Then** they verify behavior for mobile, desktop, and error states independently
4. **Given** integration testing the map, **When** tests run, **Then** they compose tested components to verify end-to-end behavior

---

### User Story 4 - Performance Optimization (Priority: P4)

The map renders efficiently with minimal re-renders and optimized marker creation, maintaining smooth user interactions.

**Why this priority**: Performance impacts user experience directly. Optimized rendering ensures responsive map interactions even with many markers visible.

**Independent Test**: Can be tested by loading the map with 50+ markers and verifying smooth pan/zoom operations at 60fps.

**Acceptance Scenarios**:

1. **Given** the map loads with many markers, **When** initial render completes, **Then** it happens within 1 second on standard connections
2. **Given** a user pans the map quickly, **When** interaction occurs, **Then** frame rate remains at 60fps without dropped frames
3. **Given** markers toggle on/off rapidly, **When** layer controls are used, **Then** updates complete without visible lag
4. **Given** the map re-renders due to state changes, **When** updates occur, **Then** only affected components re-render (not the entire map)

---

## Edge Cases

- What happens when marker icons fail to load?
- How does the system handle extremely large numbers of markers (1000+)?
- What occurs during rapid marker type additions/removals?
- How are performance regressions detected and prevented?
- What happens when components have circular dependencies during refactoring?
- How is backward compatibility maintained during the transition?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST break SimpleMap.tsx (735 lines) into smaller, focused components each under 200 lines
- **FR-002**: System MUST extract marker creation logic into reusable, composable marker components
- **FR-003**: System MUST create a unified MarkerRenderer component that handles all marker types consistently
- **FR-004**: System MUST eliminate duplicate icon creation logic by extracting to shared icon factory
- **FR-005**: System MUST extract popup and tooltip rendering into reusable UI components
- **FR-006**: System MUST create a MapLayer component to handle layer-specific marker rendering
- **FR-007**: System MUST implement proper TypeScript interfaces for all marker types with shared base types
- **FR-008**: System MUST ensure all refactored components are independently testable with minimal setup
- **FR-009**: System MUST maintain existing functionality and API contracts (no breaking changes)
- **FR-010**: System MUST improve test execution speed by 40% through better component isolation
- **FR-011**: System MUST reduce bundle size by eliminating duplicate code and dead code
- **FR-012**: System MUST improve code maintainability metrics (reduce cyclomatic complexity, increase cohesion)
- **FR-013**: System MUST preserve all existing accessibility features and ARIA attributes
- **FR-014**: System MUST optimize re-render performance through better React.memo usage and prop stability

### Key Entities

- **MarkerComponent**: Reusable React component for rendering individual markers of any type
- **IconFactory**: Shared utility for creating consistent icons across all marker types
- **PopupRenderer**: Reusable component for displaying marker popups with consistent styling
- **TooltipRenderer**: Reusable component for displaying marker tooltips
- **LayerController**: Component managing visibility and rendering for each marker layer
- **MarkerType**: Union type defining all supported marker types (location, character, burn, death, fight)
- **MapConfig**: Configuration object for map settings, bounds, and rendering options

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Largest component in map codebase is under 200 lines (currently SimpleMap.tsx at 735 lines)
- **SC-002**: Code duplication reduced by 70% measured by repeated code patterns
- **SC-003**: Unit test execution time reduced by 40% due to better component isolation
- **SC-004**: Zero breaking changes to existing API contracts or component interfaces
- **SC-005**: All new components have 90%+ test coverage
- **SC-006**: Map render performance maintained at 60fps with 50+ markers visible
- **SC-007**: Bundle size reduced by 15% through elimination of duplicate code
- **SC-008**: Developer onboarding time reduced by 50% (measured by time to make first code change)
- **SC-009**: Code maintainability index improved by 40% (measured by static analysis tools)
- **SC-010**: All existing accessibility features preserved (screen reader support, keyboard navigation)

### Completion Checklist

- [ ] SimpleMap.tsx decomposed into 5+ smaller components
- [ ] Base MarkerComponent created and tested
- [ ] IconFactory utility implemented with unit tests
- [ ] PopupRenderer component extracted and styled
- [ ] TooltipRenderer component extracted and styled
- [ ] LayerController component for managing layers
- [ ] All marker types migrated to use new components
- [ ] Layer controls UI extracted to separate component
- [ ] TypeScript interfaces refactored with proper typing
- [ ] Unit tests created for all new components (90%+ coverage)
- [ ] Integration tests verify end-to-end functionality
- [ ] Performance benchmarks meet targets
- [ ] Bundle size analysis shows improvement
- [ ] Code review completed with senior developer approval
- [ ] Documentation updated with new architecture
- [ ] Backward compatibility verified

## Assumptions

- Existing Leaflet and React-Leaflet version compatibility maintained
- WAGDIE styling and branding requirements stay consistent
- Current API contracts cannot change (components must maintain same props)
- Performance targets are achievable with React optimization techniques
- Team has time to properly test refactored components before deployment
- Accessibility standards must remain at current level or improve
- All marker types (location, character, burn, death, fight) will continue to exist
- Mobile responsiveness requirements remain unchanged

