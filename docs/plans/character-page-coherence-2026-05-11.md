# Character Page Coherence: Plan

## Goal

Make `/characters/[tokenId]` feel like one coherent WAGDIE character sheet instead of disconnected artwork, stat, trait, story, AI, equipment, wallet, and action panels.

This is a presentation and component-seam refactor. Preserve the current character data contract, edit/save flow, image fallback policy, chat launcher, animated route, searing/infection/cure modal lifecycle, wallet section, and AI persona subsystem.

## Implementation Status

Completed 2026-05-12. The route now uses `CharacterSheetLayout` and `CharacterAppendixSection`; story/equipment are visible sheet sections; AI persona and on-chain wallet content are appendix tabs; `?tab=ai-persona`, `?tab=wallet`, and `?tab=on-chain` map as planned. Targeted ESLint validation passed for the changed character page files.

## Background

- The detail route owns edit mode, modal flags, `activeTab`, character loading, image display, ownership checks, save/cancel handlers, chat, animated navigation, and detail-component composition (`app/characters/[tokenId]/page.tsx:25-190`). Keep it as the state owner.
- The current desktop hero uses a 12-column grid but only fills two `lg:col-span-5` columns before pushing story/equipment/wallet/AI content below, which makes the page feel sparse and split (`app/characters/[tokenId]/page.tsx:134-175`).
- `CharacterSheetPanel` mixes name, level, identity traits, derived stats, token card, optional lore CTA, editable stats, and owner-only chain actions in one vertical stack (`components/characters/detail/CharacterSheetPanel.tsx:70-136`).
- `CharacterTabsSection` duplicates trait display, then treats story, AI persona, equipment, and wallet as equal peer tabs (`components/characters/detail/CharacterTabsSection.tsx:24-80`). Story and equipment are primary character-sheet content; AI persona and wallet/on-chain history are supporting subsystems.
- Character loading and saving already have stable seams through `useCharacterDetailData`, `/api/characters/[tokenId]`, `useCharacterEditor`, and `useCharacterSave`; no backend/API changes are needed (`hooks/useCharacterDetailData.ts:17-31`, `hooks/useCharacterEditor.ts:28-34`, `hooks/useCharacterSave.ts:30-74`).
- The AI persona editor has its own parity plan; do not fold AI API/editor-contract changes into this page-coherence work (`docs/plans/eliza-character-sheet-parity-2026-05-11.md`).

## Approach

Make one explicit information-architecture change: **move story and equipment out of the primary tabs and into the visible character sheet; keep AI persona and wallet/on-chain content in a smaller appendix tab section below the sheet.**

The page should become:

1. **Sticky route toolbar** — existing back, edit/save/cancel, chat, and animated actions.
2. **Primary character sheet frame** — one outer gothic surface containing artwork, identity, token, level/XP, status, traits, stats, story, equipment, and owner rituals/actions.
3. **Appendix tabs** — AI persona and on-chain/wallet content, treated as supporting systems.
4. **Existing modals** — searing, infection, and cure remain route-owned and unchanged.

Commit to **one outer sheet frame** for the primary character surface. Existing child cards should either get lightweight/unframed variants or be wrapped so the outer frame owns the main chrome; do not stack several equally heavy cards inside the sheet.

## Work Items

1. **Add `CharacterSheetLayout` as the primary composition seam**
   - File: `components/characters/detail/CharacterSheetLayout.tsx`.
   - Receive flat, explicit props from the route: `tokenId`, `character`, `name`, `isOwner`, `isEditMode`, `editor`, `imageUrl`, `imageDisclosure`, `showLoreNav`, image-error handler, community-story handler, edit-entry handler, and sear/infect/cure callbacks.
   - Use a fixed desktop split: `lg:col-span-4` artwork/action rail and `lg:col-span-8` sheet body.
   - On desktop, owner actions live below the artwork in the rail, not sticky and not above the art. On mobile, actions move after equipment.
   - The route still owns fetching, saving, edit guards, modal state, and query-param parsing.

2. **Split the current mixed sheet panel into identity/stats only**
   - Add `CharacterIdentityStatsPanel.tsx`, or simplify `CharacterSheetPanel` to this responsibility if keeping the old name is cheaper.
   - Keep `NameEditor`, `LevelExperienceEditor`, `DerivedStatsEditor`, `CoreStatsEditor`, `EmptyStatsPrompt`, and editor props unchanged.
   - Move `CharacterActions` and the lore/story CTA out of the stat panel.

3. **Render traits once inside the sheet frame**
   - Remove the duplicate `NFTTraitsDisplay` from the old tab-section path.
   - Keep identity traits near name/level.
   - Put the fuller non-equipment trait list in the sheet frame as a compact wrapping section, not as a separate tab.

4. **Promote story and equipment into visible sheet sections**
   - Add thin section wrappers around existing behavior: `CharacterStorySection` for `CharacterStoryTab`/`SheetBackgroundStory`, and `CharacterEquipmentSection` for `CharacterEquipmentTab`/`SheetEquipment`.
   - Give the wrappers the section headings/chrome needed for inline sheet placement; keep existing edit and display behavior.
   - Place the lore/community-story CTA with story, not in the stat stack.

5. **Reframe owner chain actions as rituals without changing behavior**
   - Keep `CharacterActions` props and modal callbacks unchanged.
   - Remove parent-layout assumptions such as `mt-auto` from `CharacterActions` (`components/characters/detail/CharacterActions.tsx:42`).
   - Retitle the card to “rituals” or “owner actions”; do not change wallet auth, signing, or transaction behavior.

6. **Replace broad page tabs with appendix tabs and explicit URL aliases**
   - Add `components/characters/detail/CharacterAppendixSection.tsx`.
   - Supported appendix tabs: `ai-persona` and `on-chain`.
   - URL mapping must ship in the same change as the route tab swap:

     | Incoming `tab` value | Behavior |
     | --- | --- |
     | missing, `story`, `equipment` | Show primary sheet and default appendix to `ai-persona`; no redirect and no scroll anchoring in this pass. |
     | `ai-persona` | Select appendix tab `ai-persona`. |
     | `wallet`, `on-chain` | Select appendix tab `on-chain`; treat `wallet` as a read-only alias, not a redirect. |
     | anything else | Fall back to `ai-persona`. |

   - `ai-persona` renders `AIPersonaTab` with current props.
   - `on-chain` renders `CharacterWalletTab` with current token/owner/staker props.

7. **Update `app/characters/[tokenId]/page.tsx` atomically**
   - Replace the current hero grid plus `CharacterTabsSection` with `CharacterSheetLayout` and `CharacterAppendixSection`.
   - Keep loading/not-found states, edit guards, save/cancel handlers, searing query-param behavior, chat launcher, animated navigation, and `CharacterModals` wiring unchanged.
   - Change `activeTab` from broad page tabs to appendix tabs; default to `ai-persona` after applying the URL mapping above.

8. **Validate the refactor**
   - Follow `docs/development/design-system.md`: existing primitives/tokens first, sharp gothic frame, restrained accent/glow, mobile-first layout, and semantic headings/landmarks.
   - Regression-check owner and non-owner views, edit/save/cancel/unsaved-guard behavior, empty stats assignment, story and equipment rendering, `?tab=ai-persona`, `?tab=wallet`, AI persona save/import/export, wallet loading/error/empty states, image disclosure, infected/cured badges, and sear/infect/cure modal focus restoration.

## Open Questions

None blocking. The plan intentionally chooses one outer sheet frame, rail-based desktop owner actions, no scroll anchoring for former `story`/`equipment` tab links, and read-only URL aliasing for `wallet` → `on-chain`.

## References

- Current route: `app/characters/[tokenId]/page.tsx`
- Detail component barrel: `components/characters/detail/index.ts`
- Current mixed sheet: `components/characters/detail/CharacterSheetPanel.tsx`
- Current broad tabs: `components/characters/detail/CharacterTabsSection.tsx`
- Artwork/image display: `components/characters/detail/CharacterArtworkCard.tsx`, `hooks/useCharacterImageDisplay.ts`, `lib/utils/image.ts`
- Owner actions/modals: `components/characters/detail/CharacterActions.tsx`, `components/characters/detail/CharacterModals.tsx`
- Character editor/save hooks: `hooks/useCharacterEditor.ts`, `hooks/useCharacterSave.ts`
- Character DTO: `types/character.ts`
- Visual language: `docs/development/design-system.md`
- Historical wireframe: `docs/archive/PAGE_WIREFRAMES.md:254-344`
- Related AI persona plan: `docs/plans/eliza-character-sheet-parity-2026-05-11.md`
