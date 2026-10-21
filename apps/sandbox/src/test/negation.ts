/**
 * Negation words for the copy guards `CI-N2` and `CI-N4` — an EXPLANATION, never
 * a pass condition.
 *
 * ⛑ INFERENCE NO LONGER DECIDES ANYTHING (PB-3 exact-text denial exceptions,
 * founder decision 2026-10-16). This file used to hold an attachment rule —
 * bridge words, coordinator lists, parenthesised glosses — that EXCUSED a term
 * when a negation looked attached to it. Five independent review rounds each
 * found natural claims it excused ("No deposit without a bonus.", "Leave no bonus
 * unclaimed.", "No fees (bonus every week)."). A matched term now FAILS unless an
 * exact, reviewed exception covers it (`@/test/denialExceptions`).
 *
 * What remains is the hint a failure message shows: "this reads like a denial —
 * if a reviewer agrees, add an exact-text exception". It never passes a finding.
 */

const NEGATION_WORDS = [
  'no',
  'not',
  'never',
  'neither',
  'without',
  'não',
  'nem',
  'nunca',
  'sem',
  'sin',
  'ni',
  'nicht',
  'kein\\w*',
  'nie',
  'ohne',
  'nein',
  'weder',
];
const build = (words: readonly string[]): RegExp =>
  new RegExp(`(?:n't|n’t)$|^(?:${words.join('|')})$`, 'i');

const NEGATION = build(NEGATION_WORDS);
/** Portuguese denies with "não" / "nem" / "nunca" / "sem" — "no" means "in the". */
const NEGATION_PT = build(NEGATION_WORDS.filter((w) => w !== 'no'));

function negationFor(locale?: string): RegExp {
  return locale?.startsWith('pt') ? NEGATION_PT : NEGATION;
}

/** Does a negation word appear in `text` before offset `at`? A hint for the failure message only. */
export function readsAsDenial(text: string, at: number, locale?: string): boolean {
  const negation = negationFor(locale);
  return text
    .slice(0, at)
    .split(/\s+/)
    .some((w) => negation.test(w.replace(/^[^\p{L}']+|[^\p{L}'’]+$/gu, '')));
}

export const DENIAL_HINT =
  'reads like a denial — if a reviewer confirms it, add an exact-text exception (@/test/denialExceptions)';
