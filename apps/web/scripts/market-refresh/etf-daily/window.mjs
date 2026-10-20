/**
 * window.mjs — choose the ETF-01 inputs for one publication and decide the result (E1, 2026-10-20).
 *
 * Pure: ledger rows and a cutoff in, a decision out. Nothing here reads the
 * network, the clock or a file. The owner decisions it encodes (2026-10-20):
 *
 * 1. ONE PROVIDER FOR THE WHOLE WINDOW. The window is the four complete
 *    calendar trading weeks (Monday–Friday) ending on the latest Friday before
 *    the cutoff day. A provider is ELIGIBLE only when every expected session of
 *    those weeks has a STABLE value (ledger.mjs) for every fund the universe
 *    requires that day. The primary (CryptoETF) is used when eligible;
 *    otherwise the backup (SoSoValue) as a whole window; never a mix by day or
 *    week.
 * 2. THE RULE IS UNCHANGED: ≥3 of the 4 weekly nets strictly positive
 *    (`ETF01_RULE` / `isPositiveWeek`, shared with the share-count route).
 * 3. CROSS-CHECK. When both are eligible they are compared:
 *    * a fund-day is FLAGGED when the providers differ by more than their
 *      declared rounding can explain (CryptoETF ±US$50,000, SoSoValue ±US$1);
 *    * a week is FLAGGED when its sign differs, or when |P − S| exceeds BOTH
 *      that week's rounding bound AND 2% of the larger magnitude;
 *    * if the 3-of-4 result differs between providers, ETF-01 is UNAVAILABLE
 *      ('provider-disagreement') until a documented resolution exists; there
 *      is no override flag here, by design;
 *    * any flag holds the weekly PR for owner review before publication.
 *    Fund-day flags are reported even when the weekly nets agree, so opposing
 *    errors that cancel are not hidden.
 * 4. ROUNDING SENSITIVITY IS REPORTED, NOT SCORED. A week whose |net| is within
 *    its rounding bound has a sign the inputs cannot establish. The result is
 *    re-evaluated with those weeks' signs flipped; if it could change, the PR
 *    is held for review. The `> 0` rule itself is not changed (the US$10 M
 *    band was rejected).
 * 5. INSUFFICIENT HISTORY → LOW. No eligible window from either provider
 *    (empty ledger, only partial rows, fewer than four complete weeks), or a
 *    ledger that cannot be read: ETF-01 UNAVAILABLE, no points, never adverse
 *    demand, and `confidenceEffect: 'LOW'` with the reason. No date is
 *    invented and nothing is renewed from a collection attempt; an unreadable
 *    ledger keeps only a previously verified reference, for disclosure.
 * 6. FRESHNESS from R, the Friday ending the latest complete qualified week:
 *    expected update R+10, delayed after R+11, stale after R+21, each at
 *    00:00:00.000 UTC, compared strictly (`now > deadline`). R is a calendar
 *    reference, never an observation time; a holiday Friday stays R.
 *
 * Wiring this into the published score (and the confidence consumers) is E3.
 */

import { ETF01_RULE, isPositiveWeek } from '../lib/etf-flows.mjs';
import { ETF01_WEIGHT } from '../lib/regime-engine.mjs';
import { addDays, dayMs, latestFridayBefore, sessionsInWeek } from './calendar.mjs';
import { ETF_UNIVERSE, requiredFunds } from './universe.mjs';
import { ETF_PROVIDERS } from './providers.mjs';
import { indexLedger, stableValue } from './ledger.mjs';

export const PRIMARY = 'cryptoetf';
export const SECONDARY = 'sosovalue';
/** Weekly disagreement threshold, relative to the larger weekly magnitude. */
export const WEEKLY_DISAGREEMENT_SHARE = 0.02;
export const FRESHNESS_DAYS = Object.freeze({ expected: 10, delayed: 11, stale: 21 });

/** The Fridays of the scoring window, oldest first. */
export function scoringFridays(cutoffMs) {
  const last = latestFridayBefore(cutoffMs);
  return Array.from({ length: ETF01_RULE.weeks }, (_, i) =>
    addDays(last, -7 * (ETF01_RULE.weeks - 1 - i))
  );
}

/** One provider's window: per-week nets if every input is stable, and every problem. */
export function providerWindow(index, provider, fridays, universe = ETF_UNIVERSE) {
  const rounding = ETF_PROVIDERS[provider].roundingUsd;
  const problems = [];
  const values = new Map(); // session|ticker -> value
  const weeks = fridays.map((friday) => {
    const sessions = sessionsInWeek(friday);
    let netUsd = 0;
    let fundDays = 0;
    for (const session of sessions) {
      for (const ticker of requiredFunds(session, universe)) {
        const v = stableValue(index, provider, session, ticker);
        if (v.status !== 'stable') {
          problems.push({ session, ticker, status: v.status });
          continue;
        }
        values.set(`${session}|${ticker}`, v.value);
        netUsd += v.value;
        fundDays += 1;
      }
    }
    return { friday, sessions, netUsd, fundDays, roundingBoundUsd: fundDays * rounding };
  });
  return { provider, eligible: problems.length === 0, weeks, values, problems };
}

/** ≥3 of 4 positive weeks → ACTIVE (the unchanged rule). */
export function etf01Outcome(weeks) {
  const positives = weeks.filter((w) => isPositiveWeek(w.netUsd)).length;
  return { positives, state: positives >= ETF01_RULE.minPositive ? 'ACTIVE' : 'INACTIVE' };
}

/** Weeks whose sign the declared rounding cannot establish, and whether they could flip the result. */
export function roundingSensitivity(weeks) {
  const uncertain = weeks.filter((w) => Math.abs(w.netUsd) <= w.roundingBoundUsd);
  const base = etf01Outcome(weeks).state;
  let robust = true;
  // Every combination of signs for the uncertain weeks (at most 2^4).
  for (let mask = 0; mask < 1 << uncertain.length; mask += 1) {
    const flipped = weeks.map((w) => {
      const k = uncertain.indexOf(w);
      if (k === -1) return w;
      return { ...w, netUsd: mask & (1 << k) ? 1 : -1 };
    });
    if (etf01Outcome(flipped).state !== base) robust = false;
  }
  return { uncertainWeeks: uncertain.map((w) => w.friday), robust };
}

/** Compare two eligible windows over the same Fridays. */
export function compareWindows(primary, secondary) {
  const tolerance =
    ETF_PROVIDERS[primary.provider].roundingUsd + ETF_PROVIDERS[secondary.provider].roundingUsd;
  const fundDayFlags = [];
  for (const [key, p] of primary.values) {
    const s = secondary.values.get(key);
    if (s === undefined) continue; // both eligible ⇒ same required keys
    if (Math.abs(p - s) > tolerance) {
      const [session, ticker] = key.split('|');
      fundDayFlags.push({ session, ticker, primaryUsd: p, secondaryUsd: s, diffUsd: p - s });
    }
  }
  const weekFlags = [];
  primary.weeks.forEach((pw, i) => {
    const sw = secondary.weeks[i];
    const diff = Math.abs(pw.netUsd - sw.netUsd);
    const bound = pw.roundingBoundUsd + sw.roundingBoundUsd;
    const share = WEEKLY_DISAGREEMENT_SHARE * Math.max(Math.abs(pw.netUsd), Math.abs(sw.netUsd));
    if (isPositiveWeek(pw.netUsd) !== isPositiveWeek(sw.netUsd)) {
      weekFlags.push({
        friday: pw.friday,
        reason: 'sign',
        primaryUsd: pw.netUsd,
        secondaryUsd: sw.netUsd,
      });
    } else if (diff > bound && diff > share) {
      weekFlags.push({
        friday: pw.friday,
        reason: 'magnitude',
        primaryUsd: pw.netUsd,
        secondaryUsd: sw.netUsd,
      });
    }
  });
  const outcomeMatches = etf01Outcome(primary.weeks).state === etf01Outcome(secondary.weeks).state;
  return { fundDayFlags, weekFlags, outcomeMatches };
}

/** The publication's freshness fields from R (a calendar Friday), or all null. */
export function freshnessFromReference(referenceFriday) {
  if (referenceFriday === null) {
    return {
      reference_week_end: null,
      expected_update_at: null,
      delayed_after: null,
      stale_after: null,
    };
  }
  const at = (n) => new Date(dayMs(addDays(referenceFriday, n))).toISOString();
  return {
    reference_week_end: referenceFriday,
    expected_update_at: at(FRESHNESS_DAYS.expected),
    delayed_after: at(FRESHNESS_DAYS.delayed),
    stale_after: at(FRESHNESS_DAYS.stale),
  };
}

/**
 * Strict deadline comparison: exactly AT the deadline is not yet past it.
 *
 * @param {number} nowMs
 * @param {string | null} deadlineIso
 */
export const isPastDeadline = (nowMs, deadlineIso) =>
  deadlineIso !== null && nowMs > Date.parse(deadlineIso);

/**
 * @typedef {object} Etf01Decision
 * @property {'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE'} state
 * @property {number} points
 * @property {null | 'insufficient-history' | 'history-unreadable' | 'provider-disagreement'} reason
 * @property {null | 'cryptoetf' | 'sosovalue'} selected
 * @property {'agreed' | 'flagged' | 'unavailable'} crossCheck
 * @property {boolean} holdForReview
 * @property {string[]} fridays
 * @property {string} universeVersion
 * @property {boolean} insufficientHistory
 * @property {null | 'LOW'} confidenceEffect
 * @property {string | null} reference_week_end
 * @property {string | null} expected_update_at
 * @property {string | null} delayed_after
 * @property {string | null} stale_after
 * @property {number} [positives]
 * @property {{friday: string, sessions: string[], netUsd: number, roundingBoundUsd: number}[]} [weeks]
 * @property {{uncertainWeeks: string[], robust: boolean}} [sensitivity]
 * @property {ReturnType<typeof compareWindows> | null} [comparison]
 * @property {Record<string, {session: string, ticker: string, status: string}[]>} [problems]
 */

/**
 * Decide ETF-01 for one publication.
 *
 * @param {object} o
 * @param {number} o.cutoffMs — the information cutoff (instant)
 * @param {object[]|null} o.rows — private ledger rows; null when the ledger could not be read
 * @param {string|null} [o.lastVerifiedReference] — R of the last verified publication, kept for disclosure only
 * @param {object} [o.universe]
 * @returns {Etf01Decision}
 */
export function decideEtf01({
  cutoffMs,
  rows,
  lastVerifiedReference = null,
  universe = ETF_UNIVERSE,
}) {
  const fridays = scoringFridays(cutoffMs);
  const unavailable = (reason, extra = {}) => {
    const insufficient = reason === 'insufficient-history' || reason === 'history-unreadable';
    const reference = insufficient ? lastVerifiedReference : null;
    return {
      state: 'UNAVAILABLE',
      points: 0,
      reason,
      selected: null,
      crossCheck: 'unavailable',
      holdForReview: reason === 'provider-disagreement',
      fridays,
      universeVersion: universe.version,
      insufficientHistory: insufficient,
      confidenceEffect: insufficient ? 'LOW' : null,
      ...freshnessFromReference(reference),
      ...extra,
    };
  };
  if (rows === null) return unavailable('history-unreadable');

  const index = indexLedger(rows, cutoffMs);
  const primary = providerWindow(index, PRIMARY, fridays, universe);
  const secondary = providerWindow(index, SECONDARY, fridays, universe);
  const problems = { [PRIMARY]: primary.problems, [SECONDARY]: secondary.problems };

  if (!primary.eligible && !secondary.eligible) {
    return unavailable('insufficient-history', { problems });
  }
  const selectedWindow = primary.eligible ? primary : secondary;
  const other = primary.eligible ? secondary : primary;
  let comparison = null;
  let crossCheck = 'unavailable';
  if (other.eligible) {
    comparison = compareWindows(selectedWindow, other);
    if (!comparison.outcomeMatches) {
      return unavailable('provider-disagreement', { comparison, problems });
    }
    crossCheck =
      comparison.fundDayFlags.length || comparison.weekFlags.length ? 'flagged' : 'agreed';
  }
  const outcome = etf01Outcome(selectedWindow.weeks);
  const sensitivity = roundingSensitivity(selectedWindow.weeks);
  const referenceFriday = fridays[fridays.length - 1];
  return {
    state: outcome.state,
    points: outcome.state === 'ACTIVE' ? ETF01_WEIGHT : 0,
    reason: null,
    selected: selectedWindow.provider,
    crossCheck,
    holdForReview: crossCheck === 'flagged' || !sensitivity.robust,
    fridays,
    universeVersion: universe.version,
    insufficientHistory: false,
    confidenceEffect: null,
    positives: outcome.positives,
    weeks: selectedWindow.weeks.map(({ friday, sessions, netUsd, roundingBoundUsd }) => ({
      friday,
      sessions,
      netUsd,
      roundingBoundUsd,
    })),
    sensitivity,
    comparison,
    problems,
    ...freshnessFromReference(referenceFriday),
  };
}
