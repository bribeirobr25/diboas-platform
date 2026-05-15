/**
 * Market dashboard analytics events (Adelaide Daily, `/market` route).
 *
 * Naming follows the platform pattern (snake_case, feature-prefixed, past
 * tense for completed actions) per docs/tech/analytics-integration.md.
 * Matches the verified-in-code precedents:
 *   - apps/web/src/lib/learn/constants.ts        → LESSON_EVENTS
 *   - apps/web/src/lib/waitingList/constants.ts  → WAITING_LIST_EVENTS
 *   - apps/web/src/lib/compound-interest/constants.ts → CALCULATOR_EVENTS
 *
 * All events route through the existing `analyticsService.track()` and
 * inherit consent gating from the host's PostHog/GA4 layer.
 *
 * Forbidden (per docs/mvp/integration/13_host_integration_guides/diboas_platform.md §10.2):
 * no engagement-loop tracking, no scroll-depth, no rage-click. The dashboard
 * surface must not feed compulsive-checking behavior.
 */

export const MARKET_EVENTS = {
  VIEWED: 'market_viewed',
  SIGNAL_CARD_EXPANDED: 'market_signal_card_expanded',
  SIGNAL_CARD_COLLAPSED: 'market_signal_card_collapsed',
  METHODOLOGY_LINK_CLICKED: 'market_methodology_link_clicked',
  HISTORICAL_CHART_RANGE_CHANGED: 'market_historical_chart_range_changed',
  FALLBACK_SHOWN: 'market_fallback_shown',
  POWERED_BY_LINK_CLICKED: 'market_powered_by_link_clicked',
} as const;

export type MarketEventName = (typeof MARKET_EVENTS)[keyof typeof MARKET_EVENTS];
