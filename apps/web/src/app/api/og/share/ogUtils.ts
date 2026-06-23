/**
 * OG Image Utility Functions
 *
 * Helper functions for OG image generation
 * Following security requirements from security.md
 */

/**
 * Sanitize user input for XSS prevention
 * Following security requirements from security.md
 */
export function sanitizeInput(input: string | null): string | undefined {
  if (!input) return undefined;
  // Remove HTML tags, script content, and limit length
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, '')
    .slice(0, 50);
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format currency with K/M abbreviations
 */
export function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${formatNumber(num)}`;
}

/**
 * Validate waitlist position
 */
export function isValidPosition(position: number): boolean {
  return position > 0 && position <= 1000000 && Number.isFinite(position);
}

/**
 * Validate calculator inputs
 */
export function isValidCalculatorInput(futureAmount: number, years: number): boolean {
  return futureAmount > 0 && Number.isFinite(futureAmount) && years > 0 && years <= 100;
}

/**
 * Validate a tool-result hero value (Phase 3 Money Tools share card).
 * Guards the same range as the calculator (positive, finite, ≤ $1B) so a
 * fat-fingered or hostile `value` param can't blow up the renderer.
 */
export function isValidToolResultValue(value: number): boolean {
  return value > 0 && Number.isFinite(value) && value <= 1_000_000_000;
}

/**
 * Format a currency amount for the share card in the holder's locale currency.
 * Uses compact notation ($12K / R$1,2 mi) so big figures stay readable at OG
 * scale. `currency` must be a 3-letter ISO 4217 code; anything else (or an
 * `Intl` rejection) falls back to the plain `$`-prefixed K/M formatter so the
 * card never crashes on an unexpected param.
 */
export function formatResultCurrency(value: number, currency: string, locale = 'en'): string {
  if (!/^[A-Z]{3}$/.test(currency)) return formatCurrency(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  } catch {
    return formatCurrency(value);
  }
}

/**
 * Parse integer with fallback
 */
export function parseIntSafe(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
