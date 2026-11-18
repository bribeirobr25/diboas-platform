import {
  isLiteralElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';
import type { SandboxLocale } from '@/i18n/config';

/**
 * TEST SUPPORT · the RATE-AGE-1 detector (`5.814`): does a text put a currency
 * word on a rate?
 *
 * DATA_VINTAGE_POLICY P-7: "a DELAYED or STALE rate must be shown as such, never
 * as current". One detector for two uses — the catalogue scan
 * (`i18n/__tests__/rateCurrency.test.ts`) and the rendered pages
 * (`components/__tests__/rateLineRender.test.tsx`) — so the two cannot drift.
 *
 * ⚑ NEAR, NEVER FAR. A currency word counts when it stands next to a rate noun or
 * with ONE word or placeholder between ("Current variable pool rate", "Pool-Rate
 * aktuell"). A free gap flags true sentences ("Pool rates can't be read right
 * now"), and the next fix would be an exception by key. Measured on the four
 * catalogues before adoption (plan P10, review round two).
 */

/** Literal text of an ICU message, every plural/select/tag branch included. */
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
export const flattenMessage = (message: string) =>
  literalText(parse(message, { ignoreTag: false }));

const B = String.raw`(?<![\p{L}\p{N}'’-])`;
const E = String.raw`(?![\p{L}\p{N}-])`;
/** At most one word or placeholder between the currency word and the noun. */
const GAP = String.raw`(?:\s+(?:[\p{L}'’-]+|¤))?\s+`;

const NOUN: Record<SandboxLocale, string> = {
  en: String.raw`(?:(?:blended|reference)\s+)?(?:pool\s+)?(?:rates?|APYs?|APRs?|yields?)`,
  'pt-BR': String.raw`(?:taxas?|APY|APR|rendimentos?)(?:\s+(?:combinadas?|de\s+refer[êe]ncia))?(?:\s+(?:do\s+pool|dos\s+pools))?`,
  es: String.raw`(?:tasas?|APY|APR|rendimientos?)(?:\s+(?:combinadas?|de\s+referencia))?(?:\s+(?:del\s+pool|de\s+los\s+pools))?`,
  de: String.raw`(?:(?:gemischte[nrs]?|Referenz)[\s-]+)?(?:Pool-)?(?:Rate|Raten|APY|APR|Rendite|Renditen|Zinssatz)`,
};
/** Currency words before the noun. */
const BEFORE: Record<SandboxLocale, string> = {
  en: String.raw`(?:current|currently|live|today['’]s|latest|present|prevailing|up-to-date|up\s+to\s+date|real-time)`,
  'pt-BR': String.raw`(?:última|últimas|atual|atuais|corrente|correntes)`,
  es: String.raw`(?:actual|actuales|última|últimas|corriente|corrientes)`,
  de: String.raw`(?:\p{L}*aktuell|derzeitig|gegenwärtig|heutig|neueste|jetzig|momentan|live)\p{L}*`,
};
/** Currency words after the noun. A bare pt-BR "agora" is deliberately absent. */
const AFTER: Record<SandboxLocale, string> = {
  en: String.raw`(?:\((?:live|current|now|today)\)|today|right\s+now|now|currently|up\s+to\s+date)`,
  'pt-BR': String.raw`(?:atual|atuais|vigentes?|correntes?|de\s+hoje|hoje|no\s+momento|em\s+tempo\s+real|ao\s+vivo|\(ao\s+vivo\)|mais\s+recentes?)`,
  es: String.raw`(?:actual|actuales|vigentes?|corrientes?|de\s+hoy|hoy|ahora|en\s+este\s+momento|en\s+tiempo\s+real|en\s+vivo|\(en\s+vivo\)|más\s+recientes?)`,
  de: String.raw`(?:\((?:aktuell|live)\)|aktuell|heute|jetzt|momentan)`,
};

const CURRENCY_ON_RATE = Object.fromEntries(
  (Object.keys(NOUN) as SandboxLocale[]).map((locale) => {
    const alternatives = [
      `${B}${BEFORE[locale]}${GAP}${NOUN[locale]}${E}`,
      `${B}${NOUN[locale]}(?:${GAP}|\\s*)${AFTER[locale]}${E}`,
    ];
    if (locale === 'de') alternatives.push(`${B}(?:Echtzeit|Live)-${NOUN[locale]}${E}`);
    if (locale === 'en') alternatives.push(`${B}(?:live|real-time)-${NOUN[locale]}${E}`);
    return [locale, new RegExp(alternatives.join('|'), 'iu')];
  })
) as Record<SandboxLocale, RegExp>;

/** The currency claim on a rate in `text` (already plain), or null. */
export const currencyClaimIn = (locale: SandboxLocale, text: string) =>
  text.match(CURRENCY_ON_RATE[locale])?.[0] ?? null;

/** The same, for an ICU message (flattened first). */
export const currencyClaimInMessage = (locale: SandboxLocale, message: string) =>
  currencyClaimIn(locale, flattenMessage(message));

/** Words that would make a source stamp claim the data is live or current. */
export const STAMP_CURRENCY_WORDS =
  /(?<![\p{L}])(?:live|ao\s+vivo|en\s+vivo|real-time|tempo\s+real|tiempo\s+real|echtzeit\p{L}*|current(?:ly)?|latest|today|atua(?:l|is)|hoje|agora|actual(?:es)?|hoy|ahora|\p{L}*aktuell\p{L}*|heute|jetzt)(?![\p{L}])/iu;
