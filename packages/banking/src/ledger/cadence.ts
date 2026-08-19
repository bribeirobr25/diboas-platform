/**
 * Pure calendar/cadence math for the ledger clocks: real-time settle (WS-F),
 * the recurring 30-day cadence (C3), and the WG-1 weekly-credit meter.
 * Extracted from `engine.ts` in the P2BD-4 pass — semantics unchanged.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole real days to settle to "now" (WS-F): real days elapsed since genesis,
 * minus those already settled via `source:'real'` events. Pure — `nowIso` is
 * passed in. Returns 0 when there is no genesis, less than a full day has
 * passed, or the clock moved backward (D-2 daily granularity; idempotent).
 */
export function realDaysToSettle(
  genesisRecordedAt: string | null,
  realSettledDays: number,
  nowIso: string
): number {
  if (!genesisRecordedAt) return 0;
  const t0 = Date.parse(genesisRecordedAt);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(t0) || !Number.isFinite(now)) return 0;
  const realElapsed = Math.floor((now - t0) / MS_PER_DAY);
  return Math.max(0, realElapsed - realSettledDays);
}

/** Weekly-credit cadence (WG-1): one practice credit per real calendar week. */
export const WEEKLY_CADENCE_DAYS = 7;

/**
 * The genesis-anchored week indices collectible NOW (WG-1 + the collection
 * cap). Pure — the caller passes `nowIso` and the cap (`maxUncollected`, the
 * app derives it from `COLLECTION_CAP_DAYS / 7`; config-single-source stays in
 * the app layer).
 *
 * Accrual model ("pause, never loss/expiry", W-5b-am): weeks complete at
 * genesis + 7n REAL days regardless of login. At each completed boundary the
 * credit accrues ("banks") ONLY if fewer than `maxUncollected` banked weeks
 * were still uncollected at that moment — otherwise the meter is full and that
 * calendar week never accrues (paused, not banked for later). Banked weeks
 * never expire; collecting empties the meter and accrual resumes at the next
 * boundary. Deterministic given the collect history, so replay + this function
 * always agree.
 *
 * @param collectedAt `recordedAt` of every prior `WeeklyCreditGranted`, in
 *   event order (one entry per collected week — the meter's drain history).
 */
export function collectibleWeeks(
  genesisRecordedAt: string | null,
  collectedAt: string[],
  nowIso: string,
  maxUncollected: number
): number[] {
  if (!genesisRecordedAt || maxUncollected < 1) return [];
  const t0 = Date.parse(genesisRecordedAt);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(t0) || !Number.isFinite(now)) return [];
  const collectTimes = collectedAt
    .map((iso) => Date.parse(iso))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  const banked: number[] = [];
  for (let n = 1; t0 + n * WEEKLY_CADENCE_DAYS * MS_PER_DAY <= now; n += 1) {
    const boundary = t0 + n * WEEKLY_CADENCE_DAYS * MS_PER_DAY;
    const collectedByBoundary = collectTimes.filter((t) => t <= boundary).length;
    if (banked.length - collectedByBoundary < maxUncollected) banked.push(n);
  }
  // Each collect drains the oldest banked week, so the uncollected tail starts
  // after the first `collectTimes.length` entries (≤ maxUncollected long by
  // construction — the meter never banks past the cap).
  return banked.slice(collectTimes.length);
}

/** Recurring cadence (C3, decision D-1): a deposit every 30 simulated days. */
export const RECURRING_CADENCE_DAYS = 30;

/**
 * The monthly deposit sim-days due in the half-open range `(fromDay, toDay]`
 * for a schedule anchored at `startSimDay` (first deposit at
 * `startSimDay + 30`). Pure. Because `fromDay` is the position's
 * `accruedThroughSimDay` (which advances every settle), each due-day fires
 * exactly once across successive advances — idempotent even when a single month
 * is split across two advances (A-8). Ascending.
 */
export function recurringDepositDays(
  startSimDay: number,
  fromDay: number,
  toDay: number
): number[] {
  const days: number[] = [];
  if (toDay <= fromDay) return days;
  // First cadence day strictly after fromDay.
  const elapsed = fromDay - startSimDay;
  let k = Math.floor(elapsed / RECURRING_CADENCE_DAYS) + 1;
  if (k < 1) k = 1;
  for (
    let day = startSimDay + k * RECURRING_CADENCE_DAYS;
    day <= toDay;
    day += RECURRING_CADENCE_DAYS
  ) {
    if (day > fromDay) days.push(day);
  }
  return days;
}
