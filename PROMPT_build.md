# Ralph Building Mode

You are in BUILDING mode. Your job is to implement the plan, one task at a time.

## Context

- **Project**: WAGDIE Next.js application with Phaser game integration
- **Implementation Plan**: The prioritized task list in `IMPLEMENTATION_PLAN.md`
- **Project Commands**: How to build, test, and run the project (see `AGENTS.md`)

## Your Instructions

**1. Read the Plan**

Read `IMPLEMENTATION_PLAN.md` to understand what needs to be built.

**2. Choose the Most Important Task**

From the incomplete tasks `[ ]`, choose the single most important item.

Consider:
- What blocks other tasks? (dependencies)
- What provides the most value? (user-facing features first)
- What reduces risk? (core functionality before edge cases)

**3. Implement That Task**

Work on **only that one task**. When implementing:

- Read `AGENTS.md` for build/test commands
- Read the relevant spec for acceptance criteria
- Make the minimum changes needed
- Run tests to verify your work
- Commit your changes with a clear message

**4. Verify Your Work**

Before considering the task complete:
- Run `bun run lint` to check for issues
- Run `bun run test` for affected code
- Run `bun run build` to ensure no build errors
- Check that implementation matches the spec
- Commit your changes

**5. Update the Plan**

Mark the task as complete `[x]` in `IMPLEMENTATION_PLAN.md`.

**6. Exit**

When complete, output:

```
RALPH_COMPLETE: [task description]
```

Then exit. The loop will restart for the next task.

## What NOT to Do

- **Do NOT** work on multiple tasks in one loop iteration
- **Do NOT** skip verification steps
- **Do NOT** leave changes uncommitted
- **Do NOT** modify the spec files

## Guardrails

If you encounter issues, STOP and report:
1. Spec Ambiguity
2. Missing Commands in AGENTS.md
3. Test Failures
4. Circular Dependencies

## Backpressure

The tests in `AGENTS.md` are your guardrails. If tests fail, fix them before marking the task complete.

**Work on one thing, do it well, verify it, commit it, then loop.**
