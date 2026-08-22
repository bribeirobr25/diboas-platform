/**
 * Cache policy for the two public market routes (`/api/market`,
 * `/api/market/history`).
 *
 * Both became publicly reachable when the app opened at `app.diboas.com`
 * (SANDBOX_PUBLIC_ACCESS, founder 2026-08-22), and both proxy metered
 * third-party feeds — CoinGecko's free Demo tier in particular. The providers
 * already cache server-side at the ruled 6 h TTL, but that cache is
 * IN-PROCESS: on serverless every cold instance starts empty, so a burst of
 * traffic across many instances turns into a burst of upstream calls. Putting
 * the CDN in front collapses that to roughly one origin hit per region per
 * window.
 *
 * Why these directives:
 * - `public` — the payload is identical for every visitor. No user data, no
 *   cookies read, no auth. Safe for a shared cache, and that safety is the
 *   precondition for using one.
 * - `max-age=0` — browsers do not keep it. Without this they may cache
 *   heuristically and pin a stale rate into an open tab, which is the one thing
 *   an honest market surface must not do.
 * - `s-maxage=300` — the CDN serves for five minutes. Far tighter than the 6 h
 *   upstream TTL, so this costs no freshness the data actually has; it only
 *   removes duplicate work.
 * - `stale-while-revalidate=3600` — a cold origin never makes a user wait; the
 *   edge serves the last good copy and refreshes behind it.
 */
export const MARKET_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

/**
 * Failures are NEVER cached. A 503 held for five minutes would turn a momentary
 * provider blip into a five-minute outage for everyone behind that edge — the
 * cache amplifying the fault instead of absorbing it.
 */
export const MARKET_ERROR_CACHE_CONTROL = 'no-store';
