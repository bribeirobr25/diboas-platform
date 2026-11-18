// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { useDateFormat, useFormatters } from '../useFormatters';

/*
 * ⚑ Pinned to a UTC-NEGATIVE zone, as `goalMonths.test.ts` does: in UTC (CI) and
 * in CET a date-only string parsed at UTC midnight still names the right day, so
 * the local-midnight rule could be deleted and these cases would pass there.
 * Node reads TZ at each date operation.
 */
process.env.TZ = 'America/Sao_Paulo';

/**
 * `5.814` · the rate line states WHEN a rate was fetched, in the reader's locale,
 * on a surface (the strategy picker) that shows no money — so the date half of
 * the formatter is a currency-free hook, and both halves must agree.
 */
function wrapperFor(locale: string) {
  function InLocale({ children }: { children: ReactNode }) {
    return (
      <IntlProvider locale={locale} onError={() => {}}>
        {children}
      </IntlProvider>
    );
  }
  return InLocale;
}
const dateIn = (locale: string) =>
  renderHook(() => useDateFormat(), { wrapper: wrapperFor(locale) }).result.current;

describe('useDateFormat — the same calendar day on every surface (5.814)', () => {
  it.each([
    ['en', 'Nov 17, 2026'],
    ['pt-BR', '17 de nov. de 2026'],
    ['es', '17 nov 2026'],
    ['de', '17.11.2026'],
  ])('should state a date-only string as that calendar day in %s', (locale, want) => {
    expect(dateIn(locale)('2026-11-17')).toBe(want);
  });

  it('should parse a date-only string at LOCAL midnight, never the day before', () => {
    /* At UTC midnight this zone is still the previous evening. */
    expect(dateIn('en')('2026-07-18')).toBe('Jul 18, 2026');
  });

  it('should give the money formatter the very same date', () => {
    const money = renderHook(() => useFormatters('USD'), { wrapper: wrapperFor('en') }).result
      .current;
    for (const iso of ['2026-11-17', '2026-11-17T09:30:00.000Z']) {
      expect(money.date(iso)).toBe(dateIn('en')(iso));
    }
  });
});
