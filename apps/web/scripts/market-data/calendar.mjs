/**
 * calendar.mjs — when a store series' month is complete (plan MP-3a, register `5.850`).
 *
 * An exchange series trades on weekdays, so its month is complete once its last weekday is
 * stored. Bitcoin trades every day, so its month is complete only once the month's last
 * CALENDAR day is stored: with the weekday rule, a month ending on a weekend would publish
 * Friday's close as the month-end. One helper for the publisher and the score's reader.
 */

/** A series' trading calendar: the catalogue's `calendar`, weekdays when absent. */
export function calendarOf(series) {
  return series?.calendar ?? 'weekdays';
}

/** The last day of `ym` (YYYY-MM) a series with `calendar` trades on (YYYY-MM-DD). */
export function lastTradingDay(ym, calendar = 'weekdays') {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  if (calendar === 'weekdays')
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  else if (calendar !== 'daily') throw new Error(`unknown calendar ${calendar}`);
  return d.toISOString().slice(0, 10);
}

/**
 * Is a derived month complete? Its last stored day is the month's last trading day, or the
 * store already holds a later day.
 */
export function isMonthComplete(row, lastStoredDay, calendar = 'weekdays') {
  return row.last_day >= lastTradingDay(row.ym, calendar) || lastStoredDay.slice(0, 7) > row.ym;
}
