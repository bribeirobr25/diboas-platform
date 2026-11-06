/**
 * PR 2 · the months LEFT in a goal's own frame (P3 §2): calendar months in local time, counted
 * from the month the goal was created (`GoalCreated.recordedAt`), as `horizonMonths` was chosen.
 * Clamped to [0, horizon]; a clock before the creation month gives the full horizon. An
 * unparseable stamp (or a non-finite horizon) gives null — the caller then drops the lines that need it, never the block.
 *
 * Lives in `lib/` because it reads dates; the selector (`view/projection.ts`) receives the
 * number (VIEW-1: a selector reads no clock).
 */
export function goalMonthsLeft(
  horizonMonths: number,
  createdAt: string | null | undefined,
  now: Date
): number | null {
  if (!createdAt || !Number.isFinite(horizonMonths)) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime()) || Number.isNaN(now.getTime())) return null;
  const index = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const left = horizonMonths - (index(now) - index(created));
  return Math.min(Math.max(left, 0), horizonMonths);
}
