/**
 * A page's <title> names the brand once (register 5.787).
 *
 * The root layout's title template appends " | diBoaS" to every page title. A title that
 * already names the brand ("diBoaS for Business | …", "About diBoaS | …", "I'm #5 on the
 * diBoaS waitlist!") is therefore passed as ABSOLUTE, so the template does not add it again;
 * any other title stays a plain string and gets the suffix. Guard: tests/e2e/pageTitles.spec.ts
 * (the served <title> names "diBoaS" exactly once on every listed route × locale).
 */
import { BRAND_CONFIG } from '@/config/brand';

export function pageTitle(title: string): string | { absolute: string } {
  return title.includes(BRAND_CONFIG.NAME) ? { absolute: title } : title;
}
