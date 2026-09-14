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
import { Logger } from '@/lib/monitoring/Logger';

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
  vi.doUnmock('@/../data/market/shared/regime.json');
  vi.doUnmock('@/../data/market/shared/signals.json');
  vi.resetModules();
});

async function loadFreshModule() {
  return import('../mock-client.server');
}

describe('analytics-sdk — composite resilience (regime + signals transforms)', () => {
  it('returns regime: null when underlying regime.json is malformed; other endpoints populated', async () => {
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));

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
    vi.doMock('@/../data/market/shared/signals.json', () => ({ default: MALFORMED_SIGNALS }));

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
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));
    vi.doMock('@/../data/market/shared/signals.json', () => ({ default: MALFORMED_SIGNALS }));

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
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));

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

/**
 * 5.299 — a degraded read must be REPORTED, not merely survived.
 *
 * Before this, the six fetchers were bare `.catch(() => null)`: the page
 * degraded honestly and told nobody. These assertions pin the reporting, and
 * they are written to FAIL if it is removed — deleting the `reportFetchFailure`
 * call from any catch drops that endpoint's `Logger.error`, and the first two
 * cases below go red. (Sentry is deliberately not asserted: it is a dynamic
 * import that is a no-op in the test runtime, so asserting it would be a
 * vacuous test of a mock rather than of behaviour. `Logger.error` is the call
 * that always happens, in every runtime.)
 */
describe('analytics-sdk — a degraded endpoint is reported (5.299)', () => {
  it('should report the failing endpoint by name, once, and still degrade to null', async () => {
    const spy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));

    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result.regime).toBeNull(); // degradation unchanged
    const calls = spy.mock.calls.filter((c) => c[0] === 'market analytics fetch failed');
    expect(calls, 'exactly one report for the one failed endpoint').toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ surface: 'market', endpoint: 'current-regime' });
    expect(calls[0][2]).toBeInstanceOf(Error);
    spy.mockRestore();
  });

  it('should report EACH failing endpoint separately when two fail', async () => {
    const spy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));
    vi.doMock('@/../data/market/shared/signals.json', () => ({ default: MALFORMED_SIGNALS }));

    const mod = await loadFreshModule();
    await mod.fetchInitialAnalyticsData('en');

    const endpoints = spy.mock.calls
      .filter((c) => c[0] === 'market analytics fetch failed')
      .map((c) => (c[1] as { endpoint: string }).endpoint)
      .sort();
    expect(endpoints).toEqual(['current-regime', 'signals']);
    spy.mockRestore();
  });

  it('should carry the correlationId onto the report when the caller supplies one', async () => {
    const spy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    vi.doMock('@/../data/market/shared/regime.json', () => ({ default: MALFORMED_REGIME }));

    const mod = await loadFreshModule();
    await mod.fetchInitialAnalyticsData('en', 'bitcoin', { correlationId: 'req-abc-123' });

    const call = spy.mock.calls.find((c) => c[0] === 'market analytics fetch failed');
    expect(call?.[1]).toMatchObject({ correlationId: 'req-abc-123', view: 'bitcoin' });
    spy.mockRestore();
  });

  it('should NOT report when every endpoint is healthy', async () => {
    const spy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    const mod = await loadFreshModule();
    const result = await mod.fetchInitialAnalyticsData('en');

    expect(result.regime).not.toBeNull();
    expect(
      spy.mock.calls.filter((c) => c[0] === 'market analytics fetch failed'),
      'a healthy read must be silent — otherwise the signal is noise'
    ).toHaveLength(0);
    spy.mockRestore();
  });
});
