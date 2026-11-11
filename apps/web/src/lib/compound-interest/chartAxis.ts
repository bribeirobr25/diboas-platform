/**
 * Axis ticks for CompoundChart (retirement, compound interest, goal savings,
 * Learn talk 1). Pure functions, kept out of the `'use client'` component so
 * they can be tested and imported anywhere.
 */

/**
 * Year ticks at an even step (1, 2, 5, 10 or 20 years — the smallest giving at
 * most six intervals), always ending on the horizon. A step tick closer to the
 * horizon than half a step is dropped so the two labels cannot collide.
 * (A fixed list [0,5,10,20,30,40] skipped 15 and 25: a 25-year chart read
 * 0 · 5 · 10 · 20 · 25 — visual pass 2026-11-11.)
 */
export function compoundXTicks(years: number): number[] {
  if (years <= 0) return [0];
  const step = [1, 2, 5, 10, 20].find((s) => years / s <= 6) ?? Math.ceil(years / 6);
  const ticks: number[] = [];
  for (let y = 0; y < years; y += step) ticks.push(y);
  if (ticks.length > 1 && years - ticks[ticks.length - 1]! < step / 2) ticks.pop();
  ticks.push(years);
  return ticks;
}

/**
 * Value ticks on round numbers: the step is 1, 2 or 5 times a power of ten,
 * the smallest that covers `maxValue` in at most four steps, and the axis top
 * is the first step at or above `maxValue`.
 *
 * Why round steps: the labels are written in compact form ("$1.5K", "$2M",
 * "1,4 Mio. €"). Ticks at maxValue/4 are never round, and compact rounding then
 * printed wrong values and the same label on two grid lines ("$2K | $2K" for a
 * 2,400 maximum — PR #897 review). With a 1-2-5 step every tick is a multiple
 * of the step, so one fraction digit always states it exactly.
 */
export function compoundYTicks(maxValue: number): { ticks: number[]; top: number } {
  if (!(maxValue > 0) || !Number.isFinite(maxValue)) return { ticks: [0, 1], top: 1 };
  const raw = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10] as const).map((m) => m * magnitude).find((s) => s >= raw)!;
  const count = Math.ceil(maxValue / step - 1e-9);
  const ticks = Array.from({ length: count + 1 }, (_, i) => i * step);
  return { ticks, top: count * step };
}
