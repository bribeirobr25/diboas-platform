import type { SupportedLocale } from '@diboas/i18n/server';

/**
 * The investor room is served in **English and Brazilian Portuguese only** —
 * German and Spanish visitors read the English version (founder decision,
 * 2026-07-04). This maps a UI locale to the room's *content* locale.
 *
 * Use it ONLY for room content loads (`investor` + `investor-docs`) and the
 * room's `html lang`. The URL, `LocaleProvider`, and the language switcher must
 * stay on the real locale so the switcher shows the correct language and links
 * resolve.
 */
export function roomContentLocale(locale: SupportedLocale): SupportedLocale {
  return locale === 'pt-BR' ? 'pt-BR' : 'en';
}
