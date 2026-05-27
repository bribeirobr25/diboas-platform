/**
 * Phase 3 §3.3 — C3 effective-rate floor clamp (TOOLS_41_DEFECTS_FIX_PLAN.md v1.2).
 *
 * Tests the boundary clamp + observability event for catastrophic depreciation
 * (`d ≤ -1`, i.e. local currency appreciating ≥ 100% — not reachable with live
 * data, but a future provider response could expose the formula to it).
 *
 * Extended 2026-05-26 (CTO-board v3 audit) to cover ALL five hedge sites:
 *   1. `calculateWithCurrencyHedge` (FV-shape) — original coverage
 *   2. `calculateMonthlyWithCurrencyHedge` (annuity-shape) — original coverage
 *   3. `calculateCompoundProjectionHedged` (compound engine) — NEW
 *   4. `calculateEmergencyFundTimeline` (months-shape) — NEW
 *   5. `calculateTimeToTargetTimeline` (months-shape) — NEW
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateWithCurrencyHedge,
  calculateMonthlyWithCurrencyHedge,
} from '../formulas/currencyHedge';
import { calculateCompoundProjectionHedged } from '@/lib/compound-interest/calculatorHedged';
import { calculateEmergencyFundTimeline } from '@/lib/emergency-fund';
import { calculateTimeToTargetTimeline } from '@/lib/time-to-target';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { marketDataService } from '@/lib/market-data/service';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

describe('Effective-rate floor clamp (C3)', () => {
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    emitSpy = vi.spyOn(applicationEventBus, 'emit');
  });

  it('does NOT trigger for normal positive depreciation', () => {
    calculateWithCurrencyHedge(10_000, 0.07, 0.0621, 0, 5);
    expect(emitSpy).not.toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.anything()
    );
  });

  it('does NOT trigger for zero depreciation', () => {
    calculateWithCurrencyHedge(10_000, 0.07, 0, 0, 5);
    expect(emitSpy).not.toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.anything()
    );
  });

  it('does NOT trigger for small negative depreciation', () => {
    // -5% depreciation = local currency appreciating 5%
    calculateWithCurrencyHedge(10_000, 0.07, -0.05, 0, 5);
    expect(emitSpy).not.toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.anything()
    );
  });

  it('clamps + emits when effective rate would be ≤ -0.99 (lump sum)', () => {
    // d = -1 → effective = (1.07)(0) - 1 = -1 (catastrophic)
    const result = calculateWithCurrencyHedge(10_000, 0.07, -1, 0, 5);
    expect(result.effectiveLocalAPY).toBe(-0.99);
    expect(emitSpy).toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.objectContaining({
        domain: 'tools',
        source: 'calculateWithCurrencyHedge',
        metadata: expect.objectContaining({
          clampedTo: -0.99,
          depreciation: -1,
        }),
      })
    );
  });

  it('clamps + emits when effective rate would be ≤ -0.99 (monthly)', () => {
    const result = calculateMonthlyWithCurrencyHedge(100, 0.07, -1, 0, 60);
    expect(result.effectiveLocalAPY).toBe(-0.99);
    expect(emitSpy).toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.objectContaining({
        source: 'calculateMonthlyWithCurrencyHedge',
      })
    );
  });

  it('clamp emission carries usdYield + depreciation context for debugging', () => {
    calculateWithCurrencyHedge(10_000, 0.07, -1.5, 0, 5);
    expect(emitSpy).toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.objectContaining({
        metadata: expect.objectContaining({
          usdYield: 0.07,
          depreciation: -1.5,
          clampedTo: -0.99,
        }),
      })
    );
  });
});

/**
 * Extended coverage (CTO-board v3 audit, 2026-05-26).
 *
 * The original C3 implementation only protected `calculateWithCurrencyHedge`
 * and `calculateMonthlyWithCurrencyHedge`. The CTO board verified that
 * `calculatorHedged.ts` (compound engine), `lib/emergency-fund/calculator.ts`,
 * and `lib/time-to-target/calculator.ts` all had their own inline
 * `(1 + usdYield)(1 + d) - 1` computations that bypassed the clamp. The
 * helper has been exported + wired into all three; these tests force a
 * pathological `d ≤ -1` via a synthetic snapshot to verify each new site
 * routes through the clamp.
 */
describe('Effective-rate clamp — extended coverage to all hedge sites (C3 v3)', () => {
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    emitSpy = vi.spyOn(applicationEventBus, 'emit');
  });

  // Helper: build a snapshot where one currency has catastrophic depreciation.
  // The current production data has BRL d ≈ +0.062 and EUR d ≈ +0.012 — both
  // positive — so we mutate a clone to force d = -1 for the test.
  const buildCatastrophicSnapshot = (): MarketDataSnapshot => {
    const base = marketDataService.getSync();
    return {
      ...base,
      exchangeRates: {
        ...base.exchangeRates,
        rates: {
          ...base.exchangeRates.rates,
          BRL: { ...base.exchangeRates.rates.BRL!, annualDepreciation: -1.5 },
        },
      },
      // Also delete the monthly FX series so resolveHorizonMatchedDepreciation
      // falls back to the static `annualDepreciation` we just mutated.
      monthlySeries: base.monthlySeries
        ? {
            ...base.monthlySeries,
            fx: { ...base.monthlySeries.fx, BRL: undefined as never },
          }
        : undefined,
    };
  };

  it('calculatorHedged.ts emits CALCULATOR_DEPRECIATION_CLAMPED on catastrophic d (compound engine)', () => {
    // Spy includes consumer-side clamp at hedgedScenarioRate. To trigger,
    // we need depreciation to be ≤ -1 inside the engine — but the engine
    // reads from `marketDataService.getSync()` directly, so for this test
    // we replace the service stub for the duration of one call.
    const origGetSync = marketDataService.getSync;
    const catastrophic = buildCatastrophicSnapshot();
    (marketDataService as { getSync: () => MarketDataSnapshot }).getSync = () => catastrophic;
    try {
      calculateCompoundProjectionHedged({
        amount: 100,
        cadence: 'monthly',
        years: 5,
        locale: 'pt-BR',
      });
      expect(emitSpy).toHaveBeenCalledWith(
        ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
        expect.objectContaining({
          source: 'calculateCompoundProjectionHedged',
        })
      );
    } finally {
      (marketDataService as { getSync: () => MarketDataSnapshot }).getSync = origGetSync;
    }
  });

  it('calculateEmergencyFundTimeline emits CALCULATOR_DEPRECIATION_CLAMPED on catastrophic d', () => {
    const snapshot = buildCatastrophicSnapshot();
    calculateEmergencyFundTimeline(
      {
        monthlyExpenses: 1000,
        monthlySavings: 100,
        targetMultiplier: 6,
        locale: 'pt-BR',
      },
      snapshot
    );
    expect(emitSpy).toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.objectContaining({
        source: 'calculateEmergencyFundTimeline',
      })
    );
  });

  it('calculateTimeToTargetTimeline emits CALCULATOR_DEPRECIATION_CLAMPED on catastrophic d', () => {
    const snapshot = buildCatastrophicSnapshot();
    calculateTimeToTargetTimeline(
      {
        target: 50_000,
        initialAmount: 0,
        contribution: 250,
        cadence: 'monthly',
        locale: 'pt-BR',
      },
      snapshot
    );
    expect(emitSpy).toHaveBeenCalledWith(
      ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED,
      expect.objectContaining({
        source: 'calculateTimeToTargetTimeline',
      })
    );
  });
});
