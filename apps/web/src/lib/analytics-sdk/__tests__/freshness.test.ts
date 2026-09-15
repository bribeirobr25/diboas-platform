/**
 * Read-time freshness (PENDING_ALL 5.173).
 *
 * The defect: the panel was derived once at `computed_at` and frozen into
 * static JSON served for a week, so it could not degrade — production showed
 * 7/7 FRESH / HIGH while two FRED anchors were 15 days past the pipeline's own
 * 14-day allowance. These tests pin the overlay that fixes it AND the property
 * that makes the fix safe: it can only ever downgrade, and at the build instant
 * it is a no-op, so there is exactly one derivation of record.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyReadTimeFreshness } from '../freshness';
import type { DataStatus } from '../types';

const MARKET_DIR = join(__dirname, '../../../../data/market/shared');
const readJson = (f: string) => JSON.parse(readFileSync(join(MARKET_DIR, f), 'utf8'));

const committed = (): DataStatus => {
  const { _comment, ...rest } = readJson('data-status.json');
  void _comment;
  return rest as DataStatus;
};
const computedAt = (): Date => new Date(readJson('computed.json').computed_at);
const bySource = (s: DataStatus, name: string) => s.sources.find((x) => x.source.includes(name));

/**
 * An instant strictly after the EARLIEST `delayed_after` and strictly before the
 * EARLIEST `stale_after`, derived from the panel under test. Any test that wants
 * "the delayed rule has fired, the stale rule has not" must compute this rather
 * than hardcode a date — the pipeline moves every threshold weekly.
 */
const betweenThresholds = (s: DataStatus): Date => {
  const t = (v: string | null | undefined) => (v ? Date.parse(v) : NaN);
  const delayed = s.sources.map((x) => t(x.delayed_after)).filter(Number.isFinite);
  const stale = s.sources.map((x) => t(x.stale_after)).filter(Number.isFinite);
  const lo = Math.min(...delayed);
  const hi = Math.min(...stale);
  if (!(lo < hi))
    throw new Error('no instant exists between the earliest delayed_after and stale_after');
  return new Date(Math.floor((lo + hi) / 2));
};

/**
 * The published panel of cycle 2026-09-07, frozen. Both FRED weekly anchors sit
 * at 2026-08-28 — 15 days old at 09-12 against a 14-day allowance — and the page
 * rendered 7/7 FRESH / HIGH. The in-repo BTC source is legitimately FRESH here
 * (its August anchor IS the expected confirmed month), which is why the
 * assertion names two sources, not the three 5.173 measured on 09-09 against the
 * older July-anchored cycle.
 */
const PANEL_2026_09_07: DataStatus = {
  overall_confidence: 'HIGH',
  last_successful_update_at: '2026-09-07T12:35:02.613Z',
  delayed_sources: [],
  unavailable_sources: [],
  sources: [
    {
      source: 'in-repo:monthlyPrices.json (BTC)',
      status: 'FRESH',
      last_updated_at: '2026-08-31T00:00:00Z',
      expected_next_update_at: '2026-10-04T00:00:00Z',
      stale_after: '2026-11-01T00:00:00Z',
      delayed_after: '2026-10-04T00:00:00Z',
      message: null,
    },
    {
      source: 'FRED:DGS10',
      status: 'FRESH',
      last_updated_at: '2026-08-28T00:00:00Z',
      expected_next_update_at: '2026-09-04T00:00:00Z',
      stale_after: '2026-09-18T20:00:00Z',
      delayed_after: '2026-09-11T00:00:00Z',
      message: null,
    },
    {
      source: 'FRED:DTWEXBGS',
      status: 'FRESH',
      last_updated_at: '2026-08-28T00:00:00Z',
      expected_next_update_at: '2026-09-04T00:00:00Z',
      stale_after: '2026-09-18T20:00:00Z',
      delayed_after: '2026-09-11T00:00:00Z',
      message: null,
    },
    {
      source: 'FRED:M2SL',
      status: 'FRESH',
      last_updated_at: '2026-07-01T00:00:00Z',
      expected_next_update_at: '2026-09-25T20:00:00Z',
      stale_after: '2026-10-31T00:00:00Z',
      delayed_after: '2026-09-25T20:00:00Z',
      message: null,
    },
    {
      source: 'FRED:NASDAQCOM',
      status: 'FRESH',
      last_updated_at: '2026-09-04T00:00:00Z',
      expected_next_update_at: '2026-09-11T00:00:00Z',
      stale_after: '2026-09-18T20:00:00Z',
      delayed_after: '2026-09-18T00:00:00Z',
      message: null,
    },
    {
      source: 'Yahoo:GC=F',
      status: 'FRESH',
      last_updated_at: '2026-09-04T00:00:00Z',
      expected_next_update_at: '2026-09-11T00:00:00Z',
      stale_after: '2026-09-18T20:00:00Z',
      delayed_after: '2026-09-18T00:00:00Z',
      message: null,
    },
    {
      source: 'Polygon:ETF (shares-outstanding)',
      status: 'FRESH',
      last_updated_at: '2026-09-04T00:00:00Z',
      expected_next_update_at: '2026-09-11T00:00:00Z',
      stale_after: '2026-09-25T00:00:00Z',
      delayed_after: '2026-09-25T00:00:00Z',
      message: null,
    },
  ],
};

describe('applyReadTimeFreshness — equivalence at the build instant (the anti-drift guard)', () => {
  it('should be a NO-OP when evaluated at computed_at, byte-for-byte', () => {
    // This is the guarantee that the fix did not trade one defect (a frozen
    // panel) for a worse one (two derivations that disagree). If the pipeline
    // rule and this overlay ever diverge, THIS is the test that goes red.
    const panel = committed();
    expect(applyReadTimeFreshness(panel, computedAt())).toEqual(panel);
  });

  it('should give every committed source an explicit delayed_after decision', () => {
    // A new cadence class must not ship without stating when it goes stale.
    // `null` is a legal answer (the warm-up ledger is count-based, so time
    // cannot downgrade it) — absence is not.
    for (const src of committed().sources) {
      expect(src, `${src.source} has no delayed_after`).toHaveProperty('delayed_after');
    }
  });
});

describe('applyReadTimeFreshness — the defect it fixes', () => {
  it('should downgrade a FRESH source once the clock passes its own threshold', () => {
    const panel = committed();
    const dgs10 = bySource(panel, 'DGS10')!;
    expect(dgs10.status).toBe('FRESH'); // as generated

    const oneSecondPast = new Date(Date.parse(dgs10.delayed_after!) + 1000);
    const after = applyReadTimeFreshness(panel, oneSecondPast);

    expect(bySource(after, 'DGS10')!.status).toBe('DELAYED');
    expect(after.delayed_sources).toContain('FRED:DGS10');
  });

  it('should drop overall confidence off HIGH the moment any source degrades', () => {
    const panel = committed();
    expect(panel.overall_confidence).toBe('HIGH');
    const threshold = bySource(panel, 'DGS10')!.delayed_after!;
    const after = applyReadTimeFreshness(panel, new Date(Date.parse(threshold) + 1000));
    expect(after.overall_confidence).toBe('MODERATE');
  });

  it('should reproduce the 2026-09-12 production state that proved the defect', () => {
    // FROZEN FIXTURE, not `committed()`. This asserts a HISTORICAL state, so it
    // has to own its input: reading the live panel made the test depend on data
    // the pipeline rewrites every Monday, and on 2026-09-14 it duly failed in
    // the refresh workflow — the fresh anchors were no longer past their
    // thresholds, so the downgrade list was empty and the run could not publish.
    // A regression test about a past cycle must carry that cycle with it.
    const after = applyReadTimeFreshness(PANEL_2026_09_07, new Date('2026-09-12T12:00:00Z'));
    expect(after.delayed_sources.sort()).toEqual(['FRED:DGS10', 'FRED:DTWEXBGS']);
    expect(after.overall_confidence).toBe('MODERATE');
  });
});

describe('applyReadTimeFreshness — safety properties', () => {
  it('should NEVER promote a source (time does not make stale data fresh)', () => {
    const panel = committed();
    const doctored: DataStatus = {
      ...panel,
      sources: panel.sources.map((s) => ({ ...s, status: 'DELAYED' as const })),
    };
    const after = applyReadTimeFreshness(doctored, new Date('2020-01-01T00:00:00Z'));
    expect(after.sources.every((s) => s.status === 'DELAYED')).toBe(true);
  });

  it('should leave UNAVAILABLE alone — a clock cannot resolve a missing measurement', () => {
    const panel = committed();
    const doctored: DataStatus = {
      ...panel,
      sources: panel.sources.map((s, i) =>
        i === 0 ? { ...s, status: 'UNAVAILABLE' as const } : s
      ),
    };
    const after = applyReadTimeFreshness(doctored, new Date('2099-01-01T00:00:00Z'));
    expect(after.sources[0].status).toBe('UNAVAILABLE');
    expect(after.unavailable_sources).toContain(panel.sources[0].source);
  });

  it('should not crash or downgrade on a payload predating delayed_after', () => {
    const panel = committed();
    const legacy: DataStatus = {
      ...panel,
      sources: panel.sources.map(({ ...s }) => {
        delete (s as { delayed_after?: unknown }).delayed_after;
        return s;
      }),
    };
    // Evaluated PAST the earliest delayed_after but BEFORE any stale_after, so
    // the only rule that could fire is the one the legacy payload lacks. The
    // instant is DERIVED from the panel rather than written as a literal: a
    // hardcoded date drifts out of that window the moment the pipeline moves
    // the anchors, which is how two sibling tests broke the 2026-09-14 run.
    const after = applyReadTimeFreshness(legacy, betweenThresholds(panel));
    expect(after.sources.map((s) => s.status)).toEqual(panel.sources.map((s) => s.status));
  });
});

describe('STALE is reachable — the panel must name the source the headline blames', () => {
  // STALE sat in the type, had an icon in DataFreshnessBadge and a correct
  // label in all four locales, and NOTHING ever emitted it. A source past its
  // stale_after dropped overall confidence to LOW while its own row still read
  // "Delayed" — the reader was told the confidence was low and no row said
  // which source was the reason.
  const farFuture = new Date('2099-01-01T00:00:00Z');

  it('should mark a source past its stale_after as STALE, not merely DELAYED', () => {
    const after = applyReadTimeFreshness(committed(), farFuture);
    expect(after.sources.every((s) => s.status === 'STALE')).toBe(true);
  });

  it('should escalate DELAYED to STALE, never the reverse', () => {
    const panel = committed();
    const delayed: DataStatus = {
      ...panel,
      sources: panel.sources.map((s) => ({ ...s, status: 'DELAYED' as const })),
    };
    expect(applyReadTimeFreshness(delayed, farFuture).sources[0].status).toBe('STALE');
  });

  it('should never promote UNAVAILABLE to STALE (downgrade-only stays downgrade-only)', () => {
    const panel = committed();
    const unavailable: DataStatus = {
      ...panel,
      sources: panel.sources.map((s) => ({ ...s, status: 'UNAVAILABLE' as const })),
    };
    const after = applyReadTimeFreshness(unavailable, farFuture);
    expect(after.sources.every((s) => s.status === 'UNAVAILABLE')).toBe(true);
  });

  it('should still report LOW confidence when sources are STALE', () => {
    expect(applyReadTimeFreshness(committed(), farFuture).overall_confidence).toBe('LOW');
  });

  it('should list a STALE source among delayed_sources so the panel summary is complete', () => {
    // `delayed_sources` is the panel's "what is not fresh" list; a STALE source
    // dropping out of it would hide the worst case from the summary.
    const after = applyReadTimeFreshness(committed(), farFuture);
    expect(after.delayed_sources.length).toBe(after.sources.length);
  });
});

describe('the seam actually applies it (a correct overlay that is never called is still the defect)', () => {
  it('should return a clock-evaluated panel from fetchDataStatus, not the frozen one', async () => {
    const mod = await import('../mock-client.server');
    const panel = committed();
    const threshold = bySource(panel, 'DGS10')!.delayed_after!;

    const atBuild = await mod.fetchDataStatus('bitcoin', computedAt());
    const later = await mod.fetchDataStatus('bitcoin', new Date(Date.parse(threshold) + 1000));

    expect(atBuild.overall_confidence).toBe('HIGH'); // unchanged at the build instant
    expect(later.overall_confidence).toBe('MODERATE'); // degrades with the clock
    expect(later.delayed_sources).toContain('FRED:DGS10');
  });

  it('should flow through the composite so the page receives the degraded panel', async () => {
    const mod = await import('../mock-client.server');
    const threshold = bySource(committed(), 'DGS10')!.delayed_after!;
    const data = await mod.fetchInitialAnalyticsData('en', 'bitcoin', {
      now: new Date(Date.parse(threshold) + 1000),
    });
    expect(data.dataStatus!.overall_confidence).toBe('MODERATE');
  });
});

describe('the hero badge and the panel must not diverge (5.131 rider on 5.173)', () => {
  it('should move overall_confidence off the frozen build value once a source ages', () => {
    // The page renders `dataStatus.overall_confidence` for the badge, falling
    // back to `regime.summary.confidence_level` only when the panel failed to
    // load. These two are ONE concept in doc-07 §21.1 and 5.131 exists because
    // they disagreed once. This pins the live value moving; the shell reads it.
    const panel = committed();
    const frozen = JSON.parse(readFileSync(join(MARKET_DIR, 'regime.json'), 'utf8')).summary.en
      .confidence_level;

    // at build they agree, by construction (generate.mjs derives one from the other)
    expect(applyReadTimeFreshness(panel, computedAt()).overall_confidence).toBe(frozen);

    // once a source ages out they must NOT, and the page must follow the panel
    const threshold = bySource(panel, 'DGS10')!.delayed_after!;
    const later = applyReadTimeFreshness(panel, new Date(Date.parse(threshold) + 1000));
    expect(later.overall_confidence).not.toBe(frozen);
    expect(later.overall_confidence).toBe('MODERATE');
  });
});

describe('the two confidence rules agree on a source with NO stale threshold', () => {
  /**
   * The pipeline (`data-status.mjs#deriveDataStatus`) and this overlay are
   * documented as mirroring each other, and the equivalence test above pins
   * them at the build instant — but only over the COMMITTED panel, where every
   * source has a stale_after. The type allows `null`, and the two rules
   * disagreed there: `run > new Date(null)` is `run > epoch` (true, forcing
   * LOW) while `isPast(null)` is false. Unreachable today, and exactly the kind
   * of divergence the plan warned a second derivation would create.
   */
  const pipelineRule = (sources: DataStatus['sources'], run: Date) => {
    const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE').length;
    const delayed = sources.filter((s) => s.status === 'DELAYED').length;
    const pastStale = sources.some((s) => s.stale_after != null && run > new Date(s.stale_after));
    return unavailable >= 2 || pastStale ? 'LOW' : delayed || unavailable ? 'MODERATE' : 'HIGH';
  };

  it('should not treat a null stale_after as "already stale"', () => {
    const panel = committed();
    const noThreshold: DataStatus = {
      ...panel,
      sources: panel.sources.map((s) => ({ ...s, stale_after: null, delayed_after: null })),
    };
    const now = new Date('2026-09-15T00:00:00Z');
    const after = applyReadTimeFreshness(noThreshold, now);
    expect(after.overall_confidence).toBe('HIGH');
    expect(after.overall_confidence).toBe(pipelineRule(noThreshold.sources, now));
  });

  it('should agree with the pipeline rule across every status mix', () => {
    const panel = committed();
    const mixes: DataStatus['sources'][0]['status'][][] = [
      ['FRESH', 'FRESH'],
      ['DELAYED', 'FRESH'],
      ['UNAVAILABLE', 'FRESH'],
      ['UNAVAILABLE', 'UNAVAILABLE'],
      ['DELAYED', 'UNAVAILABLE'],
    ];
    const now = new Date('2026-09-15T00:00:00Z');
    for (const mix of mixes) {
      const sources = mix.map((status, i) => ({
        ...panel.sources[i],
        status,
        stale_after: null,
        delayed_after: null,
      }));
      const mine = applyReadTimeFreshness({ ...panel, sources }, now).overall_confidence;
      expect(mine, `mix ${mix.join('+')}`).toBe(pipelineRule(sources, now));
    }
  });
});
