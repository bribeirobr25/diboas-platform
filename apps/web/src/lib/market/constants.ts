/**
 * Shared market-surface constants (M3 — plan v3 D-M3-8, CTO R-2).
 *
 * `ANALYTICS_SITE_LIVE` was a shell-local constant; the umbrella became a
 * second composition gating `MethodologyLink`/`PoweredByAttribution` on it —
 * ONE flag, one flip when diboas-analytics.com launches.
 */
export const ANALYTICS_SITE_LIVE = false;

/** The diBoaS Analytics site's origin: the attribution link and the
 *  Article schema's author both point here (one definition, 2026-10-18). */
export const ANALYTICS_SITE_URL = 'https://diboas-analytics.com';

/** The ETF-01 source id in the data-status panel (written by the pipeline's
 *  `data-status.mjs`). One definition for the label map and the LOW reason. */
export const ETF_FLOW_SOURCE_ID = 'Polygon:ETF (shares-outstanding)';
