/** How many identity hues the palette carries (see `--goal-accent-N`). */
const GOAL_ACCENTS = 4;

/**
 * A goal's identity colour, as a stable index into the `--goal-accent-N`
 * palette (founder 2026-08-21; mockup 02 colour-codes its goals).
 *
 * Derived from the goalId rather than stored, deliberately: the colour is
 * presentation, so putting it in the ledger would make a display choice part
 * of the money record — and a stored value would then need a migration and a
 * default for every goal created before it. A hash gives the same goal the
 * same colour on every surface, forever, with no event change at all.
 *
 * Creation ORDER was the other candidate and is worse: dropping a goal would
 * silently recolour the ones after it.
 */
export function goalAccentIndex(goalId: string): number {
  let hash = 0;
  for (let i = 0; i < goalId.length; i += 1) {
    hash = (hash * 31 + goalId.charCodeAt(i)) % 100_000;
  }
  return hash % GOAL_ACCENTS;
}
