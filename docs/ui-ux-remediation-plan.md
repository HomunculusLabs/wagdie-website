# UI/UX Remediation Plan (WAGDIE)

Last updated: 2025-12-30

## Background
This plan translates the current UI/UX audit into a phased remediation roadmap. The goal is to remove dead ends, improve accessibility and keyboard flows, consolidate design-system usage, and stabilize layout/interaction patterns across pages.

The plan focuses on front-end/UI work only. It is intentionally scoped to fix the most user-visible issues first, then align the remaining UI components with the design system.

## Goals
- Eliminate navigation dead ends and inert CTAs.
- Improve accessibility and keyboard usability across core flows.
- Align typography, color, and components with the design system.
- Standardize layout and page structure across top-level routes.
- Improve media reliability (images, video, toasts, loaders).

## Non-Goals
- Rewriting the entire component library.
- Large visual redesigns that conflict with the existing gothic theme.
- Full performance overhaul beyond UI-related concerns.

## Summary of Issues (Condensed)
- Broken or placeholder navigation/CTAs (missing routes, `#` links, no actions).
- Accessibility gaps (focus visibility, labeling, modal semantics, keyboard traps).
- Design system drift across pages and components.
- Layout inconsistencies and invalid semantics (nested `main`).
- Media reliability gaps (remote image allowlist, video consent CTA visibility).

## Prioritization
- P0: Direct UX breakage or critical accessibility blockers.
- P1: High-impact consistency and usability issues.
- P2: Polish and non-blocking improvements.

## Remediation Plan

### Phase 0 - Navigation and CTA Repair (P0)
Goal: remove dead ends and guarantee every primary action leads somewhere.

Tasks:
- Resolve missing routes or remove links:
  - `components/layout/Navigation.tsx`
  - `components/layout/Header.tsx`
- Wire hero and CTA buttons to actual routes or external links:
  - `app/page.tsx`
- Replace placeholder `#` links with valid targets or disable until ready:
  - `app/page.tsx`

Deliverables:
- All global nav and hero CTAs lead to real destinations.
- Zero 404s from primary navigation.

### Phase 1 - Accessibility and Interaction (P0/P1)
Goal: ensure keyboard navigation, focus visibility, and accessible labels.

Tasks:
- Add focus-visible styling to primary interactive components:
  - `components/ui/Button.tsx`
  - `components/ui/Pagination.tsx`
  - `components/ui/Carousel.tsx`
- Fix clickable cards to use buttons/links or proper keyboard handlers:
  - `components/characters/CharacterCard.tsx`
- Ensure labels are associated with inputs in primitives:
  - `components/ui/Input.tsx`
  - `components/ui/TextArea.tsx`
  - `components/ui/Switch.tsx`
  - `components/ui/Checkbox.tsx`
- Standardize modal semantics and focus handling:
  - `components/ui/Modal.tsx`
  - `components/shared/DialogMask.tsx`
  - `components/modals/InfectionModal.tsx`
  - `app/page.tsx` (video consent overlay)

Deliverables:
- Visible focus on all buttons/controls.
- All inputs have programmatic labels or `aria-label`.
- Modals behave consistently with focus trap and escape handling.

### Phase 2 - Design System Alignment (P1)
Goal: remove legacy styles and consolidate on shared components.

Tasks:
- Replace legacy buttons and typography on system pages:
  - `app/error.tsx`
  - `app/not-found.tsx`
  - `app/characters/[tokenId]/animated/page.tsx`
  - `components/spread/DialogSpreadingApproval.tsx`
  - `components/modals/InfectionModal.tsx`
- Remove usage of `.btn-*` in favor of `Button`:
  - `components/wallet/UserDropdown.tsx`
  - `app/globals.css`
- Resolve typography mismatches noted in `REPOMARK` comments:
  - `components/characters/SheetToggle.tsx`
  - `components/ui/Alert.tsx`
  - `components/ui/Empty.tsx`
  - `components/ui/Accordion.tsx`
  - `components/lore/CustomTweet.tsx`
  - `app/map/page.tsx`

Deliverables:
- Consistent typography and button styling across pages.
- Reduced legacy CSS reliance.

### Phase 3 - Layout and Page Structure (P1/P2)
Goal: unify layout structure and reduce page-to-page shifts.

Tasks:
- Remove nested `main` elements:
  - `app/layout.tsx`
  - `components/ui/Layout.tsx`
  - `app/page.tsx`
- Standardize max-width and container usage across routes:
  - `components/shared/BannerHeader.tsx`
  - `components/ui/Layout.tsx`
  - `app/characters/page.tsx`
  - `app/lore/page.tsx`
  - `app/spread/page.tsx`
- Address filter sidebar height/overflow issues:
  - `components/characters/FilterSidebar.tsx`

Deliverables:
- Uniform page width and consistent top-level layout.
- No structural HTML violations.

### Phase 4 - Media and Feedback Reliability (P2)
Goal: ensure media and micro-feedback are reliable and visible.

Tasks:
- Add missing remote image patterns for tweet media:
  - `next.config.js`
  - `components/lore/CustomTweet.tsx`
- Make the video unmute overlay visible and actionable:
  - `app/page.tsx`
- Fix toast progress animation keyframes:
  - `components/ui/Toast.tsx`
  - `tailwind.config.ts`
- Improve empty/loading states for clarity and consistency:
  - `components/ui/Empty.tsx`
  - `components/ui/Spinner.tsx`

Deliverables:
- Tweet media loads across common sources.
- Feedback/toast animations function as intended.

## Acceptance Criteria
- No primary nav item leads to a 404 or placeholder.
- Keyboard focus is always visible on interactive controls.
- Every form control is labeled (native label or `aria-label`).
- Modals/drawers are accessible (focus, escape, `aria-*`).
- Design system typography and colors are consistent.
- No nested `main` elements across app.
- Hero and CTA actions are functional.

## Testing and Verification
- Manual:
  - Tab through all major flows (Home, Characters, Character detail, Map, Lore, Spread).
  - Use keyboard only to open/close modals and drawers.
  - Verify focus visibility in dark theme.
  - Validate Hero video consent and unmute behavior.
- Automated (optional):
  - Add minimal a11y checks for key pages if tests exist.

## Open Questions / Dependencies
- Should `/about` and `/gather` be implemented now or removed from navigation?
- What are the intended targets for home page CTAs and feature cards?
- Should the design system update or remove legacy `.btn-*` classes?
- Which external domains should be allowed for tweet media?

## Ownership and Sequencing
- Start with Phase 0 and Phase 1 to unblock UX and accessibility.
- Phase 2 and Phase 3 can run in parallel if desired.
- Phase 4 is safe to defer but reduces perceived quality.
