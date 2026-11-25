/**
 * C2-S G4 — the market-data service's degraded read (`5.688`, MDS-READ-1), the browser snapshot
 * without the monthly series (finding 13, TOOLS-PAYLOAD-1) and the priming rule (B1).
 *
 * In its own folder outside `src/lib/market-data/` (plan §6.4): the weekly /market workflow
 * runs that folder as a release gate, and these tests do not belong to the weekly refresh.
 * They never read the pipeline-written monthly data (GATE-BOUND-1): stub providers, and the
 * three data modules are mocked with a synthetic series. The `marketDataService` singleton is
 * used only where it is the subject (the engines read it), and is reset after each test.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stripComments } from '@diboas/test-support';
import {
  FallbackProvider,
  MARKET_DATA_FETCH_TIMEOUT_MS,
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
 * A synthetic series that diverges everywhere: FX doubles every year for every currency,
 * inflation runs at 50 % a year in every locale, every asset doubles yearly. If any engine
 * preferred the series over the calibrated constants, the server's figures (with the series)
 * would move and differ from the browser's (without them).
 */
const SYNTHETIC = vi.hoisted(() => {
  const n = 15 * 12 + 1;
  const ym = (i: number) =>
    `${2011 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`;
  const fxMonths = Array.from({ length: n }, (_, i) => ({
    ym: ym(i),
    closeLocalPerUsd: Math.pow(2, i / 12),
    closeUsdPerLocal: 1 / Math.pow(2, i / 12),
  }));
  const currencies = ['BRL', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'MXN', 'ZAR'];
  const more = ['KRW', 'SGD', 'HKD', 'AED', 'ILS', 'CHF', 'PLN'];
  const fx = Object.fromEntries(
    [...currencies, ...more].map((c) => [
      c,
      { source: 's', basis: 'x', note: 'x', months: fxMonths },
    ])
  );
  const inflationMonths = Array.from({ length: n }, (_, i) => ({
    ym: ym(i),
    yoyPct: 50,
    cumulativeSinceStartPct: (Math.pow(1.5, i / 12) - 1) * 100,
  }));
  const inflation = Object.fromEntries(
    ['en', 'pt-BR', 'es', 'de'].map((l) => [l, { source: 's', note: 'x', months: inflationMonths }])
  );
  const assetMonths = fxMonths.map((m) => ({
    ym: m.ym,
    open: m.closeLocalPerUsd,
    high: m.closeLocalPerUsd,
    low: m.closeLocalPerUsd,
    close: m.closeLocalPerUsd,
  }));
  const assets = Object.fromEntries(
    ['BTC', 'SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'].map((a) => [
      a,
      { basis: 'price', source: 's', note: 'x', months: assetMonths },
    ])
  );
  return { assets, fx, inflation };
});
vi.mock('@/lib/market-data/data/monthlyPrices.json', () => ({ default: SYNTHETIC.assets }));
vi.mock('@/lib/market-data/data/monthlyFx.json', () => ({ default: SYNTHETIC.fx }));
vi.mock('@/lib/market-data/data/monthlyInflation.json', () => ({ default: SYNTHETIC.inflation }));

const SERIES = SYNTHETIC as unknown as NonNullable<MarketDataSnapshot['monthlySeries']>;
const OTHER_SERIES = { ...SERIES, fx: {} } as NonNullable<MarketDataSnapshot['monthlySeries']>;
const T0 = new Date('2026-11-25T12:00:00Z').getTime();

/** A live snapshot whose savings rate marks it (en bank rate = `mark`). */
const live = (mark = 1.11, ttl = 300_000, series = SERIES): MarketDataSnapshot => ({
  ...FALLBACK_MARKET_DATA,
  rates: {
    ...FALLBACK_MARKET_DATA.rates,
    bankRates: {
      ...FALLBACK_MARKET_DATA.rates.bankRates,
      en: { ...FALLBACK_MARKET_DATA.rates.bankRates.en, savings: mark },
    },
  },
  monthlySeries: series,
  metadata: { ...FALLBACK_MARKET_DATA.metadata, source: 'api', stale: false, ttl },
});
const mark = (s: MarketDataSnapshot) => s.rates.bankRates.en.savings;
const staleOf = (s: MarketDataSnapshot): MarketDataSnapshot => ({
  ...s,
  metadata: { ...s.metadata, stale: true, source: 'fallback' },
});

/** A provider scripted call by call: a number returns a live snapshot so marked, 'fail' throws. */
function scripted(...steps: Array<number | 'fail'>) {
  const calls = { n: 0 };
  const provider: IMarketDataProvider = {
    fetch: async () => {
      const step = steps[Math.min(calls.n, steps.length - 1)];
      calls.n += 1;
      if (step === 'fail') throw new Error('provider down');
      return live(step, 1_000);
    },
    isAvailable: async () => true,
  };
  return { provider, calls };
}

/** A provider whose fetch resolves or rejects only when the test says so. */
function gated() {
  let resolve: (s: MarketDataSnapshot) => void = () => {};
  let reject: (e: Error) => void = () => {};
  const provider: IMarketDataProvider = {
    fetch: () =>
      new Promise<MarketDataSnapshot>((res, rej) => {
        resolve = res;
        reject = rej;
      }),
    isAvailable: async () => true,
  };
  return {
    provider,
    resolve: (s: MarketDataSnapshot) => resolve(s),
    reject: () => reject(new Error('down')),
  };
}

const quietWarn = () => vi.spyOn(Logger, 'warn').mockImplementation(() => {});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  marketDataService.setProvider(new FallbackProvider());
});

describe('MDS-READ-1 · 5.688: one degraded read for both accessors', () => {
  it('(A) should serve the same stale object from getSync() after a failed refresh', async () => {
    vi.useFakeTimers({ now: T0 });
    quietWarn();
    const service = new MarketDataServiceImpl(scripted(1, 'fail').provider);
    await service.get();
    vi.setSystemTime(T0 + 5_000); // past the 1 s ttl
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(service.getSync()).toBe(stale);
  });

  it('(B) should serve the same stale object when nothing was ever loaded', async () => {
    quietWarn();
    const service = new MarketDataServiceImpl(scripted('fail').provider);
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(service.getSync()).toBe(stale);
  });

  it('(C) should not call the provider, nor warn, again within the retry delay', async () => {
    vi.useFakeTimers({ now: T0 });
    const warn = quietWarn();
    const { provider, calls } = scripted('fail');
    const service = new MarketDataServiceImpl(provider);
    await service.get();
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS - 1_000);
    await service.get();
    expect(calls.n).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(service.retryAvailableAt()).toBe(T0 + MARKET_DATA_STALE_RETRY_MS);
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS + 1);
    expect(service.retryAvailableAt()).toBeNull(); // never a time in the past
  });

  it('(D) should share one refresh among concurrent cold calls', async () => {
    const { provider, calls } = scripted(1);
    const service = new MarketDataServiceImpl(provider);
    const [a, b, c] = await Promise.all([service.get(), service.get(), service.get()]);
    expect(calls.n).toBe(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('(E) should store a primed stale snapshot as stale, never fresh, and retry after the delay', async () => {
    vi.useFakeTimers({ now: T0 });
    const { provider, calls } = scripted(2);
    const service = new MarketDataServiceImpl(provider);
    const stale = staleOf(live(1.5));
    service.primeCache(stale);
    expect(service.getSync()).toBe(stale);
    expect(service.retryAvailableAt()).toBe(T0 + MARKET_DATA_STALE_RETRY_MS);
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS - 1);
    await service.get();
    expect(calls.n).toBe(0); // not before the retry time
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS + 1);
    const fresh = await service.get();
    expect(calls.n).toBe(1);
    expect(mark(fresh)).toBe(2);
  });

  it('should recover after the delay: fresh data, no retry time', async () => {
    vi.useFakeTimers({ now: T0 });
    quietWarn();
    const service = new MarketDataServiceImpl(scripted('fail', 3).provider);
    await service.get();
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS + 1);
    const fresh = await service.get();
    expect(mark(fresh)).toBe(3);
    expect(service.getSync()).toBe(fresh);
    expect(service.retryAvailableAt()).toBeNull();
  });

  it('should keep the monthly series through two failures', async () => {
    vi.useFakeTimers({ now: T0 });
    quietWarn();
    const service = new MarketDataServiceImpl(scripted(1, 'fail', 'fail').provider);
    await service.get();
    vi.setSystemTime(T0 + 5_000);
    await service.get();
    vi.setSystemTime(T0 + 5_000 + MARKET_DATA_STALE_RETRY_MS + 1);
    const second = await service.get();
    expect(second.metadata.stale).toBe(true);
    expect(second.monthlySeries).toBe(SERIES);
  });

  it('should treat a fetch that never settles as a failure after the timeout', async () => {
    vi.useFakeTimers({ now: T0 });
    quietWarn();
    const service = new MarketDataServiceImpl({
      fetch: () => new Promise(() => {}),
      isAvailable: async () => true,
    });
    const pending = service.get();
    await vi.advanceTimersByTimeAsync(MARKET_DATA_FETCH_TIMEOUT_MS + 1);
    const stale = await pending;
    expect(stale.metadata.stale).toBe(true);
    expect(service.retryAvailableAt()).not.toBeNull();
  });

  it('should clear the shared refresh even when the failure path itself throws', async () => {
    vi.spyOn(Logger, 'warn').mockImplementation(() => {
      throw new Error('logger down');
    });
    const { provider, calls } = scripted('fail', 4);
    const service = new MarketDataServiceImpl(provider);
    await expect(service.get()).rejects.toThrow('logger down');
    vi.restoreAllMocks();
    const fresh = await service.get();
    expect(calls.n).toBe(2);
    expect(mark(fresh)).toBe(4);
  });
});

describe('MDS-READ-1 · concurrent writes and provider swaps', () => {
  it('should never let a failed refresh replace a snapshot primed while it ran', async () => {
    quietWarn();
    const gate = gated();
    const service = new MarketDataServiceImpl(gate.provider);
    const pending = service.get();
    const primed = live(7);
    service.primeCache(primed);
    gate.reject();
    await pending;
    expect(service.getSync()).toBe(primed);
    expect(service.retryAvailableAt()).toBeNull();
  });

  it('should never let an older successful refresh replace a newer primed snapshot', async () => {
    const gate = gated();
    const service = new MarketDataServiceImpl(gate.provider);
    const pending = service.get();
    const primed = live(8);
    service.primeCache(primed);
    gate.resolve(live(6));
    await pending;
    expect(service.getSync()).toBe(primed);
  });

  it('should never let a refresh started for an old provider write the cache', async () => {
    const gate = gated();
    const service = new MarketDataServiceImpl(gate.provider);
    const pending = service.get();
    service.setProvider(scripted(1).provider);
    gate.resolve(live(9));
    await pending;
    expect(service.getSync()).toBe(FALLBACK_MARKET_DATA);
  });

  it('should reset the circuit breaker when the provider is swapped', async () => {
    quietWarn();
    vi.useFakeTimers({ now: T0 });
    const service = new MarketDataServiceImpl(scripted('fail').provider);
    for (let i = 0; i < 3; i += 1) {
      vi.setSystemTime(T0 + i * (MARKET_DATA_STALE_RETRY_MS + 1));
      await service.get(); // three failures open the breaker
    }
    const next = scripted(5);
    service.setProvider(next.provider);
    const fresh = await service.get();
    expect(next.calls.n).toBe(1);
    expect(mark(fresh)).toBe(5);
  });

  it('should not shorten an open retry window when a fresh snapshot is primed', async () => {
    vi.useFakeTimers({ now: T0 });
    quietWarn();
    const { provider, calls } = scripted('fail', 1);
    const service = new MarketDataServiceImpl(provider);
    await service.get();
    vi.setSystemTime(T0 + 1_000);
    service.primeCache(toClientSnapshot(live(2)));
    await service.get();
    expect(calls.n).toBe(1);
    expect(service.retryAvailableAt()).toBe(T0 + MARKET_DATA_STALE_RETRY_MS);
  });

  it('should never extend a fresh cache by priming new snapshots on every request', async () => {
    vi.useFakeTimers({ now: T0 });
    const { provider, calls } = scripted(1);
    const service = new MarketDataServiceImpl(provider);
    service.primeCache(live(2, 300_000));
    for (let minute = 1; minute <= 20; minute += 1) {
      vi.setSystemTime(T0 + minute * 60_000);
      service.primeCache(live(2, 300_000)); // a new object each request
    }
    await service.get(); // 20 minutes on: the 5-minute TTL has ended
    expect(calls.n).toBe(1);
  });

  it('should hold the same snapshot on the server render copy and in the browser when the server read is stale', () => {
    const serverRender = new MarketDataServiceImpl(scripted(1).provider);
    serverRender.primeCache(toClientSnapshot(live(1.2))); // an earlier, fresh request
    const stale = toClientSnapshot(staleOf(live(0.4)));
    serverRender.primeCache(stale);
    const browser = new MarketDataServiceImpl(scripted(1).provider);
    browser.primeCache(stale);
    expect(mark(serverRender.getSync())).toBe(0.4);
    expect(mark(browser.getSync())).toBe(0.4);
  });
});

describe('B1: a primed snapshot without the series never satisfies a request for them', () => {
  it('should load only the series on get(), keeping the primed values, with no provider call', async () => {
    const { provider, calls } = scripted(1);
    const service = new MarketDataServiceImpl(provider);
    service.primeCache(toClientSnapshot(live(2.5)));
    const data = await service.get();
    expect(calls.n).toBe(0);
    expect(mark(data)).toBe(2.5);
    expect(data.monthlySeries?.fx).toBe(SYNTHETIC.fx);
    expect(service.getSync().monthlySeries?.fx).toBe(SYNTHETIC.fx);
  });

  it('should keep loaded series across re-primes; a snapshot carrying its own series wins', async () => {
    const service = new MarketDataServiceImpl(scripted(1).provider);
    const primed = toClientSnapshot(live(2.5));
    service.primeCache(primed);
    const loaded = await service.get();
    service.primeCache(primed); // a re-render: the same object, a no-op
    expect(service.getSync()).toBe(loaded);
    service.primeCache(toClientSnapshot(live(2.6))); // a new series-less snapshot
    expect(service.getSync().monthlySeries?.fx).toBe(SYNTHETIC.fx);
    service.primeCache(live(2.7, 300_000, OTHER_SERIES)); // a snapshot with its own series
    expect(service.getSync().monthlySeries).toBe(OTHER_SERIES);
  });
});

describe('TOOLS-PAYLOAD-1 · finding 13: the tools pages send no monthly series to the browser', () => {
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
    const file = 'src/app/[locale]/(landing)/tools/layout.tsx';
    const code = stripComments(
      fs.readFileSync(path.join(process.cwd(), file), 'utf8'),
      file
    ).replace(/\s+/g, '');
    expect(code).toContain('initialSnapshot={toClientSnapshot(snapshot)}');
    expect(code.match(/initialSnapshot=/g)).toHaveLength(1);
  });

  // The browser computes every figure without the series; only these files may read them.
  it('should read the monthly series only in the service, the FX resolver and asset history', () => {
    const allowed = new Set([
      'lib/market-data/service.ts',
      'lib/market-data/types.ts',
      'lib/market-data/clientSnapshot.ts',
      'lib/market-data/constants.ts', // the provenance block's key, not data
      'lib/market-data/formulas/horizonMatchedCagr.ts',
      'lib/asset-history/calculator.ts',
      'components/Providers/MarketDataContextProvider.tsx', // the prop type's Omit<…>, not a read
    ]);
    const src = path.join(process.cwd(), 'src');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return e.name === '__tests__' || e.name === 'data' ? [] : walk(full);
        return /\.(ts|tsx)$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name) ? [full] : [];
      });
    const readers = walk(src)
      .filter((f) =>
        /monthlySeries|getMonthlySeries/.test(stripComments(fs.readFileSync(f, 'utf8'), f))
      )
      .map((f) => path.relative(src, f))
      .filter((f) => !allowed.has(f));
    expect(readers).toEqual([]);
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

describe("TOOLS-PAYLOAD-1 · the browser's first render computes what the server rendered", () => {
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

  /** Server: the singleton holds the full snapshot. Browser: primed with what the layout sends. */
  const serverThenBrowser = async (server: MarketDataSnapshot, locale: SupportedLocale) => {
    marketDataService.setProvider({ fetch: async () => server, isAvailable: async () => true });
    await marketDataService.get();
    const onServer = figures(marketDataService.getSync(), locale);
    marketDataService.setProvider(new FallbackProvider());
    marketDataService.primeCache(toClientSnapshot(server));
    const inBrowser = figures(marketDataService.getSync(), locale);
    return { onServer, inBrowser };
  };

  it.each(LOCALES)('%s, a fresh server snapshot', async (locale) => {
    const { onServer, inBrowser } = await serverThenBrowser(
      { ...FALLBACK_MARKET_DATA, monthlySeries: SERIES },
      locale
    );
    expect(inBrowser).toBe(onServer);
  });

  it.each(LOCALES)('%s, a stale server snapshot', async (locale) => {
    const { onServer, inBrowser } = await serverThenBrowser(
      staleOf({ ...FALLBACK_MARKET_DATA, monthlySeries: SERIES }),
      locale
    );
    expect(inBrowser).toBe(onServer);
  });
});
