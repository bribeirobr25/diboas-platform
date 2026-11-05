/**
 * derive.mjs — weekly and monthly series computed from the stored daily rows
 * (pure). Derived files are rebuilt in full on every run from `daily/` and
 * `events/`, so they can never disagree with what is stored.
 *
 * WEEKLY = the score's strict-Friday convention, by calling the engine's own
 * `strictFridayCloses` (regime-engine.mjs, LOCKED, guarded by FRIDAY-1): there
 * is one implementation of the rule, never a second one to drift.
 *
 * MONTHLY = calendar-month OHLC. For a fund, also the TOTAL-RETURN index:
 * every distribution reinvested at the close before its ex-date,
 *   index_d = index_{d-1} × (close_d + distribution_d) / close_{d-1},
 * anchored at the series' first stored close, so a stored month never changes
 * when a later dividend is paid (the defect behind register 5.633). A month is
 * emitted only when complete: never the current month, and never a first month
 * the series entered after its first week (Yahoo's BTC history started on
 * 2014-09-17, which made a "September 2014" out of two weeks).
 */

import { strictFridayCloses } from '../market-refresh/lib/regime-engine.mjs';

const num = (v) => (v === '' || v == null ? null : Number(v));

/** Last calendar day of a month's first week: a series starting after it has a partial first month. */
export const FIRST_MONTH_LATEST_START_DAY = 7;

/** @param {{date:string, close:number|string}[]} daily  @param {string} today ISO (the run's UTC date) */
export function weeklyCloses(daily, today) {
  const pairs = daily.map((r) => [new Date(`${r.date}T00:00:00Z`), num(r.close)]);
  return strictFridayCloses(pairs, new Date(`${today}T00:00:00Z`)).map(([d, close]) => ({
    week_ending: d.toISOString().slice(0, 10),
    close,
  }));
}

/**
 * @param {{date:string, open?:any, high?:any, low?:any, close:any}[]} daily
 * @param {{date:string, amount:any}[]} [distributions]
 * @param {string} today ISO — the current month is emitted only when complete
 */
export function monthlyBars(daily, distributions = [], today) {
  const dist = new Map(distributions.map((e) => [e.date, Number(e.amount)]));
  const rows = daily.map((r) => ({
    date: r.date,
    open: num(r.open),
    high: num(r.high),
    low: num(r.low),
    close: num(r.close),
  }));
  const missing = [...dist.keys()].filter((d) => !rows.some((r) => r.date === d));
  if (
    missing.length &&
    rows.length &&
    missing.some((d) => d >= rows[0].date && d <= rows.at(-1).date)
  )
    throw new Error(`DERIVE: distribution ex-date(s) with no trading day: ${missing.join(', ')}`);

  let index = rows[0]?.close ?? null;
  const months = new Map();
  rows.forEach((r, i) => {
    // A distribution counts from the second stored day: on the first one the
    // index starts at that day's (ex-distribution) close, so it is not owed.
    const paid = i > 0 ? (dist.get(r.date) ?? 0) : 0;
    if (i > 0) index *= (r.close + paid) / rows[i - 1].close;
    const ym = r.date.slice(0, 7);
    const m = months.get(ym);
    const hi = r.high ?? r.close;
    const lo = r.low ?? r.close;
    if (!m) {
      months.set(ym, {
        ym,
        open: r.open ?? r.close,
        high: hi,
        low: lo,
        close: r.close,
        tr_close: index,
        distributions: paid,
        last_day: r.date,
      });
    } else {
      m.high = Math.max(m.high, hi);
      m.low = Math.min(m.low, lo);
      m.close = r.close;
      m.tr_close = index;
      m.distributions += paid;
      m.last_day = r.date;
    }
  });
  const currentYm = today.slice(0, 7);
  const firstDay = rows[0]?.date;
  const partialFirst =
    firstDay != null && Number(firstDay.slice(8, 10)) > FIRST_MONTH_LATEST_START_DAY
      ? firstDay.slice(0, 7)
      : null;
  return [...months.values()].filter((m) => m.ym < currentYm && m.ym !== partialFirst);
}
