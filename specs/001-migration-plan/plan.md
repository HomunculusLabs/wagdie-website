# Implementation Plan: Data Migration from Legacy WAGDIE

**Branch**: `001-migration-plan` | **Date**: 2025-10-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-migration-plan/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a comprehensive data migration from the legacy WAGDIE Firestore database to the new Supabase PostgreSQL database. The migration follows a phased approach: (1) Safe export and validation of Firestore data, (2) Schema mapping and transformation to PostgreSQL structure, (3) Safe import with rollback capability, and (4) Verification and cutover to production. The migration must achieve 100% data integrity, complete within 4 hours for up to 10,000 characters, and provide rollback capability within 30 minutes if issues arise.

## Technical Context

**Language/Version**: TypeScript 5+ (Node.js 18+ for migration scripts)
**Primary Dependencies**: Firebase Admin SDK, Supabase JS client, ethers.js (for address normalization)
**Storage**: Source: Google Cloud Firestore | Target: Supabase PostgreSQL
**Testing**: Jest for unit tests, integration tests against test Supabase instance
**Target Platform**: Command-line migration scripts running on administrator workstation or CI/CD
**Project Type**: Single project (migration tooling)
**Performance Goals**: Process 10,000 character records + 1,000 users within 4 hours, streaming export/import for memory efficiency
**Constraints**: Must preserve all historical data, no data loss tolerated, rollback within 30 minutes
**Scale/Scope**: Up to 10,000 NFT characters, 1,000 users, variable tweets/locations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Simplicity First ✅ PASS

- Migration scripts are standalone TypeScript files, no complex frameworks
- Uses familiar tools: Firebase Admin SDK (standard), Supabase client (standard), Node.js
- NO Docker required, scripts run directly on Node.js
- Clear command-line interface for administrators

**Compliance**: Migration tooling aligns with simplicity principle by using standard SDKs and avoiding unnecessary abstraction.

### Principle II: Community Accessibility ✅ PASS

- Migration scripts will be well-documented with step-by-step README
- Clear error messages for administrators
- Validation reports in human-readable format (JSON + summary)
- Runbook provides non-expert guidance

**Compliance**: Documentation and clear error handling make migration accessible to community maintainers.

### Principle III: Clean Architecture ✅ PASS

Migration scripts follow layered structure:
- **CLI Layer**: Command-line entry points (export.ts, transform.ts, import.ts)
- **Service Layer**: Business logic for each phase (ExportService, TransformService, ImportService)
- **Data Layer**: Firestore client, Supabase client wrappers

**Compliance**: Clear separation of concerns in migration tooling.

### Principle IV: Type Safety & Contract Clarity ✅ PASS

- All migration scripts in TypeScript with strict mode
- Type definitions for Firestore document structures
- Type definitions for PostgreSQL row structures
- Transformation functions have explicit input/output types

**Compliance**: Full TypeScript with explicit types throughout.

### Principle V: Test-Driven for Critical Paths ✅ PASS

Tests REQUIRED for:
- Data transformation logic (address normalization, field mapping)
- Validation functions (checksum, count verification)
- Rollback procedures

Tests OPTIONAL for:
- CLI argument parsing
- Report formatting

**Compliance**: Critical data transformation and validation logic will have comprehensive tests.

### Principle VI: Documentation as Code ✅ PASS

Required documentation:
- `/scripts/migration/README.md`: Complete runbook with step-by-step instructions
- Inline comments in transformation logic explaining field mappings
- Data mapping doc showing Firestore → PostgreSQL field correspondence
- Troubleshooting guide for common errors

**Compliance**: Comprehensive documentation planned for all migration steps.

### Principle VII: Web3 Pragmatism ✅ PASS

- Wallet address normalization using ethers.js (industry standard)
- Handles checksum addresses correctly
- Preserves all NFT ownership relationships

**Compliance**: Migration correctly handles Ethereum addresses per web3 standards.

### Architecture Standards: Technology Constraints ✅ PASS

Migration tooling is separate from the main application stack:
- Uses Node.js (same runtime as Next.js, but standalone scripts)
- TypeScript (matches project standard)
- NO Docker (compliance with forbidden dependencies)
- NO GraphQL (direct database operations)

**Compliance**: Migration scripts respect technology constraints while being appropriately isolated.

### Overall Gate Status: ✅ ALL CHECKS PASSED

No violations. Migration feature can proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-migration-plan/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── field-mappings.md  # Firestore → PostgreSQL field mappings
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

Migration scripts are isolated from the main application:

```text
scripts/
└── migration/
    ├── README.md                # Complete migration runbook
    ├── package.json             # Migration script dependencies
    ├── tsconfig.json            # TypeScript config for migration
    ├── src/
    │   ├── cli/
    │   │   ├── export.ts        # Export command
    │   │   ├── transform.ts     # Transform command
    │   │   ├── import.ts        # Import command
    │   │   └── verify.ts        # Verification command
    │   ├── services/
    │   │   ├── export-service.ts      # Firestore export logic
    │   │   ├── transform-service.ts   # Data transformation logic
    │   │   ├── import-service.ts      # Supabase import logic
    │   │   └── validation-service.ts  # Checksum and validation
    │   ├── data/
    │   │   ├── firestore-client.ts    # Firestore connection wrapper
    │   │   └── supabase-client.ts     # Supabase connection wrapper
    │   ├── types/
    │   │   ├── firestore-schema.ts    # Firestore document types
    │   │   ├── postgres-schema.ts     # PostgreSQL row types
    │   │   └── migration-report.ts    # Report types
    │   └── utils/
    │       ├── address-normalizer.ts  # Ethereum address utils
    │       ├── checksum.ts            # Data integrity checks
    │       └── logger.ts              # Structured logging
    ├── tests/
    │   ├── unit/
    │   │   ├── address-normalizer.test.ts
    │   │   ├── transform-service.test.ts
    │   │   └── validation-service.test.ts
    │   └── integration/
    │       ├── export-flow.test.ts
    │       └── import-rollback.test.ts
    └── data/                    # Exported/transformed data (git-ignored)
        ├── exports/
        ├── transformed/
        └── reports/
```

**Structure Decision**: Migration tooling is isolated in `scripts/migration/` directory, separate from the main Next.js application. This keeps migration concerns decoupled from application code and allows independent versioning/testing. The structure follows clean architecture with CLI → Services → Data layers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. Constitution check passed all principles.
