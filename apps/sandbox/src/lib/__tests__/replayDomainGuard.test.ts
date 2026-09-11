import { beforeEach, describe, expect, it } from 'vitest';
import { reconcile } from '@diboas/banking';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';

/**
 * `5.209` end to end — the chain the unit tests break link by link.
 *
 * The audit row's scenario: DeFiLlama history carries a reading below −100%,
 * a replay runs, and before the fix `"NaN"` was appended to the append-only log
 * and every balance became NaN on every future load. This drives the REAL
 * client: grant → goal → a lending strategy → an advance over that history.
 */
const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
const poisoned = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      // Every tenth day is out of the domain the compounding formula has.
      apyPercent: i % 10 === 0 ? -150 : 5,
    })),
    stamp: { source: 'defillama' as const, asOf: '2026-09-11T00:00:00Z' },
  }));

describe('an out-of-domain APY reaches the ledger as nothing, never as NaN (5.209)', () => {
  beforeEach(() => resetSandbox());

  it('should append only finite earnings and keep the ledger reconciled', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 24,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 1000, networkFeeLocal: 0 });
    advanceTime(90, poisoned(120), 'machine');

    const state = getLedgerState();
    const accruals = state.events.filter((e) => e.type === 'AccrualApplied');
    expect(accruals.length).toBeGreaterThan(0); // the replay really ran
    for (const e of accruals) expect(Number.isFinite(Number(e.earnings))).toBe(true);
    // C-P0: the conservation identity survives, and nothing anywhere is NaN.
    expect(reconcile(state)).toBe('0.00');
    expect(JSON.stringify(state)).not.toContain('NaN');
  });
});
