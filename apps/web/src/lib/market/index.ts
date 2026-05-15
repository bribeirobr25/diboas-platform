/**
 * `/market` feature-domain shared code (Adelaide Daily dashboard).
 *
 * Three adjacent `market`-named locations exist in this codebase. Pick:
 *
 *   • `apps/web/src/lib/market/` (HERE) — TypeScript event constants and
 *     `/market` route-specific code. Owned by engineering.
 *
 *   • `apps/web/src/lib/market-data/` — host's market-rate data service
 *     (bank rates, exchange rates, inflation per locale). Used across the
 *     calculator suite. Owned by engineering.
 *
 *   • `apps/web/data/market/` — editorial JSON for the Adelaide Daily
 *     dashboard (regime score, signals, historical chart, etc.). Owned by
 *     editorial via the workflow in `docs/integrations/market-editorial.md`.
 *     Iteration 5 deletes this directory when the real
 *     `@analytics-platform/client` ships.
 *
 * IDE autocomplete users: this directory is for `/market` route TypeScript
 * code.
 */

export * from './constants';
