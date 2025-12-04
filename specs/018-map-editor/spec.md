# Feature Specification: Map Location Pin Editor

**Feature Branch**: `018-map-editor`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "I would like to build a map editor to place location pins on the map. We will make it accessible to the admin wallet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Places a New Location Pin (Priority: P1)

An administrator with a connected admin wallet navigates to the map editor, clicks on the map to place a new location pin, fills in the location details (name, description), and saves the location to the database.

**Why this priority**: This is the core functionality of the feature. Without the ability to place pins, the editor has no purpose.

**Independent Test**: Can be fully tested by connecting an admin wallet, clicking on the map, entering "Test Location" as the name, and verifying the pin appears on the map and persists after page refresh.

**Acceptance Scenarios**:

1. **Given** the admin wallet is connected and the user is on the map editor page, **When** the admin clicks on a location on the map, **Then** a placement marker appears at that position with a form to enter location details.
2. **Given** a placement marker is visible with the location form open, **When** the admin enters a name and optional description and clicks Save, **Then** the new location pin is saved to the database and appears on the map.
3. **Given** a placement marker is visible, **When** the admin clicks Cancel or clicks elsewhere on the map, **Then** the placement marker is removed without saving.

---

### User Story 2 - Admin Edits an Existing Location (Priority: P2)

An administrator clicks on an existing location pin to view its details, modifies the name or description, and saves the changes.

**Why this priority**: Editing is essential for maintaining accurate location data but depends on locations existing first.

**Independent Test**: Can be fully tested by clicking an existing pin, changing its name from "Old Name" to "New Name", saving, and verifying the updated name appears on the map and in the database.

**Acceptance Scenarios**:

1. **Given** the admin is on the map editor with existing location pins, **When** the admin clicks on an existing pin, **Then** an edit form appears with the current location details pre-filled.
2. **Given** the edit form is open with location details, **When** the admin modifies the name or description and clicks Save, **Then** the changes are saved to the database and reflected on the map.
3. **Given** the edit form is open, **When** the admin clicks Cancel, **Then** the form closes without saving changes.

---

### User Story 3 - Admin Deletes a Location (Priority: P2)

An administrator selects an existing location pin and removes it from the map and database.

**Why this priority**: Deletion is important for map maintenance but is a secondary operation.

**Independent Test**: Can be fully tested by clicking an existing pin, clicking Delete, confirming the deletion, and verifying the pin no longer appears on the map.

**Acceptance Scenarios**:

1. **Given** the admin has an existing location pin selected, **When** the admin clicks the Delete button, **Then** a confirmation dialog appears asking to confirm deletion.
2. **Given** the confirmation dialog is visible, **When** the admin confirms deletion, **Then** the location is removed from the database and the pin disappears from the map.
3. **Given** the confirmation dialog is visible, **When** the admin cancels deletion, **Then** the dialog closes and the location remains unchanged.

---

### User Story 4 - Admin Repositions a Location Pin (Priority: P3)

An administrator drags an existing location pin to a new position on the map to correct its placement.

**Why this priority**: Repositioning is a convenience feature that can initially be accomplished via delete and re-create.

**Independent Test**: Can be fully tested by dragging an existing pin to a new position and verifying the updated coordinates are saved.

**Acceptance Scenarios**:

1. **Given** the admin is on the map editor in edit mode, **When** the admin clicks and drags an existing pin to a new position, **Then** the pin moves with the cursor.
2. **Given** the admin is dragging a pin, **When** the admin releases the mouse button, **Then** the new coordinates are saved to the database.

---

### User Story 5 - Non-Admin Access Restriction (Priority: P1)

Users who are not connected with an admin wallet cannot access the map editor functionality.

**Why this priority**: Security is critical - unauthorized users must not be able to modify map data.

**Independent Test**: Can be tested by connecting a non-admin wallet and verifying the editor controls are not visible or accessible.

**Acceptance Scenarios**:

1. **Given** a user is not connected with any wallet, **When** they navigate to the map editor page, **Then** they see a message prompting them to connect a wallet.
2. **Given** a user is connected with a non-admin wallet, **When** they navigate to the map editor page, **Then** they see a message indicating they do not have permission to edit the map.
3. **Given** a user is connected with an admin wallet, **When** they navigate to the map editor page, **Then** they see the full editor interface with all editing controls.

---

### Edge Cases

- What happens when the admin tries to save a location without a name? The system displays an error message requiring a name.
- How does the system handle saving when there is no network connection? The system displays an error message and allows retry when connection is restored.
- What happens if two admins edit the same location simultaneously? The last save wins, and the user is notified if their version was overwritten.
- How does the system handle duplicate location names? Duplicate names are allowed since locations are identified by unique IDs, but a warning is shown.
- What happens if a location with staked characters is deleted? The system prevents deletion and shows a message indicating characters are staked at this location.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify the connected wallet is an admin wallet before displaying editor controls
- **FR-002**: System MUST allow admins to click anywhere on the map to initiate placement of a new location pin
- **FR-003**: System MUST display a form for entering location name (required) and description (optional) when placing a pin
- **FR-004**: System MUST save new locations to the database with coordinates derived from the click position
- **FR-005**: System MUST allow admins to click existing pins to view and edit their details
- **FR-006**: System MUST persist all location changes (create, update, delete) to the database
- **FR-007**: System MUST require confirmation before deleting a location
- **FR-008**: System MUST prevent deletion of locations that have characters currently staked
- **FR-009**: System MUST display appropriate error messages for validation failures and network errors
- **FR-010**: System MUST hide or disable all editing functionality for non-admin users
- **FR-011**: System MUST allow admins to reposition location pins by dragging
- **FR-012**: System MUST display the map editor on a dedicated route accessible to admins
- **FR-013**: System MUST log all admin location operations (create, update, delete, reposition) to server logs for debugging purposes

### Key Entities

- **Location**: Represents a point on the map with id (human-readable slug auto-generated from name), name, description, and coordinates stored in metadata.coordinates
- **Admin Wallet**: A wallet address configured in the admin list that grants editing permissions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can create a new location pin in under 30 seconds (click, fill name, save)
- **SC-002**: Location changes appear on the map immediately after saving without requiring a page refresh
- **SC-003**: Non-admin users have zero access to editing functionality (100% access control enforcement)
- **SC-004**: All location operations (create, edit, delete, reposition) persist correctly to the database
- **SC-005**: The editor maintains visual consistency with the existing WAGDIE map theming
- **SC-006**: Admin can manage 50+ locations without performance degradation

## Clarifications

### Session 2025-12-03

- Q: How should new location IDs be generated? → A: Human-readable slug derived from location name (e.g., "Dragon's Lair" → "dragons_lair")
- Q: Should admin actions be logged? → A: Log admin actions to console/server logs only

## Assumptions

- The existing admin wallet verification system (`lib/auth/admin.ts`) will be reused for access control
- The existing locations table schema supports coordinate storage via the `metadata.coordinates` field
- The map editor will be a new route under the existing Next.js app structure
- The existing WAGDIE map theming (colors, fonts, styling) will be applied to editor UI elements
- The editor will use the existing Leaflet/React-Leaflet map implementation
- Only one admin can edit a location at a time (no real-time collaboration required)
