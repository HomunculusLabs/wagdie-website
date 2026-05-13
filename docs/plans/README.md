# Plans

> Lifecycle: Historical index
> Last validated: 2026-05-11
> Canonical sources: current implementation files, `package.json`, `supabase/migrations/`, `.storybook/*`, and linked source files inside each plan

Plans are dated planning records. They may contain useful decisions and implementation context, but they are not current guidance unless an evergreen doc explicitly promotes and verifies their durable facts.

## Status policy

- Keep plans in this folder as historical records.
- Mark a plan **active only in this index** if work is known to be in progress; otherwise treat it as historical by default.
- When a plan ships, promote durable facts into evergreen docs and leave the plan as history.
- When a plan is superseded, add a note in this index rather than rewriting the old plan.

## Inventory

| File | Classification | Summary / status note |
| --- | --- | --- |
| `documentation-rewrite-2026-05-11.md` | Historical plan, active orchestration record | Establishes the docs rewrite IA and work items. Item A produced these policy/index files; later items own prose rewrites. |
| `admin-panel-workflows-2026-05-09.md` | Historical plan | Unified `/admin` workflows for searing mappings, map pins, and lore canonization. Verify implementation before citing. |
| `community-lore-media-submissions-2026-05-09.md` | Historical plan | Wallet-authenticated community lore submission and admin promotion workflow. Verify route/UI state before promoting. |
| `lore-real-data-transition-2026-05-09.md` | Historical plan | Transition from static lore data to database-backed reads while preserving public contracts. |
| `eliza-package-migration-2026-05-10.md` | Historical plan | Custom Eliza/Venice gateway migration away from checked-in local SDK package. |
| `official-eliza-package-migration-2026-05-10.md` | Historical plan | Move toward a WAGDIE-hosted official ElizaOS service while preserving app route contracts. |
| `elizaos-dev-infrastructure-setup-2026-05-10.md` | Historical plan feeding runbook | Dev infrastructure setup for official ElizaOS validation; operational steps belong in `docs/runbooks/elizaos-dev-validation.md`. |
| `elizaos-cutover-remaining-work-2026-05-10.md` | Historical plan feeding runbook | Remaining hosted ElizaOS production cutover gates and smoke validation expectations. |
| `eliza-character-sheet-parity-2026-05-11.md` | Historical plan | Improve WAGDIE character import/export and editor persistence toward ElizaOS character-sheet parity. |
| `elizaos-agent-location-rooms-2026-05-11.md` | Historical plan | Public map-location ElizaOS rooms for staked character interactions and transcripts. |
| `wallet-signature-loop-fix-2026-05-11.md` | Historical plan | Follow-up fix plan for repeated SIWE prompts after `docs/investigations/wallet-signature-loop-2026-05-11.md`; verify auth implementation before promoting. |
