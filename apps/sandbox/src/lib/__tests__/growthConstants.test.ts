import { describe, it, expect } from 'vitest';
import { PLAY_MONEY_GRANT } from '@/i18n/config';
import {
  WEEKLY_CREDIT_RATE,
  CREDIT_CEILING_MULTIPLE,
  COLLECTION_CAP_DAYS,
  RULE_OVERLAP_POLICY,
  SIM_EVENT_SIZING,
  weeklyCreditAmount,
  creditCeilingAmount,
  comparisonCreditAmount,
  MAX_UNCOLLECTED_WEEKS,
} from '../growthConstants';

// Attestation drift guard — docs/sandbox-app/PHASE2_CONSTANTS_ATTESTATION.md.
// Change the doc + this test together, never one alone.
describe('Phase-2 growth constants (attestation drift guard)', () => {
  it('should match the attested values exactly', () => {
    expect(WEEKLY_CREDIT_RATE).toBe(0.1);
    expect(CREDIT_CEILING_MULTIPLE).toBe(2);
    expect(COLLECTION_CAP_DAYS).toBe(14);
    expect(RULE_OVERLAP_POLICY).toBe('forbid');
    expect(SIM_EVENT_SIZING).toEqual({ minWeeklyMultiple: 1, maxWeeklyMultiple: 2 });
    expect(MAX_UNCOLLECTED_WEEKS).toBe(2); // COLLECTION_CAP_DAYS / WEEKLY_CADENCE_DAYS
  });

  it('should derive weekly credit + ceiling from the grant (single source, never a literal)', () => {
    expect(weeklyCreditAmount('b2c')).toBe(1_000); // 10_000 × 0.10
    expect(weeklyCreditAmount('b2b')).toBe(25_000); // 250_000 × 0.10
    expect(creditCeilingAmount('b2c')).toBe(20_000); // 10_000 × 2
    expect(creditCeilingAmount('b2b')).toBe(500_000); // 250_000 × 2
    // The derivation IS the grant, not a copied number.
    expect(weeklyCreditAmount('b2c')).toBe(PLAY_MONEY_GRANT.b2c * WEEKLY_CREDIT_RATE);
    expect(creditCeilingAmount('b2b')).toBe(PLAY_MONEY_GRANT.b2b * CREDIT_CEILING_MULTIPLE);
    // W-5c comparison credit = exactly one weekly amount (attestation §1).
    expect(comparisonCreditAmount('b2c')).toBe(weeklyCreditAmount('b2c'));
    expect(comparisonCreditAmount('b2b')).toBe(weeklyCreditAmount('b2b'));
  });
});
