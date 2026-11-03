/**
 * PERCENT FORMAT — the one way a percentage is written, on both diBoaS apps.
 *
 * **Requirement:** founder ruling 2026-10-31 (decision record
 * `DR-2026-10-31-practice-projection-live-rates-and-percent-format`, P8): the
 * `%` sign comes immediately after the number, with NO space, in every locale
 * ("7%", never "7 %"), and a digit is never followed by the spelled-out word
 * ("7 percent", "7 Prozent", "7 por ciento", "7 por cento").
 *
 * ⚑ WHY THIS EXISTS. `Intl.NumberFormat(locale, { style: 'percent' })` inserts
 * a no-break space before `%` in German and Spanish (`7 %`, U+00A0), which is
 * the CLDR convention for those locales and the opposite of the ruling. Every
 * percentage the apps format must therefore go through `formatPercent`, which
 * keeps the locale's digits, separators and sign and removes only the space
 * that touches the percent sign. A source check in the web app's tests fails on
 * any other `style: 'percent'` (register `5.729`).
 */

/** Options the caller may set; `style` is fixed to `percent` here. */
export type PercentFormatOptions = Omit<Intl.NumberFormatOptions, 'style'>;

/** Whitespace of any kind, including U+00A0 and U+202F, which `\s` already covers. */
const ONLY_WHITESPACE = /^\s+$/u;

/**
 * Format `fraction` (0.07 → "7%") for `locale`, with no space before `%`.
 *
 * The digits, grouping, decimal separator, sign and fraction digits are exactly
 * what `Intl` produces for the locale; only a whitespace literal adjacent to the
 * percent sign is dropped.
 */
export function formatPercent(
  fraction: number,
  locale: string,
  options: PercentFormatOptions = {}
): string {
  const parts = new Intl.NumberFormat(locale, { ...options, style: 'percent' }).formatToParts(
    fraction
  );
  return parts
    .filter((part, index) => {
      if (part.type !== 'literal' || !ONLY_WHITESPACE.test(part.value)) return true;
      const touchesPercent =
        parts[index - 1]?.type === 'percentSign' || parts[index + 1]?.type === 'percentSign';
      return !touchesPercent;
    })
    .map((part) => part.value)
    .join('');
}

/**
 * A number or an ICU placeholder (`7`, `0,39`, `{rate}`) followed by a space or
 * a hyphen and then `%`. Hyphen included: German "25-%-Karte" is the same
 * defect in a compound ("25%-Karte" is the ruled form, as in "Die 10%-Regel").
 */
const SPACE_BEFORE_PERCENT = /(?:\d|\})[\s-]+%/gu;

/**
 * A number or an ICU placeholder followed — directly or after at most two short
 * words ("20-something percent", "20 y pico por ciento") — by the spelled-out
 * word for percent in one of the four locales.
 *
 * Whole words only, so "percentage points", "Prozentpunkte" and "pontos percentuais"
 * (a different unit) never match. Also excluded, because it is not a figure:
 * the bare word with no digit before it ("Ten percent", "zwanzig Prozent" —
 * spelled-out prose stays prose, P8).
 */
const DIGIT_THEN_PERCENT_WORD =
  /(?:\d|\})[\s-]*(?:[\p{L}]+[\s-]+){0,2}(?:per ?cent|prozent|por ciento|por cento)(?![\p{L}])/giu;

export interface PercentViolation {
  /** `space` = a space or hyphen before `%`; `word` = a digit followed by the word. */
  readonly kind: 'space' | 'word';
  /** The matched text, for the failure message. */
  readonly match: string;
}

/**
 * Every place `text` breaks the percent ruling. Used by both apps' catalogue
 * guards, so the rule is written once.
 */
export function findPercentFormatViolations(text: string): PercentViolation[] {
  const found: PercentViolation[] = [];
  for (const m of text.matchAll(SPACE_BEFORE_PERCENT)) found.push({ kind: 'space', match: m[0] });
  for (const m of text.matchAll(DIGIT_THEN_PERCENT_WORD)) found.push({ kind: 'word', match: m[0] });
  return found;
}
