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
 * part that carries the `%` is dropped.
 *
 * ⚑ The `%` is not always a `percentSign` part: with `notation: 'compact'` Intl
 * labels it `unit` ("7 %" in de-DE, "1,2 mil %" in es-ES — audit 2026-11-03).
 * So "touches the percent" is decided by the neighbouring part's VALUE, never by
 * its type.
 */
export function formatPercent(
  fraction: number,
  locale: string,
  options: PercentFormatOptions = {}
): string {
  const parts = new Intl.NumberFormat(locale, { ...options, style: 'percent' }).formatToParts(
    fraction
  );
  const carriesPercent = (index: number) => parts[index]?.value.includes('%') ?? false;
  return parts
    .filter((part, index) => {
      if (part.type !== 'literal' || !ONLY_WHITESPACE.test(part.value)) return true;
      return !(carriesPercent(index - 1) || carriesPercent(index + 1));
    })
    .map((part) => part.value)
    .join('');
}

/**
 * What may stand right before a percentage: a digit of any script (`7`, `½`), an
 * ICU placeholder's closing brace (`{rate}`), or the `#` of an ICU plural branch
 * (`{n, plural, other {# %}}`).
 */
const FIGURE_END = String.raw`[\p{N}}#]`;

/**
 * Markup that can sit between the figure and the sign without changing what is
 * read: Markdown emphasis closers (`**7** %`, used by the Learn talks), a closing
 * HTML tag (`<b>{rate}</b> %`).
 */
const CLOSING_MARKUP = String.raw`(?:\*\*|__|\*|_|</[a-zA-Z][\w-]*>)?`;

/**
 * A space of any kind, an HTML no-break space entity, or a dash of any kind
 * (hyphen, U+2010–U+2015, U+2212) between the figure and `%`. Dashes are included
 * because German "25-%-Karte" is the same defect in a compound ("25%-Karte" is
 * the ruled form, as in "Die 10%-Regel").
 */
const GAP = String.raw`(?:\s|&nbsp;|&#160;|&#x[aA]0;|[-‐-―−])+`;

const SPACE_BEFORE_PERCENT = new RegExp(`${FIGURE_END}${CLOSING_MARKUP}${GAP}%`, 'gu');

/**
 * The spelled-out word for percent after a figure, in the four locales and their
 * common variants: "7 percent" / "7 per cent" / "7 pct", "7 Prozent" / "7 v. H.",
 * "7 por ciento" / "7 porciento" / "100 por cien", "7 por cento" / "7 porcento".
 *
 * Between the figure and the word only two idioms are allowed, because they are how
 * a figure is approximated in speech and they still read as a figure: a suffix
 * joined by a hyphen ("20-something percent") and Spanish/Portuguese "y pico" /
 * "e tantos" ("20 y pico por ciento"). Any other word in between means the figure
 * and the word are not one expression ("Mit 30 sind zehn Prozent viel" is prose,
 * not a violation — audit 2026-11-03).
 *
 * Whole words only, so "percentage points", "Prozentpunkte" / "Prozent-Punkte" and
 * "pontos percentuais" (a different unit) never match. The bare word with no figure
 * before it ("Ten percent", "zwanzig Prozent") is prose and stays allowed (P8).
 */
const DIGIT_THEN_PERCENT_WORD = new RegExp(
  `${FIGURE_END}(?:-\\p{L}+)?(?:\\s+(?:y\\s+pico|e\\s+tantos))?[\\s-]*` +
    String.raw`(?:per ?cent|pct|prozent|v\.\s?h\.|por ?ciento|por ?cien|por ?cento)(?![\p{L}]|-?punkt)`,
  'giu'
);

/**
 * An ICU number format that renders a percentage through `Intl`, which puts a
 * space before `%` in de/es: `{v, number, percent}`, `{v, number, ::percent}`,
 * `{v, number, ::%}`, `{v, number, ::%x100}`. A catalogue string writes `{v}%`
 * instead, with the value formatted by `formatPercent` if it needs formatting.
 */
const ICU_PERCENT = /\{\s*[\w.]+\s*,\s*number\s*,\s*(?:percent\b|::[^}]*(?:percent|%))/gu;

export interface PercentViolation {
  /**
   * `space` = a space, no-break-space entity or dash before `%`; `word` = a figure
   * followed by the spelled-out word; `icu` = an ICU percent format.
   */
  readonly kind: 'space' | 'word' | 'icu';
  /** The matched text, for the failure message. */
  readonly match: string;
}

/**
 * Every place `text` breaks the percent ruling. Used by both apps' catalogue
 * guards and by the source scan, so the rule is written once.
 */
export function findPercentFormatViolations(text: string): PercentViolation[] {
  const found: PercentViolation[] = [];
  for (const m of text.matchAll(SPACE_BEFORE_PERCENT)) found.push({ kind: 'space', match: m[0] });
  for (const m of text.matchAll(DIGIT_THEN_PERCENT_WORD)) found.push({ kind: 'word', match: m[0] });
  for (const m of text.matchAll(ICU_PERCENT)) found.push({ kind: 'icu', match: m[0] });
  return found;
}
