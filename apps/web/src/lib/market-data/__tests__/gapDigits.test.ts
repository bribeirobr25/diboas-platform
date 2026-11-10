/**
 * 5.822 · a signal card's "about X%" gap agrees with the memo on the same page.
 * Requirement: the card and the memo quote the same gap; a gap under 0.5% never reads
 * "about 0%". The card used no decimals ("about 1%") while the memo wrote "about 1.5%"
 * for the same 1.485% gap (cycle 2026-11-09).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gapDigits } from '../../../../scripts/market-refresh/generate.mjs';

const fmt = (gap: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: gapDigits(gap),
    maximumFractionDigits: gapDigits(gap),
  }).format(gap);

describe('gapDigits (5.822)', () => {
  it('should quote one decimal when the gap is under 10%', () => {
    expect(fmt(1.485, 'en-US')).toBe('1.5');
    expect(fmt(1.485, 'de-DE')).toBe('1,5');
  });

  it('should never read 0 when the gap is small but not zero', () => {
    expect(fmt(0.3, 'en-US')).toBe('0.3');
  });

  it('should quote a whole percent from 10% up', () => {
    expect(gapDigits(10)).toBe(0);
    expect(fmt(12.46, 'en-US')).toBe('12');
  });

  it('should read a whole percent when one decimal would round up to 10', () => {
    expect(fmt(9.96, 'en-US')).toBe('10');
    expect(fmt(9.94, 'en-US')).toBe('9.9');
    // the exact tie: toFixed rounds the binary 9.95 down, Intl rounds it up
    expect(fmt(9.95, 'en-US')).toBe('10');
    expect(fmt(9.95, 'de-DE')).toBe('10');
  });

  it('should keep a real gap under 0.05% from reading as zero', () => {
    expect(fmt(0.03, 'en-US')).toBe('0.03');
  });

  it('should treat a negative gap by its size', () => {
    expect(gapDigits(-3.2)).toBe(1);
  });
});

/**
 * The published card text, not only the helper: reverting the slot and regenerating
 * keeps `generate.mjs --check` green, so this reads the committed cards and asserts the
 * relationship (the gap at `gapDigits` precision), never a weekly value.
 */
describe('the published Bitcoin cards quote the gap at the rule precision (5.822)', () => {
  const dir = join(__dirname, '../../../../data/market/shared');
  const computed = JSON.parse(readFileSync(join(dir, 'computed.json'), 'utf8')) as {
    signals: { id: string; values?: { gapPct?: number } }[];
  };
  const cards = JSON.parse(readFileSync(join(dir, 'signals.json'), 'utf8')) as {
    groups: { signals: { id: string; summary: Record<string, string> }[] }[];
  };
  const INTL = { en: 'en-US', 'pt-BR': 'pt-BR', es: 'es-ES', de: 'de-DE' } as const;

  for (const id of ['BTC-01', 'BTC-02']) {
    const gap = computed.signals.find((s) => s.id === id)?.values?.gapPct;
    const card = cards.groups.flatMap((g) => g.signals).find((s) => s.id === id);
    for (const [locale, intl] of Object.entries(INTL)) {
      it(`should quote ${id}'s gap at the rule precision in ${locale}`, () => {
        expect(gap, `${id} gapPct`).toBeTypeOf('number');
        const figure = fmt(Math.abs(gap!), intl);
        expect(card?.summary[locale], `${id} ${locale}`).toContain(`${figure}%`);
      });
    }
  }
});
