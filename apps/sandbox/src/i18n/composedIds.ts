/**
 * CID-1 — composed message ids (PENDING_ALL 5.156; engineering-gates § Canon intake).
 *
 * WHY: a message id built from a template (`move.${a.id}`) is invisible to every
 * literal-grep guard. On 2026-08-25 the `move.earn*` keys were deleted as
 * "orphans" — no literal referenced them — and `/move` rendered raw ids in four
 * locales for two weeks. This module finds every template-composed id in a
 * source file so the gate can resolve it against the catalogs.
 *
 * Pure: no fs, no React. The test (`__tests__/composedIds.test.ts`) walks the
 * source tree, pairs each pattern with its runtime value source, and fails on
 * (a) an unregistered pattern, (b) a composed id missing from any locale, or
 * (c) a registry entry no source uses any more.
 */

export interface ComposedId {
  /** The template with every `${…}` replaced by `*`, e.g. `move.*Body`. */
  pattern: string;
  /** 1-based line of the match, for the failure message. */
  line: number;
}

/**
 * Message-id contexts only — DOM `id={…}` attributes are deliberately NOT
 * matched (they are element ids, not catalog keys):
 *   <FormattedMessage … id={`…${x}…`} />
 *   titleId={`…${x}…`}              (BottomSheet and friends)
 *   { id: `…${x}…` }                (formatMessage / descriptor objects)
 */
const CONTEXTS: RegExp[] = [
  /<FormattedMessage\b[^>]*?\bid=\{`([^`]*\$\{[^`]*)`\}/gs,
  /\btitleId=\{`([^`]*\$\{[^`]*)`\}/g,
  /\bid:\s*`([^`]*\$\{[^`]*)`/g,
];

export function toPattern(template: string): string {
  return template.replace(/\$\{[^}]*\}/g, '*');
}

export function findComposedMessageIds(source: string): ComposedId[] {
  const found: ComposedId[] = [];
  for (const re of CONTEXTS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const line = source.slice(0, m.index).split('\n').length;
      found.push({ pattern: toPattern(m[1]), line });
    }
  }
  return found.sort((a, b) => a.line - b.line);
}

/** Expand a pattern with one `*` against its value set. */
export function composeIds(pattern: string, values: readonly (string | number)[]): string[] {
  if ((pattern.match(/\*/g) ?? []).length !== 1) {
    throw new Error(`CID-1: pattern "${pattern}" must contain exactly one "*"`);
  }
  return values.map((v) => pattern.replace('*', String(v)));
}
