/**
 * checks.mjs — compare a series with an independent source (pure).
 *
 * A check never changes a stored value. It answers: on the days both sources
 * have, do they agree within the tolerance stated for this pair in
 * catalogue.mjs? Days beyond it are OUTLIERS. An outlier on a day this run
 * would add stops the update, unless that exact day is listed, with a reason
 * a person wrote, in `checks/accepted-exceptions.json`.
 */

/** A day range is usable only when it is a real range (some sources print flat or zero bars). */
const validRange = (r) => r && r.low > 0 && r.high > r.low;

/**
 * Two sources whose values are taken at DIFFERENT TIMES of the same day (a
 * noon rate against a 17:00 close; a 15:00 London fix against a New York
 * close) can differ honestly by the day's whole move. For such a pair the
 * catalogue sets `rangeSlack`: a day also passes when the single-time value
 * lies inside the other source's trading range that day (low..high, widened
 * by the slack for venue spread). Flat or zero bars never count as a range.
 * This is stricter than widening the tolerance: it asks whether the value
 * was actually traded that day, not whether it is "close enough".
 *
 * @param {{date:string, close:number, low?:number|null, high?:number|null}[]} primary
 * @param {{date:string, close:number, low?:number|null, high?:number|null}[]} check
 * @param {number} tolerance relative, e.g. 0.005
 * @param {{rangeSlack?: number}} [opts]
 */
export function compareCloses(primary, check, tolerance, { rangeSlack } = {}) {
  const other = new Map(check.map((r) => [r.date, r]));
  const outliers = [];
  let common = 0;
  let passedByRange = 0;
  let maxDiff = 0;
  let maxAt = null;
  const inside = (value, bar) =>
    validRange(bar) && value >= bar.low * (1 - rangeSlack) && value <= bar.high * (1 + rangeSlack);
  for (const r of primary) {
    const c = other.get(r.date);
    if (c == null) continue;
    const v = c.close;
    common += 1;
    const d = Math.abs(v / r.close - 1);
    if (d > maxDiff) {
      maxDiff = d;
      maxAt = r.date;
    }
    if (d <= tolerance) continue;
    if (rangeSlack != null && (inside(r.close, c) || inside(v, r))) {
      passedByRange += 1;
      continue;
    }
    outliers.push({ date: r.date, primary: r.close, check: v, diff: round(d) });
  }
  const primaryOnly = primary.filter((r) => !other.has(r.date)).length;
  return {
    tolerance,
    ...(rangeSlack != null ? { rangeSlack, passedByRange } : {}),
    common,
    primaryOnly,
    maxDiff: round(maxDiff),
    maxAt,
    outliers,
  };
}

/** Dividend amounts agree when they differ by rounding only (Yahoo keeps 3 decimals). */
export const AMOUNT_ABS = 0.0006;
export const AMOUNT_REL = 0.001;
const sameAmount = (a, b) => Math.abs(a - b) <= Math.max(AMOUNT_ABS, AMOUNT_REL * Math.max(a, b));
const decimals = (x) => (String(x).split('.')[1] ?? '').replace(/0+$/, '').length;

/**
 * Merge the primary's distributions with every check source's.
 *
 *   - both have it, amounts agree        → stored; the more precise amount wins
 *   - both have it, amounts disagree     → OUTLIER (blocks)
 *   - only a check source has it         → stored, flagged `missing_in_primary`
 *     (Yahoo omitted TLT 2026-10-01 and 2026-11-02, and QQQ 2020-09-21: the
 *     issuer and Nasdaq list them, and a total return without them is wrong)
 *   - only the primary has it, inside a check source's coverage → OUTLIER
 *   - only the primary has it, outside every check's coverage → stored,
 *     flagged `single_source`
 *
 * @param {{date:string, amount:number}[]} primary
 * @param {{name:string, from?:string, events:{date:string, amount:number}[]}[]} checks
 */
export function reconcileDistributions(primary, checks, { primaryName = 'yahoo' } = {}) {
  const dates = new Set([
    ...primary.map((e) => e.date),
    ...checks.flatMap((c) => c.events.map((e) => e.date)),
  ]);
  const pmap = new Map(primary.map((e) => [e.date, e.amount]));
  const covers = (c, date) => {
    const first = c.from ?? c.events[0]?.date;
    return first != null && date >= first;
  };
  const merged = [];
  const outliers = [];
  const notes = [];
  for (const date of [...dates].sort()) {
    const seen = [];
    if (pmap.has(date)) seen.push({ name: primaryName, amount: pmap.get(date) });
    for (const c of checks) {
      const e = c.events.find((x) => x.date === date);
      if (e) seen.push({ name: c.name, amount: e.amount });
    }
    const disagree = seen.some((s) => !sameAmount(s.amount, seen[0].amount));
    if (disagree) {
      outliers.push({ date, kind: 'amount_disagrees', seen });
      continue;
    }
    const best = [...seen].sort((a, b) => decimals(b.amount) - decimals(a.amount))[0];
    const sources = seen.map((s) => s.name);
    if (!pmap.has(date)) notes.push({ date, kind: 'missing_in_primary', sources });
    else if (seen.length === 1) {
      const covering = checks.filter((c) => covers(c, date)).map((c) => c.name);
      if (covering.length) {
        outliers.push({ date, kind: 'missing_in_check', seen, missing_in: covering });
        continue;
      }
      notes.push({ date, kind: 'single_source', sources });
    }
    merged.push({ date, amount: best.amount, sources });
  }
  return { merged, outliers, notes };
}

const round = (x) => Math.round(x * 1e6) / 1e6;
