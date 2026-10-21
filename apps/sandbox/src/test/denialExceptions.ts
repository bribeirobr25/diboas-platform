import { createHash } from 'node:crypto';

/**
 * ⚙ PB-3 EXACT-TEXT DENIAL EXCEPTIONS (founder decision, 2026-10-16) — shared by
 * the copy guards `CI-N2` and `CI-N4`.
 *
 * ## Why this replaced the negation rule
 *
 * The guards used to EXCUSE a matched term when a negation looked attached to it.
 * Five independent review rounds each found new natural claims that inference
 * excused — "No deposit without a bonus.", "Leave no bonus unclaimed.", "No fees
 * (bonus every week)." — in every locale. A word list cannot tell which noun a
 * negation denies. So inference no longer decides anything: a matched term in
 * the Practice catalogue FAILS unless one of the entries below covers it.
 *
 * ## What an entry is, and is not
 *
 * An entry covers exactly ONE reviewed sentence: one guard and rule, one
 * locale, one translation key, and the sha256 of the complete text. A changed
 * word, a different key or another locale's text does not inherit it. It
 * records an ENGINEERING classification ("this sentence denies X") and where
 * that review is recorded. **It is not a Legal clearance** and carries no Legal
 * wording.
 *
 * ## Adding an entry
 *
 * Only after a reviewer has read the sentence and classified it. The guard's
 * failure message says when a finding reads like a denial; that hint never
 * passes anything by itself. A stale entry (its key gone, its text changed, or
 * no longer triggering its rule) FAILS, so this list cannot quietly grow dead.
 *
 * Inventory, measured 2026-10-16 with every inferred excuse disabled: 4 of 2,412
 * Practice strings — `common.playDisclaimer` in each locale, CI-N2 only.
 */

export type Guard = 'CI-N2' | 'CI-N4';

export interface DenialException {
  guard: Guard;
  /** The guard's rule name, exactly as the guard names it. */
  rule: string;
  locale: string;
  /** Dotted translation key. */
  key: string;
  /** sha256 (hex) of the complete text. */
  sha256: string;
  /** Engineering classification of the sentence — never a Legal position. */
  justification: string;
  /** Where the review is recorded. */
  review: string;
  date: string;
}

/* The review is recorded in the register (local-only); the id is what this public file names. */
const PLAY_DISCLAIMER_REVIEW =
  'register 5.510 — reviewed: states that Practice credits are not Rewards';

export const DENIAL_EXCEPTIONS: readonly DenialException[] = [
  {
    guard: 'CI-N2',
    rule: 'reward / bonus / prize framing',
    locale: 'en',
    key: 'common.playDisclaimer',
    sha256: 'dbf6afd35ed44d85bfdb8441a0f0fb68c1c6a34b6602ab78e708cf90fd690b4b',
    justification: 'Denies that Practice credits are Rewards.',
    review: PLAY_DISCLAIMER_REVIEW,
    date: '2026-10-16',
  },
  {
    guard: 'CI-N2',
    rule: 'reward / bonus / prize framing',
    locale: 'pt-BR',
    key: 'common.playDisclaimer',
    sha256: '4b087a5a5d96c5377a8b8651d0464e7f6a8f9d12a15e6f53b4d03af1d5e3fdb7',
    justification: 'Denies that Practice credits are Rewards (recompensas).',
    review: PLAY_DISCLAIMER_REVIEW,
    date: '2026-10-16',
  },
  {
    guard: 'CI-N2',
    rule: 'reward / bonus / prize framing',
    locale: 'es',
    key: 'common.playDisclaimer',
    sha256: '2f569738d6a34c41a605605f9467068095aa1fcd0487c37edfde60c83d844253',
    justification: 'Denies that Practice credits are Rewards (recompensas).',
    review: PLAY_DISCLAIMER_REVIEW,
    date: '2026-10-16',
  },
  {
    guard: 'CI-N2',
    rule: 'reward / bonus / prize framing',
    locale: 'de',
    key: 'common.playDisclaimer',
    sha256: '2f1a7cbbb5af7a16afc290f5d5b500882d69b73fb517fe1b5080b6d6d34227b1',
    justification: 'Denies that Practice credits are Rewards (Belohnungen).',
    review: PLAY_DISCLAIMER_REVIEW,
    date: '2026-10-16',
  },
];

export function textDigest(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Is this exact sentence, under this key and locale, a reviewed denial for this guard's rule? */
export function excepted(
  guard: Guard,
  rule: string,
  locale: string,
  key: string,
  text: string
): boolean {
  const digest = textDigest(text);
  return DENIAL_EXCEPTIONS.some(
    (e) =>
      e.guard === guard &&
      e.rule === rule &&
      e.locale === locale &&
      e.key === key &&
      e.sha256 === digest
  );
}

/**
 * Entries that no longer cover a live finding: the key is gone, its text
 * changed, or the text no longer triggers the rule. Each is a FAILURE.
 */
export function staleExceptions(
  guard: Guard,
  lookup: (locale: string, key: string) => string | undefined,
  triggers: (rule: string, text: string, locale: string) => boolean,
  list: readonly DenialException[] = DENIAL_EXCEPTIONS
): string[] {
  const stale: string[] = [];
  for (const e of list.filter((x) => x.guard === guard)) {
    const text = lookup(e.locale, e.key);
    if (text === undefined) stale.push(`${e.locale}::${e.key} — key no longer exists`);
    else if (textDigest(text) !== e.sha256)
      stale.push(`${e.locale}::${e.key} — text changed since review`);
    else if (!triggers(e.rule, text, e.locale))
      stale.push(`${e.locale}::${e.key} — no longer triggers "${e.rule}"`);
  }
  return stale;
}
