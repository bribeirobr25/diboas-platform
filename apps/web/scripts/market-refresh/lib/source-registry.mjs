/**
 * source-registry.mjs — the ONE list of the /market score's sources (plan MP-3a; register
 * `5.300`, `5.765`).
 *
 * Before this, the source list existed five times in five shapes: the score's fetches and
 * recency limits (`market-sources.mjs`), the freshness panel (`data-status.mjs`), the view
 * labels (`src/lib/market/viewRegistry.ts`), the quality bounds keyed by kind
 * (`quality-gate.mjs`) and the store's catalogue (`market-data/catalogue.mjs`), with nothing
 * asserting they agree. Now the score's recency limits, quality checks and the panel's rows
 * are DERIVED from this list, and `sourceRegistry.test.ts` (gate SRC-REG-1) fails when the
 * view labels, the fetches or the catalogue links disagree with it.
 *
 * Why beside the catalogue, not inside it: the catalogue describes the STORE's series, and
 * until plan MP-4 the score still fetches two sources the store does not serve as such
 * (Yahoo's Bitcoin daily and gold futures). Each entry links to its catalogue series by
 * `storeSeries`; MP-4 folds the score's half into the catalogue when the score reads the
 * store.
 *
 * Fields:
 *   label          the source id the panel, the labels and the quality errors use
 *   key            the property of `fetchMarketSources()`'s result that carries it
 *   provider/series what the score fetches today (null for the two non-fetched panel rows)
 *   storeSeries    the catalogue series id, or null with `noStoreReason`
 *   switchTo       for a source the store does not keep: the store series plan MP-4 reads instead
 *   signals        the signal ids this source feeds
 *   check          how the quality gate checks it: 'daily' (with `boundsKey`), 'rate', 'monthly'
 *   recencyMaxDays the newest point must be at most this old (null: not fetched)
 *   panelKind      the freshness rule (`data-status.mjs`); null = no panel row
 *   description    the panel's text for a weekly row
 *   labelKey / views  the view label and the views that show it
 *   exception      a stated reason a source breaks the "one row per source" rule
 */
export const SCORE_SOURCES = Object.freeze([
  {
    label: 'in-repo:monthlyPrices.json (BTC)',
    provider: null,
    series: null,
    storeSeries: 'btc',
    signals: ['BTC-01', 'BTC-02'],
    check: null,
    recencyMaxDays: null,
    panelKind: 'monthly-close',
    description: null,
    labelKey: 'dashboard.sources.btc',
    views: ['bitcoin'],
  },
  {
    label: 'FRED:DGS10',
    key: 'us10y',
    provider: 'fred',
    series: 'DGS10',
    storeSeries: 'us10y',
    signals: ['MAC-02'],
    check: 'rate',
    recencyMaxDays: 7,
    panelKind: 'weekly-friday',
    description: 'US 10-year constant-maturity yield.',
    labelKey: 'dashboard.sources.us10y',
    views: ['bitcoin', 'backdrop'],
  },
  {
    label: 'FRED:DTWEXBGS',
    key: 'dxy',
    provider: 'fred',
    series: 'DTWEXBGS',
    storeSeries: 'dollar_broad',
    signals: ['MAC-01'],
    check: 'daily',
    boundsKey: 'dollarIndexDaily',
    recencyMaxDays: 14,
    panelKind: 'weekly-friday',
    description:
      'Broad trade-weighted U.S. dollar index (FRED DTWEXBGS), a different index from the ICE DXY.',
    labelKey: 'dashboard.sources.dxy',
    views: ['bitcoin', 'backdrop'],
  },
  {
    label: 'FRED:M2SL',
    key: 'm2',
    provider: 'fred',
    series: 'M2SL',
    storeSeries: 'us_m2',
    signals: ['MAC-03'],
    check: 'monthly',
    boundsKey: 'm2Monthly',
    recencyMaxDays: 92,
    panelKind: 'monthly-print',
    description: null,
    labelKey: 'dashboard.sources.m2',
    views: ['bitcoin', 'backdrop'],
  },
  {
    label: 'FRED:NASDAQCOM',
    key: 'nasdaq',
    provider: 'fred',
    series: 'NASDAQCOM',
    storeSeries: 'nasdaq_composite',
    signals: ['REL-03'],
    check: 'daily',
    boundsKey: 'equityIndexDaily',
    recencyMaxDays: 7,
    panelKind: 'weekly-friday',
    description: 'Nasdaq Composite close.',
    labelKey: 'dashboard.sources.nasdaq',
    views: ['bitcoin'],
  },
  {
    label: 'Yahoo:GC=F',
    key: 'gold',
    provider: 'yahoo',
    series: 'GC=F',
    range: '1y',
    storeSeries: null,
    switchTo: 'gold_spot',
    noStoreReason:
      'gold futures; the store keeps spot gold (gold_spot), which plan MP-4 switches the score to',
    signals: ['REL-01'],
    check: 'daily',
    boundsKey: 'yahooDaily',
    recencyMaxDays: 5,
    panelKind: 'weekly-friday',
    description:
      'Gold futures front-month — SUBSTITUTE for the retired FRED LBMA series (methodology drift D-gold-2026-05-29).',
    labelKey: 'dashboard.sources.gold',
    views: ['bitcoin'],
  },
  {
    label: 'Yahoo:BTC-USD',
    key: 'btc',
    provider: 'yahoo',
    series: 'BTC-USD',
    range: '6mo',
    storeSeries: null,
    switchTo: 'btc',
    noStoreReason:
      'Yahoo daily Bitcoin for the two relative-strength ratios; the store keeps Coin Metrics (btc), which plan MP-4 switches the score to',
    signals: ['REL-01', 'REL-02'],
    check: 'daily',
    boundsKey: 'yahooDaily',
    recencyMaxDays: 3,
    panelKind: null,
    description: null,
    labelKey: null,
    views: [],
    exception:
      'fetched and gated but has no panel row (5.300): the panel shows Bitcoin once, from the monthly closes; plan MP-4 retires this source',
  },
  {
    label: 'Polygon:ETF (shares-outstanding)',
    provider: null,
    series: null,
    storeSeries: null,
    noStoreReason: 'the weekly ETF ledger; daily collection into the store is plan MP-5',
    signals: ['ETF-01'],
    check: null,
    recencyMaxDays: null,
    panelKind: 'warmup-ledger',
    description: null,
    labelKey: 'dashboard.sources.btcEtf',
    views: ['bitcoin'],
  },
]);

/** The sources the score fetches live today, in fetch order. */
export const FETCHED_SOURCES = SCORE_SOURCES.filter((s) => s.provider != null);

/** The freshness panel's rows, in panel order (one per source with a `panelKind`). */
export const PANEL_SOURCES = SCORE_SOURCES.filter((s) => s.panelKind != null);

/** The view-label map one view shows: `{ [label]: labelKey }`. */
export function sourceLabelKeysFor(view) {
  return Object.fromEntries(
    SCORE_SOURCES.filter((s) => s.views.includes(view)).map((s) => [s.label, s.labelKey])
  );
}
