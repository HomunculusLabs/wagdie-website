# Archive

> Lifecycle: Historical archive index
> Last validated: 2026-05-11
> Canonical sources: archive contents, current code for any revalidation, and external data-retention requirements

The archive stores historical implementation notes, reports, compatibility fixes, and immutable exported data. Archive files are not current guidance unless an evergreen doc explicitly links them with a dated caveat.

## Archive policy

- Treat archived Markdown as historical and mostly immutable.
- Add index notes instead of rewriting old reports.
- Keep raw exports in place unless there is an explicit retention or migration task.
- If archived facts become useful current guidance, promote verified facts into evergreen docs and leave the archive as provenance.

## Inventory

### Markdown records

| File | Classification | Summary |
| --- | --- | --- |
| `010-storybook-import-implementation-report.md` | Archive / historical report | Storybook component refactoring completion report with issue fixes and story count snapshot. |
| `010-storybook-import-summary.md` | Archive / historical report | Storybook component import progress summary for feature `010-storybook-import`. |
| `CONNECTOR-FIX.md` | Archive / historical fix note | Wagmi connector function fix for Storybook stories. |
| `PROVIDER-FIX.md` | Archive / historical fix note | WagmiProvider decorator fix for Storybook stories. |
| `REACT-IMPORT-FIX.md` | Archive / historical fix note | React import fix for story files. |
| `FIXES_APPLIED.md` | Archive / historical fix note | Map page fixes including map container initialization and hook ordering. |
| `IMPLEMENTATION_NOTES.md` | Archive / historical implementation note | Page wireframes implementation notes from feature `003-page-wireframes`. |
| `MAP_REBUILD_SUMMARY.md` | Archive / historical report | Summary of a prior map rebuild around hooks, `SimpleMap`, and the map page. |
| `PAGE_WIREFRAMES.md` | Archive / historical design/reference | ASCII page wireframes and feature documentation; not current route/design truth. |
| `FEATURES_CHECKLIST.md` | Archive / historical checklist | Older phased feature checklist for the simplified platform. |
| `TECHNICAL_DEBT_REPORT.md` | Archive / historical audit | 2025 technical debt analysis; not a live debt register. |

### Data exports

| Path | Classification | Summary |
| --- | --- | --- |
| `firebasebackup/` | Archive / immutable data export | Firebase export metadata and 213 `output-*` shards from 2025-11-17. Keep as retained source data unless a dedicated migration/retention task says otherwise. |
