/**
 * Sandbox geofence (M1) — country denylist policy + pure decision helpers.
 *
 * Founder policy 2026-07-21, CLO-ratified: the sandbox is open everywhere
 * EXCEPT China / Russia / North Korea. One-line add/remove in BLOCKED_COUNTRIES.
 * Design + the D1–D11 decisions: docs/sandbox-app/SANDBOX_GEOFENCE_PLAN_2026-07-21.md.
 *
 * EDGE-SAFE: this module has NO Node imports (it is consumed by the edge
 * middleware). It must never import `node:crypto` or `@/lib/gate` — those would
 * break the edge runtime. Only pure logic + the (type-only) i18n locale list.
 */
import { SANDBOX_LOCALES, DEFAULT_LOCALE, type SandboxLocale } from '@/i18n/config';

/**
 * ISO 3166-1 alpha-2. CLO-ratified baseline (CN/RU/KP). Expandable to the fuller
 * OFAC/EU/UN set (Iran/Syria/Cuba/Crimea…) in one line if the CLO widens it.
 */
export const BLOCKED_COUNTRIES: ReadonlySet<string> = new Set(['CN', 'RU', 'KP']);

/** Pure predicate. null/unknown → NOT blocked (D3: allow-on-unknown, play-money). */
export function isCountryBlocked(country: string | null | undefined): boolean {
  return country != null && BLOCKED_COUNTRIES.has(country.toUpperCase());
}

/** The block decision: the geofence is enabled AND the detected country is on the denylist. */
export function shouldBlock(country: string | null | undefined, enabled: boolean): boolean {
  return enabled && isCountryBlocked(country);
}

/**
 * First path segment → a supported locale, else the default. Used to send a
 * blocked visitor to `/{locale}/unavailable` in their URL's language (D10).
 */
export function localeFromPathname(pathname: string): SandboxLocale {
  const seg = pathname.split('/')[1];
  return (SANDBOX_LOCALES as readonly string[]).includes(seg)
    ? (seg as SandboxLocale)
    : DEFAULT_LOCALE;
}
