/**
 * catalogue.mjs — every series the Market stores, where it comes from, and
 * what it is checked against. One home for these facts (founder 2026-11-04:
 * "10 years of data, month by month, reliable and accurate, for all
 * information we are using in the diBoaS Market").
 *
 * A series has ONE primary source (the values stored) and zero or more
 * CHECK sources (fetched, kept as evidence, compared, never stored as the
 * value). A check that disagrees beyond its tolerance stops the update.
 *
 * Tolerances are relative (0.005 = 0.5%) and sized to the DEFINITION gap
 * between two sources, not to hide errors: two closes of the same instrument
 * get a tight bound; a noon fix against a close gets a wider one, and says so.
 *
 * Kinds:
 *   'price'      a daily close series (OHLC where the source has it)
 *   'fund'       a price series that also pays distributions; total return is
 *                computed by diBoaS from the closes and the ex-dates (5.633)
 *   'rate'       a published daily rate (yields, FX, the broad dollar index)
 *   'monthly'    published once a month (M2)
 */

const DAY = 86_400_000;
const yyyymmdd = (d) => d.replaceAll('-', '');
const unix = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 1000);

/** URL builders, one per provider. `from`/`to` are ISO dates (inclusive). */
export const SOURCES = {
  yahoo: (sym) => ({
    provider: 'yahoo',
    url: (from, to) =>
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?period1=${unix(from)}&period2=${unix(to) + 2 * 86400}&interval=1d&events=div`,
    parser: 'yahoo',
  }),
  cnbc: (sym) => ({
    provider: 'cnbc',
    url: (from, to) =>
      `https://ts-api.cnbc.com/harmony/app/bars/${encodeURIComponent(sym)}/1D/${yyyymmdd(from)}000000/${yyyymmdd(to)}235959/adjusted/EST5EDT.json`,
    parser: 'cnbc',
  }),
  fred: (id) => ({
    provider: 'fred',
    url: (from) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${from}`,
    // The same Federal Reserve data from its archival host, used when the
    // main host does not answer (it timed out from one network on 2026-11-04).
    fallback: (from) => `https://alfred.stlouisfed.org/graph/alfredgraph.csv?id=${id}&cosd=${from}`,
    parser: 'fred',
  }),
  coinmetrics: () => ({
    provider: 'coinmetrics',
    url: (from, to) =>
      `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=PriceUSD&frequency=1d&start_time=${from}&end_time=${to}&page_size=10000`,
    parser: 'coinmetrics',
    paged: true,
  }),
  b3: (index) => ({
    provider: 'b3',
    // one calendar year per request
    url: (year) =>
      `https://sistemaswebb3-listados.b3.com.br/indexStatisticsProxy/IndexCall/GetPortfolioDay/${Buffer.from(
        JSON.stringify({ index, language: 'pt-br', year: String(year) })
      ).toString('base64')}`,
    parser: 'b3',
    perYear: true,
  }),
  wgc: () => ({
    provider: 'wgc',
    // one calendar year per request: longer windows come back thinned out
    url: (year) =>
      `https://fsapi.gold.org/api/goldprice/v11/chart/price/usd/oz/${Date.UTC(year, 0, 1)},${Date.UTC(year, 11, 31) + DAY - 1}`,
    parser: 'wgc',
    perYear: true,
  }),
  nasdaqHistorical: (sym) => ({
    provider: 'nasdaq',
    url: (from, to) =>
      `https://api.nasdaq.com/api/quote/${sym}/historical?assetclass=etf&fromdate=${from}&todate=${to}&limit=9999`,
    parser: 'nasdaqHistorical',
  }),
  nasdaqDividends: (sym) => ({
    provider: 'nasdaq',
    url: () => `https://api.nasdaq.com/api/quote/${sym}/dividends?assetclass=etf`,
    parser: 'nasdaqDividends',
  }),
  ishares: (productPath) => ({
    provider: 'ishares',
    url: () =>
      `https://www.ishares.com/us/products/${productPath}/1467271812596.ajax?tab=distributions&fileType=json`,
    parser: 'ishares',
  }),
  stockanalysis: (sym) => ({
    provider: 'stockanalysis',
    url: () => `https://stockanalysis.com/api/symbol/e/${sym}/dividend`,
    parser: 'stockanalysis',
  }),
};

/**
 * The series. `since` is the first date requested on a backfill (the tools
 * already start in 2010; the requirement is at least ten years).
 */
export const SERIES = [
  // ---- funds: closes + distributions; total return computed by diBoaS ----
  {
    id: 'spy',
    kind: 'fund',
    label: 'SPDR S&P 500 ETF (SPY)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('SPY'),
    checks: [{ source: SOURCES.cnbc('SPY'), tolerance: 0.005 }],
    dividendChecks: [{ source: SOURCES.stockanalysis('spy'), from: '2021-12-01' }],
  },
  {
    id: 'qqq',
    kind: 'fund',
    label: 'Invesco QQQ Trust (QQQ)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('QQQ'),
    checks: [{ source: SOURCES.nasdaqHistorical('QQQ'), tolerance: 0.005, windowYears: 10 }],
    dividendChecks: [{ source: SOURCES.nasdaqDividends('QQQ') }],
  },
  {
    id: 'urth',
    kind: 'fund',
    label: 'iShares MSCI World ETF (URTH)',
    since: '2012-01-01',
    primary: SOURCES.yahoo('URTH'),
    checks: [{ source: SOURCES.nasdaqHistorical('URTH'), tolerance: 0.005, windowYears: 10 }],
    dividendChecks: [{ source: SOURCES.ishares('239696/ishares-msci-world-etf') }],
  },
  {
    id: 'tlt',
    kind: 'fund',
    label: 'iShares 20+ Year Treasury Bond ETF (TLT)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('TLT'),
    checks: [{ source: SOURCES.cnbc('TLT'), tolerance: 0.005 }],
    dividendChecks: [
      { source: SOURCES.ishares('239454/ishares-20-year-treasury-bond-etf') },
      { source: SOURCES.nasdaqDividends('TLT') },
    ],
  },
  // ---- prices ----
  {
    id: 'btc',
    kind: 'price',
    label: 'Bitcoin (USD, Yahoo BTC-USD daily OHLC)',
    // Yahoo starts on 2014-09-17. It stays the primary because the score's
    // monthly BTC candles (BTC-01..04) are built from its OHLC today; moving
    // them to another source would change the score, which is a methodology
    // decision, not a storage one.
    since: '2014-09-17',
    primary: SOURCES.yahoo('BTC-USD'),
    checks: [{ source: SOURCES.coinmetrics(), tolerance: 0.03 }],
  },
  {
    id: 'btc_coinmetrics',
    kind: 'price',
    label: 'Bitcoin (USD, Coin Metrics reference rate)',
    // The only keyless daily series before 2014-09 (the tools' 2010-07 →
    // 2014-08 months were built from it on 2026-05-23).
    since: '2010-07-18',
    primary: SOURCES.coinmetrics(),
    checks: [],
  },
  {
    id: 'gold_spot',
    kind: 'price',
    label: 'Gold spot (USD per troy ounce)',
    since: '2010-01-01',
    // Founder 2026-11-04: the spot price, not the GLD fund and not futures.
    // Primary: the OTC spot close (New York). Check: the LBMA PM fix via the
    // World Gold Council — a 15:00 London fix, so hours apart from the close.
    primary: SOURCES.cnbc('XAU='),
    checks: [{ source: SOURCES.wgc(), tolerance: 0.035 }],
  },
  {
    id: 'ibovespa',
    kind: 'price',
    label: 'Ibovespa (B3, points)',
    since: '2010-01-01',
    // The index includes reinvested dividends by construction. The OFFICIAL
    // B3 close is the primary: Yahoo's ^BVSP disagreed with B3 by more than
    // 0.1% on 97 of 4,174 days (up to 1.6%, mostly 2019-2023), while CNBC
    // agreed with B3 on all but 4 days (dry run 2026-11-04). B3 publishes the
    // close only, so the monthly high/low come from daily closes.
    primary: SOURCES.b3('IBOV'),
    checks: [{ source: SOURCES.cnbc('.BVSP'), tolerance: 0.001 }],
  },
  {
    id: 'dax',
    kind: 'price',
    label: 'DAX (performance index, points)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('^GDAXI'),
    checks: [{ source: SOURCES.cnbc('.GDAXI'), tolerance: 0.005, since: '2015-01-02' }],
  },
  {
    id: 'nasdaq_composite',
    kind: 'price',
    label: 'Nasdaq Composite (points)',
    since: '2010-01-01',
    primary: SOURCES.fred('NASDAQCOM'),
    checks: [{ source: SOURCES.cnbc('.IXIC'), tolerance: 0.002 }],
  },
  // ---- official rates (one publisher; no independent second source exists) ----
  {
    id: 'dollar_broad',
    kind: 'rate',
    label: 'Nominal broad US dollar index (Fed)',
    since: '2010-01-01',
    primary: SOURCES.fred('DTWEXBGS'),
    checks: [],
  },
  {
    id: 'us10y',
    kind: 'rate',
    label: 'US 10-year Treasury yield (%)',
    since: '2010-01-01',
    primary: SOURCES.fred('DGS10'),
    checks: [],
  },
  {
    id: 'us_m2',
    kind: 'monthly',
    label: 'US M2 money stock (USD bn, SA)',
    since: '2010-01-01',
    primary: SOURCES.fred('M2SL'),
    checks: [],
    revisable: true,
  },
  // ---- FX: Fed H.10 noon New York rates; checked against market closes ----
  ...[
    ['fx_eur', 'DEXUSEU', 'EUR=', 'USD per EUR'],
    ['fx_gbp', 'DEXUSUK', 'GBP=', 'USD per GBP'],
    ['fx_aud', 'DEXUSAL', 'AUD=', 'USD per AUD'],
    ['fx_jpy', 'DEXJPUS', 'JPY=', 'JPY per USD'],
    ['fx_chf', 'DEXSZUS', 'CHF=', 'CHF per USD'],
    ['fx_cad', 'DEXCAUS', 'CAD=', 'CAD per USD'],
    ['fx_mxn', 'DEXMXUS', 'MXN=', 'MXN per USD'],
    ['fx_brl', 'DEXBZUS', 'BRL=', 'BRL per USD'],
  ].map(([id, fred, cnbc, unit]) => ({
    id,
    kind: 'rate',
    label: `FX ${unit} (Fed H.10, noon New York)`,
    since: '2010-01-01',
    primary: SOURCES.fred(fred),
    // A noon rate against a 17:00 close of the same pair.
    checks: [{ source: SOURCES.cnbc(cnbc), tolerance: 0.015 }],
  })),
];

export const SERIES_BY_ID = new Map(SERIES.map((s) => [s.id, s]));
