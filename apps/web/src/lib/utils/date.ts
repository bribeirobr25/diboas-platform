/**
 * Date utilities.
 */

/**
 * Formats a `Date` as a UTC ISO date string (`YYYY-MM-DD`).
 *
 * Extracted (D1 A-3) from three identical `…toISOString().slice(0, 10)` sites:
 * the waitlist position daily salt, the currency-hedge FX-bucket lookup, and the
 * path-dependent retrospective start date. Accepts any `Date` (constructed or
 * `new Date()`), so it covers all three call shapes.
 */
export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
