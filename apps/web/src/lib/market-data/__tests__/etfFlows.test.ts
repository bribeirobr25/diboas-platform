/**
 * ETF-01 flow-ledger unit tests (P4, Polygon route — founder-approved
 * 2026-07-11). Locks the doc 02 §8.3 activation rule (≥3 of trailing 4
 * weekly aggregates positive), the warm-up honesty (UNAVAILABLE below 5
 * snapshots, never backfilled), and the per-fund corruption guards.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeWeeklyFlows,
  evaluateEtf01FromFlows,
  readSnapshots,
  WARMUP_SNAPSHOTS,
  WEEK_SPAN_DAYS,
  WEEK_SPAN_TOLERANCE_DAYS,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';

const D = new Date('2026-07-11T00:00:00Z');

type Fund = { shares: number | null; price: number | null; lastUpdated: string | null };
const snap = (anchor: string, funds: Record<string, Fund>) => ({ anchor, funds });
const fund = (shares: number, price = 40, lastUpdated = '2026-07-10T00:00:00Z'): Fund => ({
  shares,
  price,
  lastUpdated,
});

/** 6 weekly snapshots with IBIT shares stepping by `steps` (millions). */
function ledger(steps: number[]) {
  const anchors = [
    '2026-06-05',
    '2026-06-12',
    '2026-06-19',
    '2026-06-26',
    '2026-07-03',
    '2026-07-10',
  ];
  let shares = 1000e6;
  return steps.map((step, i) => {
    shares += step * 1e6;
    return snap(anchors[i], { IBIT: fund(shares) });
  });
}

describe('evaluateEtf01FromFlows — §8.3 activation rule', () => {
  it(`should stay UNAVAILABLE (warming up) below ${WARMUP_SNAPSHOTS} snapshots`, () => {
    const s = evaluateEtf01FromFlows(ledger([0, 5, 5]).slice(0, 3), D);
    expect(s.state).toBe('UNAVAILABLE');
    expect(s.detail).toContain('warming up');
  });

  it('should go ACTIVE when 3 of the trailing 4 weekly flows are positive', () => {
    // deltas between the last 5 snapshots: +5, +5, -2, +5 → 3/4 positive
    const s = evaluateEtf01FromFlows(ledger([0, 0, 5, 5, -2, 5]), D);
    expect(s.state).toBe('ACTIVE');
    expect(s.detail).toContain('3/4 positive');
  });

  it('should stay INACTIVE at 2 of 4 positive', () => {
    const s = evaluateEtf01FromFlows(ledger([0, 0, 5, -5, -2, 5]), D);
    expect(s.state).toBe('INACTIVE');
  });
});

describe('computeWeeklyFlows — corruption guards', () => {
  it('should exclude a fund whose weekly share change exceeds the corruption bound', () => {
    const snaps = [
      snap('2026-07-03', { IBIT: fund(1000e6), FBTC: fund(200e6) }),
      snap('2026-07-10', { IBIT: fund(1005e6), FBTC: fund(700e6) }), // FBTC +250%/wk
    ];
    const { flows, warnings } = computeWeeklyFlows(snaps, D);
    expect(flows[0].excluded).toContain('FBTC');
    expect(flows[0].netFlowUsd).toBe(5e6 * 40); // IBIT only
    expect(warnings.some((w) => w.includes('corruption bound'))).toBe(true);
  });

  it('should exclude a fund with a stale Polygon share count and warn (the GBTC class)', () => {
    const snaps = [
      snap('2026-07-03', { IBIT: fund(1000e6), GBTC: fund(190e6) }),
      snap('2026-07-10', { IBIT: fund(1005e6), GBTC: fund(195e6, 40, '2026-06-01T00:00:00Z') }),
    ];
    const { flows, warnings } = computeWeeklyFlows(snaps, D);
    expect(flows[0].excluded).toContain('GBTC');
    expect(warnings.some((w) => w.includes('stale'))).toBe(true);
  });

  it('should exclude funds with missing shares or price rather than poisoning the aggregate', () => {
    const snaps = [
      snap('2026-07-03', { IBIT: fund(1000e6), BTCW: fund(50e6) }),
      snap('2026-07-10', {
        IBIT: { shares: 1002e6, price: null, lastUpdated: '2026-07-10T00:00:00Z' },
        BTCW: fund(51e6),
      }),
    ];
    const { flows } = computeWeeklyFlows(snaps, D);
    expect(flows[0].excluded).toContain('IBIT');
    expect(flows[0].netFlowUsd).toBe(1e6 * 40); // BTCW only
  });
});

/**
 * A "weekly aggregate" must actually span a week (PENDING_ALL 5.301).
 *
 * `ledger()` above builds PERFECT 7-day anchors, which is exactly why nothing
 * here caught this: the helper made a gap unrepresentable. The committed
 * ledger, meanwhile, already contains one — 2026-07-10 -> 2026-07-24, a
 * fortnight, because the 07-17 snapshot was missed — and it was published as
 * one of "the last 4 weekly aggregates".
 */
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

const ON = new Date('2026-07-31T00:00:00Z');
// One fresh `lastUpdated` for every snapshot, as `ledger()` above does. Tying
// it to each anchor instead makes the older weeks trip the 10-day staleness
// guard, which excludes their funds and zeroes the flow — the fixture would
// then fail for a reason that has nothing to do with spacing.
const FRESH = '2026-07-30T00:00:00Z';

/** Snapshots at arbitrary anchors, so a missed week is representable. */
function ledgerAt(anchors: string[], steps: number[]) {
  let shares = 1000e6;
  return anchors.map((a, i) => {
    shares += steps[i] * 1e6;
    return snap(a, { IBIT: fund(shares, 40, FRESH) });
  });
}

describe('week spacing is asserted, not assumed (5.301)', () => {
  const CLEAN = [
    '2026-06-19',
    '2026-06-26',
    '2026-07-03',
    '2026-07-10',
    '2026-07-17',
    '2026-07-24',
  ];
  const GAPPED = ['2026-06-19', '2026-06-26', '2026-07-03', '2026-07-10', '2026-07-24'];

  it('should label every interval with its real span', () => {
    const { flows } = computeWeeklyFlows(ledgerAt(GAPPED, [0, 5, 5, 5, 5]), ON);
    expect(flows.map((f) => f.spanDays)).toEqual([7, 7, 7, 14]);
    expect(flows.map((f) => f.weekly)).toEqual([true, true, true, false]);
  });

  it('should name the mis-spaced interval in its own warning list', () => {
    const { spacingWarnings } = computeWeeklyFlows(ledgerAt(GAPPED, [0, 5, 5, 5, 5]), ON);
    expect(spacingWarnings.some((w: string) => w.includes('2026-07-10 → 2026-07-24'))).toBe(true);
    expect(spacingWarnings.some((w: string) => w.includes('14-day'))).toBe(true);
  });

  it('should refuse to score a fortnight as one of the four weeks', () => {
    // All five steps positive: under the old code this was a confident 4/4
    // ACTIVE, worth 2 points, with one "week" covering fourteen days.
    const s = evaluateEtf01FromFlows(ledgerAt(GAPPED, [0, 5, 5, 5, 5]), ON);
    expect(s.state).toBe('UNAVAILABLE');
    expect(s.detail).toContain('14-day gap');
    expect(s.detail).toContain('2026-07-10 → 2026-07-24');
  });

  it('should still score normally when every interval IS a week', () => {
    const s = evaluateEtf01FromFlows(ledgerAt(CLEAN, [0, 5, 5, 5, 5, 5]), ON);
    expect(s.state).toBe('ACTIVE');
    expect(s.values.positives).toBe(4);
  });

  it(`should tolerate a holiday-shifted anchor within ±${WEEK_SPAN_TOLERANCE_DAYS}d`, () => {
    // A Friday market holiday moves the confirmed close to Thursday: 6 then 8.
    // That is a shifted week, not a missing one, and must stay scorable.
    const shifted = ['2026-06-19', '2026-06-26', '2026-07-02', '2026-07-10', '2026-07-17'];
    const { flows } = computeWeeklyFlows(ledgerAt(shifted, [0, 5, 5, 5, 5]), ON);
    expect(flows.map((f) => f.spanDays)).toEqual([7, 6, 8, 7]);
    expect(flows.every((f) => f.weekly)).toBe(true);
    expect(evaluateEtf01FromFlows(ledgerAt(shifted, [0, 5, 5, 5, 5]), ON).state).toBe('ACTIVE');
  });

  it('should only care about the trailing-4 window, not the whole ledger', () => {
    // The real ledger's fortnight is old. An ancient gap must not take the
    // signal offline forever — it stops mattering once it leaves the window.
    const old = [
      '2026-06-05',
      '2026-06-19',
      '2026-06-26',
      '2026-07-03',
      '2026-07-10',
      '2026-07-17',
    ];
    const { flows } = computeWeeklyFlows(ledgerAt(old, [0, 5, 5, 5, 5, 5]), ON);
    expect(flows[0].weekly).toBe(false); // the old gap is still recorded
    expect(evaluateEtf01FromFlows(ledgerAt(old, [0, 5, 5, 5, 5, 5]), ON).state).toBe('ACTIVE');
  });

  it('should NOT report a cadence gap as a fund-quality exclusion', () => {
    // The detail string counts `warnings` as "N fund-week(s) excluded by
    // quality guards". Putting spacing warnings in the same list made the
    // machine record claim a fund exclusion that never happened.
    //
    // Evaluated at the ledger's OWN last anchor, and counts derived from the
    // data: the ETF ledger grows weekly, so a literal date or a literal warning
    // count is a dated claim (the sibling that pinned `toBe(10)` stopped the
    // 2026-09-14 cycle from publishing).
    const real = readSnapshots();
    const at = new Date(`${real[real.length - 1].anchor}T00:00:00Z`);
    const { warnings, spacingWarnings } = computeWeeklyFlows(real, at);
    const misSpaced = spacingWarnings.length;
    const gapsInLedger = computeWeeklyFlows(real, at).flows.filter((f) => !f.weekly).length;
    expect(misSpaced).toBe(gapsInLedger); // one warning per non-weekly interval, no more
    expect(warnings, 'cadence must never be counted as a fund exclusion').toHaveLength(0);
    expect(evaluateEtf01FromFlows(real, at).detail).not.toContain('fund-week(s) excluded');
  });

  it('should keep the committed ledger scorable — the trailing 4 are real weeks', () => {
    // The live guarantee, stated as a RULE rather than as today's values: the
    // trailing-4 window must contain four genuine weekly intervals, and the
    // signal must therefore be scorable rather than gapped.
    //
    // The earlier version pinned the exact gap list and `ACTIVE` at a literal
    // date. Both are dated claims: the ETF ledger gains a snapshot every Monday,
    // the 2026-07-10→07-24 fortnight ages further from the window each week, and
    // ACTIVE/INACTIVE depends on flows that genuinely move.
    const real = readSnapshots();
    const at = new Date(`${real[real.length - 1].anchor}T00:00:00Z`);
    const { flows } = computeWeeklyFlows(real, at);
    const trailing4 = flows.slice(-4);
    expect(trailing4).toHaveLength(4);
    expect(trailing4.every((f) => f.weekly)).toBe(true);
    expect(
      trailing4.every((f) => Math.abs(f.spanDays - WEEK_SPAN_DAYS) <= WEEK_SPAN_TOLERANCE_DAYS)
    ).toBe(true);
    // Scorable, not a specific score: UNAVAILABLE here would mean a gap reached
    // the window, which is the condition this signal must announce rather than fudge.
    expect(evaluateEtf01FromFlows(real, at).state).not.toBe('UNAVAILABLE');
  });
});

describe('the gapped sentence can actually be published (the 5.133 trap)', () => {
  const TPL = JSON.parse(
    readFileSync(
      join(__dirname, '../../../../scripts/market-refresh/templates/signal-sentences.json'),
      'utf8'
    )
  );
  const gapped = TPL['ETF-01'].UNAVAILABLE.variants?.gapped;

  it('should exist in all four locales', () => {
    expect(gapped).toBeDefined();
    for (const l of LOCALES) expect(typeof gapped[l], `${l} missing`).toBe('string');
  });

  it('should reference only slots the engine actually emits', () => {
    // renderTemplate THROWS on any slot resolving to '' (5.133). A new
    // UNAVAILABLE reason whose sentence needs a value the engine does not put
    // in `values` stops the weekly generator dead.
    const gappedLedger = ledgerAt(
      ['2026-06-19', '2026-06-26', '2026-07-03', '2026-07-10', '2026-07-24'],
      [0, 5, 5, 5, 5]
    );
    const values = evaluateEtf01FromFlows(gappedLedger, ON).values as Record<string, unknown>;
    for (const l of LOCALES) {
      const slots = [...String(gapped[l]).matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      expect(slots.length, `${l} should carry the gap length`).toBeGreaterThan(0);
      for (const slot of slots) {
        expect(values[slot], `${l} references {${slot}} but values has no such key`).toBeDefined();
      }
    }
  });

  it('should keep the warm-up slots populated so the default stays renderable', () => {
    // The gapped branch still emits snapshots/warmupTarget, so if a locale ever
    // lacks the variant the fallback sentence renders instead of throwing.
    const values = evaluateEtf01FromFlows(
      ledgerAt(
        ['2026-06-19', '2026-06-26', '2026-07-03', '2026-07-10', '2026-07-24'],
        [0, 5, 5, 5, 5]
      ),
      ON
    ).values as Record<string, unknown>;
    for (const slot of [...String(TPL['ETF-01'].UNAVAILABLE.en).matchAll(/\{(\w+)\}/g)].map(
      (m) => m[1]
    )) {
      expect(values[slot], `fallback needs {${slot}}`).toBeDefined();
    }
  });

  it('should carry no em-dash (anti-slop Part 2) or emoji', () => {
    // "The single most common AI tell, so the default is none." The corpus has
    // 97 template dashes awaiting a founder copy call; new copy must not grow
    // that number.
    for (const l of LOCALES) {
      expect(String(gapped[l]), `${l} em-dash`).not.toMatch(/—/);
      expect(String(gapped[l]), `${l} emoji`).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('should say how the state RESOLVES, not only why it failed (Part 3 row 19)', () => {
    // An unavailable state that dead-ends is the empty-state defect. Each
    // locale names the condition that brings the signal back.
    const resolves = {
      en: /returns once/i,
      'pt-BR': /volta a pontuar/i,
      es: /vuelve a puntuar/i,
      de: /zählt wieder/i,
    };
    for (const [l, re] of Object.entries(resolves)) expect(String(gapped[l]), l).toMatch(re);
  });

  it('should not say "warming up" when the ledger is not warming up', () => {
    // The whole reason a variant exists: the default would publish "9 of 5
    // snapshots recorded", which is both nonsense and the wrong reason.
    for (const l of LOCALES) {
      expect(String(gapped[l]).toLowerCase()).not.toMatch(
        /warming up|aquecimento|calentamiento|warm/
      );
    }
  });
});
