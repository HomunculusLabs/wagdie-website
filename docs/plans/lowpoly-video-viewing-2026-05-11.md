# Lowpoly Video Viewing: Plan

## Goal

Turn `/videos` from a simple embedded episode grid into a world-class WAGDIE video viewing page: immersive, fast, accessible, and clearly tied to the Low Poly series without introducing new backend contracts.

## Background

- `/videos` is a static App Router page with route metadata and all episode data defined locally in `app/videos/page.tsx:7-86`.
- The page currently renders a `BannerHeader`, hero artwork, logo/map cards, and a two-column grid of ten YouTube `iframe` embeds (`app/videos/page.tsx:88-181`).
- Each episode already uses `youtube-nocookie.com`, lazy iframe loading, strict referrer policy, fullscreen permission, and a direct YouTube link (`app/videos/page.tsx:25-83`, `app/videos/page.tsx:155-171`).
- Shared visual primitives are already in place: `BannerHeader` and `AspectRatio` (`app/videos/page.tsx:4-5`). Adjacent native video code exists in `components/home/VideoPlayer.tsx:10-36`, but it is MP4/WebM-oriented and not a fit for YouTube playback.
- Route inventory identifies `/videos` as the Low Poly video gallery (`docs/reference/routes-and-apis.md:28`). No prior plan directly targets this page; adjacent plans only mention it as a destination or cite its YouTube embed behavior.
- Only three Low Poly image assets exist today (`public/images/low-poly/`), so per-episode thumbnails are the first content decision, not a polish task.

## Approach

Keep `/videos` static, YouTube-based, privacy-preserving, and visually WAGDIE. Replace the ten-iframe gallery with a featured theater experience: one selected episode, thumbnail-first play, a metadata-aware playlist, direct YouTube fallbacks, and server-rendered no-JS links.

The route should remain the server-rendered owner of the page shell. Move only the interactive theater/playlist into a small client island so the page gains selection, hash links, and click-to-load playback without becoming a media platform rewrite.

Two product/content decisions are now settled for v1:

1. **Thumbnail source** — use ten local 16:9 thumbnails under `public/images/low-poly/thumbnails/`. Do not add `i.ytimg.com` to `next.config.js`, and do not ship ten identical fallback posters.
2. **Metadata depth** — canonical titles, summaries, durations, captions, transcripts, and chapters are not available yet. Ship the theater-first UX with honest generic labels, then treat richer playlist copy/resources as follow-up content work.

Preserve current strengths: `youtube-nocookie.com`, direct YouTube links, stable `AspectRatio` frames, the dark gothic visual system, and no backend/persistence/uploads/global navigation changes. Do not reuse `components/home/VideoPlayer.tsx` unless the content strategy later moves to self-hosted MP4/WebM.

## Work Items

1. **Extract episode content and derive URLs**
   - Move `LowPolyEpisode`, `LOW_POLY_ASSETS`, and `LOW_POLY_EPISODES` out of `app/videos/page.tsx:12-86` into a reusable content module, for example `lib/content/lowPolyEpisodes.ts`.
   - Store stable `id`, `episode`, `label`, `youtubeId`, generic title/summary fields, and local thumbnail metadata.
   - Derive `youtubeUrl`, base embed URL, and play embed URL from `youtubeId` at the render/helper layer instead of freezing `embedUrl` as data. This avoids conflict between a canonical `?rel=0` URL and the user-clicked `autoplay=1` variant.
   - Leave `duration`, `transcriptUrl`, `captionsNote`, and `chapters` absent until real content exists.

2. **Reshape the page around viewing**
   - Keep `BannerHeader`, but adjust the subtitle so the page reads as the Low Poly series hub.
   - Reduce the current intro artwork's dominance if needed so the player becomes the page's primary object; the logo/map art should support the series context, not sit as a second hero.
   - Replace the two-column iframe grid (`app/videos/page.tsx:140-181`) with a theater region, playlist, resource links, and server-rendered `noscript` direct YouTube links.

3. **Build the client theater island**
   - Add a client component such as `components/videos/LowPolyVideoExperience.tsx` with `episodes` and optional `initialEpisodeId` props.
   - Own only local UI state: selected episode and loaded iframe episode.
   - Default to episode 1, then read `window.location.hash` after mount so `/videos#ep-3` selects episode 3 without server/client mismatch.
   - Listen for `hashchange` so browser back/forward between episode hashes updates selection.
   - Use reset-to-poster behavior on every episode selection; previously played episodes do not remain loaded in the background.

4. **Use thumbnail-first, one-iframe playback**
   - Render a poster/thumbnail state for the active episode first.
   - Mount the YouTube iframe only after the user clicks Play.
   - Keep exactly one active iframe mounted at a time.
   - Preserve existing iframe safety attributes from `app/videos/page.tsx:165-171`; after an explicit Play click, adding `autoplay=1` is acceptable.
   - Always show a direct YouTube link as the recovery path for blocked embeds or iframe failures.

5. **Create a useful playlist**
   - Render all ten episodes as selectable cards or rows with label, generic title, local thumbnail, and visible selected state.
   - Use existing `Card`, `Button`, and `AspectRatio` primitives where they fit the current visual system.
   - Keep the v1 playlist compact and structural rather than padding it with invented copy.

6. **Accessibility and fallback pass**
   - Give the theater region a visible heading and expose the selected episode title to assistive tech.
   - Ensure keyboard users can select episodes, play the active episode, open YouTube, and reach transcript/caption links when present.
   - Keep `noscript` fallback links in the server-rendered page shell, not inside the client island.
   - Avoid focus traps, surprising focus jumps, and unverified transcript/caption claims.

7. **Validation**
   - Run `bun run lint` and `bun run build`.
   - Smoke test one mobile and one desktop viewport.
   - Verify no iframe loads before Play, only one iframe loads after Play, `youtube-nocookie.com` remains the embed domain, `/videos#ep-3` selects the expected episode, direct YouTube links work, and keyboard focus states are visible.

## Open Questions

None blocking for v1. Implementation should add local thumbnails first and keep richer episode metadata/resources as follow-up content work.

## References

- Current page: `app/videos/page.tsx`
- Shared banner: `components/shared/BannerHeader.tsx`
- Shared ratio wrapper: `components/ui/AspectRatio.tsx`
- Native homepage video component: `components/home/VideoPlayer.tsx`
- Image remote config: `next.config.js`
- Route inventory: `docs/reference/routes-and-apis.md`
- Homepage plan prior art: `docs/plans/homepage-improvements-2026-05-11.md`
- Community media prior art: `docs/plans/community-lore-media-submissions-2026-05-09.md`
