/**
 * weekly-opener.mjs — which week-over-week lead-in the plain summary gets.
 *
 * The opener compares this run's score with the previous snapshot. On the
 * cycle where the ETF-01 suspension STARTS, that comparison would narrate a
 * data decision as a market move: dropping ETF-01's points can move the score,
 * and even the band, with nothing in the market having changed. So on that
 * cycle the opener says two separate things, in this order:
 *
 *   1. the suspension, and how many points it removed (the data effect);
 *   2. what the OTHER signals did, measured against the previous score minus
 *      those points (the observed effect);
 *   3. the band, only if it changed.
 *
 * Every later suspended cycle compares like with like (ETF-01 is 0 on both
 * sides), so the ordinary opener applies again. Nothing here assumes the size
 * of the change: 12 → 10 is only what happens when every other signal holds.
 *
 * Pure: the caller supplies the prior snapshot and both ETF-01 records.
 */
import { isSuspendedEtf } from './etf-suspension.mjs';

/**
 * @param {object} io
 * @param {{score: number, regime_code?: string}|null} io.prior — previous snapshot
 * @param {number} io.score
 * @param {string} io.regimeCode
 * @param {object|undefined} io.currentEtf — this run's ETF-01 record
 * @param {object|undefined} io.priorEtf — the previous run's ETF-01 record
 * @returns {Array<{key: string, slots: Record<string, number>}>} template parts,
 *          in order; [] when there is no comparison to make
 */
export function planWeeklyOpener({ prior, score, regimeCode, currentEtf, priorEtf }) {
  if (!prior || prior.score == null) return [];
  const bandChanged = Boolean(prior.regime_code) && prior.regime_code !== regimeCode;

  const suspensionStarts = isSuspendedEtf(currentEtf) && !isSuspendedEtf(priorEtf);
  if (suspensionStarts) {
    const removed = Number(priorEtf?.points ?? 0);
    const comparablePrior = prior.score - removed;
    const othersKey =
      score > comparablePrior ? 'othersUp' : score < comparablePrior ? 'othersDown' : 'othersHeld';
    const parts = [
      {
        key: removed > 0 ? 'suspensionStart' : 'suspensionStartNoPoints',
        slots: { points: removed },
      },
      { key: othersKey, slots: { score, prior: comparablePrior } },
    ];
    if (bandChanged) parts.push({ key: 'bandNow', slots: {} });
    return parts;
  }

  if (bandChanged)
    return [
      { key: score > prior.score ? 'bandUp' : 'bandDown', slots: { score, prior: prior.score } },
    ];
  if (score > prior.score) return [{ key: 'moveUp', slots: { score, prior: prior.score } }];
  if (score < prior.score) return [{ key: 'moveDown', slots: { score, prior: prior.score } }];
  return [{ key: 'held', slots: { score, prior: prior.score } }];
}
