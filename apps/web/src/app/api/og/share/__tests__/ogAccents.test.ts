/**
 * Register 5.774 · the share-image texts keep their accents. They had been written without
 * them (es "durante 5 anos" — without the tilde a vulgar word, not "years"; de "uber",
 * "konnte"; pt "Posicao", "dolar"), although the image renderer draws accented letters.
 *
 * The guard is an EXACT expected text per locale, not a list of known misspellings: a list
 * cannot see "mí" → "mi" ("mi inversión" is right), a changed case, a misplaced or decomposed
 * accent (fifth audit, 2026-11-05). Every function is rendered for 1 and 5 years, so the
 * singular ("1 año", not "1 años") is pinned too. A wording change updates this file on
 * purpose — that is the review moment, with a native pass.
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
      cta: 'Junte-se a mim no diBoaS - Liberdade Financeira Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: [
        'Em 1 ano, meu investimento poderia crescer para',
        'Em 5 anos, meu investimento poderia crescer para',
      ],
      startingWith: 'Começando com',
      strategy: 'Estratégia',
      cta: 'Calcule seu futuro em diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Dinheiro com Função',
        'currency-depreciation': 'Depreciação cambial',
        'idle-cash': 'Dinheiro parado',
        'asset-history': 'Histórico de ativos',
        'card-fees': 'Taxas de cartão',
      },
      headline: 'No que poderia se transformar',
      headlineByTool: {
        'money-jobs': 'Cada real precisa de uma função',
        'asset-history': 'Quanto valeria hoje',
        'card-fees': 'Quanto eu poderia economizar',
      },
      subline: ['Em dólar digital ao longo de 1 ano', 'Em dólar digital ao longo de 5 anos'],
      cta: 'Veja o seu em diboas.com',
    },
    default: { tagline: 'Liberdade Financeira Simplificada' },
  },
  es: {
    waitlist: {
      joinedMessage: ['¡1 se unió a la lista de espera!', '¡5 se unió a la lista de espera!'],
      position: 'Posición',
      cta: 'Únete a mí en diBoaS - Libertad Financiera Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: [
        'En 1 año, mi inversión podría crecer a',
        'En 5 años, mi inversión podría crecer a',
      ],
      startingWith: 'Empezando con',
      strategy: 'Estrategia',
      cta: 'Calcula tu futuro en diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Dinero con Función',
        'currency-depreciation': 'Depreciación monetaria',
        'idle-cash': 'Dinero parado',
        'asset-history': 'Historial de activos',
        'card-fees': 'Comisiones de tarjeta',
      },
      headline: 'En lo que podría convertirse',
      headlineByTool: {
        'money-jobs': 'Cada euro necesita una función',
        'asset-history': 'Cuánto valdría hoy',
        'card-fees': 'Cuánto podría ahorrar',
      },
      subline: ['En dólar digital durante 1 año', 'En dólar digital durante 5 años'],
      cta: 'Mira el tuyo en diboas.com',
    },
    default: { tagline: 'Libertad Financiera Simplificada' },
  },
  de: {
    waitlist: {
      joinedMessage: ['1 ist der Warteliste beigetreten!', '5 ist der Warteliste beigetreten!'],
      position: 'Position',
      cta: 'Komm zu mir auf diBoaS - Finanzielle Freiheit Einfach Gemacht',
    },
    calculator: {
      badge: 'Dream Mode Rechner',
      growthMessage: [
        'In 1 Jahr könnte meine Investition wachsen auf',
        'In 5 Jahren könnte meine Investition wachsen auf',
      ],
      startingWith: 'Startbetrag',
      strategy: 'Strategie',
      cta: 'Berechne deine Zukunft auf diboas.com',
    },
    toolResult: {
      toolName: {
        'money-jobs': 'Geld mit Aufgabe',
        'currency-depreciation': 'Währungsabwertung',
        'idle-cash': 'Ungenutztes Geld',
        'asset-history': 'Anlage-Historie',
        'card-fees': 'Kartengebühren',
      },
      headline: 'Was daraus werden könnte',
      headlineByTool: {
        'money-jobs': 'Jeder Euro braucht eine Aufgabe',
        'asset-history': 'Was es heute wert wäre',
        'card-fees': 'Was ich sparen könnte',
      },
      subline: ['Als digitaler Dollar über 1 Jahr', 'Als digitaler Dollar über 5 Jahre'],
      cta: 'Sieh deins auf diboas.com',
    },
    default: { tagline: 'Finanzielle Freiheit Einfach Gemacht' },
  },
};

const DEFAULT_NAMES = { 'pt-BR': 'Alguém', es: 'Alguien', de: 'Jemand' } as const;

/** The dream share route keeps its texts in the route file (a route may export only handlers). */
const DREAM_ROUTE = readFileSync(join(__dirname, '..', '..', 'dream', 'route.tsx'), 'utf8');
const DREAM_BADGES = [
  "'Enquanto Eu Dormia...'",
  "'Mientras Dormía...'",
  "'Während ich schlief...'",
];

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

  it('should keep the dream route badges accented when the route file is read', () => {
    for (const badge of DREAM_BADGES) expect(DREAM_ROUTE).toContain(badge);
    expect(DREAM_ROUTE).toBe(DREAM_ROUTE.normalize('NFC'));
  });
});
