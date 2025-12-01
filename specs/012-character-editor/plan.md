# Implementation Plan: Character Editor

**Branch**: `012-character-editor` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-character-editor/spec.md`

## Summary

Enable character owners to edit their character's name and stats (STR, DEX, CON, INT, WIS, CHA, HP, Max HP, AC, Speed, Level, Experience) through the existing character detail page. The implementation extends the existing API PATCH endpoint and repository layer to support stat updates, adds client-side form components with validation, and maintains ownership verification for all edit operations.

## Technical Context

**Language/Version**: TypeScript 5+, React 18, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), wagmi v2, viem v2, Tailwind CSS 3.4, @tanstack/react-query
**Storage**: Supabase PostgreSQL (`characters` table with dedicated stat columns)
**Testing**: Jest 29, @testing-library/react 16, @testing-library/jest-dom
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Save operations complete in <500ms, UI updates immediately after save
**Constraints**: Ownership verification required for all edits, stat validation (1-30 for core stats, 0-999 for HP)
**Scale/Scope**: 6,666 NFT characters, single-user edit sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains template placeholders. Applying general best practices:

| Principle | Status | Notes |
|-----------|--------|-------|
| Test-First | PASS | Will add Jest tests for new components and API endpoints |
| Type Safety | PASS | Full TypeScript with strict mode |
| Simplicity | PASS | Extends existing patterns (repository, service, API route) |
| Security | PASS | Ownership verification already implemented in API route |

## Project Structure

### Documentation (this feature)

```text
specs/012-character-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Existing structure (Next.js App Router)
app/
├── api/
│   └── characters/
│       └── [tokenId]/
│           └── route.ts          # Extend PATCH to support stats
└── characters/
    └── [tokenId]/
        └── page.tsx              # Add stat editing UI

components/
└── characters/
    ├── SheetTitleAndAttributes.tsx   # Add edit mode
    ├── StatEditor.tsx                # NEW: Stat input component
    └── NameEditor.tsx                # NEW: Name input component

lib/
├── repositories/
│   └── character-repository.ts   # Extend update() to include stats
├── services/
│   └── character-service.ts      # Extend updateCharacter() signature
└── utils/
    └── stat-validation.ts        # NEW: Validation utilities

types/
└── character.ts                  # Types already complete

tests/
├── components/
│   ├── StatEditor.test.tsx       # NEW
│   └── NameEditor.test.tsx       # NEW
├── api/
│   └── characters-update.test.ts # NEW
└── unit/
    └── stat-validation.test.ts   # NEW
```

**Structure Decision**: Extends existing Next.js App Router structure. New components added to `components/characters/`, new utilities to `lib/utils/`, tests to `tests/`.

## Complexity Tracking

No complexity violations. Implementation follows existing patterns.
