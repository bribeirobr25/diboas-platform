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
 *   'monthly'    published once a month (M2, monthly interest rates)
 *   'index'      a monthly price index (consumer prices); checks compare the
 *                month-on-month change, because agencies publish the same
 *                index on different base years
 *
 * Check `relation` (every check states one; the check report repeats it):
 *   'independent'  a separate pipeline measuring the same thing (another
 *                  market-data vendor, another exchange, the LBMA fix)
 *   'same-figure'  another publication of the SAME official figure (BIS or
 *                  the ECB republishing a national index, FRED republishing
 *                  the Treasury). It catches transport, parsing, labelling and
 *                  alignment errors, never an error at the compiler.
 *
 * Check `compare` (see collect.mjs `comparable`): absent = the values, with a
 * relative tolerance; 'points' = the values, with an absolute tolerance in
 * percentage points (interest rates); 'change' = the month-on-month % change,
 * absolute tolerance in points (price indices).
 */

const DAY = 86_400_000;
const yyyymmdd = (d) => d.replaceAll('-', '');
const unix = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 1000);
const dmy = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

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
  bitstamp: () => ({
    provider: 'bitstamp',
    // up to 1,000 UTC days per page, from `start` (unix seconds)
    url: (from) =>
      `https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400&limit=1000&start=${unix(from)}`,
    parser: 'bitstamp',
    pagedByStart: true,
  }),
  coinbase: () => ({
    provider: 'coinbase',
    // at most 300 candles per request
    url: (from, to) =>
      `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=${from}T00:00:00Z&end=${to}T00:00:00Z`,
    parser: 'coinbase',
    chunkDays: 299,
  }),
  stockanalysis: (sym) => ({
    provider: 'stockanalysis',
    url: () => `https://stockanalysis.com/api/symbol/e/${sym}/dividend`,
    parser: 'stockanalysis',
  }),
  // ---- official statistics (plan 5.760, 2026-11-05; probed and agreed that day) ----
  ecb: (flow, key) => ({
    provider: 'ecb',
    url: (from) =>
      `https://data-api.ecb.europa.eu/service/data/${flow}/${key}?format=csvdata&startPeriod=${from.slice(0, 7)}`,
    parser: 'sdmx',
  }),
  bis: (country) => ({
    provider: 'bis',
    url: (from) =>
      `https://stats.bis.org/api/v2/data/dataflow/BIS/WS_LONG_CPI/1.0/M.${country}.628?format=csv&startPeriod=${from.slice(0, 7)}`,
    parser: 'sdmx',
  }),
  bundesbank: (flow, key) => ({
    provider: 'bundesbank',
    url: (from) =>
      `https://api.statistiken.bundesbank.de/rest/data/${flow}/${key}?startPeriod=${from.slice(0, 7)}`,
    headers: { Accept: 'text/csv' },
    parser: 'sdmx',
  }),
  bls: (id) => ({
    provider: 'bls',
    // public API v1: no key, at most ten calendar years per request. The years
    // must go in a POST body: a GET ignores them and returns the last three
    // years (measured 2026-11-05).
    url: () => 'https://api.bls.gov/publicAPI/v1/timeseries/data/',
    body: (from, to) =>
      JSON.stringify({ seriesid: [id], startyear: from.slice(0, 4), endyear: to.slice(0, 4) }),
    headers: { 'Content-Type': 'application/json' },
    parser: 'bls',
    parserOpts: { seriesId: id },
    chunkDays: 3000,
  }),
  sidraIpca: () => ({
    provider: 'ibge',
    // table 1737, variable 2266: the IPCA index level (Dec 1993 = 100)
    url: (from, to) =>
      `https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2266/p/${from.slice(0, 4)}${from.slice(5, 7)}-${to.slice(0, 4)}${to.slice(5, 7)}/d/v2266%2013`,
    parser: 'sidra',
  }),
  sgs: (code, { daily = false, fullMonthPeriods = false } = {}) => ({
    provider: 'bcb',
    ...(fullMonthPeriods ? { parserOpts: { fullMonthPeriods: true } } : {}),
    url: (from, to) =>
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${dmy(from)}&dataFinal=${dmy(to)}`,
    parser: 'sgs',
    // daily series answer at most ten years per request
    ...(daily ? { chunkDays: 3000 } : {}),
  }),
  eurostat: (geo) => ({
    provider: 'eurostat',
    // HICP under ECOICOP 2018 (2025 = 100), back-cast by Eurostat to 2010
    url: (from) =>
      `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr?geo=${geo}&coicop18=TOTAL&unit=I25&sinceTimePeriod=${from.slice(0, 7)}`,
    parser: 'eurostat',
  }),
  bde: (table, code) => ({
    provider: 'bde',
    url: () => `https://www.bde.es/webbe/es/estadisticas/compartido/datos/csv/${table}.csv`,
    parser: 'bde',
    parserOpts: { code },
    encoding: 'latin1',
  }),
  treasury: (column) => ({
    provider: 'treasury',
    url: (year) =>
      `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`,
    parser: 'treasury',
    parserOpts: { column },
    perYear: true,
  }),
};

/**
 * The series. `since` is the first date requested on a backfill (the tools
 * already start in 2010; the requirement is at least ten years). A series
 * whose only source starts later says so in `historyLimit`; the store's
 * README states it, and a tool that uses the series must show it (plan 5.760,
 * increment 4).
 */
export const SERIES = [
  // ---- funds: closes + distributions; total return computed by diBoaS ----
  {
    id: 'spy',
    kind: 'fund',
    label: 'SPDR S&P 500 ETF (SPY)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('SPY'),
    checks: [{ source: SOURCES.cnbc('SPY'), tolerance: 0.005, relation: 'independent' }],
    dividendChecks: [{ source: SOURCES.stockanalysis('spy'), from: '2021-12-01' }],
  },
  {
    id: 'qqq',
    kind: 'fund',
    label: 'Invesco QQQ Trust (QQQ)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('QQQ'),
    // Nasdaq's historical endpoint covers the last ten years only; CNBC covers 2010 on.
    checks: [
      { source: SOURCES.cnbc('QQQ'), tolerance: 0.005, relation: 'independent' },
      {
        source: SOURCES.nasdaqHistorical('QQQ'),
        tolerance: 0.005,
        since: '2016-11-01',
        relation: 'independent',
      },
    ],
    dividendChecks: [{ source: SOURCES.nasdaqDividends('QQQ') }],
  },
  {
    id: 'urth',
    kind: 'fund',
    label: 'iShares MSCI World ETF (URTH)',
    since: '2012-01-01',
    primary: SOURCES.yahoo('URTH'),
    checks: [
      { source: SOURCES.cnbc('URTH'), tolerance: 0.005, relation: 'independent' },
      {
        source: SOURCES.nasdaqHistorical('URTH'),
        tolerance: 0.005,
        since: '2016-11-01',
        relation: 'independent',
      },
    ],
    dividendChecks: [{ source: SOURCES.ishares('239696/ishares-msci-world-etf') }],
  },
  {
    id: 'tlt',
    kind: 'fund',
    label: 'iShares 20+ Year Treasury Bond ETF (TLT)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('TLT'),
    checks: [{ source: SOURCES.cnbc('TLT'), tolerance: 0.005, relation: 'independent' }],
    dividendChecks: [
      { source: SOURCES.ishares('239454/ishares-20-year-treasury-bond-etf') },
      { source: SOURCES.nasdaqDividends('TLT') },
    ],
  },
  // ---- prices ----
  {
    id: 'btc',
    kind: 'price',
    label: 'Bitcoin (USD, Coin Metrics reference rate)',
    // A multi-exchange reference rate, 2010-07-18 on. Yahoo's BTC-USD was the
    // first choice and was REJECTED by review (2026-11-05): it is 1-3% off both
    // Coinbase and Bitstamp on 104 days, mostly 2017-2019. Coin Metrics agrees
    // with Coinbase, by close or inside Coinbase's day range, on 4,124 of
    // 4,125 days. It publishes one daily value, so monthly high/low come from
    // daily values (the score reads monthly closes only). No independent
    // source covers 2010-07 to 2012 (Bitstamp then traded thinly): that span
    // is single-source and the check report says so.
    since: '2010-07-18',
    // Bitcoin trades every day: a month is complete only once its last calendar day is stored (5.850).
    calendar: 'daily',
    // What the stored value IS (5.776, measured 2026-11-05): an exchange's daily close is
    // its last trade; this is not. A day the two disagree on can be a difference of
    // definition, not an error (2022-06-30: Coinbase moved about 5% in the last 15 minutes).
    definition:
      'Coin Metrics daily PriceUSD behaves as a time average of roughly the last 30 minutes before 00:00 UTC; exchanges close on their last trade. Measured on 2022-06-30 (register 5.776); whether it holds in every year is not established.',
    primary: SOURCES.coinmetrics(),
    // Bitcoin trades every day: Saturday's collection ends on Friday, already past the score's
    // 3-day limit on a Tuesday. The Tuesday top-up brings it to Monday (MP-3b, scenario G).
    topUp: true,
    checks: [
      {
        source: SOURCES.coinbase(),
        tolerance: 0.02,
        rangeSlack: 0.005,
        since: '2015-07-20',
        relation: 'independent',
      },
      {
        source: SOURCES.bitstamp(),
        tolerance: 0.03,
        rangeSlack: 0.005,
        since: '2013-01-01',
        relation: 'independent',
      },
    ],
  },
  {
    id: 'gold_spot',
    kind: 'price',
    label: 'Gold spot (USD per troy ounce)',
    since: '2010-01-01',
    // Founder 2026-11-04: the spot price, not the GLD fund and not futures.
    // Primary: the OTC spot close (New York). Check: the LBMA PM fix via the
    // World Gold Council — a 15:00 London fix, so hours apart from the close.
    // The fix is a single value with no range, so the stored close is tested
    // by tolerance alone: a day the market moved more than 3.5% after the fix
    // is an outlier a person reviews (four FOMC/crash days since 2010).
    // Gold futures (GC=F) were measured as a second check and rejected: their
    // basis to spot reached 6.9% in March 2020.
    primary: SOURCES.cnbc('XAU='),
    // The score's gold limit is 5 days: Saturday's Friday close is past it by Wednesday's retry,
    // so the Tuesday top-up adds Monday's (MP-3b review).
    topUp: true,
    checks: [{ source: SOURCES.wgc(), tolerance: 0.035, relation: 'independent' }],
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
    checks: [{ source: SOURCES.cnbc('.BVSP'), tolerance: 0.001, relation: 'independent' }],
  },
  {
    id: 'dax',
    kind: 'price',
    label: 'DAX (performance index, points)',
    since: '2010-01-01',
    primary: SOURCES.yahoo('^GDAXI'),
    checks: [{ source: SOURCES.cnbc('.GDAXI'), tolerance: 0.005, relation: 'independent' }],
  },
  {
    id: 'nasdaq_composite',
    kind: 'price',
    label: 'Nasdaq Composite (points)',
    since: '2010-01-01',
    primary: SOURCES.fred('NASDAQCOM'),
    // Published on Monday (the Fed's H.10 and broad dollar index; FRED a business day late):
    // the Tuesday refresh's top-up collects it before the score reads the store (MP-3b, TOPUP-1).
    topUp: true,
    checks: [{ source: SOURCES.cnbc('.IXIC'), tolerance: 0.002, relation: 'independent' }],
  },
  // ---- official rates (one publisher; no independent second source exists) ----
  {
    id: 'dollar_broad',
    kind: 'rate',
    label: 'Nominal broad US dollar index (Fed)',
    since: '2010-01-01',
    primary: SOURCES.fred('DTWEXBGS'),
    // Published on Monday (the Fed's H.10 and broad dollar index; FRED a business day late):
    // the Tuesday refresh's top-up collects it before the score reads the store (MP-3b, TOPUP-1).
    topUp: true,
    checks: [],
  },
  {
    id: 'us10y',
    kind: 'rate',
    label: 'US 10-year Treasury yield (%)',
    since: '2010-01-01',
    primary: SOURCES.fred('DGS10'),
    // Published on Monday (the Fed's H.10 and broad dollar index; FRED a business day late):
    // the Tuesday refresh's top-up collects it before the score reads the store (MP-3b, TOPUP-1).
    topUp: true,
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
    // The Fed revises months older than any overlap window (2026-01..05 were
    // revised between the 06-30 and 11-04 vintages), so every run re-reads
    // the whole series: about 200 rows.
    fullHistory: true,
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
    ['fx_brl', 'DEXBZUS', 'BRL=', 'BRL per USD', 0.0075],
  ].map(([id, fred, cnbc, unit, tolerance = 0.005]) => ({
    id,
    kind: 'rate',
    label: `FX ${unit} (Fed H.10, noon New York)`,
    since: '2010-01-01',
    primary: SOURCES.fred(fred),
    // Published on Monday (the Fed's H.10 and broad dollar index; FRED a business day late):
    // the Tuesday refresh's top-up collects it before the score reads the store (MP-3b, TOPUP-1).
    topUp: true,
    // A noon rate against a 17:00 close of the same pair: a day passes when
    // the two agree within the tolerance OR the stored noon rate lies inside
    // CNBC's traded range that day. Measured 2010-2026: at 0.5% + range, 0
    // outliers for seven pairs; BRL (onshore vs offshore prints) takes 0.75%, with
    // three days reviewed in the store (Fed vs CNBC; the ECB rate as third source).
    checks: [{ source: SOURCES.cnbc(cnbc), tolerance, rangeSlack: 0.003, relation: 'independent' }],
  })),
  // ---- consumer prices: monthly index levels; checks compare the monthly change ----
  // Founder 2026-11-05: inflation is stored, not hand-typed (DR items 4, 12).
  // Each is read whole every run (about 200 rows): Eurostat revises its flash
  // estimate, and a whole history is what the change checks compare.
  {
    id: 'cpi_us',
    kind: 'index',
    label: 'US CPI-U, all items, not seasonally adjusted (BLS, 1982-84 = 100)',
    since: '2010-01-01',
    primary: SOURCES.bls('CUUR0000SA0'),
    // BLS published no 2025-10 index (the 2025 shutdown): that month and the
    // change into the next one are absent, never interpolated. The OECD's copy
    // was tested as a second check and dropped: its API answered HTTP 500 on
    // 2026-11-05, and a check that fails blocks the series.
    checks: [
      { source: SOURCES.bis('US'), compare: 'change', tolerance: 0.02, relation: 'same-figure' },
    ],
    fullHistory: true,
  },
  {
    id: 'cpi_br',
    kind: 'index',
    label: 'Brazil IPCA (IBGE, Dec 1993 = 100)',
    since: '2010-01-01',
    primary: SOURCES.sidraIpca(),
    checks: [
      // the BCB publishes the IPCA's monthly change itself (2 decimals)
      {
        source: SOURCES.sgs(433),
        compare: 'change',
        checkIsChange: true,
        tolerance: 0.01,
        relation: 'same-figure',
      },
      { source: SOURCES.bis('BR'), compare: 'change', tolerance: 0.02, relation: 'same-figure' },
    ],
    fullHistory: true,
  },
  ...[
    ['hicp_de', 'DE', 'Germany'],
    ['hicp_es', 'ES', 'Spain'],
  ].map(([id, geo, name]) => ({
    id,
    kind: 'index',
    label: `${name} HICP (Eurostat, ECOICOP 2018, 2025 = 100)`,
    since: '2010-01-01',
    primary: SOURCES.eurostat(geo),
    // The ECB republishes Eurostat's HICP: this check catches a transport or
    // parsing error, not an error at Eurostat (no independent HICP source is
    // free; BIS carries the national VPI/IPC, a different index).
    checks: [
      {
        source: SOURCES.ecb('HICP', `M.${geo}.N.000000.4D0.INX`),
        compare: 'change',
        tolerance: 0.01,
        relation: 'same-figure',
      },
    ],
    revisable: true,
    fullHistory: true,
  })),
  // ---- interest rates (founder 2026-11-05, DR items 9, 13, 17, 18) ----
  {
    id: 'rate_us_1y',
    kind: 'rate',
    label: 'US 1-year Treasury constant-maturity yield (%)',
    since: '2010-01-01',
    primary: SOURCES.fred('DGS1'),
    checks: [
      {
        source: SOURCES.treasury('1 Yr'),
        compare: 'points',
        tolerance: 0.005,
        relation: 'same-figure',
      },
    ],
  },
  {
    id: 'rate_us_savings',
    kind: 'monthly',
    label: 'US national rate on savings deposits (FDIC, %)',
    since: '2021-04-01',
    historyLimit:
      'FRED carries the FDIC rate from 2021-04 (the current method); 2009-2021 is in the FDIC archive under an older method and is to be added (founder 2026-11-05).',
    // FDIC's own page is not machine-readable; FRED carries the FDIC series.
    primary: SOURCES.fred('SNDR'),
    checks: [],
    fullHistory: true,
  },
  {
    id: 'rate_br_selic',
    kind: 'rate',
    label: 'Brazil Selic target (BCB SGS 432, % a year)',
    since: '2010-01-01',
    primary: SOURCES.sgs(432, { daily: true }),
    checks: [],
  },
  {
    id: 'rate_br_selic_effective',
    kind: 'rate',
    label: 'Brazil Selic, effective, annualised (BCB SGS 1178, % a year)',
    since: '2010-01-01',
    primary: SOURCES.sgs(1178, { daily: true }),
    checks: [],
  },
  {
    id: 'rate_br_cdi',
    kind: 'rate',
    label: 'Brazil CDI (BCB SGS 12, % a day)',
    since: '2010-01-01',
    primary: SOURCES.sgs(12, { daily: true }),
    // The interbank CDI has no independent free source. The overnight Selic
    // (SGS 11) was measured as a check and REJECTED: it is a different rate,
    // up to 0.0014 points a day apart in 2012-2014 (identical only since 2020).
    checks: [],
  },
  {
    id: 'rate_br_tr',
    kind: 'monthly',
    label: 'Brazil TR, reference rate (BCB SGS 7811, % a month)',
    since: '2010-01-01',
    primary: SOURCES.sgs(7811),
    // SGS 226 publishes TR by start date; its month-first value is the month's TR.
    checks: [
      {
        source: SOURCES.sgs(226, { daily: true, fullMonthPeriods: true }),
        compare: 'points',
        onlyFirstOfMonth: true,
        tolerance: 0.00005,
        relation: 'same-figure',
      },
    ],
    fullHistory: true,
  },
  {
    id: 'rate_br_poupanca',
    kind: 'monthly',
    label: 'Brazil poupança return (BCB SGS 196, % a month)',
    since: '2012-06-01',
    primary: SOURCES.sgs(196),
    checks: [],
    fullHistory: true,
  },
  ...[
    ['de', 'DE', 'Germany', SOURCES.bundesbank, null],
    ['es', 'ES', 'Spain', null, ['be1907', 'DN_1TI1T0010', 'DN_1TI2T0025']],
  ].flatMap(([cc, area, name, bbk, bde]) =>
    [
      ['overnight', 'L21.A', 'household overnight deposits', bde?.[1]],
      ['deposit_1y', 'L22.F', 'household deposits up to 1 year, new business', bde?.[2]],
    ].map(([what, item, words, bdeCode]) => ({
      id: `rate_${cc}_${what}`,
      kind: 'monthly',
      label: `${name}: ${words} (ECB MIR, %)`,
      since: '2010-01-01',
      primary: SOURCES.ecb('MIR', `M.${area}.B.${item}.R.A.2250.EUR.N`),
      checks: [
        bbk
          ? {
              source: bbk('BBIM1', `M.DE.B.${item}.R.A.2250.EUR.N`),
              compare: 'points',
              tolerance: 0.006,
              relation: 'same-figure',
            }
          : {
              source: SOURCES.bde(bde[0], bdeCode),
              compare: 'points',
              tolerance: 0.006,
              relation: 'same-figure',
            },
      ],
      fullHistory: true,
    }))
  ),
  {
    id: 'rate_de_1y',
    kind: 'monthly',
    label:
      'Germany 1-year federal securities yield (Bundesbank fitted term structure, month-end, %)',
    since: '2010-01-01',
    primary: SOURCES.bundesbank('BBSIS', 'M.I.ZST.ZI.EUR.S1311.B.A604.R01XX.R.A.A._Z._Z.A'),
    checks: [],
    fullHistory: true,
  },
  {
    id: 'rate_es_1y',
    kind: 'monthly',
    label:
      'Spain 12-month Letras del Tesoro yield (Banco de España, monthly average of secondary trades, %)',
    since: '2019-01-01',
    historyLimit:
      "Banco de España's table starts in 2019 (2019-06 has no trades); 2010-2018 is to come from the Spanish Treasury's own auction history if it is free (founder 2026-11-05).",
    primary: SOURCES.bde('be2206', 'DMPLETIBEORCFE00345A00376TIRMEP.M'),
    checks: [],
    fullHistory: true,
  },
];

export const SERIES_BY_ID = new Map(SERIES.map((s) => [s.id, s]));
