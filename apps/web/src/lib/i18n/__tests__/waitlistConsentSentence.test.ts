/**
 * The waitlist consent line is one sentence in every locale: the text, then the privacy-policy
 * link (`WaitlistModalForm`). Visual pass 2026-11-11: the German text ended "…und stimme der"
 * and the link closed it, so the sentence lacked the "zu" that "zustimmen" needs; the English
 * read "I accept to receive". Consent wording changes only on purpose: this pins it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const T = join(__dirname, '../../../../../../packages/i18n/translations');
const consent = (locale: string) => {
  const c = JSON.parse(readFileSync(join(T, locale, 'common.json'), 'utf8')).waitingList.form
    .consent;
  return `${c.text} ${c.privacyPolicy}`;
};

describe('the waitlist consent sentence', () => {
  it.each([
    ['en', 'I agree to receive communications from diBoaS and agree with the Privacy Policy'],
    ['pt-BR', 'Aceito receber comunicações do diBoaS e concordo com a Política de Privacidade'],
    [
      'es',
      'Acepto recibir comunicaciones de diBoaS y estoy de acuerdo con la Política de Privacidad',
    ],
    [
      'de',
      'Ich bin einverstanden, Mitteilungen von diBoaS zu erhalten, und akzeptiere die Datenschutzerklärung',
    ],
  ])('should read as one complete sentence in %s when the link closes it', (locale, sentence) => {
    expect(consent(locale)).toBe(sentence);
  });
});
