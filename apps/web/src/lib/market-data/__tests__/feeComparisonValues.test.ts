/**
 * Contract tests for `buildAllFeeValues` (Phase 7 Followup PR-2).
 *
 * Verifies the omnibus map shape + locale-aware formatting against the
 * canonical `marketDataService` snapshot.
 */

import { describe, it, expect } from 'vitest';
import { buildAllFeeValues } from '../feeComparisonValues';
import { marketDataService } from '../service';

const fees = marketDataService.getSync().platformFees;

describe('buildAllFeeValues', () => {
  it('should produce expected keys for canonical PlatformFees shape (en locale)', () => {
    const map = buildAllFeeValues(fees, 'en');
    // B2C
    expect(map.has('landing-b2c.fees.rows.adding.diboas')).toBe(true);
    expect(map.has('landing-b2c.fees.rows.selling.diboas')).toBe(true);
    expect(map.has('landing-b2c.fees.rows.strategies.diboas')).toBe(true);
    expect(map.has('landing-b2c.fees.rows.cashout.diboas')).toBe(true);
    // B2B
    expect(map.has('landing-b2b.fees.rows.add.diboas')).toBe(true);
    expect(map.has('landing-b2b.fees.rows.sell.diboas')).toBe(true);
    expect(map.has('landing-b2b.fees.rows.cashOut.diboas')).toBe(true);
    expect(map.has('landing-b2b.fees.example')).toBe(true);
    // Paragraph fee citation — en locale included
    expect(map.has('landing-b2c.catch.paragraphs.p5')).toBe(true);
  });

  it('should omit landing-b2c.catch.paragraphs.p5 when locale is pt-BR', () => {
    // pt-BR's p5 carries different content (fee citation lives at p4);
    // CC8 Option C: defer pt-BR migration.
    const map = buildAllFeeValues(fees, 'pt-BR');
    expect(map.has('landing-b2c.catch.paragraphs.p5')).toBe(false);
    // Other B2C/B2B keys still present.
    expect(map.has('landing-b2c.fees.rows.adding.diboas')).toBe(true);
    expect(map.has('landing-b2b.fees.rows.add.diboas')).toBe(true);
  });

  it('should render byte-identical strings in en locale for current platformFees', () => {
    const map = buildAllFeeValues(fees, 'en');

    // Multi-slot rows reproduce the current literals exactly.
    expect(map.get('landing-b2c.fees.rows.adding.diboas')).toEqual({
      rate: '0.48%',
      min: '$0.25',
      max: '$25',
    });
    expect(map.get('landing-b2c.fees.rows.selling.diboas')).toEqual({
      rate: '0.39%',
      min: '$0.25',
      max: '$25',
    });
    // Single-slot rows.
    expect(map.get('landing-b2c.fees.rows.cashout.diboas')).toEqual({
      rate: '0.48%',
    });
    expect(map.get('landing-b2c.fees.rows.strategies.diboas')).toEqual({
      exitRate: '0.39%',
    });
    // Paragraph fee citation slots.
    expect(map.get('landing-b2c.catch.paragraphs.p5')).toEqual({
      sellRate: '0.39%',
      maxFee: '$25',
    });
    // B2B example slot.
    expect(map.get('landing-b2b.fees.example')).toEqual({
      cashOutRate: '0.48%',
    });
  });

  it('should honor maxFractionDigits 0 for max fee — $25 not $25.00 (audit M5)', () => {
    const map = buildAllFeeValues(fees, 'en');
    const adding = map.get('landing-b2c.fees.rows.adding.diboas')!;
    // Critical precision contract: maxFee must NOT have trailing decimals.
    expect(adding.max).toBe('$25');
    expect(adding.max).not.toBe('$25.00');
    // minFee preserves 2 decimals.
    expect(adding.min).toBe('$0.25');
  });

  it('should produce EUR currency formatting (not USD) in de locale', () => {
    // Audit L10: DE locale uses EUR. NBSP between number and symbol per Intl.
    const map = buildAllFeeValues(fees, 'de');
    const adding = map.get('landing-b2c.fees.rows.adding.diboas')!;
    expect(adding.min).toMatch(/€/); // EUR symbol
    expect(adding.min).not.toMatch(/\$/); // not USD
    expect(adding.max).toMatch(/€/);
    expect(adding.max).not.toMatch(/\$/);
  });

  it('should include landing-page FAQ keys (PR-5: B2C withdraw + B2B catch)', () => {
    const map = buildAllFeeValues(fees, 'en');
    expect(map.get('landing-b2c.faq.items.withdraw.answer')).toEqual({
      rate: '0.48%',
    });
    expect(map.get('landing-b2b.faq.items.catch.answer')).toEqual({
      sellRate: '0.39%',
      cashOutRate: '0.48%',
    });
  });

  it('should include landing-help keys for moneySafety.q2 (single rate) and feesCosts.q2 (multi-rate)', () => {
    const map = buildAllFeeValues(fees, 'en');
    expect(map.get('landing-help.topics.moneySafety.questions.q2.answer')).toEqual({
      rate: '0.48%',
    });
    expect(map.get('landing-help.topics.feesCosts.questions.q2.answer')).toEqual({
      sellRate: '0.39%',
      cashOutRate: '0.48%',
    });
  });

  it('should map every key to a record whose values are all strings (slot-value contract)', () => {
    const map = buildAllFeeValues(fees, 'en');
    for (const [key, values] of map) {
      expect(values, `key=${key}`).toBeTypeOf('object');
      for (const [slot, value] of Object.entries(values)) {
        expect(typeof value, `key=${key} slot=${slot}`).toBe('string');
        expect(value, `key=${key} slot=${slot}`).not.toBe('');
      }
    }
  });
});
