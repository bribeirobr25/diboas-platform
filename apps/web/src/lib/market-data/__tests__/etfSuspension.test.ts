/**
 * ETF-01 operational suspension (founder decision 2026-10-18, the 2026-10-19
 * cycle package). Every assertion here is about a RULE, never about the state
 * of the committed data files (5.478): the weekly run rewrites those, and a
 * test that reads them becomes a release gate on whatever Monday produces.
 *
 * What is locked:
 *   1. ETF-01 is UNAVAILABLE/suspended through every route, and 0 points.
 *   2. Nothing in the data can lift it: not a healthy flow window, not a new
 *      snapshot, not the manual fallback.
 *   3. Weights, bands and the 14-point scale are untouched (no renormalisation).
 *   4. The panel says why, never "scored from the trailing 4 weekly flows", and
 *      the headline confidence is capped at MODERATE by the suspension while
 *      every route to LOW survives, identically at build and at read time.
 *   5. No locale can silently fall back to the warm-up sentence.
 *   6. The opener separates the data effect from what the other signals did,
 *      and assumes no particular size of change.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ETF01_SUSPENSION,
  suspendedEtfSignal,
  isSuspendedEtf,
} from '../../../../scripts/market-refresh/lib/etf-suspension.mjs';
import {
  resolveEtfSignals,
  evaluateEtf01FromFlows,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';
import { archiveSignals } from '../../../../scripts/market-refresh/lib/archive.mjs';
import { scoreSignals } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import { deriveDataStatus } from '../../../../scripts/market-refresh/lib/data-status.mjs';
import { selectSignalTemplate } from '../../../../scripts/market-refresh/lib/template-select.mjs';
import { planWeeklyOpener } from '../../../../scripts/market-refresh/lib/weekly-opener.mjs';
import { cycleCoverage } from '../../../../scripts/market-refresh/lib/coverage.mjs';
import { groupSummary } from '../../../../scripts/market-refresh/lib/group-summaries.mjs';
import { applyReadTimeFreshness } from '../../analytics-sdk/freshness';
import type { DataStatus } from '../../analytics-sdk/types';

const TPL_DIR = join(__dirname, '../../../../scripts/market-refresh/templates');
const tpl = (f: string) => JSON.parse(readFileSync(join(TPL_DIR, f), 'utf8'));
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

type Fund = { shares: number; price: number; lastUpdated: string | null };
const fund = (shares: number): Fund => ({ shares, price: 40, lastUpdated: null });
/** Weekly snapshots with IBIT stepping by `steps` (millions): a HEALTHY, gap-free
 *  ledger that the pre-suspension rule would score ACTIVE (≥3 of 4 positive). */
function healthyLedger(extraWeeks = 0) {
  const anchors = ['2026-09-04', '2026-09-11', '2026-09-18', '2026-09-25', '2026-10-02'];
  for (let i = 1; i <= extraWeeks; i += 1) {
    const d = new Date(`${anchors[anchors.length - 1]}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7);
    anchors.push(d.toISOString().slice(0, 10));
  }
  let shares = 1000e6;
  return anchors.map((anchor) => {
    shares += 5e6;
    return { anchor, funds: { IBIT: fund(shares) } };
  });
}
const AT = new Date('2026-10-19T08:00:00Z');

describe('ETF-01 suspension — the engine route', () => {
  it('should be active, with a decision date, a first cycle, a reason and an end condition', () => {
    expect(ETF01_SUSPENSION.active).toBe(true);
    expect(ETF01_SUSPENSION.decidedOn).toBe('2026-10-18');
    expect(ETF01_SUSPENSION.firstCycle).toBe('2026-10-19');
    expect(ETF01_SUSPENSION.reason.length).toBeGreaterThan(20);
    expect(ETF01_SUSPENSION.endCondition).toMatch(/explicit/i);
  });

  it('should score UNAVAILABLE/suspended even when the flow rule alone would say ACTIVE', () => {
    const ledger = healthyLedger();
    // Control: without the suspension this ledger is a clean ACTIVE.
    expect(evaluateEtf01FromFlows(ledger, AT).state).toBe('ACTIVE');
    const [sig] = resolveEtfSignals({ snapshots: ledger, manual: null }, AT);
    expect(sig.state).toBe('UNAVAILABLE');
    expect(sig.values.variant).toBe('suspended');
    expect(isSuspendedEtf(sig)).toBe(true);
  });

  it('should NOT be lifted by a successful collection (a new clean weekly snapshot)', () => {
    for (const extra of [1, 2, 6]) {
      const [sig] = resolveEtfSignals({ snapshots: healthyLedger(extra), manual: null }, AT);
      expect(sig.state).toBe('UNAVAILABLE');
      expect(sig.values.variant).toBe('suspended');
      expect(sig.values.snapshots).toBe(5 + extra);
    }
  });

  it('should also override the manual fallback route (empty ledger + a valid manual ACTIVE)', () => {
    const manual = {
      state: 'ACTIVE',
      positiveWeeks: 4,
      expires: '2099-01-01',
      updated: '2026-10-18',
    };
    const [sig] = resolveEtfSignals({ snapshots: [], manual }, AT);
    expect(sig.state).toBe('UNAVAILABLE');
    expect(sig.values.variant).toBe('suspended');
    expect(sig.anchor).toBeNull();
  });

  it('should award 0 points through the archive seam and keep the variant and slots', () => {
    const [rec] = archiveSignals([suspendedEtfSignal(healthyLedger())], { etfSnapshotCount: 5 });
    expect(rec.points).toBe(0);
    expect(rec.weight).toBe(2);
    expect(rec.values.variant).toBe('suspended');
    expect(rec.values.snapshots).toBe(5);
  });
});

describe('ETF-01 suspension — the scale is unchanged', () => {
  const sig = (id: string, state: string, weight: number) => ({ id, state, weight });
  const others = (state: string) => ({
    btc: [
      sig('BTC-01', state, 2),
      sig('BTC-02', state, 2),
      sig('BTC-03', state, 1),
      sig('BTC-04', state, 1),
    ],
    macro: [sig('MAC-01', state, 1), sig('MAC-02', state, 1), sig('MAC-03', state, 1)],
    rel: [sig('REL-01', state, 1), sig('REL-02', state, 1), sig('REL-03', state, 1)],
  });

  it('should keep the 14-point bands: every other signal ACTIVE reaches 12, still Very Favorable', () => {
    const { score, band, groupTotals } = scoreSignals({
      ...others('ACTIVE'),
      etf: [suspendedEtfSignal(healthyLedger())],
    });
    expect(score).toBe(12);
    expect(groupTotals.institutional_demand).toBe(0);
    expect(band?.code).toBe('VERY_FAVORABLE');
  });

  it('should not renormalise: the same 10 points read Constructive, as on the 14-point scale', () => {
    const base = others('ACTIVE');
    base.rel = base.rel
      .map((s) => ({ ...s, state: 'INACTIVE' }))
      .slice(0, 2)
      .concat(base.rel[2]);
    const { score, band } = scoreSignals({ ...base, etf: [suspendedEtfSignal(healthyLedger())] });
    expect(score).toBe(10);
    expect(band?.code).toBe('CONSTRUCTIVE');
  });
});

describe('ETF-01 suspension — the data-status panel and confidence', () => {
  const computedAt = '2026-10-19T15:00:00Z';
  function computed(etf: object) {
    return {
      computed_at: computedAt,
      signals: [
        { id: 'BTC-01', anchor: '2026-09-01' },
        { id: 'MAC-01', anchor: '2026-10-16' },
        { id: 'MAC-02', anchor: '2026-10-16' },
        { id: 'MAC-03', anchor: '2026-09-01' },
        { id: 'REL-01', anchor: '2026-10-16' },
        { id: 'REL-03', anchor: '2026-10-16' },
        etf,
      ],
    };
  }
  const ledger = healthyLedger(2); // latest anchor 2026-10-16
  const suspended = { ...suspendedEtfSignal(ledger) };

  it('should report the ETF row UNAVAILABLE, say why, and never claim the signal is scored', () => {
    const ds = deriveDataStatus(computed(suspended), ledger);
    const row = ds.sources.find((s: { source: string }) => s.source.startsWith('Polygon'));
    expect(row?.status).toBe('UNAVAILABLE');
    expect(row?.message).toContain('is suspended');
    expect(row?.message).toContain('does not reactivate');
    expect(row?.message).not.toMatch(/scored from the trailing/);
    expect(row?.message).not.toContain('doc 02');
  });

  it('should cap the headline at MODERATE when the suspension is the only issue', () => {
    const ds = deriveDataStatus(computed(suspended), ledger);
    expect(ds.unavailable_sources).toHaveLength(1);
    expect(ds.overall_confidence).toBe('MODERATE');
  });

  it('should still reach LOW when a source is past its stale_after (build time)', () => {
    const late = { ...computed(suspended), computed_at: '2026-11-20T15:00:00Z' };
    expect(deriveDataStatus(late, ledger).overall_confidence).toBe('LOW');
  });

  it('should agree at read time: MODERATE at computed_at, LOW once stale, LOW with a second UNAVAILABLE', () => {
    const ds = deriveDataStatus(computed(suspended), ledger) as unknown as DataStatus;
    expect(applyReadTimeFreshness(ds, new Date(computedAt)).overall_confidence).toBe('MODERATE');
    expect(applyReadTimeFreshness(ds, new Date('2026-12-15T00:00:00Z')).overall_confidence).toBe(
      'LOW'
    );
    const second: DataStatus = {
      ...ds,
      sources: ds.sources.map((s, i) => (i === 0 ? { ...s, status: 'UNAVAILABLE' } : s)),
    };
    expect(applyReadTimeFreshness(second, new Date(computedAt)).overall_confidence).toBe('LOW');
  });

  it('should never promote the suspended row back to FRESH at read time', () => {
    const ds = deriveDataStatus(computed(suspended), ledger) as unknown as DataStatus;
    const read = applyReadTimeFreshness(ds, new Date('2026-10-20T00:00:00Z'));
    const row = read.sources.find((s) => s.source.startsWith('Polygon'));
    expect(row?.status).toBe('UNAVAILABLE');
  });
});

describe('ETF-01 suspension — every locale exists and none falls back to warm-up', () => {
  const signals = tpl('signal-sentences.json');
  const groups = tpl('group-summaries.json');
  const openers = tpl('weekly-openers.json');
  const coverage = tpl('coverage-notes.json');

  it.each(LOCALES)('should carry the suspended wording in %s for every surface', (locale) => {
    expect(signals['ETF-01'].UNAVAILABLE.variants.suspended[locale]).toBeTruthy();
    expect(groups.institutional_demand.suspended[locale]).toBeTruthy();
    for (const key of [
      'suspensionStart',
      'suspensionStartNoPoints',
      'othersHeld',
      'othersUp',
      'othersDown',
    ]) {
      expect(openers[key]?.[locale], `${key} ${locale}`).toBeTruthy();
    }
    expect(coverage.plainSuspended[locale]).toBeTruthy();
  });

  it.each(LOCALES)(
    'should select the suspended sentence in %s, never the warm-up one',
    (locale) => {
      const set = signals['ETF-01'].UNAVAILABLE;
      const chosen = selectSignalTemplate(set, 'suspended', locale, 'test');
      expect(chosen).toBe(set.variants.suspended[locale]);
      expect(chosen).not.toBe(set[locale]);
    }
  );

  it('should THROW when a declared variant is missing a locale (deliberate absence)', () => {
    const set = structuredClone(signals['ETF-01'].UNAVAILABLE);
    delete set.variants.suspended.de;
    expect(() => selectSignalTemplate(set, 'suspended', 'de', 'ETF-01 de')).toThrow(
      /refusing to fall back/
    );
    // The other locales are unaffected.
    expect(selectSignalTemplate(set, 'suspended', 'en', 'ETF-01 en')).toBeTruthy();
  });

  it('should THROW on a variant with no templates at all', () => {
    expect(() => selectSignalTemplate({ en: 'x' }, 'suspended', 'en', 'ctx')).toThrow(
      /no templates/
    );
  });

  it('should pick the suspended group summary and throw when its locale is missing', () => {
    const ctx = {
      byId: { 'ETF-01': suspendedEtfSignal(healthyLedger()) },
      groupTotals: { institutional_demand: 0 },
      groupTpl: groups,
      signalLabels: {},
    };
    for (const locale of LOCALES) {
      const text = groupSummary(ctx, 'institutional_demand', locale);
      expect(text.startsWith(groups.institutional_demand.suspended[locale].split('{')[0])).toBe(
        true
      );
    }
    const broken = { ...ctx, groupTpl: structuredClone(groups) };
    delete broken.groupTpl.institutional_demand.suspended['pt-BR'];
    expect(() => groupSummary(broken, 'institutional_demand', 'pt-BR')).toThrow(/pt-BR/);
  });
});

describe('ETF-01 suspension — the weekly opener separates data from market', () => {
  const susp = { id: 'ETF-01', values: { variant: 'suspended' }, points: 0 };
  const activeEtf = { id: 'ETF-01', state: 'ACTIVE', points: 2, values: {} };

  it('should announce the suspension and the removed points, then what the others did', () => {
    const parts = planWeeklyOpener({
      prior: { score: 12, regime_code: 'VERY_FAVORABLE' },
      score: 10,
      regimeCode: 'CONSTRUCTIVE',
      currentEtf: susp,
      priorEtf: activeEtf,
    });
    // No band sentence: the monthly read that follows already names the band.
    expect(parts.map((p) => p.key)).toEqual(['suspensionStart', 'othersHeld']);
    expect(parts[0].slots).toEqual({ points: 2 });
  });

  it('should attribute a genuine move of the other signals to them, not to the suspension', () => {
    const up = planWeeklyOpener({
      prior: { score: 12, regime_code: 'VERY_FAVORABLE' },
      score: 11,
      regimeCode: 'CONSTRUCTIVE',
      currentEtf: susp,
      priorEtf: activeEtf,
    });
    expect(up.map((p) => p.key)).toEqual(['suspensionStart', 'othersUp']);
    expect(up[1].slots).toEqual({ score: 11, prior: 10 });
    const down = planWeeklyOpener({
      prior: { score: 12, regime_code: 'VERY_FAVORABLE' },
      score: 8,
      regimeCode: 'NEUTRAL_MIXED',
      currentEtf: susp,
      priorEtf: activeEtf,
    });
    expect(down[1]).toEqual({ key: 'othersDown', slots: { score: 8, prior: 10 } });
  });

  it('should say the suspension moved nothing when ETF-01 was adding no points', () => {
    const parts = planWeeklyOpener({
      prior: { score: 9, regime_code: 'CONSTRUCTIVE' },
      score: 9,
      regimeCode: 'CONSTRUCTIVE',
      currentEtf: susp,
      priorEtf: { id: 'ETF-01', state: 'INACTIVE', points: 0, values: {} },
    });
    expect(parts.map((p) => p.key)).toEqual(['suspensionStartNoPoints', 'othersHeld']);
  });

  it('should fall back to the ordinary opener once both sides are suspended', () => {
    const parts = planWeeklyOpener({
      prior: { score: 10, regime_code: 'CONSTRUCTIVE' },
      score: 9,
      regimeCode: 'CONSTRUCTIVE',
      currentEtf: susp,
      priorEtf: susp,
    });
    expect(parts).toEqual([{ key: 'moveDown', slots: { score: 9, prior: 10 } }]);
  });

  it('should produce nothing when there is no prior snapshot', () => {
    expect(
      planWeeklyOpener({
        prior: null,
        score: 10,
        regimeCode: 'CONSTRUCTIVE',
        currentEtf: susp,
        priorEtf: activeEtf,
      })
    ).toEqual([]);
  });
});

describe('ETF-01 suspension — coverage record', () => {
  const line = (runAt: string, etf: object) =>
    JSON.stringify({ run_at: runAt, signals: [{ id: 'MAC-01', state: 'ACTIVE' }, etf] });
  const susp = { id: 'ETF-01', state: 'UNAVAILABLE', values: { variant: 'suspended' } };
  const active = { id: 'ETF-01', state: 'ACTIVE', values: {} };

  it('should be empty when ETF-01 is not suspended', () => {
    expect(cycleCoverage([active], '', '2026-10-19T15:00:00Z')).toEqual({ suspended: [] });
  });

  it('should date the suspension to the first archived run day that applied it', () => {
    const archive = [
      line('2026-10-12T15:00:00Z', active),
      line('2026-10-19T15:00:00Z', susp),
      line('2026-10-26T15:00:00Z', susp),
    ].join('\n');
    const cov = cycleCoverage([{ ...susp, weight: 2 }], archive, '2026-10-26T15:00:00Z');
    expect(cov).toEqual({ suspended: [{ signal_id: 'ETF-01', points: 2, since: '2026-10-19' }] });
  });

  it('should count the current run even when its archive line was skipped', () => {
    const archive = line('2026-10-12T15:00:00Z', active);
    const cov = cycleCoverage([{ ...susp, weight: 2 }], archive, '2026-10-20T09:00:00Z');
    expect(cov.suspended[0].since).toBe('2026-10-20');
  });
});
