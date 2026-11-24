import { describe, expect, it } from 'vitest';
import { applyDecision } from '@/lib/ledger/applyDecision';
import type { Decision, Effect } from '@/lib/ledger/decide/types';

/**
 * S1a PR-2 · the adapter's one writer refuses an effect it does not know (plan P12 D6). The
 * `never` check makes a new effect type a compile error; this pins the runtime half, so an effect
 * smuggled past the types (a cast, stale data from a server) fails loudly instead of being dropped.
 */
describe('applyDecision · an unknown effect', () => {
  it('should throw rather than drop the effect when its type is not handled', () => {
    const decision: Decision<number> = {
      result: 1,
      outcome: { kind: 'emitted' },
      append: null,
      effects: [{ type: 'SomethingNew' } as unknown as Effect],
    };
    expect(() => applyDecision(decision)).toThrow(/Unhandled ledger effect/);
  });

  it('should return the result and touch nothing when a decision has no events and no effects', () => {
    const decision: Decision<string> = {
      result: 'r',
      outcome: { kind: 'emitted' },
      append: null,
      effects: [],
    };
    expect(applyDecision(decision)).toBe('r');
  });
});
