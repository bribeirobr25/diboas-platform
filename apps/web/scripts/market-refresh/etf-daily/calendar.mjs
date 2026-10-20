/**
 * calendar.mjs — which days are US exchange trading sessions (E1, 2026-10-20).
 *
 * The daily-flow route needs to know which sessions a week SHOULD contain, so
 * that a missing day is a missing day: a week is complete only when every
 * expected session is present for every required fund. "Friday present and at
 * least four dates" was the pilot's heuristic and is replaced by this.
 *
 * SOURCE. NYSE's published holiday list (full-day closures), copied with the
 * date it was read. The US spot-Bitcoin ETFs list on NYSE Arca, Nasdaq and
 * Cboe, which follow the same full-day closures. Early closes (1 p.m.) are
 * still sessions and are not listed.
 *
 * COVERAGE IS EXPLICIT AND FAILS CLOSED. A day outside `coverage` throws
 * `CalendarCoverageError` instead of guessing. An unscheduled closure (for
 * example a national day of mourning) is not in any published list: until it
 * is added here, that day is expected and missing, so the week is ineligible,
 * which is the safe direction. Extending the list is a reviewed change.
 *
 * The "is the list about to run out" check belongs ONLY to the collection
 * workflow (E2), never to a required test: a test that compares this list with
 * today's date is a dated landmine (the 2026-11-11 TVL failure is that class).
 */

import { ISO_DAY_PATTERN } from './formats.mjs';

export const NYSE_CALENDAR = Object.freeze({
  source: 'https://www.nyse.com/markets/hours-calendars',
  readOn: '2026-10-20',
  coverage: Object.freeze({ from: '2026-01-01', to: '2028-12-31' }),
  closures: Object.freeze([
    // 2026
    '2026-01-01', // New Year's Day
    '2026-01-19', // Martin Luther King, Jr. Day
    '2026-02-16', // Washington's Birthday
    '2026-04-03', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-06-19', // Juneteenth
    '2026-07-03', // Independence Day (observed)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving Day
    '2026-12-25', // Christmas Day
    // 2027
    '2027-01-01',
    '2027-01-18',
    '2027-02-15',
    '2027-03-26', // Good Friday
    '2027-05-31',
    '2027-06-18', // Juneteenth (observed)
    '2027-07-05', // Independence Day (observed)
    '2027-09-06',
    '2027-11-25',
    '2027-12-24', // Christmas Day (observed)
    // 2028 (no New Year's Day closure: January 1 falls on a Saturday)
    '2028-01-17',
    '2028-02-21',
    '2028-04-14', // Good Friday
    '2028-05-29',
    '2028-06-19',
    '2028-07-04',
    '2028-09-04',
    '2028-11-23',
    '2028-12-25',
  ]),
});

const CLOSED = new Set(NYSE_CALENDAR.closures);
const DAY_MS = 86_400_000;

export class CalendarCoverageError extends Error {
  constructor(day) {
    super(
      `exchange calendar does not cover ${day} (covered ${NYSE_CALENDAR.coverage.from} to ` +
        `${NYSE_CALENDAR.coverage.to}); extend NYSE_CALENDAR before using this day`
    );
    this.day = day;
  }
}

/** Parse a YYYY-MM-DD calendar day to its UTC midnight (ms), rejecting anything else. */
export function dayMs(day) {
  if (typeof day !== 'string' || !ISO_DAY_PATTERN.test(day))
    throw new Error(`not a YYYY-MM-DD day: ${day}`);
  const t = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== day) {
    throw new Error(`not a real calendar day: ${day}`);
  }
  return t;
}

/** Whether `day` is a real calendar day (`2026-02-30` is not); never throws. */
export function isRealDay(day) {
  try {
    dayMs(day);
    return true;
  } catch {
    return false;
  }
}

export const addDays = (day, n) => new Date(dayMs(day) + n * DAY_MS).toISOString().slice(0, 10);

/** Whether the calendar covers `day` (no throw). */
export const isCovered = (day) =>
  day >= NYSE_CALENDAR.coverage.from && day <= NYSE_CALENDAR.coverage.to;

/** True when `day` is a trading session. Throws outside the covered years. */
export function isSession(day) {
  const t = dayMs(day);
  if (!isCovered(day)) throw new CalendarCoverageError(day);
  const weekday = new Date(t).getUTCDay();
  return weekday >= 1 && weekday <= 5 && !CLOSED.has(day);
}

/** The sessions of the Monday–Friday week ending on `friday` (may be fewer than five). */
export function sessionsInWeek(friday) {
  if (new Date(dayMs(friday)).getUTCDay() !== 5) throw new Error(`not a Friday: ${friday}`);
  return [-4, -3, -2, -1, 0].map((n) => addDays(friday, n)).filter(isSession);
}

/**
 * The latest Friday whose calendar day is strictly before the UTC day of
 * `instant`. For the Monday cutoff this is the Friday just gone. It is a
 * calendar reference even when that Friday is a holiday.
 */
export function latestFridayBefore(instant) {
  const today = new Date(instant).toISOString().slice(0, 10);
  let day = addDays(today, -1);
  while (new Date(dayMs(day)).getUTCDay() !== 5) day = addDays(day, -1);
  return day;
}
