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
