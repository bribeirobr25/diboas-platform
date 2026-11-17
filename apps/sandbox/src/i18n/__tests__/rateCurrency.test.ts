import { createHash } from 'node:crypto';
import {
  isLiteralElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';
import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES, type SandboxLocale } from '../config';
import { getMessages } from '../loadMessages';

/**
 * `5.814` · RATE-AGE-1 · NO MESSAGE CALLS A RATE CURRENT (plan P10, guards 4 and 5).
 *
 * DATA_VINTAGE_POLICY P-7: "a DELAYED or STALE rate must be shown as such, never
 * as current"; Brand §15: "stale ≠ current". No Practice policy allows CURRENT,
 * so no message may put a currency word on a rate — except `goalNew.apyNow`, the
 * line reserved for a CURRENT rate, pinned here by its key AND its exact text.
 *
 * ⚑ ADJACENCY, NEVER A GAP. A currency word counts only right before or right
 * after a rate noun. A free gap ("rates … right now") flags true sentences —
 * "Pool rates can't be read right now" — and the next fix would be an exception
 * by key. The word lists and the must-not-flag controls below were measured in
 * the plan's fourth review round: 13/13 probes caught, 0 false positives.
 *
 * Every message is flattened through the runtime's own ICU parser first, so text
 * inside a plural, select or tag branch is read too; a naive `{…}` strip hides it.
 */

/** Literal text of a message, every branch included; arguments become a placeholder. */
function literalText(elements: MessageFormatElement[]): string {
  return elements
    .map((el) => {
      if (isLiteralElement(el)) return el.value;
      if (isPoundElement(el)) return '#';
      if (isTagElement(el)) return literalText(el.children);
      if (isPluralElement(el) || isSelectElement(el)) {
        return Object.values(el.options)
          .map((option) => ` ${literalText(option.value)} `)
          .join(' | ');
      }
      return ' ¤ ';
    })
    .join('');
}
const flatten = (message: string) => literalText(parse(message, { ignoreTag: false }));

const B = String.raw`(?<![\p{L}\p{N}'’-])`;
const E = String.raw`(?![\p{L}\p{N}-])`;
/** The rate nouns, with a blend/reference word allowed inside the noun phrase. */
const NOUN: Record<SandboxLocale, string> = {
  en: String.raw`(?:(?:blended|reference)\s+)?(?:pool\s+)?(?:rates?|APYs?|APRs?|yields?)`,
  'pt-BR': String.raw`(?:taxas?|APY|APR|rendimentos?)(?:\s+(?:combinadas?|de\s+refer[êe]ncia))?(?:\s+(?:do\s+pool|dos\s+pools))?`,
  es: String.raw`(?:tasas?|APY|APR|rendimientos?)(?:\s+(?:combinadas?|de\s+referencia))?(?:\s+(?:del\s+pool|de\s+los\s+pools))?`,
  de: String.raw`(?:(?:gemischte[nrs]?|Referenz)[\s-]+)?(?:Pool-)?(?:Rate|Raten|APY|APR|Rendite|Renditen|Zinssatz)`,
};
/** Currency words right BEFORE the noun. */
const BEFORE: Record<SandboxLocale, string> = {
  en: String.raw`(?:current|live|today['’]s|latest|present|prevailing|up-to-date|real-time)`,
  'pt-BR': String.raw`(?:última|últimas)`,
  es: String.raw`(?:actual|actuales|última|últimas)`,
  de: String.raw`(?:aktuell|derzeitig|gegenwärtig|heutig|neueste)\p{L}*`,
};
/** Currency words right AFTER the noun. A bare pt-BR "agora" is deliberately absent. */
const AFTER: Record<SandboxLocale, string> = {
  en: String.raw`(?:\((?:live|current)\)|today|right\s+now|now)`,
  'pt-BR': String.raw`(?:atual|atuais|vigentes?|de\s+hoje|hoje|em\s+tempo\s+real|ao\s+vivo|\(ao\s+vivo\)|mais\s+recentes?)`,
  es: String.raw`(?:actual|actuales|vigentes?|de\s+hoy|hoy|en\s+tiempo\s+real|en\s+vivo|\(en\s+vivo\)|más\s+recientes?)`,
  de: String.raw`(?:\((?:aktuell|live)\)|heute|jetzt)`,
};
const CURRENCY_ON_RATE = Object.fromEntries(
  SANDBOX_LOCALES.map((locale) => {
    const alternatives = [
      `${B}${BEFORE[locale]}\\s+${NOUN[locale]}${E}`,
      `${B}${NOUN[locale]}\\s*${AFTER[locale]}${E}`,
    ];
    if (locale === 'de') alternatives.push(`${B}(?:Echtzeit|Live)-${NOUN[locale]}${E}`);
    return [locale, new RegExp(alternatives.join('|'), 'iu')];
  })
) as Record<SandboxLocale, RegExp>;

const claimIn = (locale: SandboxLocale, message: string) =>
  flatten(message).match(CURRENCY_ON_RATE[locale])?.[0] ?? null;

/** The CURRENT-only line, allowed by key AND by the sha256 of its exact text. */
const ALLOWED_KEY = 'goalNew.apyNow';
const ALLOWED_TEXT_SHA256: Record<SandboxLocale, string> = {
  en: '2e51e77564fa528e29134aa3c939eb593c6ef2d16d91437eca4dd3d234185e8e',
  'pt-BR': '7b27ec50ee7a85e3ed81f3d5a2d2157cb1acfd4b65290174f0a595a2adfd8f39',
  es: '087e5ea2356e709cdd50cd6a14ec47c93846e182e9103a984189975b192db805',
  de: 'abba817d0e7c60328a80ae0eed4d94ebbdbbcc1695067f018d6cceb27d9fc028',
};
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/** True sentences that put a time or "live" word near a rate noun. Never flagged. */
const MUST_NOT_FLAG: readonly [SandboxLocale | 'all', string][] = [
  ['all', 'pathCard.noPromise'],
  ['all', 'goalNew.apyNowFixture'],
  ['all', 'projection.unavailable'],
  ['all', 'common.dataGasReference'],
  ['all', 'common.dataFixture'],
  ['pt-BR', 'history.feeDrag'],
];

/** Today's (pre-`5.814`) currency claims, and plants: the detector must catch each. */
const POSITIVE: readonly [SandboxLocale, string][] = [
  ['en', 'Current APY'],
  ['pt-BR', 'APY atual'],
  ['es', 'APY actual'],
  ['de', 'Aktueller APY'],
  ['en', 'Current pool rate: {apy, number}%/yr (real, variable)'],
  ['pt-BR', 'Taxa atual do pool: {apy, number}%/ano (real, variável)'],
  ['es', 'Tasa actual del pool: {apy, number}%/año (real, variable)'],
  ['de', 'Aktuelle Pool-Rate: {apy, number}%/Jahr (echt, variabel)'],
  ['en', 'No promises live here. The numbers are history and current rates, not the future.'],
  ['pt-BR', 'Aqui não mora promessa. Os números são história e taxas atuais, não o futuro.'],
  ['es', 'Aquí no viven las promesas. Los números son historial y tasas actuales, no el futuro.'],
  [
    'de',
    'Hier wohnen keine Versprechen. Die Zahlen sind Verlauf und aktuelle Raten, nicht die Zukunft.',
  ],
  ['de', 'Aktuelle Pool-Raten von {source}, abgerufen am {date}'],
  ['es', 'Tasa actual del pool'],
  ['de', 'Live-Pool-Rate'],
  ['en', 'Current blended pool rate'],
  ['pt-BR', 'Taxa combinada atual do pool'],
  ['es', 'Tasa combinada actual del pool'],
  ['de', 'Aktuelle gemischte Pool-Rate'],
  ['pt-BR', 'Última taxa do pool'],
  ['en', 'Pool rate (live): 4%'],
  ['de', 'Pool-Rate (live)'],
  ['en', 'Current APYs'],
];

describe('5.814 · RATE-AGE-1 · no message puts a currency word on a rate', () => {
  it.each(SANDBOX_LOCALES)('should find no currency claim on a rate in %s', (locale) => {
    const messages = getMessages(locale);
    const found: string[] = [];
    for (const [id, message] of Object.entries(messages)) {
      const claim = claimIn(locale, message);
      if (claim === null) continue;
      if (id === ALLOWED_KEY && sha256(message) === ALLOWED_TEXT_SHA256[locale]) continue;
      found.push(`${id}: «${claim}» in "${message}"`);
    }
    expect(
      found,
      'a DELAYED or STALE rate is never current (P-7); only goalNew.apyNow may say it'
    ).toEqual([]);
  });

  it.each(SANDBOX_LOCALES)(
    'should read the whole %s catalogue (the scan is not vacuous)',
    (locale) => {
      expect(Object.keys(getMessages(locale)).length).toBeGreaterThan(500);
    }
  );

  it.each(SANDBOX_LOCALES)(
    'should keep the allowed CURRENT line exactly as approved in %s',
    (locale) => {
      const text = getMessages(locale)[ALLOWED_KEY];
      expect(text, `${locale}:${ALLOWED_KEY} exists`).toBeDefined();
      /* The allowance is for this exact text: any edit re-opens the question. */
      expect(sha256(text!)).toBe(ALLOWED_TEXT_SHA256[locale]);
      expect(
        claimIn(locale, text!),
        'the allowed line is a real claim the allowance covers'
      ).not.toBeNull();
    }
  );

  it.each(MUST_NOT_FLAG)('should not flag the true sentence %s:%s', (scope, id) => {
    const locales = scope === 'all' ? SANDBOX_LOCALES : [scope];
    for (const locale of locales) {
      const message = getMessages(locale)[id];
      expect(message, `${locale}:${id} exists`).toBeDefined();
      expect(claimIn(locale, message!), `${locale}:${id}`).toBeNull();
    }
  });

  it.each(POSITIVE)('should catch the currency claim in %s "%s"', (locale, text) => {
    expect(claimIn(locale, text)).not.toBeNull();
  });

  it('should read text inside plural and select branches', () => {
    expect(
      claimIn('en', '{n, plural, one {Current pool rate} other {Current pool rates}}')
    ).not.toBeNull();
  });
});

/** Words that would make a source stamp claim the data is live or current. */
const STAMP_WORDS =
  /(?<![\p{L}])(?:live|ao vivo|en vivo|real-time|tempo real|tiempo real|Echtzeit|current|atual|actual|aktuell)(?![\p{L}])/iu;
const STAMP_KEYS = ['common.dataLive', 'common.dataPartlyLive', 'common.dataMixed'] as const;

describe('5.814 · the source stamps carry no live, real-time or current word', () => {
  it.each(SANDBOX_LOCALES)('should keep every %s stamp to origin and fetch date', (locale) => {
    const messages = getMessages(locale);
    for (const id of STAMP_KEYS) {
      const message = messages[id];
      expect(message, `${locale}:${id} exists`).toBeDefined();
      expect(flatten(message!).match(STAMP_WORDS)?.[0] ?? null, `${locale}:${id}`).toBeNull();
    }
  });

  it.each([
    ['en', 'Live from {source}, fetched {date}'],
    ['pt-BR', 'Ao vivo de {source}, buscado em {date}'],
    ['es', 'En vivo de {source}, obtenido {date}'],
    ['de', 'Live von {source}, abgerufen {date}'],
    ['de', 'Pool-Raten von {source}, aktuell abgerufen am {date}'],
  ])('should catch the pre-5.814 %s stamp "%s"', (_locale, text) => {
    expect(flatten(text)).toMatch(STAMP_WORDS);
  });
});
