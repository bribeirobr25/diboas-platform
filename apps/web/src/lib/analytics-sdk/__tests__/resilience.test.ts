/**
 * Page-level resilience guard — composite fetcher path (iter-3 §3.7).
 *
 * The /market RSC composes the dashboard from six fetchers wrapped in
 * `Promise.all([... .catch(() => null), ...])` inside `fetchInitialAnalyticsData`.
 * The page then conditionally renders each section based on `regime && ...`,
 * `signals && signals.signal_groups.length > 0 && ...`, etc.
 *
 * Scope of this test (honest framing per M4 round-1 + verified iter-2
 * implementation): only the fetchers that perform a non-trivial transform
 * — `fetchRegime` (locale-flattens `regime.signal_groups`) and
 * `fetchSignals` (locale-flattens `signals.groups`) — can throw on
 * structurally-malformed input. The other 4 fetchers are pass-through
 * (`fetchHistoricalRegimes`, `fetchDataStatus`, `fetchMethodology`,
 * `fetchProductDisclaimer` all return the JSON shape as-is) and their
 * resilience is enforced at the page-component conditional layer instead
 * (`historical && historical.snapshots.length > 0 && ...`), not by the
 * composite's `.catch(() => null)`.
 *
 * NOT covered here (caught earlier in the pipeline):
 *  - A missing JSON file → fails `pnpm --filter web build` (static imports
 *    are inlined at build time; absence is a compile-time failure).
 *  - A syntactically-invalid JSON file → same build-time failure path.
 *  - A schema-violating JSON file → caught by the fixture-drift guard
 *    (fixtures.test.ts) at PR time.
 *
 * Each test uses `vi.resetModules()` + `vi.doMock` + a fresh dynamic
 * `import` so the underlying JSON import is replaced before module
 * evaluation (static JSON imports are inlined at module load; we have to
 * reload the module to swap the inlined value).
 *
 * Plan: docs/audit/MARKET_INTEGRATION_ITERATION_3_PLAN_2026-05-14.md §3.7.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Malformed payloads: keep top-level shape valid enough that the import-time
// shape match doesn't blow up, but break the field the transform walks.
const MALFORMED_REGIME = {
  score: 10,
  max_score: 14,
  regime_code: 'CONSTRUCTIVE',
  regime_label: 'Constructive',
  environment_bias: 'CONSTRUCTIVE',
  last_updated_at: new Date().toISOString(),
  summary: {
    en: {
      short: 's',
      detailed: 'd',
      confidence_level: 'HIGH',
      mixed_signals: false,
      key_supportive_factors: [],
      key_headwinds: [],
    },
    'pt-BR': {
      short: 's',
      detailed: 'd',
      confidence_level: 'HIGH',
      mixed_signals: false,
      key_supportive_factors: [],
      key_headwinds: [],
    },
    es: {
      short: 's',
      detailed: 'd',
      confidence_level: 'HIGH',
      mixed_signals: false,
      key_supportive_factors: [],
      key_headwinds: [],
    },
    de: {
      short: 's',
      detailed: 'd',
      confidence_level: 'HIGH',
      mixed_signals: false,
      key_supportive_factors: [],
      key_headwinds: [],
    },
  },
  // signal_groups expected to be an array; `flattenRegime` calls `.map` on it.
  // null → throws "Cannot read properties of null (reading 'map')".
  signal_groups: null,
  data_status: {
    overall_confidence: 'HIGH',
    last_successful_update_at: null,
    sources: [],
    delayed_sources: [],
    unavailable_sources: [],
  },
};

// `fetchSignals` does `raw.groups.map(...)`. null `groups` triggers throw.
const MALFORMED_SIGNALS = { groups: null };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock('@/../data/market/regime.json');
  vi.doUnmock('@/../data/market/signals.json');
  vi.resetModules();
});

async function loadFreshModule() {
  return import('../mock-client.server');
}

describe('analytics-sdk — composite resilience (regime + signals transforms)', () => {
  it('returns regime: null when underlying regime.json is malformed; other endpoints populated', async () => {
    vi.doMock('@/../data/market/regime.json', () => ({ default: MALFORMED_REGIME }));

    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result.regime).toBeNull();
    expect(result.signals).not.toBeNull();
    expect(result.historical).not.toBeNull();
    expect(result.dataStatus).not.toBeNull();
    expect(result.methodology).not.toBeNull();
    expect(result.productDisclaimer).not.toBeNull();
  });

  it('returns signals: null when underlying signals.json is malformed; other endpoints populated', async () => {
    vi.doMock('@/../data/market/signals.json', () => ({ default: MALFORMED_SIGNALS }));

    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result.signals).toBeNull();
    expect(result.regime).not.toBeNull();
    expect(result.historical).not.toBeNull();
    expect(result.dataStatus).not.toBeNull();
    expect(result.methodology).not.toBeNull();
    expect(result.productDisclaimer).not.toBeNull();
  });

  it('returns regime + signals both null when both upstreams are malformed; pass-through endpoints still populated', async () => {
    vi.doMock('@/../data/market/regime.json', () => ({ default: MALFORMED_REGIME }));
    vi.doMock('@/../data/market/signals.json', () => ({ default: MALFORMED_SIGNALS }));

    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result.regime).toBeNull();
    expect(result.signals).toBeNull();
    // Methodology + disclaimer are pass-through and survive — proving the
    // composite isolates per-endpoint failures and the page can still render
    // its closing chrome (methodology link + disclaimers + powered-by).
    expect(result.methodology).not.toBeNull();
    expect(result.productDisclaimer).not.toBeNull();
  });

  it('returns the full shape (no missing keys) regardless of which endpoint throws — pages can rely on the contract', async () => {
    vi.doMock('@/../data/market/regime.json', () => ({ default: MALFORMED_REGIME }));

    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result).toHaveProperty('regime');
    expect(result).toHaveProperty('historical');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('dataStatus');
    expect(result).toHaveProperty('methodology');
    expect(result).toHaveProperty('productDisclaimer');
  });
});
