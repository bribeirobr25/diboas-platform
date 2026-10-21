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
 *      those points (the observed effect).
 *
 * The band is NOT restated here: the monthly read that follows the opener
 * already names it, so a band sentence would say it twice in a row.
 *
 * Every later suspended cycle compares like with like (ETF-01 is 0 on both
 * sides), so the ordinary opener applies again. Nothing here assumes the size
 * of the change: 12 → 10 is only what happens when every other signal holds.
 *
 * Pure: the caller supplies the prior snapshot and both ETF-01 records.
 */
import { isSuspendedEtf } from './etf-suspension.mjs';

/**
 * A comparison may be called "this week" only when the previous run is 7±1
 * days before this one (2026-10-21, founder decision on the review-gate
 * findings). After a missed or re-run Monday the previous run can be two weeks
 * old, or two days, and a change over that span is not "this week".
 */
export const WEEKLY_GAP_DAYS = { min: 6, max: 8 };

/**
 * Whether two run days (`YYYY-MM-DD`, UTC) are a week apart, 7±1 days.
 * False for anything unparseable: no weekly wording without evidence.
 * @param {string | null | undefined} priorDay
 * @param {string} currentDay
 */
export function isWeekApart(priorDay, currentDay) {
  const a = Date.parse(`${String(priorDay ?? '').slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${String(currentDay).slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const days = (b - a) / 86_400_000;
  return days >= WEEKLY_GAP_DAYS.min && days <= WEEKLY_GAP_DAYS.max;
}

/**
 * @param {object} io
 * @param {{score: number, regime_code?: string}|null} io.prior — previous snapshot
 * @param {number} io.score
 * @param {string} io.regimeCode
 * @param {object|undefined} io.currentEtf — this run's ETF-01 record
 * @param {object|undefined} io.priorEtf — the previous run's ETF-01 record
 * @param {boolean} [io.weekly] — the previous snapshot is 7±1 days back. The
 *   ordinary openers say "this week" / "a steady week", so without it they are
 *   omitted; the suspension disclosure ("from this update") always applies.
 * @returns {Array<{key: string, slots: Record<string, number>}>} template parts,
 *          in order; [] when there is no comparison to make
 */
export function planWeeklyOpener({
  prior,
  score,
  regimeCode,
  currentEtf,
  priorEtf,
  weekly = true,
}) {
  if (!prior || prior.score == null) return [];
  const bandChanged = Boolean(prior.regime_code) && prior.regime_code !== regimeCode;

  const suspensionStarts = isSuspendedEtf(currentEtf) && !isSuspendedEtf(priorEtf);
  if (suspensionStarts) {
    const removed = Number(priorEtf?.points ?? 0);
    const comparablePrior = prior.score - removed;
    const othersKey =
      score > comparablePrior ? 'othersUp' : score < comparablePrior ? 'othersDown' : 'othersHeld';
    return [
      {
        key: removed > 0 ? 'suspensionStart' : 'suspensionStartNoPoints',
        slots: { points: removed },
      },
      { key: othersKey, slots: { score, prior: comparablePrior } },
    ];
  }
  if (!weekly) return [];

  if (bandChanged)
    return [
      { key: score > prior.score ? 'bandUp' : 'bandDown', slots: { score, prior: prior.score } },
    ];
  if (score > prior.score) return [{ key: 'moveUp', slots: { score, prior: prior.score } }];
  if (score < prior.score) return [{ key: 'moveDown', slots: { score, prior: prior.score } }];
  return [{ key: 'held', slots: { score, prior: prior.score } }];
}
