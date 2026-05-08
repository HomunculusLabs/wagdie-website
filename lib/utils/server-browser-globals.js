/**
 * Remove browser-only storage globals from the server runtime.
 *
 * Newer Node releases can expose Web Storage globals. Some browser-oriented
 * packages use their presence as a browser signal during SSR, which can cause
 * server rendering to call browser storage APIs. The app should keep using
 * `typeof window`/`window.localStorage` as the browser boundary instead.
 */
function sanitizeServerBrowserGlobals() {
  if (typeof window !== 'undefined') {
    return;
  }

  for (const globalName of ['localStorage', 'sessionStorage']) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, globalName);

    if (!descriptor || descriptor.configurable === false) {
      continue;
    }

    try {
      delete globalThis[globalName];
    } catch {
      // Non-fatal: if a runtime refuses deletion, continue booting and let
      // normal server-side guards handle browser-only APIs.
    }
  }
}

sanitizeServerBrowserGlobals();

module.exports = { sanitizeServerBrowserGlobals };
