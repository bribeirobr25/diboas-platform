/**
 * Sandbox i18n config — app-local (decision G-1), same standard as the
 * platform: 4 locales wired from the first commit; the D-10 sub-clause defers
 * es/de CONTENT only (their files mirror EN until the promotion-gate
 * transcreation — the investor-room roomContentLocale precedent).
 */

import type { GoalMarket } from '@diboas/investing';

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
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.trim().toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .filter((x) => x.tag && x.tag !== '*')
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

/**
 * Locale → market, for the domain package's market-keyed constants (SWR,
 * essentials share). The package owns the market type; the app maps here.
 * Note `en = US` at MVP-0 (multi-market English is a promotion-gate item).
 */
export const LOCALE_MARKET: Record<SandboxLocale, GoalMarket> = {
  en: 'US',
  'pt-BR': 'BR',
  es: 'ES',
  de: 'DE',
};

/** Play-money grants per mode, in LOCAL currency units (decision D-4). */
export const PLAY_MONEY_GRANT = {
  b2c: 10_000,
  b2b: 250_000,
} as const;

/**
 * The marketing site (apps/web, a separate app) hosts the canonical legal pages.
 * Sandbox legal links point here and open in a new tab. Locale-prefixed to match
 * the marketing site's [locale] routing.
 */
export const MARKETING_ORIGIN = 'https://diboas.com';
export const legalUrl = (locale: string, page: 'terms' | 'privacy') =>
  `${MARKETING_ORIGIN}/${locale}/legal/${page}`;
