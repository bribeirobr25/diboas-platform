/**
 * Pre-paint theme application. Runs before first paint (inline, in <head>) so a
 * stored dark/light choice is on <html data-theme> before any CSS resolves —
 * no flash of the wrong design. If nothing is stored, no attribute is set and
 * the CSS `prefers-color-scheme` media query drives the default from the OS.
 *
 * Kept as a tiny, self-contained IIFE string — it must not depend on React,
 * hydration, or any bundle that loads after paint.
 *
 * NB — STAGE-1 CSP DEPENDENCY: today the sandbox ships no CSP (MVP-0 posture,
 * `next.config.mjs`), so this inline script runs freely. When the nonce-CSP
 * middleware lands at Stage 1 (`'unsafe-inline'` prohibited for scripts), this
 * ONE inline script must carry the per-request nonce or it will be blocked and
 * the pre-paint theme (no-flash) will silently regress. Wire it then by adding
 * a `nonce` prop here (read from `next/headers` in the layout) and setting it
 * on the <script>. Tracked in docs/sandbox-app/screens/BUILD_AUDIT_LEARNINGS.md.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sb-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
