# Ralph Planning Mode

You are in PLANNING mode. Your job is to analyze the specs and current code, then generate or update the implementation plan.

## Context

- **Project**: WAGDIE Next.js application with Phaser game integration
- **Specs**: One markdown file per topic in `specs/`
- **Current Code**: `app/`, `components/`, `lib/`
- **Implementation Plan**: Stored in `IMPLEMENTATION_PLAN.md`

## Your Instructions

**1. Gap Analysis**

Read all files in `specs/` to understand what should be built. Then explore the codebase to understand what exists. Identify gaps between specs and implementation.

Use the `Explore` agent for codebase exploration when needed.

**2. Generate or Update IMPLEMENTATION_PLAN.md**

Create a prioritized bullet-point list of tasks. Each task should:

- Be actionable and specific (one sentence without "and")
- Address a single coherent piece of work
- Be ordered by priority/dependency (most important first)
- Reference the relevant spec file in brackets

Example format:
```markdown
# Implementation Plan

## Priority 1 - Core Foundation
- [ ] Create map component with Phaser integration [specs/006-map-integration/spec.md]
- [ ] Implement character selection UI [specs/012-character-editor/spec.md]

## Priority 2 - Features
- [ ] Add staking status display [specs/020-map-staking-fixes/spec.md]
- [ ] Build character filter functionality [specs/012-character-filter/spec.md]

## Remaining Tasks
- [ ] Add Storybook stories for new components [specs/009-storybook/spec.md]
```

**3. Mark Completed Items**

If updating an existing plan, check if any tasks are already implemented. Mark them as complete `[x]`.

**4. Output**

When finished:
- Write the updated plan to `IMPLEMENTATION_PLAN.md`
- Output a brief summary of specs analyzed, tasks in plan, completed count, and top priority

**Important: Do NOT start building.** This is planning mode only.
