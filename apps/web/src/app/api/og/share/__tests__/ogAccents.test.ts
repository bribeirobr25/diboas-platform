/**
 * Register 5.774 · the share-image texts keep their accents. They had been written without
 * them (es "durante 5 anos" — without the tilde a vulgar word, not "years"; de "uber",
 * "konnte"; pt "Posicao", "dolar"), although the image renderer draws accented letters.
 *
 * The guard is an EXACT expected text per locale, not a list of known misspellings: a list
 * cannot see "mí" → "mi" ("mi inversión" is right), a changed case, a misplaced or decomposed
 * accent (fifth audit, 2026-11-05). Every function is rendered for 1 and 5 years, so the
 * singular ("1 año", not "1 años") is pinned too. A wording change updates this file on
 * purpose — that is the review moment, with a native pass (done by CC under the founder's
 * delegation, 2026-11-05: idiom, sentence case, the in-app tool names, singular years).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OG_TRANSLATIONS, getDefaultName } from '../ogTranslations';

type Rendered = string | readonly [string, string] | { readonly [key: string]: Rendered };

/** Strings stay; a function becomes its text for 1 year and for 5 years. */
function render(value: unknown): Rendered {
  if (typeof value === 'function') {
    const fn = value as (arg: number) => string;
    return [fn(1), fn(5)];
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, render(v)]));
  }
  return value as string;
}

const EXPECTED: Record<'pt-BR' | 'es' | 'de', Rendered> = {
  'pt-BR': {
    waitlist: {
      joinedMessage: ['1 entrou na lista de espera!', '5 entrou na lista de espera!'],
      position: 'Posição',
      cta: 'Entre você também no diBoaS: liberdade financeira simplificada',
    },
    calculator: {
      badge: 'Calculadora Modo Sonho',
      growthMessage: [
        'Em 1 ano, meu investimento poderia chegar a',
        'Em 5 anos, meu investimento poderia chegar a',
      ],
      startingWith: 'Começando com',
      strategy: 'Estratégia',
      cta: 'Calcule seu futuro em diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Dinheiro com Função',
        'currency-depreciation': 'Desvalorização cambial',
        'idle-cash': 'Caixa parado',
        'asset-history': 'Histórico de ativos',
        'card-fees': 'Taxas de cartão',
      },
      headline: 'No que isso poderia se transformar',
      headlineByTool: {
        'money-jobs': 'Cada real precisa de uma função',
        'asset-history': 'Quanto valeria hoje',
        'card-fees': 'Quanto eu poderia economizar',
      },
      subline: ['Mantido em dólar digital por 1 ano', 'Mantido em dólar digital por 5 anos'],
      cta: 'Calcule o seu em diboas.com',
    },
    default: { tagline: 'Liberdade financeira simplificada' },
  },
  es: {
    waitlist: {
      joinedMessage: ['¡1 se unió a la lista de espera!', '¡5 se unió a la lista de espera!'],
      position: 'Posición',
      cta: 'Únete tú también a diBoaS: libertad financiera simplificada',
    },
    calculator: {
      badge: 'Calculadora Modo Sueño',
      growthMessage: [
        'En 1 año, mi inversión podría llegar a',
        'En 5 años, mi inversión podría llegar a',
      ],
      startingWith: 'Empezando con',
      strategy: 'Estrategia',
      cta: 'Calcula tu futuro en diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Dinero con Función',
        'currency-depreciation': 'Depreciación monetaria',
        'idle-cash': 'Efectivo parado',
        'asset-history': 'Historial de activos',
        'card-fees': 'Comisiones de tarjeta',
      },
      headline: 'En qué podría convertirse',
      headlineByTool: {
        'money-jobs': 'Cada euro necesita una función',
        'asset-history': 'Cuánto valdría hoy',
        'card-fees': 'Cuánto podría ahorrar',
      },
      subline: [
        'Guardado en dólar digital durante 1 año',
        'Guardado en dólar digital durante 5 años',
      ],
      cta: 'Calcula el tuyo en diboas.com',
    },
    default: { tagline: 'Libertad financiera simplificada' },
  },
  de: {
    waitlist: {
      joinedMessage: ['1 steht jetzt auf der Warteliste!', '5 steht jetzt auf der Warteliste!'],
      position: 'Platz',
      cta: 'Mach mit bei diBoaS: finanzielle Freiheit einfach gemacht',
    },
    calculator: {
      badge: 'Dream-Mode-Rechner',
      growthMessage: [
        'In 1 Jahr könnte meine Geldanlage anwachsen auf',
        'In 5 Jahren könnte meine Geldanlage anwachsen auf',
      ],
      startingWith: 'Startbetrag',
      strategy: 'Strategie',
      cta: 'Berechne deine Zukunft auf diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Geld mit Aufgabe',
        'currency-depreciation': 'Währungs-Wertverlust',
        'idle-cash': 'Liegendes Geld',
        'asset-history': 'Vermögensverlauf',
        'card-fees': 'Kartengebühren',
      },
      headline: 'Was daraus werden könnte',
      headlineByTool: {
        'money-jobs': 'Jeder Euro braucht eine Aufgabe',
        'asset-history': 'Was es heute wert wäre',
        'card-fees': 'Was ich sparen könnte',
      },
      subline: [
        '1 Jahr lang als digitaler Dollar gehalten',
        '5 Jahre lang als digitaler Dollar gehalten',
      ],
      cta: 'Berechne deins auf diboas.com',
    },
    default: { tagline: 'Finanzielle Freiheit einfach gemacht' },
  },
};

const DEFAULT_NAMES = { 'pt-BR': 'Alguém', es: 'Alguien', de: 'Jemand' } as const;

describe('OG share texts keep their accents (5.774)', () => {
  it.each(Object.keys(EXPECTED) as Array<keyof typeof EXPECTED>)(
    'should render exactly the reviewed %s texts, singular and plural',
    (locale) => {
      expect(render(OG_TRANSLATIONS[locale])).toEqual(EXPECTED[locale]);
      expect(getDefaultName(locale)).toBe(DEFAULT_NAMES[locale]);
    }
  );

  it('should keep every share text in composed (NFC) form when any locale is rendered', () => {
    const all = JSON.stringify(render(OG_TRANSLATIONS));
    expect(all).toBe(all.normalize('NFC'));
  });
});
