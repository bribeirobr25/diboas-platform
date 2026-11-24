/**
 * ⛑ LEDGER-CHAR-1 · compares each case with its golden (plan P12 §4.2, D11).
 *
 * EXACT mode (S1a): the encoded observation must equal the golden byte for byte, in both clock
 * modes; the three time zones must agree with each other; the golden's hash must equal the
 * manifest's; no case may be missing or extra; and NO golden may carry a regeneration marker,
 * because S1a changes no behaviour (until PR-3's commit B switches to canonical mode).
 *
 * This file never writes. In an update run (`pnpm --filter sandbox char:update`) the update
 * setup installs `__charSink`, and observations go to it instead of being compared.
 */
import { createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import type { CaseDef, Observation } from './harness';
import { runCase } from './harness';
import { canonicalize, encode } from './recorder';

export type Golden = Record<string, { fixed: unknown; advancing: unknown }>;
export interface ManifestEntry {
  row: number | 'preview' | 'walk';
  exact: string;
  canonical: string;
  pinnedDefect?: string;
  regenerationRegisterId?: string;
}
export type Manifest = Record<string, Record<string, ManifestEntry>>;

interface Sink {
  collect(family: string, def: CaseDef, fixed: Observation, advancing: Observation): void;
  done(family: string): void;
}

const MODES = ['fixed', 'advancing'] as const;
const ZONES = ['UTC', 'America/Sao_Paulo', 'Europe/Berlin'] as const;

export const sha = (text: string) => createHash('sha256').update(text).digest('hex');

/** The exact and canonical hashes of one case, as the update run stores them. */
export function hashes(fixed: Observation, advancing: Observation) {
  const text = encode({ fixed, advancing });
  const canonical =
    canonicalize(encode(fixed), fixed.timeline) +
    canonicalize(encode(advancing), advancing.timeline);
  return { exact: sha(text), canonical: sha(canonical) };
}

/** What the recording shows: a throw, an append, a side-store write only, or nothing. */
export function labelOf(o: Observation): string {
  const result = o.result as { throw?: unknown };
  if (result.throw) return 'throw';
  if (
    o.timeline.some(
      ([kind, detail]) => kind === 'append' || (kind === 'count' && detail === 'append')
    )
  )
    return 'emitted';
  if (
    o.timeline.some(
      ([kind, key]) => kind === 'storage.set' && !String(key).startsWith('diboas-ledger')
    )
  )
    return 'effect';
  return 'noop';
}

/** `noop:<reason>` is a noop; the reason is checked against PR-2's decisions, not here. */
const labelKind = (expected: string) => expected.split(':')[0];

async function observe(def: CaseDef, mode: (typeof MODES)[number]): Promise<Observation> {
  const original = process.env.TZ;
  try {
    let first: Observation | null = null;
    for (const zone of ZONES) {
      process.env.TZ = zone;
      const observation = await runCase({ ...def, clockMode: mode });
      if (!first) first = observation;
      // No command may depend on the machine's time zone.
      else expect(encode(observation), `${def.id} ${mode} in ${zone}`).toBe(encode(first));
    }
    return first!;
  } finally {
    process.env.TZ = original;
  }
}

export function characterize(
  family: string,
  cases: readonly CaseDef[],
  golden: Golden,
  manifest: Manifest,
  options: { timeoutMs?: number } = {}
): void {
  const sink = (globalThis as Record<string, unknown>).__charSink as Sink | undefined;
  const entries = manifest[family] ?? {};

  describe(`LEDGER-CHAR-1 · ${family}`, () => {
    if (sink) afterAll(() => sink.done(family));

    it(`should hold exactly one golden and one manifest entry per case in ${family}`, () => {
      if (sink) return;
      const ids = cases.map((c) => c.id);
      expect(new Set(ids).size, 'case ids are unique').toBe(ids.length);
      expect(Object.keys(golden).sort()).toEqual([...ids].sort());
      expect(Object.keys(entries).sort()).toEqual([...ids].sort());
    });

    it(`should carry no regeneration marker in exact mode in ${family}`, () => {
      if (sink) return;
      const marked = Object.entries(entries)
        .filter(([, e]) => e.regenerationRegisterId !== undefined)
        .map(([id]) => id);
      expect(marked).toEqual([]);
    });

    for (const def of cases) {
      it(
        `should behave exactly as recorded when ${family} case ${def.id} runs`,
        async () => {
          const fixed = await observe(def, 'fixed');
          const advancing = await observe(def, 'advancing');
          if (sink) {
            sink.collect(family, def, fixed, advancing);
            return;
          }
          // The hand-written label agrees with what today's code did (plan §4.1).
          expect(labelOf(fixed), `label of ${def.id}`).toBe(labelKind(def.label.expected));
          const recorded = golden[def.id];
          expect(recorded, `golden for ${def.id}`).toBeDefined();
          // The golden itself is unedited: its hash is the one recorded with it.
          expect(sha(encode(recorded)), `manifest hash of ${def.id}`).toBe(entries[def.id]?.exact);
          expect(entries[def.id]?.row).toBe(def.row);
          expect(entries[def.id]?.pinnedDefect).toBe(def.pinnedDefect);
          expect(encode(fixed)).toBe(encode(recorded.fixed));
          expect(encode(advancing)).toBe(encode(recorded.advancing));
        },
        options.timeoutMs ?? 5000
      );
    }
  });
}
