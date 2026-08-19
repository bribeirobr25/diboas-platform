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
 *                   (DELAYED once the run passes the ledger's stale_after)
 *
 * overall_confidence (founder-ratified with the B3 go, 2026-08-11):
 *   HIGH when all sources FRESH · MODERATE when any DELAYED/UNAVAILABLE ·
 *   LOW when ≥2 UNAVAILABLE or any source already past its stale_after.
 *
 * Messages are ops-facing EN templates (the panel's visible labels stay
 * localized via i18n). Stable provenance notes ride verbatim in the
 * templates; transition narratives are per-status variants; bespoke one-off
 * notes live in git history (delete-after-execution).
 */

import { expectedConfirmedMonthYM } from './regime-engine.mjs';
import { WARMUP_SNAPSHOTS } from './etf-flows.mjs';

const DAY_MS = 86400000;
const MONTHS_EN =
  'January February March April May June July August September October November December'.split(
    ' '
  );

const d = (s) => new Date(`${s.slice(0, 10)}T00:00:00Z`);
const iso = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');
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

/** One entry per panel source, in committed panel order. */
export const SOURCE_REGISTRY = [
  { source: 'in-repo:monthlyPrices.json (BTC)', kind: 'monthly-close', signal: 'BTC-01' },
  { source: 'FRED:DGS10', kind: 'weekly-friday', signal: 'MAC-02' },
  { source: 'FRED:DTWEXBGS', kind: 'weekly-friday', signal: 'MAC-01' },
  { source: 'FRED:M2SL', kind: 'monthly-print', signal: 'MAC-03' },
  { source: 'FRED:NASDAQCOM', kind: 'weekly-friday', signal: 'REL-03' },
  { source: 'Yahoo:GC=F', kind: 'weekly-friday', signal: 'REL-01' },
  { source: 'Polygon:ETF (shares-outstanding)', kind: 'warmup-ledger', signal: 'ETF-01' },
];

const WEEKLY_DESC = {
  'FRED:DGS10': 'US 10-year constant-maturity yield.',
  'FRED:DTWEXBGS': 'Broad dollar index (DXY proxy).',
  'FRED:NASDAQCOM': 'Nasdaq Composite close.',
  'Yahoo:GC=F':
    'Gold futures front-month — SUBSTITUTE for the retired FRED LBMA series (methodology drift D-gold-2026-05-29).',
};

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
        `${confirmedEnd.getUTCFullYear()} per doc 02 §5.1. Next update due at the ` +
        `${monthName(nextEnd)} ${nextEnd.getUTCDate()} monthly close.`
      : `${base} The ${monthName(d(expectedYM))} close is confirmable but not yet appended ` +
        `(--append-btc due); signals still anchor ${monthName(confirmedEnd)} per doc 02 §5.1.`;
  return {
    source,
    status,
    last_updated_at: iso(confirmedEnd),
    expected_next_update_at: iso(at(nextEnd, 23, 59, 59)),
    stale_after: iso(addDays(monthEnd(anchor, 2), 1)),
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
    message,
  };
}

function etfLedgerEntry(source, signal, snapshots, run) {
  const count = snapshots.length;
  const anchorStr = count ? snapshots[count - 1].anchor : ymd(run);
  const anchor = d(anchorStr);
  const expectedNext = addDays(anchor, 7);
  const staleAfter = addDays(anchor, 21);
  const base =
    'Spot-ETF net flows derived from the Polygon shares-outstanding weekly ledger ' +
    '(P4 route, 2026-07-11 — replaces the dead CoinGlass/Farside feeds).';
  let status;
  let message;
  if (count < WARMUP_SNAPSHOTS) {
    status = 'UNAVAILABLE';
    // The run that records the snapshot making the ledger scorable: the
    // Monday after the ((target − count)th) future Friday anchor.
    const scorable = addDays(anchor, 7 * (WARMUP_SNAPSHOTS - count) + 3);
    message =
      `${base} Warming up: ${count} of ${WARMUP_SNAPSHOTS} weekly snapshots recorded; ` +
      `4 weekly flows need ${WARMUP_SNAPSHOTS} snapshots. UNAVAILABLE (not weak) per doc 02 §10.1 — ` +
      `no guessed backfill; first scorable evaluation expected ~${ymd(scorable)}.`;
  } else if (run > staleAfter) {
    status = 'DELAYED';
    message = `${base} Ledger stale: last snapshot ${anchorStr}; weekly snapshots overdue.`;
  } else {
    status = 'FRESH';
    message =
      `${base} Ledger live: ${count} weekly snapshots; ETF-01 scored from the trailing ` +
      `4 weekly flows per doc 02 §8.3. Weekly anchor ${anchorStr}.`;
  }
  return {
    source,
    status,
    last_updated_at: iso(anchor),
    expected_next_update_at: iso(expectedNext),
    stale_after: iso(staleAfter),
    message,
  };
}

/**
 * @param computed  parsed computed.json (anchors + computed_at)
 * @param etfSnapshots  parsed etf-shares-weekly.jsonl rows
 * @returns the canonical data_status object (no `_`-annotations)
 */
export function deriveDataStatus(computed, etfSnapshots) {
  const run = new Date(computed.computed_at);
  const anchorOf = Object.fromEntries(computed.signals.map((s) => [s.id, s.anchor]));
  const sources = SOURCE_REGISTRY.map((r) => {
    if (r.kind === 'weekly-friday') return weeklyEntry(r.source, anchorOf[r.signal], run);
    if (r.kind === 'monthly-close') return btcMonthlyEntry(r.source, anchorOf[r.signal], run);
    if (r.kind === 'monthly-print') return m2Entry(r.source, anchorOf[r.signal], run);
    return etfLedgerEntry(r.source, r.signal, etfSnapshots, run);
  });
  const delayed = sources.filter((s) => s.status === 'DELAYED').map((s) => s.source);
  const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE').map((s) => s.source);
  const pastStale = sources.some((s) => run > new Date(s.stale_after));
  const overall =
    unavailable.length >= 2 || pastStale
      ? 'LOW'
      : delayed.length || unavailable.length
        ? 'MODERATE'
        : 'HIGH';
  return {
    overall_confidence: overall,
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
