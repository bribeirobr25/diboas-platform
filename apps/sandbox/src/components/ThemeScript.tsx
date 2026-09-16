/**
 * Pre-paint theme application. Runs before first paint (inline, in <head>) so a
 * stored dark/light choice is on <html data-theme> before any CSS resolves —
 * no flash of the wrong design. If nothing is stored, no attribute is set and
 * the CSS `prefers-color-scheme` media query drives the default from the OS.
 *
 * Kept as a tiny, self-contained IIFE string — it must not depend on React,
 * hydration, or any bundle that loads after paint.
 *
 * NB — CSP DEPENDENCY, LIVE since 2026-09-14 (register `5.212`). The sandbox
 * now ships a nonce-based CSP from `src/middleware.ts`: `script-src 'self'
 * 'nonce-…'` with NO `'unsafe-inline'`. This ONE inline script is therefore
 * BLOCKED unless it carries the per-request nonce, and the pre-paint theme
 * (no-flash) regresses silently when it does not — nothing throws, the design
 * just flashes. So `nonce` is load-bearing, not decoration, and it is a
 * REQUIRED prop: a caller that forgets it is a compile error rather than a
 * silent regression. The layout reads the value from the `x-nonce` request
 * header the middleware sets. Guarded by
 * `app/[locale]/__tests__/cspNonce.test.tsx`.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sb-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export function ThemeScript({ nonce }: { nonce: string | undefined }) {
  // Required KEY, nullable VALUE: callers must pass it explicitly, but a request
  // with no `x-nonce` still renders (the middleware fails open, so the page must
  // too) — see the NB above.
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
