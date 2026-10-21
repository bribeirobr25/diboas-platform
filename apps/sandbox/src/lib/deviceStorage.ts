/**
 * Is device storage usable at all? (R-9.)
 *
 * `typeof localStorage` is NOT a safe probe on its own: when the browser blocks storage,
 * merely reading the `localStorage` global throws a SecurityError, and `typeof` does not
 * shield a throwing getter. So the probe itself sits inside a `try`. One copy, shared by
 * every small device-storage store (lane audit 2026-10-20: it existed twice and was
 * missing, unguarded, in a third).
 */
export function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}
