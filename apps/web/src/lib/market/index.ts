/**
 * `/market` feature-domain shared code (Adelaide Daily dashboard).
 *
 * NOTE (rev-3 NF7): NOT the same as `apps/web/src/lib/market-data/` — that
 * directory carries the host's market-rate data service (bank rates, exchange
 * rates, inflation rates per locale, used across the calculator suite). This
 * directory carries `/market` route-specific concerns (analytics event
 * constants, anything else iter-2+ adds for the dashboard surface).
 *
 * IDE autocomplete users: pick `lib/market/` for `/market` route work,
 * `lib/market-data/` for market-rate fetching.
 */

export * from './constants';
