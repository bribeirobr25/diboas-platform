/**
 * C2-S G4 — the market-data service's degraded read (`5.688`), the browser snapshot without the
 * monthly series (finding 13) and the priming rule (B1).
 *
 * Outside `src/lib/market-data/` on purpose: the weekly /market workflow runs that folder as a
 * release gate, and these tests do not belong to the weekly refresh. They never read the
 * pipeline-written monthly data (GATE-BOUND-1): stub providers and a synthetic series, and the
 * three data modules are mocked so an accidental load returns the synthetic series too.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FallbackProvider,
  MARKET_DATA_STALE_RETRY_MS,
  MarketDataServiceImpl,
  marketDataService,
} from '@/lib/market-data/service';
import { toClientSnapshot } from '@/lib/market-data/clientSnapshot';
import { FALLBACK_MARKET_DATA, LOCALE_CURRENCY } from '@/lib/market-data/constants';
import type {
  ClientMarketDataSnapshot,
  IMarketDataProvider,
  MarketDataSnapshot,
} from '@/lib/market-data/types';
import { Logger } from '@/lib/monitoring/Logger';
import { calculateCompoundProjectionHedged } from '@/lib/compound-interest';
import { calculateTimeToTargetTimeline } from '@/lib/time-to-target/calculator';
import { calculateEmergencyFundTimeline } from '@/lib/emergency-fund/calculator';
import { calculateIdleCashYield } from '@/lib/idle-cash/calculator';
import {
  CURRENCY_DEPRECIATION_OPTIONS,
  calculateCurrencyDepreciationForward,
} from '@/lib/currency-depreciation/calculator';
import type { SupportedLocale } from '@diboas/i18n/config';

/**
 * A synthetic series whose FX doubles every year for every currency: if any engine preferred
 * the series over the calibrated constant, the server's figures (with the series) would move
 * and differ from the browser's (without them).
 */
const SYNTHETIC = vi.hoisted(() => {
  const months = Array.from({ length: 15 * 12 + 1 }, (_, i) => ({
    ym: `${2011 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
    closeLocalPerUsd: Math.pow(2, i / 12),
    closeUsdPerLocal: 1 / Math.pow(2, i / 12),
  }));
  const codes = ['BRL', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'MXN', 'ZAR', 'KRW', 'SGD'];
  const more = ['HKD', 'AED', 'ILS', 'CHF', 'PLN'];
  const fx = Object.fromEntries(
    [...codes, ...more].map((c) => [c, { source: 'synthetic', basis: 'x', note: 'x', months }])
  );
  return { assets: {}, fx, inflation: {} };
});
vi.mock('@/lib/market-data/data/monthlyPrices.json', () => ({ default: SYNTHETIC.assets }));
vi.mock('@/lib/market-data/data/monthlyFx.json', () => ({ default: SYNTHETIC.fx }));
vi.mock('@/lib/market-data/data/monthlyInflation.json', () => ({ default: SYNTHETIC.inflation }));
const withSeries = (): MarketDataSnapshot => ({
  ...FALLBACK_MARKET_DATA,
  monthlySeries: SYNTHETIC as unknown as MarketDataSnapshot['monthlySeries'],
});

const SERIES = { marker: 'loaded-series' } as unknown as MarketDataSnapshot['monthlySeries'];
const T0 = new Date('2026-11-25T12:00:00Z');

const live = (ttl = 1_000): MarketDataSnapshot => ({
  ...FALLBACK_MARKET_DATA,
  monthlySeries: SERIES,
  metadata: { ...FALLBACK_MARKET_DATA.metadata, source: 'api', stale: false, ttl },
});

/** A provider scripted call by call: 'ok' returns a live snapshot, 'fail' throws. */
function scripted(...steps: Array<'ok' | 'fail'>) {
  const calls = { n: 0 };
  const provider: IMarketDataProvider = {
    fetch: async () => {
      const step = steps[Math.min(calls.n, steps.length - 1)];
      calls.n += 1;
      if (step === 'fail') throw new Error('provider down');
      return live();
    },
    isAvailable: async () => true,
  };
  return { provider, calls };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  marketDataService.setProvider(new FallbackProvider());
});

describe('5.688: one degraded read for both accessors', () => {
  it('(A) should serve the same stale object from getSync() after a failed refresh', async () => {
    vi.useFakeTimers({ now: T0 });
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const { provider } = scripted('ok', 'fail');
    const service = new MarketDataServiceImpl(provider);
    await service.get();
    vi.setSystemTime(T0.getTime() + 5_000); // past the 1 s ttl
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(service.getSync()).toBe(stale);
  });

  it('(B) should serve the same stale object when nothing was ever loaded', async () => {
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(scripted('fail').provider);
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(service.getSync()).toBe(stale);
  });

  it('(C) should not call the provider again, nor warn again, within the retry delay', async () => {
    vi.useFakeTimers({ now: T0 });
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const { provider, calls } = scripted('fail');
    const service = new MarketDataServiceImpl(provider);
    await service.get();
    vi.setSystemTime(T0.getTime() + MARKET_DATA_STALE_RETRY_MS - 1_000);
    await service.get();
    expect(calls.n).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(service.retryAvailableAt()).toBe(T0.getTime() + MARKET_DATA_STALE_RETRY_MS);
  });

  it('(D) should share one refresh among concurrent cold calls', async () => {
    const { provider, calls } = scripted('ok');
    const service = new MarketDataServiceImpl(provider);
    const [a, b, c] = await Promise.all([service.get(), service.get(), service.get()]);
    expect(calls.n).toBe(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('(E) should ignore a stale primed snapshot and retry after the delay', async () => {
    vi.useFakeTimers({ now: T0 });
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const { provider, calls } = scripted('fail', 'ok');
    const service = new MarketDataServiceImpl(provider);
    const stale = await service.get();
    const other = new MarketDataServiceImpl(scripted('ok').provider);
    other.primeCache(stale);
    expect(other.getSync()).toBe(FALLBACK_MARKET_DATA); // ignored, not stored as fresh
    vi.setSystemTime(T0.getTime() + MARKET_DATA_STALE_RETRY_MS + 1_000);
    const fresh = await service.get();
    expect(calls.n).toBe(2);
    expect(fresh.metadata.stale).toBe(false);
  });

  it('should recover after the delay: fresh data, no retry time', async () => {
    vi.useFakeTimers({ now: T0 });
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(scripted('fail', 'ok').provider);
    await service.get();
    expect(service.retryAvailableAt()).not.toBeNull();
    vi.setSystemTime(T0.getTime() + MARKET_DATA_STALE_RETRY_MS + 1);
    const fresh = await service.get();
    expect(fresh.metadata.source).toBe('api');
    expect(service.getSync()).toBe(fresh);
    expect(service.retryAvailableAt()).toBeNull();
  });

  it('should keep the monthly series through two failures', async () => {
    vi.useFakeTimers({ now: T0 });
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(scripted('ok', 'fail', 'fail').provider);
    await service.get();
    vi.setSystemTime(T0.getTime() + 5_000);
    await service.get();
    vi.setSystemTime(T0.getTime() + 5_000 + MARKET_DATA_STALE_RETRY_MS + 1);
    const second = await service.get();
    expect(second.metadata.stale).toBe(true);
    expect(second.monthlySeries).toBe(SERIES);
  });

  it('should never let a refresh started for an old provider write the cache', async () => {
    let release: (s: MarketDataSnapshot) => void = () => {};
    const slow: IMarketDataProvider = {
      fetch: () => new Promise<MarketDataSnapshot>((resolve) => (release = resolve)),
      isAvailable: async () => true,
    };
    const service = new MarketDataServiceImpl(slow);
    const pending = service.get();
    service.setProvider(scripted('ok').provider);
    release(live());
    await pending;
    expect(service.getSync()).toBe(FALLBACK_MARKET_DATA);
  });
});

describe('B1: a primed snapshot without the series never satisfies a request for them', () => {
  it('should load the series on get() when the primed snapshot lacks them', async () => {
    const { provider, calls } = scripted('ok');
    const service = new MarketDataServiceImpl(provider);
    service.primeCache(toClientSnapshot(live(300_000)));
    const data = await service.get();
    expect(calls.n).toBe(1);
    expect(data.monthlySeries).toBe(SERIES);
    expect(service.getSync().monthlySeries).toBe(SERIES);
  });

  it('should keep loaded series when the same or a series-less snapshot is primed again', async () => {
    const service = new MarketDataServiceImpl(scripted('ok').provider);
    const primed = toClientSnapshot(live(300_000));
    service.primeCache(primed);
    const loaded = await service.get();
    service.primeCache(primed); // a re-render: the same object, a no-op
    expect(service.getSync()).toBe(loaded);
    service.primeCache(toClientSnapshot(live(300_000))); // a new series-less snapshot
    expect(service.getSync().monthlySeries).toBe(SERIES);
  });
});

describe('finding 13: the tools pages send no monthly series to the browser', () => {
  it('should strip the series and keep everything else', () => {
    const full = live();
    const client = toClientSnapshot(full);
    expect('monthlySeries' in client).toBe(false);
    const { monthlySeries: _dropped, ...rest } = full;
    expect(client).toEqual(rest);
  });

  it('should make a full snapshot a type error where the client snapshot is required', () => {
    const full: MarketDataSnapshot = live();
    // @ts-expect-error — a snapshot that may carry the monthly series is not a client snapshot
    const client: ClientMarketDataSnapshot = full;
    expect(client).toBe(full);
  });

  it('should hand the tools provider the stripped snapshot', () => {
    const layout = fs.readFileSync(
      path.join(process.cwd(), 'src/app/[locale]/(landing)/tools/layout.tsx'),
      'utf8'
    );
    expect(layout).toMatch(/initialSnapshot=\{toClientSnapshot\(snapshot\)\}/);
    expect(layout).not.toMatch(/initialSnapshot=\{snapshot\}/);
  });

  // H7: the browser computes every offered figure from these constants, so each must exist.
  it('should hold a calibrated depreciation for every currency a tool offers', () => {
    const offered = new Set<string>([
      ...Object.values(LOCALE_CURRENCY),
      ...CURRENCY_DEPRECIATION_OPTIONS,
    ]);
    offered.delete('USD');
    const missing = [...offered].filter(
      (c) => typeof FALLBACK_MARKET_DATA.exchangeRates.rates[c]?.annualDepreciation !== 'number'
    );
    expect(missing).toEqual([]);
  });
});

describe("the browser's first render computes what the server rendered", () => {
  const LOCALES: SupportedLocale[] = ['en', 'pt-BR', 'es', 'de'];

  const figures = (snapshot: MarketDataSnapshot, locale: SupportedLocale) => {
    const { computedAt: _t, ...compound } = calculateCompoundProjectionHedged({
      amount: 200,
      cadence: 'monthly',
      years: 12,
      locale,
    });
    return JSON.stringify({
      compound,
      ttt: calculateTimeToTargetTimeline(
        { target: 50000, initialAmount: 1000, contribution: 250, cadence: 'monthly', locale },
        snapshot
      ),
      ef: calculateEmergencyFundTimeline(
        { monthlyExpenses: 2900, monthlySavings: 300, targetMultiplier: 6, locale },
        snapshot
      ),
      idle: calculateIdleCashYield(
        { idleCash: 100000, years: 3, bankYieldPct: 2, locale },
        snapshot
      ),
      fx: CURRENCY_DEPRECIATION_OPTIONS.map((currency) =>
        calculateCurrencyDepreciationForward({ amount: 50000, years: 10, currency }, snapshot)
      ),
    });
  };

  const serverThenBrowser = async (server: MarketDataSnapshot, locale: SupportedLocale) => {
    // Server: the singleton holds the server's snapshot (with the series).
    marketDataService.setProvider({ fetch: async () => server, isAvailable: async () => true });
    await marketDataService.get();
    const onServer = figures(marketDataService.getSync(), locale);
    // Browser: a fresh singleton primed with what the tools layout sends.
    marketDataService.setProvider(new FallbackProvider());
    marketDataService.primeCache(toClientSnapshot(server));
    const inBrowser = figures(marketDataService.getSync(), locale);
    return { onServer, inBrowser };
  };

  it.each(LOCALES)('%s, a fresh server snapshot', async (locale) => {
    const full = withSeries();
    const { onServer, inBrowser } = await serverThenBrowser(full, locale);
    expect(inBrowser).toBe(onServer);
  });

  it.each(LOCALES)('%s, a stale server snapshot', async (locale) => {
    const full = withSeries();
    const stale: MarketDataSnapshot = {
      ...full,
      metadata: { ...full.metadata, stale: true, source: 'fallback' },
    };
    const { onServer, inBrowser } = await serverThenBrowser(stale, locale);
    expect(inBrowser).toBe(onServer);
  });
});
