/**
 * derive.mjs — weekly and monthly series computed from the stored daily rows
 * (pure). Derived files are rebuilt in full on every run from `daily/` and
 * `events/`, so they can never disagree with what is stored.
 *
 * WEEKLY = the strict-Friday convention the score uses (regime-engine.mjs,
 * LOCKED): the Friday's close, or the last trading day of that week before it
 * when the Friday was a holiday. A week is emitted only once its Friday is
 * over (`today` is the run's UTC date).
 *
 * MONTHLY = calendar-month OHLC. For a fund, also the TOTAL-RETURN index:
 * every distribution reinvested at the close before its ex-date,
 *   index_d = index_{d-1} × (close_d + distribution_d) / close_{d-1},
 * anchored at the series' first stored close, so a stored month never changes
 * when a later dividend is paid (the defect behind register 5.633).
 */

import { weekday } from './parsers.mjs';

const num = (v) => (v === '' || v == null ? null : Number(v));

/** Friday (ISO date) of the Mon–Sun week containing `date`. */
export function fridayOf(date) {
  const d = new Date(`${date}T12:00:00Z`);
  const wd = d.getUTCDay(); // 0 = Sun
  const delta = wd === 0 ? -2 : 5 - wd; // Sunday belongs to the week before
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** @param {{date:string, close:number|string}[]} daily  @param {string} today ISO */
export function weeklyCloses(daily, today) {
  const byWeek = new Map();
  for (const r of daily) {
    const wd = weekday(r.date);
    if (wd === 0 || wd === 6) continue; // a weekend row never stands in for a Friday close
    const fri = fridayOf(r.date);
    if (fri >= today) continue; // the week's Friday is not over yet
    byWeek.set(fri, { week_ending: fri, date: r.date, close: num(r.close) });
  }
  return [...byWeek.values()].sort((a, b) => a.week_ending.localeCompare(b.week_ending));
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
    if (i > 0) index *= (r.close + (dist.get(r.date) ?? 0)) / rows[i - 1].close;
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
        distributions: dist.get(r.date) ?? 0,
        last_day: r.date,
      });
    } else {
      m.high = Math.max(m.high, hi);
      m.low = Math.min(m.low, lo);
      m.close = r.close;
      m.tr_close = index;
      m.distributions += dist.get(r.date) ?? 0;
      m.last_day = r.date;
    }
  });
  const currentYm = today.slice(0, 7);
  return [...months.values()].filter((m) => m.ym < currentYm);
}
