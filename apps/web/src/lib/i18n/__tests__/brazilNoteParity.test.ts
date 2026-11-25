/**
 * 5.974 · the pt-BR Brazil notes say what the Terms say (market clean-up W-D1, spec §6.3). The
 * cookie and privacy policies told Brazilian visitors the waitlist was NOT open to them, while the
 * Terms (and the site) say it is. Both notes now carry the Terms page's sentence verbatim; the
 * privacy note keeps its LGPD sentence. Only pt-BR has a Brazil note (searched: en, es, de have
 * none in any legal file).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const LEGAL = resolve(__dirname, '../../../../../../packages/i18n/translations');
const note = (locale: string, file: string): string | undefined =>
  JSON.parse(readFileSync(join(LEGAL, locale, 'legal', `${file}.json`), 'utf8')).sections
    ?.brazilNote?.content;

describe('5.974: the Brazil notes agree with the Terms', () => {
  const terms = note('pt-BR', 'terms')!;

  it('should carry the Terms sentence verbatim in the cookie and privacy policies', () => {
    expect(terms).toMatch(/lista de espera estão totalmente acessíveis/);
    expect(note('pt-BR', 'cookies')).toBe(terms);
    expect(note('pt-BR', 'privacy')!.startsWith(terms)).toBe(true);
    expect(note('pt-BR', 'privacy')).toMatch(/LGPD - Lei n\. 13\.709\/2018/);
  });

  it('should find no Brazil note in any other locale', () => {
    for (const locale of ['en', 'es', 'de'])
      for (const file of ['cookies', 'privacy', 'terms'])
        expect(note(locale, file)).toBeUndefined();
  });
});
