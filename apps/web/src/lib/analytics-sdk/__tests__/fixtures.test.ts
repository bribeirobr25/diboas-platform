/**
 * Fixture-drift guard — hand-rolled type guards (CC4: no Zod).
 *
 * Catches drift between fixture JSON and the canonical doc 07 §26 schema before
 * page renders an invalid payload at runtime. Iteration 5 deletes this file
 * when fixtures are removed.
 */

import { describe, expect, it } from 'vitest';

import constructive from '../fixtures/regime-constructive.json';
import veryFavorable from '../fixtures/regime-very-favorable.json';
import mixed from '../fixtures/regime-mixed.json';
import defensive from '../fixtures/regime-defensive.json';
import hostile from '../fixtures/regime-hostile.json';
import stale from '../fixtures/regime-stale.json';
import historical from '../fixtures/historical-regimes-1y.json';
import signals from '../fixtures/signals.json';
import dataStatus from '../fixtures/data-status.json';
import methodology from '../fixtures/methodology.json';
import productDisclaimer from '../fixtures/product-disclaimer.json';

// Iteration 3 editorial dataset (apps/web/data/market/). Imported via the
// same `@/../data/market/...` path the server fetcher uses (mock-client.server.ts).
import editorialRegime from '@/../data/market/regime.json';
import editorialHistorical from '@/../data/market/historical.json';
import editorialSignals from '@/../data/market/signals.json';
import editorialDataStatus from '@/../data/market/data-status.json';
import editorialMethodology from '@/../data/market/methodology.json';
import editorialProductDisclaimer from '@/../data/market/product-disclaimer.json';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const REGIME_CODES = [
  'VERY_FAVORABLE',
  'CONSTRUCTIVE',
  'NEUTRAL_MIXED',
  'DEFENSIVE',
  'HOSTILE',
] as const;
const FRESHNESS_STATUSES = ['FRESH', 'STALE', 'DELAYED', 'UNAVAILABLE'] as const;
const CONFIDENCE_LEVELS = ['HIGH', 'MODERATE', 'LOW'] as const;
const SIGNAL_CATEGORIES = [
  'BTC_STRUCTURE',
  'MACRO_ENVIRONMENT',
  'INSTITUTIONAL_DEMAND',
  'RELATIVE_STRENGTH',
] as const;

type AnyRecord = Record<string, unknown>;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasLocalizedText(v: unknown): v is Record<string, string> {
  if (!isObject(v)) return false;
  return LOCALES.every((locale) => typeof v[locale] === 'string' && (v[locale] as string).length > 0);
}

function hasLocalizedSummary(v: unknown): boolean {
  if (!isObject(v)) return false;
  return LOCALES.every((locale) => {
    const s = v[locale];
    if (!isObject(s)) return false;
    return (
      typeof s.short === 'string' &&
      typeof s.detailed === 'string' &&
      CONFIDENCE_LEVELS.includes(s.confidence_level as (typeof CONFIDENCE_LEVELS)[number]) &&
      typeof s.mixed_signals === 'boolean' &&
      Array.isArray(s.key_supportive_factors) &&
      Array.isArray(s.key_headwinds)
    );
  });
}

function isValidSignalGroup(g: unknown): boolean {
  if (!isObject(g)) return false;
  return (
    typeof g.id === 'string' &&
    SIGNAL_CATEGORIES.includes(g.category as (typeof SIGNAL_CATEGORIES)[number]) &&
    hasLocalizedText(g.title) &&
    typeof g.status === 'string' &&
    typeof g.points_awarded === 'number' &&
    typeof g.max_points === 'number' &&
    g.points_awarded <= g.max_points &&
    hasLocalizedText(g.summary)
  );
}

function isValidDataStatus(d: unknown): boolean {
  if (!isObject(d)) return false;
  if (!CONFIDENCE_LEVELS.includes(d.overall_confidence as (typeof CONFIDENCE_LEVELS)[number])) {
    return false;
  }
  if (!Array.isArray(d.sources)) return false;
  return d.sources.every((source) => {
    if (!isObject(source)) return false;
    return (
      typeof source.source === 'string' &&
      FRESHNESS_STATUSES.includes(source.status as (typeof FRESHNESS_STATUSES)[number])
    );
  });
}

function isValidRegime(r: unknown): r is AnyRecord {
  if (!isObject(r)) return false;
  return (
    typeof r.score === 'number' &&
    r.max_score === 14 &&
    REGIME_CODES.includes(r.regime_code as (typeof REGIME_CODES)[number]) &&
    typeof r.regime_label === 'string' &&
    typeof r.environment_bias === 'string' &&
    typeof r.last_updated_at === 'string' &&
    hasLocalizedSummary(r.summary) &&
    Array.isArray(r.signal_groups) &&
    r.signal_groups.every(isValidSignalGroup) &&
    isValidDataStatus(r.data_status)
  );
}

describe('analytics-sdk fixtures — regime schema drift guard', () => {
  const cases: Array<[string, unknown, string]> = [
    ['constructive', constructive, 'CONSTRUCTIVE'],
    ['very-favorable', veryFavorable, 'VERY_FAVORABLE'],
    ['mixed', mixed, 'NEUTRAL_MIXED'],
    ['defensive', defensive, 'DEFENSIVE'],
    ['hostile', hostile, 'HOSTILE'],
    ['stale', stale, 'CONSTRUCTIVE'],
  ];

  cases.forEach(([name, fixture, expectedCode]) => {
    it(`should match canonical regime schema for ${name}`, () => {
      expect(isValidRegime(fixture)).toBe(true);
    });

    it(`should carry regime_code ${expectedCode} for ${name}`, () => {
      expect((fixture as AnyRecord).regime_code).toBe(expectedCode);
    });

    it(`should provide all 4 locale summaries for ${name}`, () => {
      const sum = (fixture as AnyRecord).summary;
      expect(hasLocalizedSummary(sum)).toBe(true);
    });
  });

  it('should keep regime_code within the canonical 5-band set', () => {
    cases.forEach(([, fixture]) => {
      expect(REGIME_CODES).toContain((fixture as AnyRecord).regime_code);
    });
  });

  it('should keep score within [0, 14]', () => {
    cases.forEach(([, fixture]) => {
      const score = (fixture as AnyRecord).score as number;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(14);
    });
  });
});

describe('analytics-sdk fixtures — historical schema drift guard', () => {
  it('should expose snapshots array on historical fixture', () => {
    expect(isObject(historical)).toBe(true);
    expect(Array.isArray((historical as AnyRecord).snapshots)).toBe(true);
  });

  it('should provide >= 50 weekly snapshots for the 1y fixture', () => {
    const snaps = (historical as AnyRecord).snapshots as unknown[];
    expect(snaps.length).toBeGreaterThanOrEqual(50);
  });

  it('should expose date/score/regime_code on every snapshot', () => {
    const snaps = (historical as AnyRecord).snapshots as AnyRecord[];
    snaps.forEach((s) => {
      expect(typeof s.date).toBe('string');
      expect(typeof s.score).toBe('number');
      expect(REGIME_CODES).toContain(s.regime_code);
    });
  });
});

describe('analytics-sdk fixtures — signals schema drift guard', () => {
  it('should expose groups array on signals fixture', () => {
    expect(isObject(signals)).toBe(true);
    expect(Array.isArray((signals as AnyRecord).groups)).toBe(true);
  });

  it('should cover all 4 canonical signal categories', () => {
    const groups = (signals as AnyRecord).groups as AnyRecord[];
    const categories = new Set(groups.map((g) => g.category));
    SIGNAL_CATEGORIES.forEach((cat) => expect(categories).toContain(cat));
  });

  it('should keep group.points_awarded within [0, max_points]', () => {
    const groups = (signals as AnyRecord).groups as AnyRecord[];
    groups.forEach((g) => {
      const awarded = g.points_awarded as number;
      const max = g.max_points as number;
      expect(awarded).toBeGreaterThanOrEqual(0);
      expect(awarded).toBeLessThanOrEqual(max);
    });
  });

  it('should provide localized summaries on every signal', () => {
    const groups = (signals as AnyRecord).groups as AnyRecord[];
    groups.forEach((g) => {
      const inner = g.signals as AnyRecord[];
      inner.forEach((s) => expect(hasLocalizedText(s.summary)).toBe(true));
    });
  });
});

describe('analytics-sdk fixtures — data-status schema drift guard', () => {
  it('should match canonical DataStatus schema', () => {
    expect(isValidDataStatus(dataStatus)).toBe(true);
  });

  it('should declare overall_confidence in the canonical set', () => {
    const conf = (dataStatus as AnyRecord).overall_confidence;
    expect(CONFIDENCE_LEVELS).toContain(conf);
  });
});

describe('analytics-sdk fixtures — methodology schema drift guard', () => {
  it('should expose canonical methodology fields', () => {
    const m = methodology as AnyRecord;
    expect(typeof m.version).toBe('string');
    expect(typeof m.methodology_url).toBe('string');
    expect((m.methodology_url as string).startsWith('https://diboas-analytics.com')).toBe(true);
    expect(m.max_score).toBe(14);
    expect(Array.isArray(m.score_bands)).toBe(true);
    expect((m.score_bands as unknown[]).length).toBe(5);
  });
});

describe('analytics-sdk fixtures — product-disclaimer schema drift guard', () => {
  it('should provide disclaimer text in all 4 locales', () => {
    const d = productDisclaimer as AnyRecord;
    expect(hasLocalizedText(d.text)).toBe(true);
  });
});

// ============================================================================
// Iteration 3 — editorial dataset drift guard (apps/web/data/market/)
//
// The editorial dataset is the live data source for `/market`. It starts
// byte-identical to the iter-2 fixtures (per §3.1 copy-not-move) and diverges
// as editorial owners update the live copy via PR. These tests prevent an
// editorial PR from shipping a malformed JSON that would break the page.
// Staleness gate (regime.last_updated_at within 14 days) catches the "we
// forgot for a month" failure mode without being so tight that a 1-week
// vacation triggers CI red.
// ============================================================================

describe('editorial dataset — regime schema drift guard', () => {
  it('should match canonical regime schema', () => {
    expect(isValidRegime(editorialRegime)).toBe(true);
  });

  it('should keep regime_code within the canonical 5-band set', () => {
    expect(REGIME_CODES).toContain((editorialRegime as AnyRecord).regime_code);
  });

  it('should keep score within [0, 14]', () => {
    const score = (editorialRegime as AnyRecord).score as number;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(14);
  });

  it('should provide all 4 locale summaries', () => {
    expect(hasLocalizedSummary((editorialRegime as AnyRecord).summary)).toBe(true);
  });

  it('should expose last_updated_at within 14 days of CI run (staleness gate)', () => {
    const updatedAt = new Date((editorialRegime as AnyRecord).last_updated_at as string).getTime();
    expect(Number.isFinite(updatedAt)).toBe(true);
    const ageDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    expect(ageDays).toBeLessThan(14);
  });
});

describe('editorial dataset — historical schema drift guard', () => {
  it('should expose snapshots array on historical fixture', () => {
    expect(isObject(editorialHistorical)).toBe(true);
    expect(Array.isArray((editorialHistorical as AnyRecord).snapshots)).toBe(true);
  });

  it('should provide >= 50 weekly snapshots', () => {
    const snaps = (editorialHistorical as AnyRecord).snapshots as unknown[];
    expect(snaps.length).toBeGreaterThanOrEqual(50);
  });

  it('should expose date/score/regime_code on every snapshot', () => {
    const snaps = (editorialHistorical as AnyRecord).snapshots as AnyRecord[];
    snaps.forEach((s) => {
      expect(typeof s.date).toBe('string');
      expect(typeof s.score).toBe('number');
      expect(REGIME_CODES).toContain(s.regime_code);
    });
  });
});

describe('editorial dataset — signals schema drift guard', () => {
  it('should expose groups array on signals fixture', () => {
    expect(isObject(editorialSignals)).toBe(true);
    expect(Array.isArray((editorialSignals as AnyRecord).groups)).toBe(true);
  });

  it('should cover all 4 canonical signal categories', () => {
    const groups = (editorialSignals as AnyRecord).groups as AnyRecord[];
    const categories = new Set(groups.map((g) => g.category));
    SIGNAL_CATEGORIES.forEach((cat) => expect(categories).toContain(cat));
  });

  it('should keep group.points_awarded within [0, max_points]', () => {
    const groups = (editorialSignals as AnyRecord).groups as AnyRecord[];
    groups.forEach((g) => {
      const awarded = g.points_awarded as number;
      const max = g.max_points as number;
      expect(awarded).toBeGreaterThanOrEqual(0);
      expect(awarded).toBeLessThanOrEqual(max);
    });
  });

  it('should provide localized summaries on every signal', () => {
    const groups = (editorialSignals as AnyRecord).groups as AnyRecord[];
    groups.forEach((g) => {
      const inner = g.signals as AnyRecord[];
      inner.forEach((s) => expect(hasLocalizedText(s.summary)).toBe(true));
    });
  });
});

describe('editorial dataset — data-status schema drift guard', () => {
  it('should match canonical DataStatus schema', () => {
    expect(isValidDataStatus(editorialDataStatus)).toBe(true);
  });

  it('should declare overall_confidence in the canonical set', () => {
    const conf = (editorialDataStatus as AnyRecord).overall_confidence;
    expect(CONFIDENCE_LEVELS).toContain(conf);
  });
});

describe('editorial dataset — methodology schema drift guard', () => {
  it('should expose canonical methodology fields', () => {
    const m = editorialMethodology as AnyRecord;
    expect(typeof m.version).toBe('string');
    expect(typeof m.methodology_url).toBe('string');
    expect((m.methodology_url as string).startsWith('https://diboas-analytics.com')).toBe(true);
    expect(m.max_score).toBe(14);
    expect(Array.isArray(m.score_bands)).toBe(true);
    expect((m.score_bands as unknown[]).length).toBe(5);
  });
});

describe('editorial dataset — product-disclaimer schema drift guard', () => {
  it('should provide disclaimer text in all 4 locales', () => {
    const d = editorialProductDisclaimer as AnyRecord;
    expect(hasLocalizedText(d.text)).toBe(true);
  });
});

describe('editorial dataset — parity with iter-2 fixture shape', () => {
  it('should keep editorial regime.json top-level keys aligned with iter-2 regime-constructive.json', () => {
    const editorialKeys = Object.keys(editorialRegime as AnyRecord).filter((k) => !k.startsWith('_')).sort();
    const fixtureKeys = Object.keys(constructive as AnyRecord).filter((k) => !k.startsWith('_')).sort();
    expect(editorialKeys).toEqual(fixtureKeys);
  });
});
