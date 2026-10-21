/**
 * state-lead.mjs — the /market/backdrop lead + depth composer (founder-designed
 * 2026-08-24; PENDING_ALL 5.140 + 5.141).
 *
 * Produces two strings per locale for the STATE-grammar view:
 *
 *   lead  = [points-free opening] + one BEAT per macro condition, fixed order
 *   depth = one numeric sentence per macro condition, same order
 *
 * WHY THE BEATS READ CHANGE, NOT LEVEL — a lead built from levels says "the
 * dollar has slipped below its trend" every week it happens to be below, which
 * implies a recency the data does not have. The 2026-08-24 review caught
 * exactly that in a draft: MAC-01 crossed on 2026-08-04 and had been below for
 * four runs, so "has slipped" would have been three weeks stale. A beat
 * therefore selects on whether the signal's state DIFFERS FROM THE PREVIOUS RUN
 * DAY, which `run-archive.jsonl` records for every signal on every run.
 *
 * FAIL-SAFE DIRECTION — with no prior run (fresh clone, rebuilt archive) a beat
 * resolves to HOLD, never to MOVED. Claiming a move we cannot evidence is the
 * failure that matters; describing a state we can see is always true.
 *
 * NOT A WEEK APART (2026-10-21) — the moved beats and the fresh depth sentences
 * say "this week" / "a week earlier". When the previous run day is not 7±1
 * days back (a missed or extra run), a changed condition gets the NOW beat
 * ("is now below") and the plain depth sentence; an unchanged one keeps HOLD,
 * which stays true over any gap.
 *
 * PURE: no network, no filesystem. The caller injects the archive text and the
 * template library, matching `regime-engine.mjs`'s convention.
 */

import { readArchiveRows, runDayIndex } from './archive.mjs';
import { fill, groupLevel, MAX_BY_GROUP, composeMixed } from './group-summaries.mjs';

/** The three macro conditions, in the order the page always reads them. */
export const STATE_BEAT_ORDER = ['MAC-01', 'MAC-02', 'MAC-03'];

/** The state view is the macro group's presentation. */
const STATE_GROUP_ID = 'macro_environment';

/**
 * Signals from the most recent run day STRICTLY BEFORE `currentRunAt`.
 *
 * Distinct DAY, not archive line: a same-day re-run (a correction, or a manual
 * verification) must not become "last week" — that would make every re-run
 * report a move of zero and silently flip beats to HOLD on a week something
 * genuinely changed. Same reasoning as the provenance counter in 5.127.
 *
 * @param {string} archiveText — raw run-archive.jsonl contents ('' if absent)
 * @param {string} currentRunAt — this run's ISO timestamp
 * @returns {Record<string, {state: string, values: object}>|null}
 */
export function priorRunSignals(archiveText, currentRunAt) {
  return priorRun(archiveText, currentRunAt)?.signals ?? null;
}

/**
 * The previous run day and its signals (same rule as `priorRunSignals`), so a
 * caller can tell how far back "the previous run" is.
 * @param {string} archiveText
 * @param {string} currentRunAt
 * @returns {{day: string, signals: Record<string, {state: string, values: object}>}|null}
 */
export function priorRun(archiveText, currentRunAt) {
  const today = String(currentRunAt).slice(0, 10);
  // 5.302: parsing and the later-line-wins rule live in archive.mjs now — this
  // loop used to be written out here, again in realSnapshotCount, and a third
  // time for the historical append.
  const byDay = runDayIndex(readArchiveRows(archiveText));
  const priorDays = [...byDay.keys()].filter((d) => d < today).sort();
  if (!priorDays.length) return null;
  const day = priorDays[priorDays.length - 1];
  const signals = byDay.get(day)?.signals;
  if (!Array.isArray(signals)) return null;
  return { day, signals: Object.fromEntries(signals.map((s) => [s.id, s])) };
}

/**
 * Which beat variant a condition gets: moved|hold x Supportive|Restrictive.
 * ACTIVE means supportive for all three macro signals (softer dollar, easing
 * yields, expanding liquidity).
 */
export function beatKey(signal, priorSignal, weekly = true) {
  // A state that is neither ACTIVE nor INACTIVE (UNAVAILABLE, or anything a
  // future signal introduces) is NOT measured, and every beat sentence asserts
  // a measurement. Returning null drops the beat instead of defaulting it to
  // "restrictive" — the same defect shape as ETF-01 scoring INACTIVE from an
  // absent ledger (fixed 2026-08-24). Unreachable from evaluateMacro today,
  // which is exactly when a guard is cheap.
  if (signal?.state !== 'ACTIVE' && signal?.state !== 'INACTIVE') return null;
  const supportive = signal.state === 'ACTIVE';
  const moved = Boolean(priorSignal) && priorSignal.state !== signal.state;
  const kind = !moved ? 'hold' : weekly ? 'moved' : 'now';
  return `${kind}${supportive ? 'Supportive' : 'Restrictive'}`;
}

/** Depth variant: the condition that moved gets the 'fresh' framing. */
export function depthKey(signal, priorSignal, weekly = true) {
  if (signal?.state !== 'ACTIVE' && signal?.state !== 'INACTIVE') return null;
  const supportive = signal.state === 'ACTIVE';
  const moved = Boolean(priorSignal) && priorSignal.state !== signal.state;
  // The fresh sentences quote "a week earlier": only for a week-apart prior.
  if (!moved || !weekly) return supportive ? 'supportive' : 'restrictive';
  return supportive ? 'freshSupportive' : 'freshRestrictive';
}

/**
 * The points-free opening.
 *
 * Reuses `groupLevel` + `composeMixed` so the state view picks the SAME variant
 * the scored summary picks (including the Spanish contraction fix), by handing
 * them a context whose `groupTpl` is this file's `opening` block. That keeps one
 * selection rule instead of two that can drift, and leaves
 * `group-summaries.json` — which the Bitcoin view renders — untouched.
 */
export function stateOpening(ctx, stateTpl, locale) {
  const points = ctx.groupTotals[STATE_GROUP_ID];
  const max = MAX_BY_GROUP[STATE_GROUP_ID];
  const shim = { ...ctx, groupTpl: { [STATE_GROUP_ID]: stateTpl.opening } };
  const level = groupLevel(points, max);
  if (level === 'mixed') {
    const composed = composeMixed(shim, STATE_GROUP_ID, locale, points, max);
    if (composed) return composed;
  }
  return fill(stateTpl.opening[level][locale], { points: String(points), max: String(max) });
}

/**
 * lead = opening + one beat per condition, joined by single spaces.
 * A missing signal drops its beat rather than emitting an empty sentence.
 */
export function composeStateLead(ctx, stateTpl, locale, priorById, weekly = true) {
  const beats = STATE_BEAT_ORDER.map((id) => {
    const sig = ctx.byId[id];
    if (!sig) return null;
    const key = beatKey(sig, priorById?.[id], weekly);
    return key ? (stateTpl.beat[id]?.[key]?.[locale] ?? null) : null;
  }).filter(Boolean);
  return [stateOpening(ctx, stateTpl, locale), ...beats].join(' ');
}

/**
 * depth = one numeric sentence per condition, in the same order.
 *
 * `renderDepthSentence` is injected by the caller so this module stays pure and
 * so the sentences reuse the generator's existing locale-aware slot builder and
 * its empty-slot guard — the same net that stops "the dollar closed at " from
 * ever shipping (2026-07-11 audit).
 */
export function composeStateDepth(
  ctx,
  stateTpl,
  locale,
  priorById,
  renderDepthSentence,
  weekly = true
) {
  return STATE_BEAT_ORDER.map((id) => {
    const sig = ctx.byId[id];
    if (!sig) return null;
    const key = depthKey(sig, priorById?.[id], weekly);
    const template = key ? stateTpl.depth[id]?.[key]?.[locale] : null;
    if (!template) return null;
    return renderDepthSentence(id, locale, template, priorById?.[id]);
  })
    .filter(Boolean)
    .join(' ');
}
