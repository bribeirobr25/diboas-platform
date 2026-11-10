/**
 * data-status.mjs — the automated `data_status` writer (B3, 2026-08-11 —
 * closes PENDING_ALL "Follow-up L": the panel had NO automated writer, so
 * every weekly refresh needed a hand edit or the page showed "updated today"
 * beside a stale sources panel).
 *
 * Pure derivation, no I/O (the group-summaries.mjs pattern):
 *   deriveDataStatus(computed, etfSnapshots) → the canonical panel object.
 * generate.mjs writes it into BOTH regime.json#data_status and
 * data-status.json — one writer ⇒ F-M6 mirror by construction — and the
 * --check drift gate covers it (a hand-edited panel can never merge).
 *
 * Anchors come from computed.json#signals (the engine already emits
 * `anchor`/`anchorKind` per signal — run.mjs needed no schema change).
 * Status rules per cadence class (F-M3: a laggard source inside its
 * publication window is FRESH, not DELAYED):
 *   weekly-friday   FRESH while (run − anchor) ≤ 14d, else DELAYED
 *   monthly-close   FRESH while the anchor is the doc-02 §5.1 expected
 *                   confirmed month (append grace honored), else DELAYED
 *   monthly-print   FRESH until the next print is overdue (~25th of
 *                   anchor month + 2), else DELAYED
 *   warmup-ledger   UNAVAILABLE below WARMUP_SNAPSHOTS, else FRESH
 *                   (past the ledger's stale_after: STALE, by the next rule)
 *   any row         then the read-time twin's thresholds at the run instant: FRESH or
 *                   DELAYED past its stale_after -> STALE; FRESH past delayed_after ->
 *                   DELAYED (plan MP-3b: the panel equals its own read at computed_at)
 *
 * overall_confidence (founder-ratified with the B3 go, 2026-08-11):
 *   HIGH when all sources FRESH · MODERATE when any DELAYED/UNAVAILABLE ·
 *   LOW when ≥2 UNAVAILABLE or any source already past its stale_after, and then
 *   `low_confidence_causes` names them (as the read-time twin does).
 *
 * Messages are ops-facing EN templates (the panel's visible labels stay
 * localized via i18n). Stable provenance notes ride verbatim in the
 * templates; transition narratives are per-status variants; bespoke one-off
 * notes live in git history (delete-after-execution).
 */

import { expectedConfirmedMonthYM, MONTH_APPEND_GRACE_DAYS } from './regime-engine.mjs';
import { PANEL_SOURCES } from './source-registry.mjs';
import { WARMUP_SNAPSHOTS } from './etf-flows.mjs';
import { ledgerCoverage } from './etf-coverage.mjs';
import { ETF_VARIANT } from './regime-engine.mjs';
import { isSuspendedEtf } from './etf-suspension.mjs';

const DAY_MS = 86400000;
const MONTHS_EN =
  'January February March April May June July August September October November December'.split(
    ' '
  );

const d = (s) => new Date(`${s.slice(0, 10)}T00:00:00Z`);
// Whole seconds are written without milliseconds, as before. A deadline that
// is NOT a whole second (the monthly-close one, 5.630) keeps them: dropping
// them would move it to a different instant.
const iso = (date) => date.toISOString().replace(/\.000Z$/, 'Z');
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);
const ymd = (date) => date.toISOString().slice(0, 10);
const monthName = (date) => MONTHS_EN[date.getUTCMonth()];

/** Last day of the month `offset` months after the given date's month, at 00:00Z. */
function monthEnd(date, offset = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset + 1, 0));
}
/** First Friday strictly after the given date, at 20:00Z. */
function nextFriday2000Z(date) {
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const days = (5 - base.getUTCDay() + 7) % 7 || 7;
  const fri = addDays(base, days);
  fri.setUTCHours(20, 0, 0, 0);
  return fri;
}
const at = (date, h, m = 0, s = 0) => {
  const c = new Date(date.getTime());
  c.setUTCHours(h, m, s, 0);
  return c;
};

const WEEKLY_LAG_ALLOWANCE_DAYS = 14; // F-M3 publication-lag window

/**
 * One entry per panel source, in committed panel order, DERIVED from the one source list
 * (`lib/source-registry.mjs`, gate SRC-REG-1, plan MP-3a); never edit a copy here.
 */
export const SOURCE_REGISTRY = PANEL_SOURCES.map((s) => ({
  source: s.label,
  kind: s.panelKind,
  signal: s.signals[0],
}));

/** The panel text of each weekly source, from the same list. */
const WEEKLY_DESC = Object.fromEntries(
  PANEL_SOURCES.filter((s) => s.description).map((s) => [s.label, s.description])
);

function weeklyEntry(source, anchorStr, run) {
  const anchor = d(anchorStr);
  const lagDays = (run - anchor) / DAY_MS;
  const status = lagDays <= WEEKLY_LAG_ALLOWANCE_DAYS ? 'FRESH' : 'DELAYED';
  const expectedNext = nextFriday2000Z(run);
  const message =
    source === 'Yahoo:GC=F'
      ? `${WEEKLY_DESC[source]} Weekly anchor ${anchorStr}.`
      : `${WEEKLY_DESC[source]} Weekly signal anchored at the most recent confirmed Friday close (${anchorStr}).`;
  return {
    source,
    status,
    last_updated_at: iso(anchor),
    expected_next_update_at: iso(expectedNext),
    stale_after: iso(addDays(expectedNext, 7)),
    // 5.173: the instant THIS rule flips FRESH -> DELAYED. Shipped so the page
    // can re-evaluate freshness at READ time without re-implementing the
    // cadence policy, which stays here. Weekly: anchor + the lag allowance.
    delayed_after: iso(addDays(anchor, WEEKLY_LAG_ALLOWANCE_DAYS)),
    message,
  };
}

function btcMonthlyEntry(source, anchorStr, run) {
  const anchor = d(anchorStr);
  const expectedYM = expectedConfirmedMonthYM(run);
  const status = anchorStr === expectedYM ? 'FRESH' : 'DELAYED';
  const confirmedEnd = monthEnd(anchor);
  const nextEnd = monthEnd(anchor, 1);
  const base =
    'BTC monthly price series spliced (CoinMetrics 2010-07 → 2014-08; Yahoo 2014-09 onwards). ' +
    'Authoritative for BTC structural signals (BTC-01..04).';
  const message =
    status === 'FRESH'
      ? `${base} Last confirmed monthly close ${monthName(confirmedEnd)} ${confirmedEnd.getUTCDate()}, ` +
        `${confirmedEnd.getUTCFullYear()}. Next update due at the ` +
        `${monthName(nextEnd)} ${nextEnd.getUTCDate()} monthly close.`
      : `${base} The ${monthName(d(expectedYM))} close is confirmable but not yet appended ` +
        `(--append-btc due); signals still anchor ${monthName(confirmedEnd)}.`;
  return {
    source,
    status,
    last_updated_at: iso(confirmedEnd),
    expected_next_update_at: iso(at(nextEnd, 23, 59, 59)),
    stale_after: iso(addDays(monthEnd(anchor, 2), 1)),
    // 5.173: this source is FRESH while `anchor === expectedConfirmedMonthYM(now)`.
    // That equality breaks the first moment the grace window closes two months
    // on: day 4 of (anchor month + 2), 00:00 UTC. Derived from the same rule.
    // 5.630 (N02, CON:155): `delayed_after` is the LAST fresh instant, because
    // the read-time check is `now > delayed_after`. Day 4 00:00 itself is
    // already DELAYED at generation, so the deadline is 1 ms before it; the
    // three-day grace and the confidence rules are unchanged.
    delayed_after: iso(
      new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 2, MONTH_APPEND_GRACE_DAYS + 1) - 1
      )
    ),
    message,
  };
}

function m2Entry(source, anchorStr, run) {
  const anchor = d(anchorStr);
  const due = at(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 2, 25)), 20);
  const status = run <= due ? 'FRESH' : 'DELAYED';
  const printMonth = monthName(anchor);
  const nextPrint = monthName(addDays(monthEnd(anchor), 1));
  const dueMonth = monthName(due);
  const message =
    status === 'FRESH'
      ? `US M2 money stock, monthly. ${printMonth} ${anchor.getUTCFullYear()} print landed ` +
        `(anchor ${anchorStr}); the ${nextPrint} print is due ~late ${dueMonth}.`
      : `US M2 money stock, monthly. The ${nextPrint} print is overdue (last anchor ${anchorStr}).`;
  return {
    source,
    status,
    last_updated_at: iso(anchor),
    expected_next_update_at: iso(due),
    stale_after: iso(monthEnd(anchor, 3)),
    // 5.173: FRESH until the next print is overdue — `due` IS that instant.
    delayed_after: iso(due),
    message,
  };
}

/**
 * The ETF row's dates (2026-10-19) describe the latest COMPLETE ledger record,
 * by its conventional Friday anchor: `last_updated_at` is that anchor,
 * `expected_next_update_at` the next Friday after it, `stale_after` three weeks
 * after it. They are not observation dates (the route provides none for the
 * share counts) and not collection times. An incomplete record or a refused
 * attempt does not move them, so a failing collection cannot make the source
 * look updated: the row ages, and the confidence rule acts on it unchanged.
 *
 * @param signal the ETF-01 signal RECORD (not its id) — see deriveDataStatus.
 * @param attempts refused collection attempts (etf-snapshot-attempts.jsonl)
 */
function etfLedgerEntry(source, signal, snapshots, run, attempts = []) {
  const cov = ledgerCoverage(snapshots);
  const count = cov.complete;
  // No complete record at all: date the row by the ledger's FIRST record, so
  // it ages like any failing collection. Today's date is only for an empty
  // ledger (nothing collected yet), as before.
  const anchorStr = cov.latestCompleteAnchor ?? snapshots[0]?.anchor ?? ymd(run);
  const anchor = d(anchorStr);
  const expectedNext = addDays(anchor, 7);
  const staleAfter = addDays(anchor, 21);
  const base =
    'Spot-ETF net flows derived from the Polygon shares-outstanding weekly ledger ' +
    '(P4 route, 2026-07-11 — replaces the dead CoinGlass/Farside feeds).';
  let status;
  let message;
  // 5.301: a cadence GAP is neither warm-up nor staleness — the ledger is deep
  // and its last anchor is recent, so both of those branches read FRESH. Left
  // alone, the panel would say "Ledger live … ETF-01 scored from the trailing 4
  // weekly flows" beside a signal that says it could not be scored: two
  // contradicting statements on one page, which is 5.131 all over again.
  //
  // The gap is read off the SIGNAL rather than recomputed here, so the two
  // surfaces cannot disagree by construction — the panel reports the same fact
  // the engine acted on.
  // 2026-10-18 suspension (lib/etf-suspension.mjs). Read off the SIGNAL, like
  // the gap below, so the panel and the signal cannot disagree. UNAVAILABLE on
  // purpose: it is the existing precedent (5.301) for an ETF-01 that cannot be
  // scored, and it caps the headline confidence at MODERATE through the shared
  // rule (one unavailable source) while leaving every route to LOW intact (a
  // second unavailable source, or any source past its stale_after). The
  // stale_after below still applies, so a ledger that stops being collected
  // degrades exactly as it would without the suspension.
  if (isSuspendedEtf(signal)) {
    return {
      source,
      status: 'UNAVAILABLE',
      last_updated_at: iso(anchor),
      expected_next_update_at: iso(expectedNext),
      stale_after: iso(staleAfter),
      delayed_after: null,
      message:
        `${base} ETF-01 is suspended from the ${signal.values.suspendedSince} cycle: the ` +
        `share-count route cannot support a weekly evaluation, so the signal is scored ` +
        `UNAVAILABLE (0 points), not weak. ${ledgerSentence(cov, attempts)} A successful ` +
        `collection does not reactivate the signal.`,
    };
  }
  if (signal?.values?.variant === ETF_VARIANT.GAPPED) {
    return {
      source,
      status: 'UNAVAILABLE',
      last_updated_at: iso(anchor),
      expected_next_update_at: iso(expectedNext),
      stale_after: iso(staleAfter),
      // Count-based, like warm-up: time cannot make a missing snapshot worse.
      delayed_after: null,
      message:
        `${base} Ledger has a ${signal.values.gapDays}-day gap inside the trailing-4 window — ` +
        `a weekly snapshot is missing, so four weekly flows cannot be measured. UNAVAILABLE ` +
        `(not weak) rather than counting the gap as one week; resolves once four clean weekly ` +
        `intervals are recorded.`,
    };
  }
  if (count < WARMUP_SNAPSHOTS) {
    status = 'UNAVAILABLE';
    // The run that records the snapshot making the ledger scorable: the
    // Tuesday after the ((target − count)th) future Friday anchor (the weekly run
    // moved from Monday to Tuesday with plan MP-3b, so +4, not +3).
    const scorable = addDays(anchor, 7 * (WARMUP_SNAPSHOTS - count) + 4);
    message =
      `${base} Warming up: ${count} of ${WARMUP_SNAPSHOTS} weekly snapshots recorded; ` +
      `4 weekly flows need ${WARMUP_SNAPSHOTS} snapshots. UNAVAILABLE (not weak), ` +
      `no guessed backfill; first scorable evaluation expected ~${ymd(scorable)}.`;
  } else if (run > staleAfter) {
    // past its stale_after: STALE, as the read-time twin reads it (plan MP-3b)
    status = 'STALE';
    message = `${base} Ledger stale: last snapshot ${anchorStr}; weekly snapshots overdue.`;
  } else {
    status = 'FRESH';
    message =
      `${base} Ledger live: ${count} weekly snapshots; ETF-01 scored from the trailing ` +
      `4 weekly flows. Weekly anchor ${anchorStr}.`;
  }
  return {
    source,
    status,
    last_updated_at: iso(anchor),
    expected_next_update_at: iso(expectedNext),
    stale_after: iso(staleAfter),
    // 5.173: while warming up the state is COUNT-based, so time cannot make it
    // worse — null means "no time-based downgrade applies". Once scorable, the
    // ledger going stale is the only time-based transition.
    delayed_after: count < WARMUP_SNAPSHOTS ? null : iso(staleAfter),
    message,
  };
}

/**
 * What the ETF ledger holds, said plainly (2026-10-19). Records, complete
 * records and the latest refused attempt are separate facts; a complete record
 * is never described as a usable week, because completeness does not show
 * that a share count is current.
 */
function ledgerSentence(cov, attempts) {
  const parts = [
    `Collection is still attempted weekly. Ledger: ${cov.records} records, ${cov.complete} ` +
      `complete (a share count and a price for every fund); completeness does not show ` +
      `that the share counts are current, and their observation dates are not provided.`,
  ];
  if (cov.latestRecordAnchor && !cov.latestRecordComplete) {
    parts.push(`The latest record (anchor ${cov.latestRecordAnchor}) is incomplete.`);
  }
  parts.push(
    cov.latestCompleteAnchor
      ? `The latest complete record is anchored ${cov.latestCompleteAnchor}.`
      : 'No complete record yet.'
  );
  const refused = attempts
    .filter((a) => a.outcome === 'refused-incomplete' && typeof a.anchor === 'string')
    .filter((a) => a.anchor > (cov.latestRecordAnchor ?? ''))
    .sort((a, b) => (a.anchor < b.anchor ? -1 : a.anchor > b.anchor ? 1 : 0));
  const last = refused[refused.length - 1];
  if (last) {
    parts.push(
      `The latest collection attempt (anchor ${last.anchor}, ${String(last.attempted_at).slice(0, 10)}) ` +
        `returned incomplete data and was not added to the ledger; it is kept as evidence.`
    );
  }
  return parts.join(' ');
}

/**
 * @param computed  parsed computed.json (anchors + computed_at)
 * @param etfSnapshots  parsed etf-shares-weekly.jsonl rows
 * @param etfAttempts  parsed etf-snapshot-attempts.jsonl rows (refused collections)
 * @returns the canonical data_status object (no `_`-annotations)
 */
/**
 * The headline confidence from the panel's rows at `run`: LOW when two or more are UNAVAILABLE or
 * any is past its stale_after; MODERATE when any is DELAYED, STALE or UNAVAILABLE; else HIGH.
 * Exported so the read-time twin's test compares against THIS rule, not a copy (MP-3b review).
 */
export function confidenceOf(sources, run) {
  const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE').length;
  const delayed = sources.filter((s) => s.status === 'DELAYED' || s.status === 'STALE').length;
  const pastStale = sources.some((s) => s.stale_after != null && run > new Date(s.stale_after));
  return unavailable >= 2 || pastStale ? 'LOW' : delayed || unavailable ? 'MODERATE' : 'HIGH';
}

export function deriveDataStatus(computed, etfSnapshots, etfAttempts = []) {
  const run = new Date(computed.computed_at);
  const anchorOf = Object.fromEntries(computed.signals.map((s) => [s.id, s.anchor]));
  // The registry's `signal` is an ID, not a record. The ETF row needs the
  // record itself (5.301 reads the gap off it), so resolve it here rather than
  // letting `signal?.values` quietly be undefined on a string.
  const signalOf = Object.fromEntries(computed.signals.map((s) => [s.id, s]));
  const past = (instant) => instant != null && run > new Date(instant);
  const sources = SOURCE_REGISTRY.map((r) => {
    if (r.kind === 'weekly-friday') return weeklyEntry(r.source, anchorOf[r.signal], run);
    if (r.kind === 'monthly-close') return btcMonthlyEntry(r.source, anchorOf[r.signal], run);
    if (r.kind === 'monthly-print') return m2Entry(r.source, anchorOf[r.signal], run);
    return etfLedgerEntry(r.source, signalOf[r.signal], etfSnapshots, run, etfAttempts);
  }).map((s) => {
    // The read-time twin's two thresholds (`analytics-sdk/freshness.ts#applyReadTimeFreshness`),
    // applied at the run instant so the panel equals its own read at computed_at in every week,
    // not only in weeks where nothing is past a threshold (plan MP-3b; the equivalence guard in
    // `freshness.test.ts` pins the two together).
    if ((s.status === 'FRESH' || s.status === 'DELAYED') && past(s.stale_after))
      return { ...s, status: 'STALE' };
    if (s.status === 'FRESH' && past(s.delayed_after)) return { ...s, status: 'DELAYED' };
    return s;
  });
  // STALE is a worse DELAYED (as the twin lists it): the summary must name the source the
  // headline blames.
  const delayed = sources
    .filter((s) => s.status === 'DELAYED' || s.status === 'STALE')
    .map((s) => s.source);
  const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE').map((s) => s.source);
  // Null-safe on purpose. `new Date(null)` is the epoch, so a source with no
  // stale_after would read as "past stale" and force LOW. No branch emits null
  // today, but the TYPE allows it, and the read-time twin
  // (`analytics-sdk/freshness.ts`) returns FALSE for null — so the unguarded
  // form was a real divergence between two rules documented as mirroring each
  // other, waiting on the first cadence class that has no stale threshold.
  const pastStaleSources = sources.filter((s) => past(s.stale_after)).map((s) => s.source);
  const overall = confidenceOf(sources, run);
  return {
    overall_confidence: overall,
    // Only when LOW, the facts that made it LOW, exactly as the read-time twin derives them
    // (`analytics-sdk/freshness.ts#withLowCauses`, #741). Before, only the twin wrote them, so in
    // any LOW week the panel and its own read at computed_at differed and the equivalence guard
    // (`freshness.test.ts`, a weekly blocking test) would have stopped a run on a correct state
    // (found by the week simulator's Bitcoin month-roll, plan MP-3b).
    ...(overall === 'LOW'
      ? { low_confidence_causes: { past_stale: pastStaleSources, unavailable } }
      : {}),
    last_successful_update_at: computed.computed_at,
    sources,
    delayed_sources: delayed,
    unavailable_sources: unavailable,
  };
}

/** Generator-owned file-level _comment for data-status.json. */
export const DATA_STATUS_COMMENT =
  'Per-source freshness map used by DataFreshnessIndicator. Matches doc 07 §26 DataStatus schema. ' +
  'AUTO-GENERATED by generate.mjs (B3, 2026-08-11) from computed.json anchors + the ETF ledger — ' +
  'do not hand-edit (the --check drift gate enforces parity; version history lives in git). ' +
  'This file and apps/web/data/market/shared/regime.json#data_status MUST list the same source set (audit gate, F-M6).';
