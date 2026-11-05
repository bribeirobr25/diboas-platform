/**
 * checks.mjs — compare a series with an independent source (pure).
 *
 * A check never changes a stored value. It answers, on the days both sources
 * have: do they agree within the tolerance stated for this pair in
 * catalogue.mjs, and are the two series aligned on the same calendar days?
 * Days beyond the tolerance are OUTLIERS. An outlier on a day this run would
 * add stops the update, unless that exact day is listed, with a reason a
 * person wrote, in `checks/accepted-exceptions.json` (see collect.mjs for how
 * an exception is bound to the outlier it resolves).
 */

/** A day range is usable only when it is a real range (some sources print flat or zero bars). */
const validRange = (r) => r != null && r.low > 0 && r.high > r.low;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Fewest common days before the alignment test means anything. */
export const ALIGNMENT_MIN_DAYS = 10;

/**
 * Two sources whose values are taken at DIFFERENT TIMES of the same day (a
 * noon rate against a 17:00 close) can differ honestly by the day's move.
 * For such a pair the catalogue sets `rangeSlack`: a day also passes when the
 * STORED (primary) value lies inside the CHECK source's traded range that day
 * (low..high, widened by the slack for venue spread). Only that direction is
 * used: the value being stored is the value being tested. A check source with
 * no range (a fix, a single print) is compared by tolerance alone.
 *
 * Alignment: a series shifted by a whole day can sit inside every tolerance
 * on quiet days. With at least ALIGNMENT_MIN_DAYS common days, the mean
 * difference on the same calendar day must be lower than with the check moved
 * one day either way; otherwise the pair is reported `misaligned`.
 *
 * @param {{date:string, close:number}[]} primary
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
  for (const r of primary) {
    const c = other.get(r.date);
    if (c == null) continue;
    common += 1;
    const d = Math.abs(c.close / r.close - 1);
    if (d > maxDiff) {
      maxDiff = d;
      maxAt = r.date;
    }
    if (d <= tolerance) continue;
    if (
      rangeSlack != null &&
      validRange(c) &&
      r.close >= c.low * (1 - rangeSlack) &&
      r.close <= c.high * (1 + rangeSlack)
    ) {
      passedByRange += 1;
      continue;
    }
    outliers.push({ date: r.date, primary: r.close, check: c.close, diff: round(d) });
  }
  const meanAt = (shift) => {
    let n = 0;
    let s = 0;
    for (const r of primary) {
      const c = other.get(addDays(r.date, shift));
      if (c == null) continue;
      n += 1;
      s += Math.abs(c.close / r.close - 1);
    }
    return n ? s / n : null;
  };
  let alignment = null;
  if (common >= ALIGNMENT_MIN_DAYS) {
    const same = meanAt(0);
    const before = meanAt(-1);
    const after = meanAt(1);
    const misaligned = [before, after].some((x) => x != null && x <= same);
    alignment = {
      same: round(same),
      shiftedBack: round(before),
      shiftedForward: round(after),
      misaligned,
    };
  }
  return {
    tolerance,
    ...(rangeSlack != null ? { rangeSlack, passedByRange } : {}),
    common,
    checkRows: check.length,
    primaryOnly: primary.filter((r) => !other.has(r.date)).length,
    maxDiff: round(maxDiff),
    maxAt,
    alignment,
    outliers,
  };
}

/** Dividend amounts agree when they differ by rounding only (Yahoo keeps 3 decimals). */
export const AMOUNT_ABS = 0.0006;
export const AMOUNT_REL = 0.001;
/** Two sources' ex-dates this close with the same amount are one distribution dated differently. */
export const EX_DATE_NEAR_DAYS = 4;
export const sameAmount = (a, b) =>
  Math.abs(a - b) <= Math.max(AMOUNT_ABS, AMOUNT_REL * Math.max(a, b));
const decimals = (x) => (String(x).split('.')[1] ?? '').replace(/0+$/, '').length;

/**
 * Merge the primary's distributions with every check source's, over one
 * window (the run's `from`..`to`: every source is cut to it, so a weekly run
 * compares the same weeks, not the primary's 45 days with a full history).
 *
 *   - sources agree on date and amount → stored; the more precise amount wins
 *   - amounts disagree                  → OUTLIER `amount_disagrees`
 *   - the same amount within EX_DATE_NEAR_DAYS on another date → OUTLIER
 *     `date_disagrees` (never two distributions: that double-counts it)
 *   - an ex-date that is not a trading day of the primary → OUTLIER
 *     `not_a_trading_day` (total return could not be computed on it)
 *   - only a check source has it        → stored, flagged `missing_in_primary`
 *     (Yahoo omitted TLT 2012-11-01, 2026-10-01, 2026-11-02 and QQQ 2020-09-21)
 *   - only the primary has it, inside a check's coverage → OUTLIER `missing_in_check`
 *   - only the primary has it, before every check's coverage → stored,
 *     flagged `single_source`
 *
 * @param {{date:string, amount:number}[]} primary
 * @param {{name:string, from?:string, events:{date:string, amount:number}[]}[]} checks
 * @param {{primaryName?: string, tradingDays?: Set<string>}} [opts]
 */
export function reconcileDistributions(
  primary,
  checks,
  { primaryName = 'yahoo', tradingDays } = {}
) {
  const all = [
    ...primary.map((e) => ({ ...e, name: primaryName })),
    ...checks.flatMap((c) => c.events.map((e) => ({ ...e, name: c.name }))),
  ];
  const dates = [...new Set(all.map((e) => e.date))].sort();
  const pmap = new Map(primary.map((e) => [e.date, e.amount]));
  const covers = (c, date) => {
    const first = c.from ?? c.events[0]?.date;
    return first != null && date >= first;
  };
  const merged = [];
  const outliers = [];
  const notes = [];
  for (const date of dates) {
    const seen = all.filter((e) => e.date === date).map(({ name, amount }) => ({ name, amount }));
    if (seen.some((s) => !sameAmount(s.amount, seen[0].amount))) {
      outliers.push({ date, kind: 'amount_disagrees', seen });
      continue;
    }
    const names = new Set(seen.map((s) => s.name));
    const near = all.filter(
      (e) =>
        e.date !== date &&
        !names.has(e.name) &&
        Math.abs(Date.parse(e.date) - Date.parse(date)) <= EX_DATE_NEAR_DAYS * 86_400_000 &&
        sameAmount(e.amount, seen[0].amount)
    );
    if (near.length) {
      outliers.push({
        date,
        kind: 'date_disagrees',
        seen,
        near: near.map(({ name, date: d, amount }) => ({ name, date: d, amount })),
      });
      continue;
    }
    if (tradingDays && !tradingDays.has(date)) {
      outliers.push({ date, kind: 'not_a_trading_day', seen });
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

const round = (x) => (x == null ? null : Math.round(x * 1e6) / 1e6);
