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
