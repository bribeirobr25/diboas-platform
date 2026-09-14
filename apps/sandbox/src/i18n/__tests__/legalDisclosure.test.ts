import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES } from '../config';
import { getMessages } from '../loadMessages';

/**
 * `DISCLOSE-1` — the play-money disclosure matches its LEGAL-APPROVED wording
 * in all four locales.
 *
 * WHY THIS EXISTS, and why it is not covered by anything already here:
 * - `SHELL-1` asserts the disclosure's PRESENCE and POSITION in the content
 *   flow. Its row states the scope limit explicitly: it never asserts the
 *   LANGUAGE. It reads `getMessages('en')`, so it would pass just as happily
 *   over a catalogue someone had quietly reworded.
 * - the untranslated ratchet asserts each locale DIFFERS from English. That is
 *   the wrong test for a compliance control: four locales can all differ from
 *   English and still say materially different things, which is exactly what
 *   `5.308` recorded (en/pt-BR asserted five fewer things than de/es, and
 *   asserted one thing de/es did not).
 *
 * So this pins the bytes. Legal supplied the EN and pt-BR replacements
 * (`5.308`, 2026-09-14) and had already approved de/es (Consolidated Handoff
 * §2.1, applied 2026-09-12). The strings are EMBEDDED rather than read from a
 * document because `docs/sandbox-app/legal-current/` is empty and the ruling
 * documents are local-only + gitignored: a test that read them would pass
 * vacuously in a fresh clone. Embedding is what makes a future drift fail.
 *
 * ⚑ Changing any string below requires a Legal ruling, not an engineering
 * decision. If Legal supersedes one, replace the constant in the same commit
 * that changes the catalogue, and cite the ruling.
 */
const APPROVED: Record<string, string> = {
  en: 'Practice is a simulation. No real money moves. Practice does not provide financial or investment advice. Practice Credits are simulated practice units with no monetary value; they are not fiat currency or Rewards. They cannot be converted into real money, withdrawn, redeemed or transferred.',
  'pt-BR':
    'Practice é uma simulação. Nenhum dinheiro real é movimentado. Practice não oferece aconselhamento financeiro ou de investimento. Practice Credits são unidades simuladas de prática sem valor monetário; não são moeda fiduciária nem Rewards (recompensas). Não podem ser convertidos em dinheiro real, sacados, resgatados ou transferidos.',
  de: 'Practice ist eine Simulation. Es wird kein echtes Geld bewegt. Practice bietet keine Finanz- oder Anlageberatung. Practice Credits sind simulierte Übungseinheiten ohne Geldwert, keine Fiatwährung und keine Rewards (Belohnungen). Sie können weder in echtes Geld umgewandelt noch ausgezahlt, eingelöst oder übertragen werden.',
  es: 'Practice es una simulación. No se mueve dinero real. Practice no ofrece asesoramiento financiero ni de inversión. Los Practice Credits son unidades de práctica simuladas sin valor monetario; no son moneda fiduciaria ni Rewards (recompensas). No pueden convertirse en dinero real, retirarse, canjearse ni transferirse.',
};

describe('DISCLOSE-1 — the play-money disclosure carries Legal-approved wording in every locale', () => {
  it.each(SANDBOX_LOCALES)('should match the approved %s wording byte-for-byte', (locale) => {
    expect(getMessages(locale)['common.playDisclaimer']).toBe(APPROVED[locale]);
  });

  it('should cover every supported locale, so the gate cannot go partial unnoticed', () => {
    // A four-locale control with three entries is the shape 5.308 described.
    expect(Object.keys(APPROVED).sort()).toEqual([...SANDBOX_LOCALES].sort());
  });

  it('should assert each of the five things Legal requires the disclosure to say', () => {
    /**
     * Semantic floor, so a future Legal-approved rewording cannot silently drop
     * a required assertion. Per-locale markers, because these are the concepts
     * `5.308` found missing from en/pt-BR: simulation · no real money moves ·
     * no advice · no monetary value · not convertible.
     */
    const REQUIRED: Record<string, RegExp[]> = {
      en: [
        /simulation/i,
        /no real money moves/i,
        /not provide financial or investment advice/i,
        /no monetary value/i,
        /cannot be converted/i,
      ],
      'pt-BR': [
        /simula/i,
        /nenhum dinheiro real/i,
        /não oferece aconselhamento/i,
        /sem valor monetário/i,
        /não podem ser convertidos/i,
      ],
      de: [
        /Simulation/,
        /kein echtes Geld/,
        /keine Finanz- oder Anlageberatung/,
        /ohne Geldwert/,
        /weder in echtes Geld umgewandelt/,
      ],
      es: [
        /simulaci/i,
        /no se mueve dinero real/i,
        /no ofrece asesoramiento/i,
        /sin valor monetario/i,
        /no pueden convertirse/i,
      ],
    };
    for (const locale of SANDBOX_LOCALES) {
      const value = getMessages(locale)['common.playDisclaimer'];
      for (const re of REQUIRED[locale]) {
        expect(re.test(value), `${locale} disclosure must assert ${re}`).toBe(true);
      }
    }
  });
});
