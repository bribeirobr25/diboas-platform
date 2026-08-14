/**
 * Pre-paint theme application. Runs before first paint (inline, in <head>) so a
 * stored dark/light choice is on <html data-theme> before any CSS resolves —
 * no flash of the wrong design. If nothing is stored, no attribute is set and
 * the CSS `prefers-color-scheme` media query drives the default from the OS.
 *
 * Kept as a tiny, self-contained IIFE string — it must not depend on React,
 * hydration, or any bundle that loads after paint.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sb-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
