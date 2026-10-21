import { describe, expect, it } from 'vitest';
import { FEE_RATES } from '@diboas/banking';
import de from '../messages/de.json';
import en from '../messages/en.json';
import es from '../messages/es.json';
import ptBR from '../messages/pt-BR.json';

/**
 * ONE FACT, ONE VALUE (Front 9 X1; lane audit 2026-10-21, Z1): the exit fee is quoted as
 * typed text in three approved strings per locale, while the Detailed view formats
 * `FEE_RATES.exit`. Nothing tied the two together, so a changed rate would have kept the
 * Simple view quoting the old fee on the screen before money moves. The copy itself is
 * Brand/Legal's and is not touched; this pins that whatever it quotes is the real rate.
 */
const CATALOGS = { en, de, es, 'pt-BR': ptBR } as Record<string, Record<string, unknown>>;
const KEYS = ['pathCard.exitFee', 'strategyDetail.costLine', 'goalPause.alsoStop'];

function read(catalog: Record<string, unknown>, key: string): string {
  const v = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], catalog);
  return typeof v === 'string' ? v : String((catalog as Record<string, unknown>)[key] ?? '');
}

describe('the exit fee quoted in copy is the ledger rate (Z1)', () => {
  const expected = FEE_RATES.exit.times(100).toNumber();

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    for (const key of KEYS) {
      it(`should quote ${expected}% in ${locale} ${key}`, () => {
        const text = read(catalog, key);
        const quoted = text.match(/(\d+[.,]\d+)\s*%/);
        expect(quoted, `${locale} ${key}: "${text}"`).not.toBeNull();
        expect(Number(quoted![1].replace(',', '.'))).toBe(expected);
      });
    }
  }
});
