# Investigation: Orb of the Leorn Front Rendering

## Summary
The `Front` / `Orb of the Void` layer resolution and asset are likely correct; local composition for WAGDIE #5873 visibly changes the image. The unchanged result image is most likely caused by the `/searing` UI showing the source image when sync does not return a usable `imageUrl`, by normal character image display policy forcing `/images/characters/5873.png`, or by stale cache if the DOM is already using the deterministic GCS seared URL.

## Symptoms
- Searing UI/result metadata indicates `Front` and `Orb of the Void` for Orb of the Leorn on WAGDIE #5873.
- The rendered result image appears unchanged; no visible front layer is added.

## Background / Prior Research
No external research needed at initial triage. This appears contained to workspace code/data/assets: searing map resolution, layer composition, local layer mirror, and preview/result rendering.

## Investigator Findings
<!-- Pair investigator appends structured analysis here. -->

### 2026-05-02 - Dedicated searing page result image path

- **Proved: the dedicated `/searing` page does not compose a client-side preview.** `app/searing/page.tsx:1-5` only renders `SearingPageClient`. The result image is selected in `components/searing/SearingPageClient.tsx:166-172`: it computes `sourceImageUrl` with `getCharacterImageUrl(...)`, then uses `const previewImageUrl = resultImageUrl || sourceImageUrl`. The `<img>` uses that value at `components/searing/SearingPageClient.tsx:184-187`.
- **Proved: before/while sync, the result panel falls back to the original/current character image.** Starting a sear clears the result URL at `components/searing/SearingPageClient.tsx:376-378`; selecting a different character/concord also clears it at `components/searing/SearingPageClient.tsx:317-327`. Therefore the result image is the `sourceImageUrl` until the sync API returns a completed result with `imageUrl`.
- **Proved: `resultImageUrl` only comes from the sync response.** The page posts to `/api/characters/${selectedCharacter.token_id}/searing/sync` at `components/searing/SearingPageClient.tsx:343-353`, converts the response through `syncStateFromResponse(...)`, and stores `setResultImageUrl(result.imageUrl)` at `components/searing/SearingPageClient.tsx:358-361`.

### 2026-05-02 - Sync/materialization result URL behavior

- **Proved: fresh successful materialization should return a result image URL.** The public sync endpoint calls `searingMaterializationService.verifyTransactionAndMaterialize(...)` and returns the service result directly at `app/api/characters/[tokenId]/searing/sync/route.ts:72-79`. The materializer resolves layers, composes them, uploads the PNG, updates the read model, marks the event completed, and returns `imageUrl` at `lib/services/searing-materialization-service.ts:375-418`.
- **Completed-without-image case exists.** If an event is already completed, `materializeEvent(...)` returns `status: 'completed'` but only includes `imageUrl` when `event.seared_image_url` is truthy at `lib/services/searing-materialization-service.ts:181-188`. `seared_image_url` is nullable in the event row type at `lib/repositories/searing-event-repository.ts:6-25`.
- **UI behavior for completed-without-image/pending/failed:** `syncStateFromResponse(...)` treats completed-without-image as completed with message "read model was already up to date" and returns `imageUrl: null` at `components/searing/SearingPageClient.tsx:43-59`; failed results return `imageUrl: null` at `components/searing/SearingPageClient.tsx:62-70`; all other no-completed/no-error responses become pending with `imageUrl: null` at `components/searing/SearingPageClient.tsx:82-89`. In all three null-image cases, `ResultPreview` falls back to `sourceImageUrl`.

### 2026-05-02 - Display policy conflict with seared metadata

- **Proved: `getCharacterImageUrl` ignores seared metadata and `image_url`.** `getCharacterImageCandidates(...)` explicitly discards `metadataOrImage`, `imageUrl`, and `options` at `lib/utils/image.ts:173-181`, then returns `/images/characters/${tokenId}.png` when `hasLocalCharacterImage(tokenId)` is true at `lib/utils/image.ts:183-187`. `getCharacterImageUrl(...)` just returns the first candidate at `lib/utils/image.ts:193-199`.
- **For WAGDIE #5873, that means `/images/characters/5873.png`.** `hasLocalCharacterImage(...)` returns true for all integer token IDs `1..6666` unless listed missing, and the missing list is empty at `lib/data/local-character-asset-status.ts:1-11`.
- **Hydration reinforces this policy.** `characterLocalAssets.hydrateCharacter(...)` merges local metadata, calls `getCharacterImageUrl(...)`, and overwrites returned `image_url` with that value at `lib/services/assets/character-local-assets.ts:223-235`. Thus a refetched character can have seared metadata / DB `image_url`, but normal character display still resolves to `/images/characters/5873.png`.
- **Scope of conflict:** this does **not** override a non-null `resultImageUrl` in `ResultPreview` because `resultImageUrl || sourceImageUrl` prefers the sync URL. It **does** explain an unchanged result if the sync result is pending, failed, completed-without-image, or otherwise returns no usable `imageUrl`.

### 2026-05-02 - Front layer asset and composition correctness

- **Proved: the target asset exists and is not blank.** `public/images/wagdie-layers/Searing/Front/Orb of the Void.png` exists. Local inspection reports `PNG image data, 400 x 400, 8-bit/color RGBA`, size `3,207` bytes. Sharp raw-pixel inspection found `19,392` non-transparent pixels, all opaque, with bounding box `[216, 232, 400, 400]` and mean visible RGBA approximately `[138.84, 33.39, 192.39, 255]`.
- **Proved: resolver would put a `Front` sear in the last layer.** `SEARING_LAYERS` orders `Front` last at `lib/domain/searing/searing-layer-resolver.ts:7-17`. If the sear location is missing from metadata, the resolver adds that trait with `None` at `lib/domain/searing/searing-layer-resolver.ts:171-180`. For affected layers, it swaps the URL to `/images/wagdie-layers/Searing/{location}/{newTrait}.png` and marks `seared` at `lib/domain/searing/searing-layer-resolver.ts:195-205`, then sorts by layer position at `lib/domain/searing/searing-layer-resolver.ts:209-213`.
- **Proved: composer composites in resolver order.** `SearingImageComposer.compose(...)` uses the first layer as base and passes all remaining images to Sharp `composite(...)` in array order at `lib/services/searing-image-composer.ts:121-136`. Since `Front` sorts last, a `Front` sear is composited last/topmost.
- **Concrete #5873 composition evidence:** `public/metadata/characters/5873.json:5-34` has the base traits `Background=Serpentine`, `Back=None`, `Body=Hole Protector`, `Armor=Pilgrim's Plain Chain`, `Hair=Hermit Set`, `Mask=Removal's Kin`, and no `Front` trait. A local Sharp composition using those base layers exactly matched `public/images/characters/5873.png` (`local5873VsBase changedPixels: 0`). Adding `Searing/Front/Orb of the Void.png` changed `19,392` pixels (`baseVsSeared changedPixels: 19392`). This disproves missing/transparent/wrong-order layer as the primary cause for an unchanged image.

### 2026-05-02 - Deterministic storage URL / cache risk

- **Cache risk proven in code if materialized image URL is used.** `SearingStorageService.objectNameForToken(...)` stores every seared image for a token at a deterministic object name, `${prefix}/${tokenId}.png` or `${tokenId}.png`, at `lib/services/searing-storage.ts:55-56`. `publicUrlForObject(...)` returns the deterministic `https://storage.googleapis.com/{bucket}/{objectName}` URL at `lib/services/searing-storage.ts:59-60`.
- **Uploaded objects are marked long-lived immutable.** `uploadSearedImage(...)` saves with `cacheControl: 'public, max-age=31536000, immutable'` at `lib/services/searing-storage.ts:68-75`. There is no cache-busting query param or content hash in the URL before `ResultPreview` renders it at `components/searing/SearingPageClient.tsx:172-187`.
- **API responses are no-store, but the image object is not.** The sync routes set `Cache-Control: no-store` for JSON at `app/api/characters/[tokenId]/searing/sync/route.ts:10-12` and `app/api/sync/searing/route.ts:10-12`; this does not prevent browser/CDN reuse of the deterministic immutable PNG URL. Therefore, if the DOM `img src` is a GCS seared URL and still appears unchanged, stale cached content at the deterministic object URL is a plausible cause.

### 2026-05-02 - Current best explanation / falsifiable checks

- If the result panel `img src` is `/images/characters/5873.png`, the unchanged image is explained by the dedicated page fallback plus `getCharacterImageUrl`'s local-only policy. That means sync did not provide a usable `resultImageUrl` (pending, failed, completed-without-image, or response shape mismatch).
- If the result panel `img src` is `https://storage.googleapis.com/.../5873.png`, the resolver/layer/composer path should have produced a visible lower-right purple orb; remaining likely causes are stale immutable cache at the deterministic object URL or the backend uploaded/served an older object.
- Concrete browser-side proof point: inspect the result image element `src` and network response. `/images/characters/5873.png` proves UI fallback/display policy; a GCS URL with `200` but unchanged pixels points at cache/object contents.

## Investigation Log

### Initial Assessment - Searing result rendering
**Hypothesis:** The result image may be rendering the pre-seared character because the materialization/preview path does not actually compose local layers for browser preview.
**Findings:** Confirmed. The dedicated `/searing` page uses `resultImageUrl || sourceImageUrl`; it does not compose a local preview. `resultImageUrl` is only set from the searing sync response when that response includes `imageUrl`.
**Evidence:** `components/searing/SearingPageClient.tsx:166-187`, `components/searing/SearingPageClient.tsx:343-361`.
**Conclusion:** Confirmed as the primary explanation when the result `<img src>` is `/images/characters/5873.png`.

### Initial Assessment - Front layer composition
**Hypothesis:** The `Front` layer may be resolved but omitted/invisible due to layer ordering, missing base `Front/None`, missing `Searing/Front/Orb of the Void.png`, transparent asset, or composer fallback choosing the wrong same-name file.
**Findings:** Eliminated as the primary cause for #5873. The target asset exists, is non-transparent, resolver places `Front` last, composer composites in resolver order, and manual local composition changes 19,392 pixels versus the base #5873 image.
**Evidence:** `public/images/wagdie-layers/Searing/Front/Orb of the Void.png`; `lib/domain/searing/searing-layer-resolver.ts:7-17`, `lib/domain/searing/searing-layer-resolver.ts:171-213`, `lib/services/searing-image-composer.ts:121-136`; pair investigator pixel comparison recorded above.
**Conclusion:** Eliminated for this reported symptom unless production is serving a different asset/object than the workspace asset.

## Root Cause
The searing result label and result image are driven by different systems. The `Front` / `Orb of the Void` text comes from the selected Concord searing map, while the image in the dedicated `/searing` result panel is `resultImageUrl || sourceImageUrl`. Because there is no client-side composed preview, the panel displays the original/current character image until sync returns a completed result with a non-null `imageUrl`.

If sync returns `pending`, `failed`, or `completed` without `imageUrl`, the UI silently falls back to `sourceImageUrl`. For #5873, `sourceImageUrl` resolves to `/images/characters/5873.png` because `getCharacterImageUrl` ignores seared metadata and DB image URLs and prefers local static character images for token IDs 1–6666.

The layer pipeline itself is not the likely root cause. `Searing/Front/Orb of the Void.png` exists, contains visible pixels, and local composition proves it would visibly alter #5873. If the rendered DOM image is already a GCS URL, the remaining likely cause is stale content from deterministic `{tokenId}.png` storage combined with `Cache-Control: public, max-age=31536000, immutable`.

## Recommendations
1. Inspect the live result image element `src` for WAGDIE #5873 after using Orb of the Leorn.
   - `/images/characters/5873.png` confirms UI fallback/no usable sync image.
   - `https://storage.googleapis.com/.../5873.png` shifts the issue to cache/object contents.
2. Inspect the `/api/characters/5873/searing/sync` response for the exact transaction: `results[0].status`, `results[0].imageUrl`, `results[0].error`, and `results[0].reason`.
3. Treat `completed` without `imageUrl` as non-successful in `components/searing/SearingPageClient.tsx`; show a warning instead of presenting the source image as the result.
4. Fix character image URL priority in `lib/utils/image.ts` and related tests so seared images (`metadata.searImage`, `metadata.searing_materialization.seared_image_url`, or DB `image_url`) can outrank local static `/images/characters/{tokenId}.png` where appropriate.
5. Make seared storage URLs cache-safe in `lib/services/searing-storage.ts`, preferably by versioning object paths with event/transaction/materialization identifiers rather than overwriting `{tokenId}.png` with immutable cache headers.
6. Optionally add backend validation/logging for composed image delta and exact fallback paths so zero-pixel or wrong-file compositions fail loudly.

## Preventive Measures
- Add UI tests for completed-without-image, failed, and pending sync responses to ensure the result panel does not silently show the source image as a completed result.
- Add unit tests for seared character image priority in `getCharacterImageUrl` and hydration.
- Add a fixture test that composes #5873 plus `Searing/Front/Orb of the Void.png` and asserts a non-zero pixel delta.
- Use versioned/cache-busted seared image URLs for all materialized outputs.
