/**
 * ETF-01 flow-ledger unit tests (P4, Polygon route — founder-approved
 * 2026-07-11). Locks the doc 02 §8.3 activation rule (≥3 of trailing 4
 * weekly aggregates positive), the warm-up honesty (UNAVAILABLE below 5
 * snapshots, never backfilled), and the per-fund corruption guards.
 */

import { describe, it, expect } from 'vitest';
import {
  computeWeeklyFlows,
  evaluateEtf01FromFlows,
  WARMUP_SNAPSHOTS,
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
