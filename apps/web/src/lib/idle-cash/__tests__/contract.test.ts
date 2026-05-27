/**
 * Phase 7 §7.4 — idle-cash / compound-interest USD contract test (C39 close).
 *
 * idle-cash deliberately does NOT route through `calculateCompoundProjectionHedged`
 * even though both functions compute "lump sum at a USD scenario rate with optional
 * currency hedge." The divergence risk is real — a future bug-fix to the hedge
 * formula in one path would not reach the other. This contract test pins that
 * the two paths agree for the USD locale (no hedge in play), so any drift is
 * detectable.
 *
 * Non-USD locales are intentionally NOT tested here: idle-cash uses
 * `conservative = 7%` and a user-overridable bank yield; the compound engine
 * uses scenario rates and a service-driven bank rate. The pure-math agreement
 * we care about is the lump-sum compounding kernel, which the USD case
 * isolates cleanly.
 */

import { describe, it, expect } from 'vitest';
import { calculateIdleCashYield, IDLE_CASH_SCENARIO_USD_PERCENT } from '../calculator';
import { calculateCompoundProjectionHedged } from '@/lib/compound-interest/calculatorHedged';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { marketDataService } from '@/lib/market-data/service';

const snapshot = marketDataService.getSync();

describe('idle-cash ↔ compound-interest contract (C39)', () => {
  it('USD lump sum at conservative rate matches calculateCompoundProjectionHedged oneTime', () => {
    const amount = 100000;
    const years = 5;

    const idleCash = calculateIdleCashYield(
      { idleCash: amount, years, bankYieldPct: 0, locale: 'en' },
      snapshot
    );

    const compound = calculateCompoundProjectionHedged({
      amount,
      cadence: 'oneTime',
      years,
      locale: 'en',
    });

    const conservativeSeries = compound.series.find((s) => s.scenario === 'conservative');
    expect(conservativeSeries).toBeDefined();
    expect(idleCash).not.toBeNull();

    const compoundFinalValue = conservativeSeries!.finalValue;
    const idleCashFinalValue = idleCash!.diboasFV;

    // Should match to within $1 (both wrap calculateLumpSum at conservative 7%
    // for USD; any larger drift means one path diverged).
    expect(Math.abs(idleCashFinalValue - compoundFinalValue)).toBeLessThan(1);
  });

  it('conservative rate constants agree across both paths', () => {
    // If these ever diverge, both calculators will silently project different
    // numbers for the same scenario. Phase 2 §2.5 chose to NOT route idle-cash
    // through the compound engine (R1 discipline + B2B-specific framing) — this
    // test is the contract that catches the divergence anyway.
    expect(IDLE_CASH_SCENARIO_USD_PERCENT).toBe(SCENARIO_RATES.conservative);
  });
});
