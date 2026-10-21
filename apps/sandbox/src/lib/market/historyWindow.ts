/**
 * The history window — ONE owner for a fact that two places used to state separately
 * (lane audit 2026-10-20): the server's `?days=` cap on `/api/market/history` and the
 * client's real-time settle span. The settle requests at most `HISTORY_DAYS_MAX` days (its
 * span plus a margin), so the route serves all of it; they were two literal `730`s.
 */

/** Days a history request covers when it names none. */
export const HISTORY_DAYS_DEFAULT = 365;

/** The most days one history request may ask for. */
export const HISTORY_DAYS_MAX = 730;

/**
 * Extra days the settle fetches beyond the span it replays, so the window's anchor date
 * is always inside the series. It must fit INSIDE `HISTORY_DAYS_MAX` (lane audit
 * 2026-10-21, R5/L11): the settle asked for `span + 30`, up to 760 days, while the route
 * serves at most 730, so at the cap the margin was silently lost.
 */
export const HISTORY_SETTLE_MARGIN_DAYS = 30;

/** The longest single settle: the request (span + margin) then never exceeds the cap. */
export const HISTORY_SETTLE_DAYS_MAX = HISTORY_DAYS_MAX - HISTORY_SETTLE_MARGIN_DAYS;
