// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FIXTURE_STAMP,
  getStrategy,
  observedStamp,
  type ProtocolApy,
  type ProtocolApyHistory,
} from '@diboas/defi';
import { SANDBOX_LOCALES, type SandboxLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { StrategyDetail } from '../StrategyDetail';
import { StrategyPicker } from '../StrategyPicker';

/**
 * `5.814` · RATE-AGE-1 guard 2 · THE RATE LINE AS THE READER SEES IT, FOUR LOCALES.
 *
 * DATA_VINTAGE_POLICY P-7: "a DELAYED or STALE rate must be shown as such, never
 * as current"; handoff 2026-09-12 §8.6. Rendered through the REAL catalogues with
 * every react-intl error collected and asserted absent — a missing message or a
 * missing `{date}` value must fail here, never fall back silently. Each line is
 * asserted WHOLE, with its formatted date and number, on the picker and in both
 * views of the detail, so a line chosen by origin again, or a dated line without
 * its date, cannot pass.
 */

const NOW = '2026-11-17T12:00:00.000Z';
const HOUR = 3_600_000;
const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString();
const SAFE = getStrategy('safeHarbor')!;

const apysAged = (ms: number): ProtocolApy[] =>
  SAFE.allocation.map((leg, i) => ({
    protocolId: leg.protocolId,
    apyPercent: [4, 4.5, 4.75][i] ?? 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: observedStamp('defillama', ago(ms)),
  }));
/* 4×0.5 + 4.5×0.3 + 4.75×0.2 = 4.3 */
const APY = 4.3;
const histories: ProtocolApyHistory[] = SAFE.allocation.map((leg) => ({
  protocolId: leg.protocolId,
  points: [],
  stamp: observedStamp('defillama', ago(HOUR)),
}));

/** The approved lines (plan P10 §6), filled the way the reader sees them. */
const EXPECTED: Record<
  SandboxLocale,
  { recent: (d: string, n: string) => string; stale: (d: string, n: string) => string }
> = {
  en: {
    recent: (d, n) => `Pool rate, fetched ${d}: ${n}%/yr (real, variable)`,
    stale: (d, n) =>
      `Pool rate, fetched ${d}, over a week ago: ${n}%/yr (real, variable; may have changed)`,
  },
  'pt-BR': {
    recent: (d, n) => `Taxa do pool, buscada em ${d}: ${n}%/ano (real, variável)`,
    stale: (d, n) =>
      `Taxa do pool, buscada em ${d}, há mais de uma semana: ${n}%/ano (real, variável; pode ter mudado)`,
  },
  es: {
    recent: (d, n) => `Tasa del pool, obtenida el ${d}: ${n}%/año (real, variable)`,
    stale: (d, n) =>
      `Tasa del pool, obtenida el ${d}, hace más de una semana: ${n}%/año (real, variable; puede haber cambiado)`,
  },
  de: {
    recent: (d, n) => `Pool-Rate, abgerufen am ${d}: ${n}%/Jahr (echt, variabel)`,
    stale: (d, n) =>
      `Pool-Rate, abgerufen am ${d}, vor über einer Woche: ${n}%/Jahr (echt, variabel; kann sich geändert haben)`,
  },
};
const formatDate = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
const formatApy = (locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(APY);

const CASES = SANDBOX_LOCALES.flatMap((locale) => [
  [locale, 'RECENT', HOUR] as const,
  [locale, 'STALE', 13 * 24 * HOUR] as const,
]);

afterEach(cleanup);

function intlErrorsCollector() {
  const errors: string[] = [];
  return { errors, onError: (e: { message: string }) => errors.push(e.message) };
}

describe('5.814 · RATE-AGE-1 · the rate line renders whole, in every locale', () => {
  it.each(CASES)('should render the %s %s line on the picker', (locale, kind, ageMs) => {
    const { errors, onError } = intlErrorsCollector();
    const messages = getMessages(locale);
    render(
      <IntlProvider locale={locale} messages={messages} onError={onError}>
        <StrategyPicker
          horizonMonths={36}
          apys={apysAged(ageMs)}
          selectedId={null}
          onSelect={() => {}}
          now={NOW}
        />
      </IntlProvider>
    );
    const name = messages['catalog.strategies.safeHarbor.name']!;
    const row = screen.getByText(name).closest('li')!;
    const line = within(row).getByTestId('rate-line').textContent;
    const want = EXPECTED[locale][kind === 'RECENT' ? 'recent' : 'stale'];
    expect(line).toBe(want(formatDate(locale, ago(ageMs)), formatApy(locale)));
    expect(line).not.toMatch(/[{}]|goalNew\./);
    expect(errors).toEqual([]);
  });

  it.each(CASES)(
    'should render the %s %s line in both views of the detail',
    (locale, kind, ageMs) => {
      const { errors, onError } = intlErrorsCollector();
      const messages = getMessages(locale);
      render(
        <IntlProvider locale={locale} messages={messages} onError={onError}>
          <StrategyDetail
            strategy={SAFE}
            goalName="Trip"
            apys={apysAged(ageMs)}
            histories={histories}
            gas={[{ chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP }]}
            usdPriceLocal={1}
            currency="USD"
            now={NOW}
          />
        </IntlProvider>
      );
      const want = EXPECTED[locale][kind === 'RECENT' ? 'recent' : 'stale'](
        formatDate(locale, ago(ageMs)),
        formatApy(locale)
      );
      /* Simple view. */
      expect(screen.getByTestId('rate-line').textContent).toBe(want);
      /* Detailed view: the neutral title over the same line (5.226, D5). */
      fireEvent.click(screen.getByText(messages['strategyDetail.detailed']!));
      expect(screen.getByTestId('rate-title').textContent).toBe(
        messages['strategyDetail.poolRate']
      );
      expect(screen.getByTestId('rate-line').textContent).toBe(want);
      /* The stamp states the same date: one rate, one date on one screen. */
      expect(screen.getByTestId('provenance-stamp-partly-live').textContent).toContain(
        formatDate(locale, ago(ageMs))
      );
      expect(errors).toEqual([]);
    }
  );
});
