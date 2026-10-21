/**
 * The market wire-format checks (`5.353`, completed 2026-10-19).
 *
 * A JSON body that crossed a network is a claim about bytes nobody checked, so the app's
 * market boundary PARSES it against the domain contracts here instead of asserting a type.
 * Each check answers with the FIRST failing path (`apys[2].stamp.asOf`) or `null` when the
 * value is usable — a path, never a value from the payload, so a rejection can be logged
 * without carrying the payload with it.
 *
 * ```text
 * STRUCTURE ONLY      known ids / sources / origins / chains, finite numbers, calendar-valid
 *                     dates, strictly ascending series, required fields present
 * NOT HERE            age (freshness policy, `freshness.ts`), plausibility bounds
 *                     (`evidenceBounds.ts`, applied by the providers that ingest a value)
 * NEVER               sorting, dropping, defaulting or repairing an entry
 * ```
 *
 * Keeping age and bounds out is deliberate: a second copy of either rule would drift from
 * the one the providers and the current-facing contract already apply.
 *
 * Two date shapes, never confused: a series POINT is a UTC day (`YYYY-MM-DD`); a STAMP
 * time (`asOf`, `observedAt`, `derivedAt`) is a day OR an ISO timestamp — the reference
 * fixture stamps are documented as day-only (`fixtures.ts`, `FIXTURE_AS_OF`).
 */

import { CHAINS, EVIDENCE_ORIGINS, EVIDENCE_SOURCES, PROTOCOL_IDS } from './types';

export type ShapeIssue = string | null;

type Obj = Record<string, unknown>;
/** A plain JSON object — not `null`, not a list. Shared with the app's response parsers. */
export const isPlainRecord = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isObj = isPlainRecord;
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const oneOf = (list: readonly string[], v: unknown) => typeof v === 'string' && list.includes(v);

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const STAMP_TIME =
  /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-](\d{2}):(\d{2})))?$/;

/**
 * A real UTC calendar day. `Date.parse('2026-02-30')` quietly answers 2 March, so the
 * spelling alone proves nothing: the day must survive a round trip through the calendar.
 */
export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DAY.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** A stamp time: a calendar day, or that day with a valid ISO time and zone. */
export function isStampTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = STAMP_TIME.exec(value);
  if (!m || !isCalendarDay(m[1])) return false;
  const [hh, mm, ss, zh, zm] = [m[2], m[3], m[4], m[5], m[6]].map((x) => (x ? Number(x) : 0));
  if (hh > 23 || mm > 59 || ss > 59 || zh > 23 || zm > 59) return false;
  return Number.isFinite(Date.parse(value));
}

/**
 * Strictly ascending day strings — the ONE ordering rule for a dated series, shared with
 * `buildHistoricalSeries` so the server that builds a series and the client that receives
 * it can never disagree about what an orderly series is.
 */
export function datesStrictlyAscending(dates: readonly string[]): boolean {
  for (let i = 1; i < dates.length; i += 1) if (dates[i] <= dates[i - 1]) return false;
  return true;
}

const DAY_MS = 86_400_000;

/**
 * A replay series is one point per CONSECUTIVE calendar day (`5.105`; lane audit
 * 2026-10-21, D1/D6/B2). The replay walks a series by position — "start + one step
 * per day" — so a missing day makes every later step read the NEXT day's value while
 * the window still reports itself covered: a gap silently filled with later data,
 * which `5.105` forbids. A gap therefore makes the SERIES unavailable, here, the
 * one rule both the server (`buildHistoricalSeries`) and the client boundary apply.
 * It implies `datesStrictlyAscending` and requires every date to be a real day.
 */
export function datesAreConsecutiveDays(dates: readonly string[]): boolean {
  if (!dates.every(isCalendarDay) || !datesStrictlyAscending(dates)) return false;
  for (let i = 1; i < dates.length; i += 1) {
    if (Date.parse(`${dates[i]}T00:00:00Z`) - Date.parse(`${dates[i - 1]}T00:00:00Z`) !== DAY_MS)
      return false;
  }
  return true;
}

/** `DataStamp` — every required field present, every optional one well-formed when present. */
export function dataStampIssue(v: unknown, path: string): ShapeIssue {
  if (!isObj(v)) return path;
  if (
    typeof v.source !== 'string' ||
    !Object.prototype.hasOwnProperty.call(EVIDENCE_SOURCES, v.source)
  )
    return `${path}.source`;
  if (!oneOf(EVIDENCE_ORIGINS, v.origin)) return `${path}.origin`;
  if (!isStampTime(v.asOf)) return `${path}.asOf`;
  if (!('observedAt' in v) || (v.observedAt !== null && !isStampTime(v.observedAt)))
    return `${path}.observedAt`;
  if (v.derivedAt !== undefined && v.derivedAt !== null && !isStampTime(v.derivedAt))
    return `${path}.derivedAt`;
  if (typeof v.fallbackUsed !== 'boolean') return `${path}.fallbackUsed`;
  if (
    !('fixtureVersion' in v) ||
    (v.fixtureVersion !== null && typeof v.fixtureVersion !== 'string')
  )
    return `${path}.fixtureVersion`;
  if (v.methodology !== undefined && typeof v.methodology !== 'string')
    return `${path}.methodology`;
  if (v.proxyOf !== undefined && typeof v.proxyOf !== 'string') return `${path}.proxyOf`;
  return null;
}

/** A list whose every member passes `member`, with `keyOf` unique — consumers index by it. */
function listIssue(
  v: unknown,
  path: string,
  member: (item: unknown, at: string) => ShapeIssue,
  keyOf: (item: Obj) => unknown
): ShapeIssue {
  if (!Array.isArray(v)) return path;
  const seen = new Set<unknown>();
  for (let i = 0; i < v.length; i += 1) {
    const issue = member(v[i], `${path}[${i}]`);
    if (issue) return issue;
    const key = keyOf(v[i] as Obj);
    if (seen.has(key)) return `${path}[${i}]`;
    seen.add(key);
  }
  return null;
}

function protocolApyIssue(v: unknown, path: string): ShapeIssue {
  if (!isObj(v)) return path;
  if (!oneOf(PROTOCOL_IDS, v.protocolId)) return `${path}.protocolId`;
  if (!isFiniteNumber(v.apyPercent)) return `${path}.apyPercent`;
  // `tvlUsd` is display-only and read by nothing that decides; an ABSENT value is accepted
  // like `null` (unknown), so a source that omits it cannot blank every rate (2026-10-19
  // review). A present value must still be a finite number.
  if (v.tvlUsd !== undefined && v.tvlUsd !== null && !isFiniteNumber(v.tvlUsd))
    return `${path}.tvlUsd`;
  if (!oneOf(CHAINS, v.chain)) return `${path}.chain`;
  return dataStampIssue(v.stamp, `${path}.stamp`);
}

function gasQuoteIssue(v: unknown, path: string): ShapeIssue {
  if (!isObj(v)) return path;
  if (!oneOf(CHAINS, v.chain)) return `${path}.chain`;
  if (!isFiniteNumber(v.typicalFeeUsd)) return `${path}.typicalFeeUsd`;
  return dataStampIssue(v.stamp, `${path}.stamp`);
}

function seriesIssue(v: unknown, path: string, valueKey: 'apyPercent' | 'priceUsd'): ShapeIssue {
  if (!isObj(v)) return path;
  if (!oneOf(PROTOCOL_IDS, v.protocolId)) return `${path}.protocolId`;
  if (!Array.isArray(v.points)) return `${path}.points`;
  for (let i = 0; i < v.points.length; i += 1) {
    const p: unknown = v.points[i];
    if (!isObj(p)) return `${path}.points[${i}]`;
    if (!isCalendarDay(p.date)) return `${path}.points[${i}].date`;
    if (!isFiniteNumber(p[valueKey])) return `${path}.points[${i}].${valueKey}`;
  }
  if (!datesAreConsecutiveDays((v.points as Obj[]).map((p) => p.date as string)))
    return `${path}.points`;
  return dataStampIssue(v.stamp, `${path}.stamp`);
}

/** `ProtocolApy[]`, one entry per protocol. */
export const protocolApyListIssue = (v: unknown, path: string): ShapeIssue =>
  listIssue(v, path, protocolApyIssue, (a) => a.protocolId);

/** `GasQuote[]`, one quote per chain. */
export const gasQuoteListIssue = (v: unknown, path: string): ShapeIssue =>
  listIssue(v, path, gasQuoteIssue, (g) => g.chain);

/** `ProtocolApyHistory[]`, one series per protocol. */
export const apyHistoryListIssue = (v: unknown, path: string): ShapeIssue =>
  listIssue(
    v,
    path,
    (s, at) => seriesIssue(s, at, 'apyPercent'),
    (s) => s.protocolId
  );

/** `ProtocolPriceHistory[]`, one series per protocol. */
export const priceHistoryListIssue = (v: unknown, path: string): ShapeIssue =>
  listIssue(
    v,
    path,
    (s, at) => seriesIssue(s, at, 'priceUsd'),
    (s) => s.protocolId
  );
