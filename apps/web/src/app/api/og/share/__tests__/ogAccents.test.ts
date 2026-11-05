/**
 * Register 5.774 · the share-image texts keep their accents. They had been written without
 * them (es "durante 5 anos" reads as a vulgar word, not "years"; de "uber", "konnte"; pt
 * "Posicao", "dolar"), although the image renderer draws accented letters. Each list names the
 * stripped forms of THIS file's words, per locale; a correct word that happens to look alike in
 * another language is not listed (pt "anos" is right, es "Estrategia" is right).
 */
import { describe, expect, it } from 'vitest';
import { OG_TRANSLATIONS, getDefaultName } from '../ogTranslations';

const STRIPPED: Record<string, RegExp> = {
  es: /\b(anos|unio|Posicion|Unete|inversion|podria|valdria|Cuanto|Funcion|funcion|Depreciacion|dolar)\b/,
  'pt-BR':
    /\b(Posicao|Comecando|Estrategia|Funcao|funcao|Depreciacao|Historico|cartao|dolar|Alguem)\b/,
  de: /\b(konnte|Wahrungsabwertung|Kartengebuhren|ware|uber)\b/,
};

function texts(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return [String((value as (a: unknown) => string)(5))];
  if (value && typeof value === 'object') return Object.values(value).flatMap(texts);
  return [];
}

describe('OG share texts keep their accents (5.774)', () => {
  it.each(Object.keys(STRIPPED))(
    'should contain no accent-stripped word when rendering %s',
    (locale) => {
      const all = texts(OG_TRANSLATIONS[locale as keyof typeof OG_TRANSLATIONS]);
      expect(all.length).toBeGreaterThan(15);
      expect(all.filter((t) => STRIPPED[locale]!.test(t))).toEqual([]);
    }
  );

  it('should keep the accent in the default name when the locale is pt-BR', () => {
    expect(STRIPPED['pt-BR']!.test(getDefaultName('pt-BR'))).toBe(false);
  });

  it('should open a Spanish exclamation with "¡" when the waitlist message is rendered', () => {
    expect(OG_TRANSLATIONS.es.waitlist.joinedMessage('Ana')).toMatch(/^¡.*!$/);
  });
});
