/**
 * Time axis for the /market history chart (5.176 fix (a), plan C-2). Pure
 * functions, kept out of the `'use client'` chart component.
 */

/** Minimum distance between two month labels, in viewBox units (a short month
 *  at the phone label size is ~45 units wide). */
export const MONTH_MIN_GAP = 64;
/** Average character advance of a month label at the phone size (24 units,
 *  ~0.55em), used to widen the gap for longer labels ("jul. de 27"). */
const PHONE_CHAR_UNITS = 13.2;

/**
 * The gap two month labels need: 1.5x the longest label's phone width (a
 * start-anchored label followed by a middle-anchored one needs w + w/2), never
 * less than MONTH_MIN_GAP.
 */
export function monthLabelGap(labels: Readonly<Record<string, string>>): number {
  const longest = Math.max(0, ...Object.values(labels).map((label) => label.length));
  return Math.max(MONTH_MIN_GAP, Math.ceil(longest * PHONE_CHAR_UNITS * 1.5));
}

/** Midnight UTC of a snapshot's day; NaN when the date cannot be read. */
export function snapshotDayTime(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
}

interface MonthTick {
  key: string;
  x: number;
  anchor: 'start' | 'middle' | 'end';
}

/**
 * Month ticks for a date-scaled axis: one at the first point (its month) and
 * one at the 1st of every later month up to the last point. Ticks closer than
 * `plot.minGap` (default MONTH_MIN_GAP) are thinned. The last month is always kept; the first is kept
 * unless it would collide with the last (then the later, more informative
 * label wins). A single point gets its own month. Unreadable dates give no
 * ticks (never an unbounded loop). `dates` must be in chronological order.
 */
export function historicalMonthTicks(
  dates: ReadonlyArray<string>,
  xAt: (time: number) => number,
  plot: { left: number; right: number; minGap?: number }
): MonthTick[] {
  const gap = plot.minGap ?? MONTH_MIN_GAP;
  if (dates.length === 0) return [];
  const first = dates[0]!.slice(0, 10);
  const start = snapshotDayTime(first);
  const end = snapshotDayTime(dates[dates.length - 1]!);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  if (dates.length === 1 || end === start) {
    return [{ key: first.slice(0, 7), x: xAt(start), anchor: 'middle' }];
  }
  const all: MonthTick[] = [{ key: first.slice(0, 7), x: xAt(start), anchor: 'start' }];
  let year = Number(first.slice(0, 4));
  let month = Number(first.slice(5, 7));
  for (let guard = 0; guard < 1200; guard++) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const time = Date.UTC(year, month - 1, 1);
    if (time > end) break;
    all.push({ key: `${year}-${String(month).padStart(2, '0')}`, x: xAt(time), anchor: 'middle' });
  }
  const kept: MonthTick[] = [all[0]!];
  for (let i = 1; i < all.length; i++) {
    const tick = all[i]!;
    if (tick.x - kept[kept.length - 1]!.x >= gap) kept.push(tick);
    else if (i === all.length - 1) kept[kept.length - 1] = tick;
  }
  for (const tick of kept) {
    if (tick.x < plot.left + gap / 2) tick.anchor = 'start';
    else if (tick.x > plot.right - gap / 2) tick.anchor = 'end';
  }
  return kept;
}

/**
 * The score axis for a scale of `max` points (C2-S, `5.915`): a tick every 3 points, then `max`
 * itself (14 gives 0, 3, 6, 9, 12, 14). No usable maximum (non-finite or not above 0) gives no
 * ticks, and the shell does not render the chart.
 */
export function scoreTicks(max: number): number[] {
  if (!Number.isFinite(max) || max <= 0) return [];
  const ticks: number[] = [];
  for (let t = 0; t < max; t += 3) ticks.push(t);
  ticks.push(max);
  return ticks;
}

/**
 * Two score labels closer than this, in drawing units, touch at the phone label size, so phones
 * hide the lower one (on the 14-point scale: 12 under 14 is 27.4 units apart, 3 points are 41.1).
 */
export const SCORE_LABEL_MIN_GAP = 30;

/**
 * The history chart's scale (5.915): the regime's `max_score`, else the methodology's, so the chart
 * still renders during a regime outage (the outage banner promises the archive stays available);
 * `null` when neither is a usable maximum, and the shell does not render the chart.
 */
export function historyChartMax(
  regimeMax: number | null | undefined,
  methodologyMax: number | null | undefined
): number | null {
  for (const max of [regimeMax, methodologyMax]) {
    if (typeof max === 'number' && Number.isFinite(max) && max > 0) return max;
  }
  return null;
}
