// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { useDateFormat, useFormatters } from '../useFormatters';

/**
 * The money formatter is the seam every figure in the app passes through, so
 * the "zero is unsigned" rule lives here as well as in the domain fix that
 * removed the residue which first put "-$0.00" on the split preview.
 */
const inEnglish = ({ children }: { children: ReactNode }) => (
  <IntlProvider locale="en" onError={() => {}}>
    {children}
  </IntlProvider>
);
const usd = () => renderHook(() => useFormatters('USD'), { wrapper: inEnglish }).result.current;

describe('money never shows a sign on nothing', () => {
  it('should render a float residue below a cent as an unsigned zero', () => {
    expect(usd().money(-1.4210854715202004e-14)).toBe('$0.00');
    expect(usd().money('-0.00')).toBe('$0.00');
    expect(usd().money(-0)).toBe('$0.00');
  });

  it('should KEEP the sign on a real negative, because a loss must read as one', () => {
    // §4.8 made practice money able to fall; folding a real −0.01 would hide it.
    expect(usd().money(-0.01)).toBe('-$0.01');
    expect(usd().money('-12.50')).toBe('-$12.50');
  });

  it('should apply the same rule at whole-unit precision', () => {
    expect(usd().moneyWhole(-0.4)).toBe('$0');
    expect(usd().moneyWhole(-0.6)).toBe('-$1');
  });
});

/**
 * `5.729` — founder ruling 2026-10-31 (DR P8): a percentage is written with the % sign
 * right after the number in every locale. `intl.formatNumber(…, { style: 'percent' })`
 * gives "7 %" in de/es, so the seam must not.
 */
describe('percent puts no space before % in any locale (5.729)', () => {
  const inLocale = (locale: string) => {
    function InLocale({ children }: { children: ReactNode }) {
      return (
        <IntlProvider locale={locale} onError={() => {}}>
          {children}
        </IntlProvider>
      );
    }
    return InLocale;
  };
  it.each([
    ['en', '7%', '0.39%'],
    ['pt-BR', '7%', '0,39%'],
    ['es', '7%', '0,39%'],
    ['de', '7%', '0,39%'],
  ] as const)(
    'should write percentages with no space before the sign when the locale is %s (%s, %s)',
    (locale, whole, fee) => {
      const { percent } = renderHook(() => useFormatters('EUR'), { wrapper: inLocale(locale) })
        .result.current;
      expect(percent(0.07)).toBe(whole);
      expect(percent(0.0039, { minimumFractionDigits: 2 })).toBe(fee);
    }
  );
});

/**
 * `5.814` · the rate line states WHEN a rate was fetched, in the reader's locale,
 * on a surface (the strategy picker) that shows no money — so the date half of
 * the formatter is a currency-free hook, and both halves must agree.
 */
describe('useDateFormat — the same date on every surface (5.814)', () => {
  const inLocale = (locale: string) => {
    function InLocale({ children }: { children: ReactNode }) {
      return (
        <IntlProvider locale={locale} onError={() => {}}>
          {children}
        </IntlProvider>
      );
    }
    return InLocale;
  };
  const dateIn = (locale: string) =>
    renderHook(() => useDateFormat(), { wrapper: inLocale(locale) }).result.current;

  it.each([
    ['en', 'Nov 17, 2026'],
    ['pt-BR', '17 de nov. de 2026'],
    ['es', '17 nov 2026'],
    ['de', '17.11.2026'],
  ])('should state a date-only string as that calendar day in %s', (locale, want) => {
    expect(dateIn(locale)('2026-11-17')).toBe(want);
  });

  it('should parse a date-only string at LOCAL midnight, never the day before', () => {
    /* A date-only string parses as UTC midnight per the ES spec, which renders
       the previous day in any UTC-negative zone; the formatter must not. */
    expect(dateIn('en')('2026-07-18')).toBe('Jul 18, 2026');
  });

  it('should give the money formatter the very same date', () => {
    const iso = '2026-11-17T09:30:00.000Z';
    expect(usd().date(iso)).toBe(dateIn('en')(iso));
  });
});
