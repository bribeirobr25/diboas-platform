// @vitest-environment happy-dom
/**
 * S1a PR-2 · every decision's outcome agrees with the label PR-1 wrote by hand from reading the
 * old code (plan P12 §4.1, §4.4, D4). The characterization cases run again through the harness;
 * each decision a case calls is recorded; the FIRST one (a case that calls twice labels its first
 * call) must say what the label says:
 *   `emitted` → appended events, with exactly the label's notes;
 *   `effect`  → nothing appended, at least one effect (the decline);
 *   `noop:<reason>` → nothing appended, that reason.
 * `throw` labels are not checked here: a throw may come from the decision or from the adapter
 * after it, and the characterization suite already pins the throw itself. Row 9 (`advanceTime`)
 * has no decision until PR-3; previews, the core seams and the walk are not commands.
 */
import { describe, expect, it, vi } from 'vitest';
import { runCase, type CaseDef } from './characterization/harness';
import { journeyCases } from './characterization/cases/journey';
import { rulesCreditsSimCases } from './characterization/cases/rulesCreditsSim';
import { lazyReadCases } from './characterization/cases/lazyRead';

vi.mock('@/lib/ids', () => import('./characterization/mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) =>
  import('./characterization/mocks').then((m) => m.banking(orig as never))
);

type Recorded = {
  name: string;
  outcome: { kind: string; reason?: string; notes?: readonly string[] };
  append: unknown;
  effects: readonly unknown[];
};
const KEY = '__decideCalls';
const calls = () => ((globalThis as Record<string, unknown>)[KEY] ??= []) as Recorded[];

async function recording<T extends Record<string, unknown>>(importOriginal: () => Promise<T>) {
  const actual = await importOriginal();
  const wrapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(actual)) {
    wrapped[name] =
      typeof value === 'function' && name.startsWith('decide')
        ? (...args: unknown[]) => {
            const decision = (value as (...a: unknown[]) => Recorded)(...args);
            calls().push({ ...decision, name });
            return decision;
          }
        : value;
  }
  return wrapped as T;
}
vi.mock('@/lib/ledger/decide/journey', (orig) => recording(orig as never));
vi.mock('@/lib/ledger/decide/rules', (orig) => recording(orig as never));
vi.mock('@/lib/ledger/decide/credits', (orig) => recording(orig as never));
vi.mock('@/lib/ledger/decide/simEvents', (orig) => recording(orig as never));

const checked = (cases: readonly CaseDef[]) =>
  cases.filter((c) => typeof c.row === 'number' && c.row !== 9 && c.label.expected !== 'throw');

describe('S1a PR-2 · decisions agree with the hand-written labels', () => {
  const all = [
    ...checked(journeyCases),
    ...checked(rulesCreditsSimCases),
    ...checked(lazyReadCases),
  ];

  it('should check a case for every split row (non-vacuity)', () => {
    const rows = new Set(all.map((c) => c.row));
    for (const row of [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
      expect(rows.has(row), `row ${row}`).toBe(true);
  });

  it.each(all.map((c) => [c.id, c] as const))(
    'should decide what the label says when case %s runs',
    async (_id, def) => {
      (globalThis as Record<string, unknown>)[KEY] = [];
      await runCase(def);
      const first = calls()[0];
      expect(first, `a decision was made in ${def.id}`).toBeDefined();
      const [kind, reason] = def.label.expected.split(':');
      if (kind === 'emitted') {
        expect(first!.outcome.kind).toBe('emitted');
        expect(first!.append).not.toBeNull();
        expect([...(first!.outcome.notes ?? [])]).toEqual([...(def.label.notes ?? [])]);
      } else if (kind === 'effect') {
        expect(first!.outcome.kind).toBe('emitted');
        expect(first!.append).toBeNull();
        expect(first!.effects.length).toBeGreaterThan(0);
      } else {
        expect(first!.outcome).toEqual({ kind: 'noop', reason });
      }
    }
  );
});
