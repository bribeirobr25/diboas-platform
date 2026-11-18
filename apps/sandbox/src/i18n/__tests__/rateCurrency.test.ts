import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES, type SandboxLocale } from '../config';
import { getMessages } from '../loadMessages';
import {
  currencyClaimIn,
  currencyClaimInMessage,
  flattenMessage as flatten,
  STAMP_CURRENCY_WORDS as STAMP_WORDS,
} from '@/test/rateCurrency';

/**
 * `5.814` · RATE-AGE-1 · NO MESSAGE CALLS A RATE CURRENT (plan P10, guards 4 and 5).
 *
 * DATA_VINTAGE_POLICY P-7: "a DELAYED or STALE rate must be shown as such, never
 * as current"; Brand §15: "stale ≠ current". No Practice policy allows CURRENT,
 * so no message may put a currency word on a rate — except `goalNew.apyNow`, the
 * line reserved for a CURRENT rate, pinned here by its key AND its exact text.
 *
 * ⚑ NEAR, NEVER FAR (`src/test/rateCurrency.ts`). A currency word counts next to
 * a rate noun or with one word or placeholder between; a free gap flags true
 * sentences ("Pool rates can't be read right now") and the next fix would be an
 * exception by key. Measured on the four catalogues: only the allowed line hits.
 * The same detector reads the rendered pages in `rateLineRender.test.tsx`.
 *
 * Every message is flattened through the runtime's own ICU parser first, so text
 * inside a plural, select or tag branch is read too; a naive `{…}` strip hides it.
 */

const claimIn = (locale: SandboxLocale, message: string) => currencyClaimInMessage(locale, message);

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
  /* Review round two: one word between, and the words the first list lacked. */
  ['en', 'Current {source} pool rate'],
  ['en', 'Current variable pool rate'],
  ['en', 'Pool rate currently: {apy, number}%'],
  ['en', 'Live-rate'],
  ['pt-BR', 'Taxa variável atual'],
  ['pt-BR', 'Taxa corrente do pool'],
  ['es', 'Tasa corriente del pool'],
  ['es', 'Tasa del pool ahora'],
  ['de', 'Pool-Rate aktuell: {apy, number}%'],
  ['de', 'Tagesaktuelle Pool-Rate'],
  ['de', 'Live Pool-Rate'],
  ['de', 'Gemischte Pool-Rate aktuell, ein Teil abgerufen am {date}'],
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

  it('should not reach across more than one word (the scope is stated, not hidden)', () => {
    /* Two words between are outside the detector by design (GATE_SCOPE_LIMITS). */
    expect(currencyClaimIn('en', 'Current blended variable rate')).toBeNull();
  });

  it('should read text inside plural and select branches', () => {
    expect(
      claimIn('en', '{n, plural, one {Current pool rate} other {Current pool rates}}')
    ).not.toBeNull();
  });
});

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
    ['de', 'Aktuelle Daten von {source}, abgerufen am {date}'],
    ['pt-BR', 'Dados atuais dos pools via {source}, buscados em {date}'],
    ['es', 'Datos actuales vía {source}, obtenidos hoy'],
    ['en', 'Pool rates from {source}, fetched today'],
    ['de', 'Tagesaktuelle Pool-Raten von {source}'],
    ['en', 'Live from {source}, fetched {date}'],
    ['pt-BR', 'Ao vivo de {source}, buscado em {date}'],
    ['es', 'En vivo de {source}, obtenido {date}'],
    ['de', 'Live von {source}, abgerufen {date}'],
    ['de', 'Pool-Raten von {source}, aktuell abgerufen am {date}'],
  ])('should catch the pre-5.814 %s stamp "%s"', (_locale, text) => {
    expect(flatten(text)).toMatch(STAMP_WORDS);
  });
});
