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
