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
  return (
    futureAmount > 0 &&
    Number.isFinite(futureAmount) &&
    years > 0 &&
    years <= 100
  );
}

/**
 * Parse integer with fallback
 */
export function parseIntSafe(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
