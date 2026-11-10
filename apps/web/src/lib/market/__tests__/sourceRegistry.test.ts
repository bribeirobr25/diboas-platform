/**
 * SRC-REG-1 · the /market score's source list exists once (plan MP-3a; `5.300`, `5.765`).
 *
 * Requirement: the score's fetches, its recency limits, the freshness panel's rows, the view
 * labels and the store links all agree with `lib/source-registry.mjs`. Written BEFORE the
 * other lists were derived from the registry, so the registry cannot ship narrower than the
 * lists it replaces. A source the score fetches but the registry lacks fails here.
 *
 * Code-consistency only (no data read); outside the weekly-gate directories.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FETCHED_SOURCES,
  PANEL_SOURCES,
  SCORE_SOURCES,
  sourceLabelKeysFor,
} from '../../../../scripts/market-refresh/lib/source-registry.mjs';
import { RECENCY_SLA_DAYS } from '../../../../scripts/market-refresh/lib/market-sources.mjs';
import { SOURCE_REGISTRY } from '../../../../scripts/market-refresh/lib/data-status.mjs';
import { SERIES_BY_ID } from '../../../../scripts/market-data/catalogue.mjs';
import { OUTLIER_BOUNDS_PCT } from '../../../../scripts/market-refresh/lib/quality-gate.mjs';
import { MARKET_VIEWS } from '../viewRegistry';

type Source = {
  label: string;
  provider: string | null;
  series: string | null;
  range?: string;
  storeSeries: string | null;
  noStoreReason?: string;
  signals: string[];
  check: 'daily' | 'rate' | 'monthly' | null;
  boundsKey?: string;
  recencyMaxDays: number | null;
  panelKind: string | null;
  labelKey: string | null;
  views: string[];
  exception?: string;
};
const ALL = SCORE_SOURCES as unknown as Source[];

const MARKET_SOURCES_SRC = readFileSync(
  join(__dirname, '../../../../scripts/market-refresh/lib/market-sources.mjs'),
  'utf8'
);

describe('SRC-REG-1: one source list for the /market score', () => {
  it('should list every source the score fetches, with the same provider and series', () => {
    const fetched = [
      ...[...MARKET_SOURCES_SRC.matchAll(/fetchFredSeries\('([^']+)'\)/g)].map(
        (m) => `fred:${m[1]}`
      ),
      ...[...MARKET_SOURCES_SRC.matchAll(/fetchYahooDaily\('([^']+)'/g)].map(
        (m) => `yahoo:${m[1]}`
      ),
    ].sort();
    const registered = (FETCHED_SOURCES as unknown as Source[])
      .map((s) => `${s.provider}:${s.series}`)
      .sort();
    expect(fetched.length).toBeGreaterThan(0);
    expect(registered).toEqual(fetched);
  });

  it('should name, for every fetched source, a key fetchMarketSources() returns', () => {
    const body = MARKET_SOURCES_SRC.slice(
      MARKET_SOURCES_SRC.indexOf('export async function fetchMarketSources()')
    );
    const ret = body.match(/return \{ ([^}]+) \};/);
    expect(ret, 'the return statement of fetchMarketSources').not.toBeNull();
    const returned = ret![1]
      .split(',')
      .map((k) => k.trim())
      .sort();
    const keys = (FETCHED_SOURCES as unknown as (Source & { key: string })[])
      .map((s) => s.key)
      .sort();
    expect(keys).toEqual(returned);
  });

  it("should give the score exactly the registry's recency limits", () => {
    const expected = Object.fromEntries(
      (FETCHED_SOURCES as unknown as Source[]).map((s) => [s.label, s.recencyMaxDays])
    );
    expect({ ...RECENCY_SLA_DAYS }).toEqual(expected);
  });

  it('should give every fetched source a quality check, and every bounds key a real bound', () => {
    for (const s of FETCHED_SOURCES as unknown as Source[]) {
      expect(s.check, s.label).not.toBeNull();
      if (s.check !== 'rate') expect(OUTLIER_BOUNDS_PCT, s.label).toHaveProperty(s.boundsKey!);
    }
  });

  it('should build the freshness panel from the registry, in its order', () => {
    expect(SOURCE_REGISTRY).toEqual(
      (PANEL_SOURCES as unknown as Source[]).map((s) => ({
        source: s.label,
        kind: s.panelKind,
        signal: s.signals[0],
      }))
    );
  });

  it("should keep each view's source labels equal to the registry", () => {
    for (const [view, entry] of Object.entries(MARKET_VIEWS)) {
      const keys = (entry as { sourceLabelKeys?: Record<string, string> }).sourceLabelKeys;
      if (!keys) continue;
      expect(keys, view).toEqual(sourceLabelKeysFor(view));
    }
  });

  it('should link every source to a store series, or state why not', () => {
    for (const s of ALL) {
      if (s.storeSeries) expect(SERIES_BY_ID.has(s.storeSeries), s.label).toBe(true);
      else expect(s.noStoreReason?.length ?? 0, s.label).toBeGreaterThan(20);
    }
  });

  it('should give every fetched source a store series the reader can read (MP-4 switch targets included)', () => {
    for (const s of FETCHED_SOURCES as unknown as (Source & { switchTo?: string })[]) {
      const id = s.storeSeries ?? s.switchTo;
      expect(id, s.label).toBeTruthy();
      expect(SERIES_BY_ID.has(id!), s.label).toBe(true);
    }
  });

  it('should state the exception for a source with no panel row', () => {
    for (const s of ALL.filter((x) => x.panelKind == null))
      expect(s.exception?.length ?? 0, s.label).toBeGreaterThan(20);
  });

  it('should hold each label once', () => {
    const labels = ALL.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
