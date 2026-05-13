# Critique: Character Page Coherence Plan (2026-05-11)

Reviewing `docs/plans/character-page-coherence-2026-05-11.md`. Scope is bounded to seams, contradictions, over-planning, and order-changing questions.

## 1. Top 3 under-specified seams

1. **Deep-link `?tab=` semantics (Items 6 + 7).** Current route only honors `?tab=ai-persona` (`app/characters/[tokenId]/page.tsx:53-57`); `story|equipment|wallet` are not mapped today. The plan says old `story`/`equipment` links "can land on the visible default sheet" and `wallet` → `on-chain`, but doesn't define: URL rewrite vs. transparent alias, scroll-to-section vs. plain landing, and whether the appendix `activeTab` needs a separate query key. Implementers will guess.
2. **Owner-actions placement on desktop (Item 5).** "Near the artwork rail" is fuzzy — above artwork, below, sticky? Also coupled to the proposed `lg:col-span-4` rail height. Without committing, the rail's vertical rhythm and `CharacterActions`' current `mt-auto` (`components/characters/detail/CharacterActions.tsx:42`) interact unpredictably.
3. **"One coherent sheet frame" surface treatment (Items 1, 8).** Every subcomponent (`CharacterArtworkCard`, identity/stat editors, story, equipment) currently ships its own `Card` chrome. The plan never says whether they get unwrapped, nested inside one outer `Card`, or left as-is. This is the single largest visual decision and is silent.

## 2. Contradictions / missing dependencies

- Item 7 declares `activeTab` default = `'ai-persona'`, but current default is `'story'` (`page.tsx:37`) and the only deep-link effect watches `'ai-persona'`. Once `story`/`equipment` leave the tab set, Item 6's URL-mapping table *must* ship in the same commit as Item 7 — not as later polish.
- Item 6 renames `wallet` → `on-chain`, but Item 7's "mapped query param" mapping is never specified. One-line table missing.
- `CharacterSheetLayout` is introduced (Item 1) with no prop contract. The plan promises to "preserve" `useCharacterEditor`, `useCharacterImageDisplay`, image-disclosure, ownership, save handlers, etc., but doesn't say whether these arrive as flat props or a context object — this is the prop-pass-through that route composition (Item 7) hinges on.
- Item 4 says reuse `CharacterStoryTab` and `CharacterEquipmentTab` "behavior". Those components today assume tab-content placement (no card, no heading). Promoting them inline either requires wrappers or component edits; the plan picks neither.
- The reference at `page.tsx:134-175` cited in Background is off — the hero grid is at `~119-149`; `134-175` overlaps `CharacterTabsSection` + `CharacterModals`. Minor, but the plan's most concrete pointer is wrong.

## 3. Over-planning — cut or simplify

- **Items 8 + 9 + 10** are ~30 lines of polish, a11y, and QA that mostly restate `design-system.md` and the existing test surface. Collapse to one paragraph: "follow design-system.md; regression-test owner/non-owner, edit lifecycle, deep-links, modals, image disclosure."
- **Background bullets 6–8** (image hook, design-system, archived wireframe) are framing, not constraints. Delete.
- **Item 5's `mt-auto` callout** is an implementation note, not a plan-level work item; fold into Item 1 or delete.
- **"Recommended" `lg:col-span-4`/`lg:col-span-8` (Item 1)** — either commit or remove the recommendation. Plans shouldn't hedge on the single grid number.
- **Item 8's breakpoint list (375/768/1280)** is QA, not planning. Move to Item 10 or cut.

## 4. Questions that would change implementation order

1. **One outer `Card` or nested `Card`s for the sheet frame?** If one outer, Items 1–4 are a single atomic PR. If nested, story/equipment promotion (Items 3–4) can ship before layout (Item 1).
2. **Do `?tab=story|equipment` need scroll-to-section anchoring?** If yes, stable section IDs must be introduced *before* the tab swap (Item 7), making Item 1 a prerequisite. If no, Items 6–7 are independent of Item 1.
3. **Is `?tab=wallet` an alias or a redirect to `?tab=on-chain`?** Determines whether the URL-sync effect in Item 7 is read-only (alias) or write-back (redirect on mount).
4. **Do owner actions belong in the artwork rail or in their own row?** If rail, Items 1 + 5 must ship together (rail height changes with action presence). If row, Item 5 is independent and ships last.
5. **Does `CharacterSheetLayout` take ~15 flat props or one `sheet` context object?** Decides whether route composition (Item 7) is a one-line swap or a 20-line prop migration.

## Recommendation

Answer Q1 and Q4 before starting; specify the `?tab=` mapping table; delete or compress Items 8–10. The plan's information-architecture decision is sound; its presentational specifics aren't.
