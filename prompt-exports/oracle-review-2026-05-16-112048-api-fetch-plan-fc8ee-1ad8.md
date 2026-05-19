# Oracle Review

## Summary

The diff largely follows the staged API/fetch standardization plan: it adds explicit raw/envelope client readers, a shared `ApiError`, shape-aware `ApiClient` helpers, migrates many client call sites, and replaces several raw `NextResponse.json` responses with `jsonRaw*` helpers while preserving body shapes. I do **not** see P0 contract-breaking blockers in the raw/envelope route helper replacements, FormData upload handling, stream/blob preservation, or no-store helper usage. One correctness regression is worth fixing before wrap-up.

## Findings

### P1

- **`lib/api/client-errors.ts` — raw Eliza-style errors now prefer machine codes over user-facing messages**
  - **What’s wrong:** `extractApiErrorMessage()` currently returns `body.error` before `body.message`. Several raw Eliza/auth endpoints use `{ error: 'UNAUTHORIZED' | 'NO_TOKEN' | 'FORBIDDEN' | ..., message: 'Human readable text' }`. Before migration, many clients used `message` first, especially:
    - `hooks/useAICharacter.ts`
    - `hooks/useConversations.ts`
    - `hooks/useElizaAuth.ts`
    - `hooks/useKnowledgeUpload.ts`
  - This means UI errors can regress from `"Wallet not connected"` / `"Authentication failed"` to machine codes like `"UNAUTHORIZED"` or `"NO_TOKEN"`.
  - **Suggestion:** Make raw-response error extraction prefer `message` over `error` when both are present, or add a `preferMessage`/`messageFieldOrder` option used by `readApiRaw`. Keep envelope behavior compatible with existing lore/location routes. Add a unit test for:
    ```ts
    { error: 'UNAUTHORIZED', message: 'Wallet not connected' }
    ```
    expecting `"Wallet not connected"` for raw readers, while `{ error: 'Invalid wallet address' }` still returns the error string.