import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES } from '../config';
import { getMessages } from '../loadMessages';

/**
 * ⚙ `CUR-2` · A CURRENCY AMOUNT IN COPY IS STILL A CURRENCY AMOUNT WITHOUT A SIGIL.
 *
 * `5.371` blind spot (2), and it was **still live when measured 2026-09-25**:
 * planting `"This costs 500.00 and illustrates simulated settlement in Practice."`
 * into all four locales left the entire 1,119-test sandbox suite **green**.
 *
 * `CUR-1` (`localeIntegrity.test.ts`) filters on currency SYMBOL classes, and a
 * sibling ratchet covers currency WORDS behind an allowlist — so a bare numeric
 * amount in prose passes both. That matters because the ledger currency is fixed
 * at grant while copy is per-locale: a hardcoded amount in a string follows the
 * LANGUAGE, not the money, which is the recurrence `5.160` already records at
 * four sites.
 *
 * ⚑ THE FILTER IS PART OF THE THREAT MODEL (system gate X6), so this guard is
 * built the way X6 demands — by planting the EXCLUDED class and watching it fail,
 * never by reasoning about it.
 *
 * ⚑ MEASURED BEFORE IT WAS WRITTEN, because a guard that fires wrongly is one
 * people learn to ignore. A naive two-decimal rule flags **12 existing strings**
 * (3 per locale) — every one of them the reference fee `0.39%` / `0,39 %`.
 * Excluding a trailing percent sign leaves **ZERO** false positives across all
 * four locales while still catching `500.00` AND the comma convention `500,00`.
 *
 * ⚑ STATED SCOPE, so a green run is not over-read (added 2026-09-25 under the
 * `CI-N4` scope-limit discipline). It catches a TWO-DECIMAL amount in any of the
 * four locales, with or without a currency sigil — `$500.00` is flagged too,
 * deliberately, because a hardcoded amount in copy follows the LANGUAGE rather
 * than the money. It does **not** catch a bare INTEGER (`It costs 500 today`):
 * two decimals are what separate a money amount from a count, and flagging
 * every integer would fire on page numbers, day counts and percentages. A green
 * run means "no two-decimal amount", not "no hardcoded money".
 */

/**
 * `1.234,56` / `1,234.56` / `1000.00` / `500,00` — but never `0.39%`.
 *
 * ⛑ WIDENED (P0 review, PB-3). The integer part was `\d{1,3}` plus thousands
 * groups, and the look-behind refuses a leading digit — so an UNGROUPED
 * integer of 4+ digits (`1000.00`, `1234.56`, `12345.67`) could never match.
 * The integer part is now either grouped or plain `\d+`. Re-measured: still
 * ZERO false positives across the four catalogues.
 */
const BARE_AMOUNT = /(?<![\d.,])(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{2}(?![\d])(?!\s?%)/;

function leafStrings(o: unknown, path = ''): Array<[string, string]> {
  if (typeof o === 'string') return [[path, o]];
  if (o && typeof o === 'object') {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
      leafStrings(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

describe('CUR-2 · no bare currency amount is hardcoded in copy', () => {
  it('should DETECT a planted bare amount, in both decimal conventions', () => {
    /* The self-test first: a scan that reports zero because it is broken looks
       exactly like a clean catalogue. */
    expect(BARE_AMOUNT.test('This costs 500.00 and illustrates settlement.')).toBe(true);
    expect(BARE_AMOUNT.test('Das kostet 500,00 und zeigt die Abwicklung.')).toBe(true);
    expect(BARE_AMOUNT.test('Total 1,234.56 today')).toBe(true);
    /* The ungrouped 4+-digit class the first pattern could not see (PB-3). */
    for (const planted of ['It costs 1000.00 today.', 'Saldo 1234,56.', 'Total 12345.67']) {
      expect(BARE_AMOUNT.test(planted), planted).toBe(true);
    }
  });

  it('should NOT flag the reference fee percentage — the measured false-positive class', () => {
    /* The other direction. 12 existing strings carry `0.39%` / `0,39 %`; a rule
       that flagged them would be abandoned within a week. */
    expect(BARE_AMOUNT.test('the diBoaS exit fee is 0.39% or {min} per position')).toBe(false);
    expect(BARE_AMOUNT.test('Ausstiegsgebühr (Referenz): 0,39 % oder {min}')).toBe(false);
    expect(BARE_AMOUNT.test('30% growth exposure')).toBe(false);
  });

  it.each(SANDBOX_LOCALES)('should carry no bare currency amount in any %s string', (locale) => {
    const all = leafStrings(getMessages(locale));
    /* Non-vacuity: the catalogue must actually have been loaded. */
    expect(all.length).toBeGreaterThan(100);
    const offenders = all
      .filter(([, v]) => BARE_AMOUNT.test(v))
      .map(([k, v]) => `${k} = ${v.slice(0, 60)}`);
    expect(offenders).toEqual([]);
  });
});
