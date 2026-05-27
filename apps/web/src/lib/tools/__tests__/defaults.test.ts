/**
 * Phase 7 §7.2 — Defaults pinning tests for all 10 tools.
 *
 * Pre-Phase 7, the audit-bundle vectors (PT1/PT3 product-truth gates) tested
 * the ENGINE with explicit inputs — not the page defaults. If
 * `COMPOUND_TOOL_DEFAULTS.retirement.amount['pt-BR']` was accidentally edited
 * from 2000 to 200, the PT1 gate would still pass (the gate hardcodes 2000),
 * but the retirement page's default state would silently shift.
 *
 * These tests pin the documented per-locale defaults so a regression is caught
 * at PR time, not by a product check three weeks later.
 */

import { describe, it, expect } from 'vitest';
import {
  ASSET_HISTORY_DEFAULTS,
  CARD_FEES_DEFAULTS,
  COMPOUND_TOOL_DEFAULTS,
  CURRENCY_DEPRECIATION_DEFAULTS,
  EMERGENCY_FUND_DEFAULTS,
  IDLE_CASH_DEFAULTS,
  INFLATION_IMPACT_DEFAULTS,
  TIME_TO_TARGET_DEFAULTS,
} from '../constants';

describe('COMPOUND_TOOL_DEFAULTS — locked per audit bundle PT1/PT3', () => {
  it('retirement pt-BR defaults match PT1 gate (R$2000/mo × 25y)', () => {
    expect(COMPOUND_TOOL_DEFAULTS.retirement.amount['pt-BR']).toBe(2000);
    expect(COMPOUND_TOOL_DEFAULTS.retirement.cadence).toBe('monthly');
    expect(COMPOUND_TOOL_DEFAULTS.retirement.years).toBe(25);
  });

  it('retirement de defaults match PT3 gate (€400/mo × 25y)', () => {
    expect(COMPOUND_TOOL_DEFAULTS.retirement.amount.de).toBe(400);
  });

  it('compound-interest defaults: daily cadence, 12y horizon', () => {
    expect(COMPOUND_TOOL_DEFAULTS['compound-interest'].cadence).toBe('daily');
    expect(COMPOUND_TOOL_DEFAULTS['compound-interest'].years).toBe(12);
    expect(COMPOUND_TOOL_DEFAULTS['compound-interest'].amount.en).toBe(5);
    expect(COMPOUND_TOOL_DEFAULTS['compound-interest'].amount['pt-BR']).toBe(25);
  });

  it('goal-savings defaults: monthly cadence, 10y horizon (within retrospective cap)', () => {
    expect(COMPOUND_TOOL_DEFAULTS['goal-savings'].cadence).toBe('monthly');
    expect(COMPOUND_TOOL_DEFAULTS['goal-savings'].years).toBe(10);
    // The 10-year default is intentionally <= MAX_RETROSPECTIVE_YEARS so the
    // tool opens in a safe state when retrospective mode toggles (C7 context).
    expect(COMPOUND_TOOL_DEFAULTS['goal-savings'].years).toBeLessThanOrEqual(16);
  });
});

describe('EMERGENCY_FUND_DEFAULTS', () => {
  it('targetMultiplier = 6 (months of expenses)', () => {
    expect(EMERGENCY_FUND_DEFAULTS.targetMultiplier).toBe(6);
  });

  it('monthlyExpenses per locale', () => {
    expect(EMERGENCY_FUND_DEFAULTS.monthlyExpenses.en).toBe(2900);
    expect(EMERGENCY_FUND_DEFAULTS.monthlyExpenses['pt-BR']).toBe(2700);
  });
});

describe('TIME_TO_TARGET_DEFAULTS', () => {
  it('cadence monthly, initialAmount 0', () => {
    expect(TIME_TO_TARGET_DEFAULTS.cadence).toBe('monthly');
    expect(TIME_TO_TARGET_DEFAULTS.initialAmount.en).toBe(0);
  });
});

describe('INFLATION_IMPACT_DEFAULTS', () => {
  it('years = 10', () => {
    expect(INFLATION_IMPACT_DEFAULTS.years).toBe(10);
  });
});

describe('CURRENCY_DEPRECIATION_DEFAULTS', () => {
  it('years = 5', () => {
    expect(CURRENCY_DEPRECIATION_DEFAULTS.years).toBe(5);
  });
});

describe('IDLE_CASH_DEFAULTS', () => {
  it('years = 3 (short B2B treasury horizon)', () => {
    expect(IDLE_CASH_DEFAULTS.years).toBe(3);
  });

  it('idleCash per locale', () => {
    expect(IDLE_CASH_DEFAULTS.idleCash.en).toBe(100000);
    expect(IDLE_CASH_DEFAULTS.idleCash['pt-BR']).toBe(500000);
  });
});

describe('CARD_FEES_DEFAULTS — Phase C Decision Q3 (ES/DE post-IFR)', () => {
  it('en: 2.9% (North American blended typical)', () => {
    expect(CARD_FEES_DEFAULTS.processorFeeRate.en).toBe(0.029);
  });

  it('pt-BR: 3.0% (BR D+30 typical)', () => {
    expect(CARD_FEES_DEFAULTS.processorFeeRate['pt-BR']).toBe(0.03);
  });

  it('es/de: 0.8% (post-IFR EU 2015/751 interchange-capped)', () => {
    // Phase C Q3 (2026-05-23): was 1.75%, refreshed to 0.8% to reflect IFR.
    expect(CARD_FEES_DEFAULTS.processorFeeRate.es).toBe(0.008);
    expect(CARD_FEES_DEFAULTS.processorFeeRate.de).toBe(0.008);
  });
});

describe('ASSET_HISTORY_DEFAULTS', () => {
  it('asset = BTC across all locales, startYear = 2016, mode = monthlyDca', () => {
    expect(ASSET_HISTORY_DEFAULTS.asset.en).toBe('BTC');
    expect(ASSET_HISTORY_DEFAULTS.asset['pt-BR']).toBe('BTC');
    expect(ASSET_HISTORY_DEFAULTS.asset.es).toBe('BTC');
    expect(ASSET_HISTORY_DEFAULTS.asset.de).toBe('BTC');
    expect(ASSET_HISTORY_DEFAULTS.startYear).toBe(2016);
    expect(ASSET_HISTORY_DEFAULTS.mode).toBe('monthlyDca');
  });

  it('contribution per locale (en/es/de=100, pt-BR=500)', () => {
    expect(ASSET_HISTORY_DEFAULTS.contribution.en).toBe(100);
    expect(ASSET_HISTORY_DEFAULTS.contribution['pt-BR']).toBe(500);
    expect(ASSET_HISTORY_DEFAULTS.contribution.es).toBe(100);
    expect(ASSET_HISTORY_DEFAULTS.contribution.de).toBe(100);
  });
});
