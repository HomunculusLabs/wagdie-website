# Implementation Plan: Code Complexity Refactoring

**Branch**: `019-code-complexity-refactor` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-code-complexity-refactor/spec.md`

## Summary

Refactor four high-complexity code areas identified in the codebase analysis:
1. **Character Detail Page** (737 lines → <300 lines): Extract tab components and editing state into dedicated modules
2. **useSpread Hook** (duplicate 100+ line functions): Create shared blockchain transaction utility
3. **MapScene** (4 switch statements): Replace with single marker configuration object
4. **useAIPersonaEditor** (9 identical setters): Consolidate with useReducer or factory pattern

All refactoring must preserve identical functionality verified by existing tests.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React 18, wagmi v2, viem v2, Tailwind CSS 3.4, Phaser 3.90
**Storage**: N/A (refactoring existing code, no database changes)
**Testing**: Jest, React Testing Library (existing test suite)
**Target Platform**: Web (browser)
**Project Type**: Web application (Next.js)
**Performance Goals**: Maintain existing performance; 60fps map rendering, <10ms re-render for 50 markers
**Constraints**: No new external dependencies; all existing tests must pass; backward compatible APIs
**Scale/Scope**: 4 files primary refactoring; ~15 hooks/components affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| No new dependencies | PASS | FR-017 explicitly prohibits new dependencies |
| Test coverage maintained | PASS | FR-016 requires all existing tests pass |
| Incremental deployment | PASS | FR-018 requires independent deployability |
| Backward compatibility | PASS | All public interfaces preserved |
| Simplicity (YAGNI) | PASS | Refactoring reduces complexity, not adds features |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/019-code-complexity-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (internal state models)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Files to be created/modified

hooks/
├── useBlockchainTransaction.ts    # NEW: Shared transaction utility (P2)
├── useCharacterEditor.ts          # NEW: Consolidated editing state (P1)
├── useSpread.ts                   # MODIFY: Use shared utility
└── useAIPersonaEditor.ts          # MODIFY: Use useReducer pattern (P4)

app/characters/[tokenId]/
├── page.tsx                       # MODIFY: Extract components (P1)
└── components/                    # NEW: Directory for extracted components
    ├── CharacterStoryTab.tsx      # NEW: Story tab content
    ├── CharacterEquipmentTab.tsx  # NEW: Equipment tab content
    └── CharacterWalletTab.tsx     # NEW: Wallet tab content

game/
├── config/
│   └── markerConfig.ts            # NEW: Marker configuration object (P3)
└── scenes/
    └── MapScene.ts                # MODIFY: Use marker config

components/characters/ai-editor/
└── AIPersonaTab.tsx               # VERIFY: Already extracted (no changes)
```

**Structure Decision**: Web application structure maintained. New files follow existing conventions. Extracted components placed in colocated `components/` directory following Next.js App Router patterns.

## Complexity Tracking

> No constitution violations requiring justification. All changes reduce complexity.

## Post-Design Constitution Re-Check

*GATE: Verify design decisions comply with constitution.*

| Principle | Status | Notes |
|-----------|--------|-------|
| No new dependencies | PASS | All solutions use built-in React APIs (useState, useReducer, useCallback) |
| Test coverage maintained | PASS | Existing tests preserved; contracts define testable interfaces |
| Incremental deployment | PASS | Each of 4 areas independently deployable |
| Backward compatibility | PASS | All hook return signatures preserved; internal changes only |
| Simplicity (YAGNI) | PASS | useReducer, config objects, and hook extraction are standard React patterns |

**Post-Design Gate Result**: PASS - Ready for task generation

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Implementation Plan | `specs/019-code-complexity-refactor/plan.md` | This file |
| Research | `specs/019-code-complexity-refactor/research.md` | Technical decisions and rationale |
| Data Model | `specs/019-code-complexity-refactor/data-model.md` | Internal state models |
| Quickstart | `specs/019-code-complexity-refactor/quickstart.md` | Development setup guide |
| useCharacterEditor Contract | `specs/019-code-complexity-refactor/contracts/useCharacterEditor.ts` | Hook interface |
| useBlockchainTransaction Contract | `specs/019-code-complexity-refactor/contracts/useBlockchainTransaction.ts` | Hook interface |
| MarkerConfig Contract | `specs/019-code-complexity-refactor/contracts/markerConfig.ts` | Configuration object |
| AIPersonaReducer Contract | `specs/019-code-complexity-refactor/contracts/aiPersonaReducer.ts` | Reducer definition |

## Next Steps

Run `/speckit.tasks` to generate the task breakdown for implementation.
