// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FIXTURE_STAMP,
  getStrategy,
  observedStamp,
  type DataStamp,
  type ProtocolApy,
  type ProtocolApyHistory,
} from '@diboas/defi';
import { SANDBOX_LOCALES, type SandboxLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { currencyClaimIn } from '@/test/rateCurrency';
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
 * views of the detail, for every kind a render can reach (CURRENT needs a policy
 * no source has; `strategy.test.ts` covers it). The whole page is also read by
 * the RATE-AGE-1 detector, so a second rate line outside the test id is caught.
 */

/*
 * ⚑ Pinned to a UTC-NEGATIVE zone, with stamps an hour after UTC midnight: here
 * the fetch date is the PREVIOUS calendar day, so a rate line formatted in UTC
 * instead of the reader's zone fails. In UTC (CI) and CET the two agree.
 */
process.env.TZ = 'America/Sao_Paulo';

const NOW = '2026-11-17T02:00:00.000Z';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString();
const SAFE = getStrategy('safeHarbor')!;
const RATES = [4, 4.5, 4.75];
/* 4×0.5 + 4.5×0.3 + 4.75×0.2 = 4.3 */
const APY = 4.3;

type Leg = { live: boolean; ageMs: number };
const stampOf = ({ live, ageMs }: Leg): DataStamp =>
  live
    ? observedStamp('defillama', ago(ageMs))
    : { ...FIXTURE_STAMP, asOf: ago(ageMs), observedAt: ago(ageMs) };
const apysFor = (legs: Leg[]): ProtocolApy[] =>
  SAFE.allocation.map((leg, i) => ({
    protocolId: leg.protocolId,
    apyPercent: RATES[i] ?? 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: stampOf(legs[i]!),
  }));
const histories: ProtocolApyHistory[] = SAFE.allocation.map((leg) => ({
  protocolId: leg.protocolId,
  points: [],
  stamp: observedStamp('defillama', ago(HOUR)),
}));

const L = (ageMs: number): Leg => ({ live: true, ageMs });
const D = (ageMs: number): Leg => ({ live: false, ageMs });

type Kind = 'RECENT' | 'STALE' | 'PARTLY_STALE' | 'MIXED_RECENT' | 'MIXED_STALE' | 'REFERENCE';
/** Each kind's legs, and the live date its line states (null when undated). */
const STATES: Record<Kind, { legs: Leg[]; datedBy: number | null; stamp: string }> = {
  RECENT: { legs: [L(HOUR), L(HOUR), L(HOUR)], datedBy: HOUR, stamp: 'partly-live' },
  STALE: { legs: [L(13 * DAY), L(13 * DAY), L(13 * DAY)], datedBy: 13 * DAY, stamp: 'partly-live' },
  PARTLY_STALE: { legs: [L(HOUR), L(9 * DAY), L(9 * DAY)], datedBy: null, stamp: 'partly-live' },
  MIXED_RECENT: { legs: [D(2 * DAY), L(HOUR), L(HOUR)], datedBy: HOUR, stamp: 'mixed' },
  MIXED_STALE: { legs: [D(2 * DAY), L(9 * DAY), L(9 * DAY)], datedBy: null, stamp: 'mixed' },
  REFERENCE: { legs: [D(2 * DAY), D(2 * DAY), D(2 * DAY)], datedBy: null, stamp: 'fixture' },
};

/** The approved lines (plan P10 §6; the reference line unchanged), as the reader sees them. */
const EXPECTED: Record<SandboxLocale, Record<Kind, (d: string, n: string) => string>> = {
  en: {
    RECENT: (d, n) => `Pool rate, fetched ${d}: ${n}%/yr (real, variable)`,
    STALE: (d, n) =>
      `Pool rate, fetched ${d}, over a week ago: ${n}%/yr (real, variable; may have changed)`,
    PARTLY_STALE: (_d, n) =>
      `Pool rate, with data over a week old: ${n}%/yr (real, variable; may have changed)`,
    MIXED_RECENT: (d, n) =>
      `Blended pool rate, part of it fetched ${d}: ${n}%/yr (variable, includes reference values)`,
    MIXED_STALE: (_d, n) =>
      `Blended pool rate, with data over a week old: ${n}%/yr (variable, includes reference values; may have changed)`,
    REFERENCE: (_d, n) => `Reference pool rate: ${n}%/yr (documented values, not live)`,
  },
  'pt-BR': {
    RECENT: (d, n) => `Taxa do pool, buscada em ${d}: ${n}%/ano (real, variável)`,
    STALE: (d, n) =>
      `Taxa do pool, buscada em ${d}, há mais de uma semana: ${n}%/ano (real, variável; pode ter mudado)`,
    PARTLY_STALE: (_d, n) =>
      `Taxa do pool, com dados de mais de uma semana: ${n}%/ano (real, variável; pode ter mudado)`,
    MIXED_RECENT: (d, n) =>
      `Taxa combinada do pool, parte dela buscada em ${d}: ${n}%/ano (variável, inclui valores de referência)`,
    MIXED_STALE: (_d, n) =>
      `Taxa combinada do pool, com dados de mais de uma semana: ${n}%/ano (variável, inclui valores de referência; pode ter mudado)`,
    REFERENCE: (_d, n) =>
      `Taxa de referência do pool: ${n}%/ano (valores documentados, não ao vivo)`,
  },
  es: {
    RECENT: (d, n) => `Tasa del pool, obtenida el ${d}: ${n}%/año (real, variable)`,
    STALE: (d, n) =>
      `Tasa del pool, obtenida el ${d}, hace más de una semana: ${n}%/año (real, variable; puede haber cambiado)`,
    PARTLY_STALE: (_d, n) =>
      `Tasa del pool, con datos de más de una semana: ${n}%/año (real, variable; puede haber cambiado)`,
    MIXED_RECENT: (d, n) =>
      `Tasa combinada del pool, una parte obtenida el ${d}: ${n}%/año (variable, incluye valores de referencia)`,
    MIXED_STALE: (_d, n) =>
      `Tasa combinada del pool, con datos de más de una semana: ${n}%/año (variable, incluye valores de referencia; puede haber cambiado)`,
    REFERENCE: (_d, n) =>
      `Tasa de referencia del pool: ${n}%/año (valores documentados, no en vivo)`,
  },
  de: {
    RECENT: (d, n) => `Pool-Rate, abgerufen am ${d}: ${n}%/Jahr (echt, variabel)`,
    STALE: (d, n) =>
      `Pool-Rate, abgerufen am ${d}, vor über einer Woche: ${n}%/Jahr (echt, variabel; kann sich geändert haben)`,
    PARTLY_STALE: (_d, n) =>
      `Pool-Rate, mit Daten älter als eine Woche: ${n}%/Jahr (echt, variabel; kann sich geändert haben)`,
    MIXED_RECENT: (d, n) =>
      `Gemischte Pool-Rate, ein Teil abgerufen am ${d}: ${n}%/Jahr (variabel, enthält Referenzwerte)`,
    MIXED_STALE: (_d, n) =>
      `Gemischte Pool-Rate, mit Daten älter als eine Woche: ${n}%/Jahr (variabel, enthält Referenzwerte; kann sich geändert haben)`,
    REFERENCE: (_d, n) => `Referenz-Pool-Rate: ${n}%/Jahr (dokumentierte Werte, nicht live)`,
  },
};
const formatDate = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
const formatApy = (locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(APY);
const expectedLine = (locale: SandboxLocale, kind: Kind) => {
  const { datedBy } = STATES[kind];
  return EXPECTED[locale][kind](
    datedBy === null ? '' : formatDate(locale, ago(datedBy)),
    formatApy(locale)
  );
};

const CASES = SANDBOX_LOCALES.flatMap((locale) =>
  (Object.keys(STATES) as Kind[]).map((kind) => [locale, kind] as const)
);

afterEach(cleanup);

function intlErrorsCollector() {
  const errors: string[] = [];
  return { errors, onError: (e: { message: string }) => errors.push(e.message) };
}

describe('5.814 · RATE-AGE-1 · the rate line renders whole, in every locale', () => {
  it('should put the fetch date on the previous calendar day in this zone (the TZ pin bites)', () => {
    expect(formatDate('en', ago(HOUR))).toBe('Nov 16, 2026');
    expect(new Date(ago(HOUR)).toISOString().slice(0, 10)).toBe('2026-11-17');
  });

  it.each(CASES)('should render the %s %s line on the picker', (locale, kind) => {
    const { errors, onError } = intlErrorsCollector();
    const messages = getMessages(locale);
    render(
      <IntlProvider locale={locale} messages={messages} onError={onError}>
        <StrategyPicker
          horizonMonths={36}
          apys={apysFor(STATES[kind].legs)}
          selectedId={null}
          onSelect={() => {}}
          now={NOW}
        />
      </IntlProvider>
    );
    const name = messages['catalog.strategies.safeHarbor.name']!;
    const row = screen.getByText(name).closest('li')!;
    expect(within(row).getByTestId('rate-line').textContent).toBe(expectedLine(locale, kind));
    /* The whole page: no rate line anywhere else may call a rate current. */
    expect(currencyClaimIn(locale, document.body.textContent ?? '')).toBeNull();
    expect(errors).toEqual([]);
  });

  it.each(CASES)('should render the %s %s line in both views of the detail', (locale, kind) => {
    const { errors, onError } = intlErrorsCollector();
    const messages = getMessages(locale);
    render(
      <IntlProvider locale={locale} messages={messages} onError={onError}>
        <StrategyDetail
          strategy={SAFE}
          goalName="Trip"
          apys={apysFor(STATES[kind].legs)}
          histories={histories}
          gas={[{ chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP }]}
          usdPriceLocal={1}
          currency="USD"
          now={NOW}
        />
      </IntlProvider>
    );
    const want = expectedLine(locale, kind);
    /* Simple view. */
    expect(screen.getByTestId('rate-line').textContent).toBe(want);
    expect(currencyClaimIn(locale, document.body.textContent ?? '')).toBeNull();
    /* Detailed view: the neutral title over the same line (5.226, D5). */
    fireEvent.click(screen.getByText(messages['strategyDetail.detailed']!));
    expect(screen.getByTestId('rate-title').textContent).toBe(messages['strategyDetail.poolRate']);
    expect(screen.getByTestId('rate-line').textContent).toBe(want);
    expect(currencyClaimIn(locale, document.body.textContent ?? '')).toBeNull();
    /* The stamp branch, and one date per rate on one screen. */
    const stamp = screen.getByTestId(`provenance-stamp-${STATES[kind].stamp}`);
    const { datedBy } = STATES[kind];
    if (datedBy !== null) expect(stamp.textContent).toContain(formatDate(locale, ago(datedBy)));
    expect(errors).toEqual([]);
  });
});
