/**
 * Shared market-surface constants (M3 — plan v3 D-M3-8, CTO R-2).
 *
 * The analytics-site flag and URL were deleted 2026-11-11: there is no diBoaS Analytics
 * product (founder, DR-2026-11-11-market-cleanup-decisions item 13), so nothing links to
 * it and the Article schema's author is diBoaS (decision G-1).
 */

/** The ETF-01 source id in the data-status panel (written by the pipeline's
 *  `data-status.mjs`). One definition for the label map and the LOW reason. */
export const ETF_FLOW_SOURCE_ID = 'Polygon:ETF (shares-outstanding)';

/**
 * Product events on /market (founder 2026-11-11, DR-2026-11-11-market-cleanup-decisions items 7
 * and 8). Consent-gated through the existing analytics service; caller parameters come only from
 * closed registries (view slugs, signal-group ids, condition ids), never from free text
 * (MKT-EVENT-2). Each fires once per element per page view, on first open, never on close.
 *   - memo opened: the scored view's weekly memo, or the Backdrop's "what is behind" depth;
 *   - signal group opened: a scored-view signal row;
 *   - view switched: a view tab or an umbrella card leading to another view;
 *   - Backdrop explainer opened: a condition row on /market/backdrop (the German kill-signal
 *     reads this one, item 8).
 */
export const MARKET_EVENTS = {
  MEMO_OPENED: 'market_memo_opened',
  SIGNAL_GROUP_OPENED: 'market_signal_group_opened',
  VIEW_SWITCHED: 'market_view_switched',
  BACKDROP_EXPLAINER_OPENED: 'market_backdrop_explainer_opened',
} as const;
export type MarketEventName = (typeof MARKET_EVENTS)[keyof typeof MARKET_EVENTS];
