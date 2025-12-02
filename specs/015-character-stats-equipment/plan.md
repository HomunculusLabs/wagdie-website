# Implementation Plan: Character Stats & Equipment Display

**Branch**: `015-character-stats-equipment` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-character-stats-equipment/spec.md`

## Summary

Enhance the character detail page to display all available character statistics and equipment data. The existing components (`CoreStatsEditor`, `DerivedStatsEditor`, `SheetEquipment`) already render stats - the primary work is ensuring they always display when data exists, adding NFT trait display, and improving empty state handling.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React 18, Tailwind CSS 3.4, @supabase/supabase-js v2
**Storage**: Supabase PostgreSQL (characters table with dedicated stat columns + metadata JSONB)
**Testing**: Jest 29, @testing-library/react 16, MSW 2.2
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js fullstack)
**Performance Goals**: Page load < 2 seconds, stats visible immediately on render
**Constraints**: Read-only for non-owners, edit mode only for authenticated owners
**Scale/Scope**: 6666 characters max, single page enhancement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is not yet configured (template only). Proceeding with standard Next.js best practices:

| Gate | Status | Notes |
|------|--------|-------|
| Test coverage required | ✅ Pass | Existing test infrastructure with Jest/RTL |
| No breaking changes | ✅ Pass | Display-only enhancements, no API changes |
| Performance targets | ✅ Pass | Single API call already exists |
| Accessibility | ✅ Pass | Existing components have proper labels |

## Project Structure

### Documentation (this feature)

```text
specs/015-character-stats-equipment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── characters/
│   └── [tokenId]/
│       └── page.tsx     # Main character detail page (MODIFY)
└── api/
    └── characters/
        └── [tokenId]/
            └── route.ts # Existing API (NO CHANGES)

components/
└── characters/
    ├── CoreStatsEditor.tsx      # Existing (MINOR MODIFY)
    ├── DerivedStatsEditor.tsx   # Existing (MINOR MODIFY)
    ├── SheetEquipment.tsx       # Existing (MINOR MODIFY)
    ├── NFTTraitsDisplay.tsx     # NEW - display NFT attributes
    └── EmptyStatsPrompt.tsx     # Existing (NO CHANGES)

lib/
├── repositories/
│   └── character-repository.ts  # Existing (NO CHANGES)
├── services/
│   └── character-service.ts     # Existing (NO CHANGES)
└── utils/
    └── nft-traits.ts            # NEW - extract traits from metadata

tests/
└── components/
    └── characters/
        └── NFTTraitsDisplay.test.tsx  # NEW

types/
└── character.ts                 # Existing (NO CHANGES)
```

**Structure Decision**: Minimal additions to existing structure. One new component (`NFTTraitsDisplay`) and one utility function (`extractNFTTraits`).

## Complexity Tracking

No constitution violations - feature is a straightforward display enhancement.
