# Critique: Lowpoly Video Viewing Plan (2026-05-11)

Reviewing `docs/plans/lowpoly-video-viewing-2026-05-11.md`. Scope: seams, contradictions, over-planning, ordering questions only.

## 1. Top under-specified seams

1. **Thumbnail source is the load-bearing decision and the plan punts on it.** Work Item 7 says "Add local 16:9 thumbnails ... when available," and "If thumbnails are not ready, use an existing low-poly asset as a temporary fallback." Only three low-poly assets exist today (`public/images/low-poly/low-poly-hero-banner.png`, `low-poly-logo.webp`, `low-poly-map-banner.png` — confirmed). Falling back to a single shared image gives every playlist row the same poster, which defeats Work Item 5's whole purpose. Meanwhile YouTube already serves deterministic per-video thumbnails at `i.ytimg.com/vi/{youtubeId}/...jpg` — but the plan rejects that path ("Avoid remote YouTube thumbnails unless implementation intentionally updates image remote configuration") without acknowledging it's a five-line `next.config.js` change and is the obvious unblocking option. Pick one source before WI1, because the data type (`thumbnailSrc` field) depends on it.

2. **`embedUrl` as data vs. autoplay-on-click is double-booked.** WI1: "Keep `embedUrl` deterministic: `https://www.youtube-nocookie.com/embed/{youtubeId}?rel=0`." WI4: "after an explicit Play click, adding `autoplay=1` is acceptable." Those are incompatible if `embedUrl` is a frozen string in the content module — the island would have to mutate the query string at render time. Resolve by storing only `youtubeId` and deriving every URL variant at the call site, or drop the autoplay-on-Play affordance. Today's `embedUrl` values in `app/videos/page.tsx:25-83` already use `?rel=0` only, so the data module shape inherits this ambiguity unchanged.

3. **Hash-link selection (WI3) ignores `hashchange` and Play-state persistence.** "Default to episode 1, then read `window.location.hash` after mount" covers the initial load but not browser back/forward between `/videos#ep-2` and `/videos#ep-3`, which will silently break unless the island also listens to `hashchange`. Separately, when the user plays ep-1 then clicks ep-3 in the playlist, the plan says "resets the loaded iframe, and does not autoplay" — but is the ep-1 *played* state remembered if they click back to ep-1? One sentence ("each selection resets to poster" or "Play state is per-episode") removes a guaranteed inconsistency.

## 2. Contradictions / missing dependencies

- **WI1 vs. WI5 on metadata honesty.** WI1: "honest generic titles and summaries; do not invent lore-specific details." WI5: "generic titles are acceptable, missing optional fields should simply be omitted." Combined, the first deliverable can ship ten cards reading "Low Poly Episode N" with no summaries — i.e., visually richer than today's grid but informationally identical. Open Questions admits canonical metadata may not exist. Either gate WI5 on the content-availability check from Open Questions, or state explicitly that the v1 playlist is structural-only.
- **`noscript` fallback (WI6) inside a client island won't work.** WI3 makes the theater a client component; if the `noscript` fallback lives inside that island it never renders for JS-off users. The plan doesn't say the `noscript` must remain in the server-rendered page shell. Specify the boundary.
- **WI2 "support the viewing flow rather than compete with playback"** has no concrete deliverable — reduce hero height? reorder hero/logo/map below the theater? cut the map card? Without a target, it's a decorator everyone interprets differently.

## 3. Over-planning — cut or simplify

- **References block (10 lines, half external).** No work item cites a specific MDN/web.dev/W3C recommendation. Cut the external links; keep the four in-repo paths.
- **WI8 validation gates.** "Verify no iframe loads before Play, only one iframe loads after Play, and `youtube-nocookie.com` remains the embed domain" restates WI4's acceptance criteria. "Manually check 375px, 768px, and 1280px layouts" — implementation hygiene, drop the specific breakpoints. Collapse WI8 to "Run `bun run lint && bun run build`; manual smoke at one mobile/desktop width."
- **WI6 negative-space requirements** ("Do not trap focus or force focus jumps on every playlist selection," "Do not claim transcripts ... exist unless they are real"). These are anti-bugs, not work. Inline as one sentence or cut.
- **Open Question #2** ("Is YouTube the required long-term source") explicitly self-marks as non-blocking. Either delete or move to a one-line "Future" footer.

## 4. Questions whose answers reorder implementation

1. **Canonical episode titles/summaries — do they exist now?** If yes, WI1 unlocks WI5 as the centerpiece. If no, WI4 (theater player) carries the page and WI5 is decorative. This decides the first PR.
2. **YouTube remote thumbnails or local files?** Decides whether WI7 is "5-line `next.config.js` edit, unblocking everything" or "wait on art for ten files." The `thumbnailSrc` shape in WI1 depends on this answer, so it precedes WI1.
3. **Per-episode Play state, or reset-to-poster on every selection?** Different reducer in the island; pick before WI3/WI4 are written.
4. **Does `hashchange` drive selection, or only mount-time hash?** Cheap to add, but if unspecified it gets skipped and a back-button bug ships.

---

**Recommendation:** Answer Q1–Q2 before sequencing; collapse `embedUrl` to `youtubeId` in the data type; specify that `noscript` lives in the server tree; cut the References external links, half of WI8, and Open Question #2. Plan is ~25% over-specified on validation/refs and ~15% under-specified on the thumbnail/autoplay/hash seams — the under-specified ones are load-bearing.
