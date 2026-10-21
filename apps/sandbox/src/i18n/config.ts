/**
 * Sandbox i18n config — app-local (decision G-1), same standard as the
 * platform: 4 locales wired from the first commit; the D-10 sub-clause defers
 * es/de CONTENT only (their files mirror EN until the promotion-gate
 * transcreation — the investor-room roomContentLocale precedent).
 */

export const SANDBOX_LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
export type SandboxLocale = (typeof SANDBOX_LOCALES)[number];

export const DEFAULT_LOCALE: SandboxLocale = 'en';

export function isSandboxLocale(value: string): value is SandboxLocale {
  return (SANDBOX_LOCALES as readonly string[]).includes(value);
}

/** Persisted language choice — same cookie name as the marketing site so the
 *  preference is shared across diBoaS surfaces. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Endonyms (a language's name in itself) — never country flags: English is not
 *  the USA, and flags carry nationality baggage a trust-first product avoids
 *  (the marketing-site C-5/B-3 ruling, mirrored here). Locale-invariant, so a
 *  constant, not a translated string. */
export const LOCALE_ENDONYM: Record<SandboxLocale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
  de: 'Deutsch',
};

/** Best SANDBOX_LOCALE for an Accept-Language header (q-weighted; exact tag
 *  first, then primary subtag, e.g. `pt` or `de-AT` -> `de`). Pure + edge-safe. */
function matchAcceptLanguage(header: string | null): SandboxLocale | null {
  if (!header) return null;
  /* RFC 9110 §12.4.2 (lane audit 2026-10-21, R6): parameters may carry whitespace
     (`de; q=0.9`), `q=0` means "not acceptable", and a malformed weight is dropped
     rather than sorted as NaN (an inconsistent comparator). */
  const ranked = header
    .split(',')
    .map((part) => {
      const [tagPart, ...params] = part.split(';').map((s) => s.trim());
      const qParam = params.find((p) => /^q\s*=/i.test(p));
      const q = qParam === undefined ? 1 : Number(qParam.replace(/^q\s*=\s*/i, ''));
      return { tag: tagPart.toLowerCase(), q };
    })
    .filter((x) => x.tag && x.tag !== '*' && Number.isFinite(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const exact = SANDBOX_LOCALES.find((l) => l.toLowerCase() === tag);
    if (exact) return exact;
    const primary = tag.split('-')[0];
    const byPrimary = SANDBOX_LOCALES.find((l) => l.toLowerCase().split('-')[0] === primary);
    if (byPrimary) return byPrimary;
  }
  return null;
}

/** Preferred locale: the saved choice (cookie) wins, else the browser's
 *  Accept-Language, else the default. Mirrors the marketing site's chain. */
export function detectSandboxLocale(
  cookieLocale: string | null | undefined,
  acceptLanguage: string | null | undefined
): SandboxLocale {
  if (cookieLocale && isSandboxLocale(cookieLocale)) return cookieLocale;
  return matchAcceptLanguage(acceptLanguage ?? null) ?? DEFAULT_LOCALE;
}

/** Per-market display currency (the platform's locale→currency canon). */
export const LOCALE_CURRENCY: Record<SandboxLocale, 'USD' | 'BRL' | 'EUR'> = {
  en: 'USD',
  'pt-BR': 'BRL',
  es: 'EUR',
  de: 'EUR',
};

/** Currency symbol for input prefixes (the money formatter handles full display). */
export const CURRENCY_SYMBOL: Record<'USD' | 'BRL' | 'EUR', string> = {
  USD: '$',
  BRL: 'R$',
  EUR: '€',
};

/** Play-money grants per mode, in LOCAL currency units (decision D-4). */
export const PLAY_MONEY_GRANT = {
  b2c: 10_000,
  b2b: 250_000,
} as const;

/**
 * EN-02 wallet-authentication disclosure — locales in which the line may be
 * publicly rendered. Strategy Canon correction 2 (2026-09-07): the disclosure is
 * exposed in a locale ONLY when a materially equivalent localized wording has
 * been supplied or approved under Product / Brand / Legal copy authority; the
 * lane never invents de / es / pt-BR wording to complete the increment. The
 * catalogs carry the English line for key parity, and `untranslated.test.ts`
 * asserts the gate matches (a locale added here must have approved wording).
 */
export const WALLET_NOTE_LOCALES: readonly SandboxLocale[] = ['en'];

/**
 * Legal readiness screen (I-0b) — locales whose CHROME wording (step label,
 * subtitle, badges, headings) is authority-approved. The four Legal control
 * strings are approved in all four locales (LC-TD-02 §4.2); the Product chrome
 * exists in English only, so the route serves only these locales until the
 * localized chrome arrives (F-6 locale completeness). Internal build only.
 */
export const LEGAL_READINESS_LOCALES: readonly SandboxLocale[] = ['en'];

/**
 * The marketing site (apps/web, a separate app) hosts the canonical legal pages.
 * Sandbox legal links point here and open in a new tab. Locale-prefixed to match
 * the marketing site's [locale] routing.
 */
export const MARKETING_ORIGIN = 'https://diboas.com';
export const legalUrl = (locale: string, page: 'terms' | 'privacy') =>
  `${MARKETING_ORIGIN}/${locale}/legal/${page}`;
