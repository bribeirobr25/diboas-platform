/**
 * ⛑ LEDGER-CHAR-1 · the recorder behind the characterization harness (plan P12 §4.1, D11).
 *
 * Everything a ledger command touches is observed here as ONE ordered timeline: id draws,
 * clock reads, projections, appends, notifications, side-store writes and console output.
 * The state lives on `globalThis` because every case runs after `vi.resetModules()`: a
 * module-level recorder would be a fresh, empty copy inside each re-imported mock.
 *
 * This file never writes to disk (a source scan enforces it, `controls.test.ts`); goldens are
 * written only by the update setup (`scripts/characterization/updateSetup.ts`), which the normal config never loads.
 */

export type TimelineEntry = readonly [kind: string, ...detail: unknown[]];

interface RecorderState {
  /** Record the timeline only while a command runs (not while the harness seeds or reads). */
  armed: boolean;
  timeline: TimelineEntry[];
  idCounter: number;
  clockIndex: number;
  clockMode: 'fixed' | 'advancing';
  /** Throw once, on the next projection (the take-back path, sabotage (k), (y)). */
  faultOnce: boolean;
  /** Reject the store's next `append` once (a persist failure that reaches the core). */
  storeFailOnce: boolean;
}

const KEY = '__ledgerCharacterizationRecorder';

export function recorder(): RecorderState {
  const g = globalThis as unknown as Record<string, RecorderState | undefined>;
  g[KEY] ??= {
    armed: false,
    timeline: [],
    idCounter: 0,
    clockIndex: 0,
    clockMode: 'fixed',
    faultOnce: false,
    storeFailOnce: false,
  };
  return g[KEY]!;
}

export function record(...entry: TimelineEntry): void {
  const r = recorder();
  if (r.armed) r.timeline.push(entry);
}

/* ── ids ─────────────────────────────────────────────────────────────────────────── */

/** Prefixed so no fixture can collide: the store silently drops a duplicate `eventId`. */
export const ID_PREFIX = 'char-id-';

export function nextId(): string {
  const r = recorder();
  r.idCounter += 1;
  const id = `${ID_PREFIX}${r.idCounter}`;
  record('id', id);
  return id;
}

/* ── the clock ───────────────────────────────────────────────────────────────────── */

/** The advancing clock starts 2 ms before a month boundary, so a stamp that drifts shows. */
export const CLOCK_START_MS = Date.UTC(2026, 9, 31, 23, 59, 59, 998);
const RealDate: DateConstructor = globalThis.Date;

function nextInstantMs(): number {
  const r = recorder();
  const ms = r.clockMode === 'fixed' ? CLOCK_START_MS : CLOCK_START_MS + r.clockIndex;
  r.clockIndex += 1;
  record('clock', new RealDate(ms).toISOString());
  return ms;
}

/**
 * A `Date` that advances only on a CLOCK READ (`new Date()` with no argument, `Date.now()`).
 * `new Date(string)` and `Date.parse` are date arithmetic and pass straight through, so
 * `advanceTime`'s epoch maths is never mistaken for a read.
 */
class CharacterizationDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(nextInstantMs());
    else super(...(args as [string | number | Date]));
  }

  static override now(): number {
    return nextInstantMs();
  }
}

export function installClock(): void {
  globalThis.Date = CharacterizationDate as unknown as DateConstructor;
}

export function uninstallClock(): void {
  globalThis.Date = RealDate;
}

/* ── encoding ────────────────────────────────────────────────────────────────────── */

/**
 * The roadmap's tagged encoding (plan §4.2): plain JSON would turn `NaN` into `null` and drop
 * an `undefined` key, so a value the caller passed through (`horizonMonths`, a split percent)
 * could change without the golden noticing. Key order is the object's own (insertion) order,
 * so an event whose fields are written in a different order shows.
 */
export function encode(value: unknown): string {
  return JSON.stringify(value, tagged, 2);
}

function tagged(this: unknown, _key: string, value: unknown): unknown {
  if (value === undefined) return { $undefined: true };
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { $number: 'NaN' };
    if (value === Infinity) return { $number: 'Infinity' };
    if (value === -Infinity) return { $number: '-Infinity' };
    if (Object.is(value, -0)) return { $number: '-0' };
  }
  if (typeof value === 'function') return { $function: value.name || 'anonymous' };
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (value instanceof Set) return { $set: [...value] };
  if (value instanceof Map) return { $map: [...value.entries()] };
  return value;
}

/** A deep, encoded copy: what a value looked like at this moment. */
export function snapshot(value: unknown): unknown {
  return JSON.parse(encode(value));
}

/* ── errors ──────────────────────────────────────────────────────────────────────── */

const NATIVE = new Set(['TypeError', 'RangeError', 'SyntaxError', 'ReferenceError']);

/**
 * Errors our code throws keep name and message. Native errors keep their name and their
 * place in the timeline only: V8's message text differs between Node versions, and a file or
 * line would move with every refactored line (plan §4.1, final check H1).
 */
export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return NATIVE.has(error.name)
      ? { name: error.name, native: true }
      : { name: error.name, message: error.message };
  }
  return { thrown: snapshot(error) };
}

/** Console arguments, with stacks removed (they carry file and line, which a refactor moves). */
export function normalizeLog(args: unknown[]): unknown {
  return JSON.parse(
    JSON.stringify(args, function (key, value: unknown) {
      if (key === 'stack') return '<stack>';
      if (value instanceof Error) return describeError(value);
      return tagged.call(this, key, value);
    })
  );
}

/* ── canonical form (D11; compared from PR-3's commit B) ─────────────────────────── */

const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g;

/**
 * Ids renamed by the order they were drawn, instants by the order their DISTINCT values were
 * read from the clock. Equal instants stay equal, so collapsing a command's stamps into one
 * still shows (sabotage (h)); an id drawn in a different order still shows (sabotage (e)).
 */
export function canonicalize(text: string, timeline: readonly TimelineEntry[]): string {
  const ids = new Map<string, string>();
  const instants = new Map<string, string>();
  for (const [kind, detail] of timeline) {
    if (kind === 'id' && typeof detail === 'string' && !ids.has(detail))
      ids.set(detail, `id#${ids.size + 1}`);
    if (kind === 'clock' && typeof detail === 'string' && !instants.has(detail))
      instants.set(detail, `t#${instants.size + 1}`);
  }
  const idPattern = new RegExp(`${ID_PREFIX}\\d+`, 'g');
  return text
    .replace(idPattern, (id) => ids.get(id) ?? id)
    .replace(ISO, (iso) => instants.get(iso) ?? iso);
}
