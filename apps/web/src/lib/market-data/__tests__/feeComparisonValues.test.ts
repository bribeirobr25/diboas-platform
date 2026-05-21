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
    // Paragraph fee citation — Phase 8 Item B: uniform `feeParagraph` key
    // across all 4 locales (replaces locale-specific `catch.paragraphs.p5`).
    expect(map.has('landing-b2c.catch.feeParagraph')).toBe(true);
    expect(map.has('landing-b2c.catch.paragraphs.p5')).toBe(false);
  });

  it('should include landing-b2c.catch.feeParagraph for ALL 4 locales (CC8 closeout)', () => {
    // Phase 8 Item B: pt-BR no longer excluded; the catch.feeParagraph key
    // carries the parameterized fee citation uniformly. ProseSection picks
    // the locale-specific narrative position via `feeParagraphAt`.
    for (const loc of ['en', 'pt-BR', 'es', 'de'] as const) {
      const map = buildAllFeeValues(fees, loc);
      expect(map.has('landing-b2c.catch.feeParagraph'), `locale=${loc}`).toBe(true);
      const entry = map.get('landing-b2c.catch.feeParagraph')!;
      expect(entry).toHaveProperty('sellRate');
      expect(entry).toHaveProperty('maxFee');
      expect(entry).toHaveProperty('exampleFee');
    }
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
    // Paragraph fee citation slots (Phase 8 Item B — uniform feeParagraph).
    expect(map.get('landing-b2c.catch.feeParagraph')).toEqual({
      sellRate: '0.39%',
      maxFee: '$25',
      exampleFee: '39 cents',
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

  it('should include landing-page FAQ keys (PR-5: B2C withdraw + B2B catch) with Phase 8 Item C exampleFee slots', () => {
    const map = buildAllFeeValues(fees, 'en');
    expect(map.get('faq.items.withdraw.answer')).toEqual({
      rate: '0.48%',
      exampleFee: '48 cents',
    });
    expect(map.get('faq.items.catch.answer')).toEqual({
      sellRate: '0.39%',
      cashOutRate: '0.48%',
      sellExampleFee: '$39',
    });
  });

  it('should expose canonical faq.items.* keys consumed by B2C/B2B landing + /help (Phase 8 Item A)', () => {
    // After Phase 8 Item A consolidation, `faq.items.withdraw.answer` is the
    // single canonical key — it renders on both B2C landing AND /help moneySafety.
    // Same for `faq.items.catch.answer` (B2B landing + /help feesCosts).
    const map = buildAllFeeValues(fees, 'en');
    expect(map.has('faq.items.withdraw.answer')).toBe(true);
    expect(map.has('faq.items.catch.answer')).toBe(true);
    // Legacy per-surface keys are gone (consolidated into faq.items.*).
    expect(map.has('landing-help.topics.moneySafety.questions.q2.answer')).toBe(false);
    expect(map.has('landing-help.topics.feesCosts.questions.q2.answer')).toBe(false);
    expect(map.has('landing-b2c.faq.items.withdraw.answer')).toBe(false);
    expect(map.has('landing-b2b.faq.items.catch.answer')).toBe(false);
  });

  it('should compute locale-specific exampleFee per sub-unit naming convention', () => {
    // en uses "48 cents"; es uses "48 céntimos"; de uses "48 Cent"; pt-BR uses canonical "R$ 0,48".
    expect(buildAllFeeValues(fees, 'en').get('faq.items.withdraw.answer')?.exampleFee).toBe('48 cents');
    expect(buildAllFeeValues(fees, 'es').get('faq.items.withdraw.answer')?.exampleFee).toBe('48 céntimos');
    expect(buildAllFeeValues(fees, 'de').get('faq.items.withdraw.answer')?.exampleFee).toBe('48 Cent');
    const ptBR = buildAllFeeValues(fees, 'pt-BR').get('faq.items.withdraw.answer')?.exampleFee;
    expect(ptBR).toMatch(/R\$\s?0,48/); // canonical BRL ("R$ 0,48" with NBSP)
  });

  it('should use locale-specific B2B principal for sellExampleFee (pt-BR uses R$50.000)', () => {
    // pt-BR principal 50_000 × 0.39% = R$195; other locales 10_000 × 0.39% = $39 / 39 EUR.
    expect(buildAllFeeValues(fees, 'en').get('faq.items.catch.answer')?.sellExampleFee).toBe('$39');
    const ptBR = buildAllFeeValues(fees, 'pt-BR').get('faq.items.catch.answer')?.sellExampleFee;
    expect(ptBR).toMatch(/R\$\s?195/); // canonical BRL ("R$ 195" with NBSP)
    expect(buildAllFeeValues(fees, 'de').get('faq.items.catch.answer')?.sellExampleFee).toMatch(/39\s?€/);
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
