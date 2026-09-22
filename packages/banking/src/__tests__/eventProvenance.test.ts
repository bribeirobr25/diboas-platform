import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { entryNetworkFeeOf, exitFeesOf } from '../ledger/events';
import type { StrategyEnteredV2, StrategyExitedV2 } from '../ledger/events';

/**
 * EVENT-LEVEL EVIDENCE PROVENANCE (Founder determination 2026-09-22).
 *
 * `methodologyId` / `methodologyVersion` / `evidenceSnapshotVersion` ride on the
 * committed entry/exit events so a decision stays reconstructable after its
 * evidence row is lawfully purged at 90 days. The rules that matter are what
 * must NOT happen: no default synthesis, no reinterpretation of old events, no
 * replay dependency.
 */

const base = {
  eventId: 'e1',
  simDay: 0,
  recordedAt: '2026-09-22T00:00:00.000Z',
  correlationId: 'c1',
  type: 'StrategyEntered' as const,
  goalId: 'g1',
  positionId: 'p1',
  strategyId: 'safeHarbor',
  amount: '500.00',
};

describe('event provenance is optional, and absence means UNRECORDED', () => {
  it('should read the committed fee whether or not provenance is present', () => {
    const without = { ...base, schemaVersion: 2, modeledNetworkFee: '0.03' } as StrategyEnteredV2;
    const with_ = {
      ...base,
      schemaVersion: 2,
      modeledNetworkFee: '0.03',
      methodologyId: 'arb-usdc-strategy-entry',
      methodologyVersion: '1',
      evidenceSnapshotVersion: '7',
    } as StrategyEnteredV2;
    expect(entryNetworkFeeOf(without)).toBe('0.03');
    expect(entryNetworkFeeOf(with_)).toBe('0.03');
  });

  it('should declare all three fields as OPTIONAL in the type itself', () => {
    /**
     * ⚑ Asserted on the SOURCE. A sabotage proved the runtime test vacuous:
     * making the fields REQUIRED did not fail anything, because every fixture
     * here uses an `as StrategyEnteredV2` cast and a cast silently satisfies a
     * required field. The runtime check below still matters for the default
     * rule; THIS check is what makes optionality real.
     *
     * The compile-time half is the literal beneath it: a no-cast assignment
     * that `pnpm -w type-check` rejects the moment a `?` is removed.
     */
    const code = readFileSync(join(process.cwd(), 'src/ledger/events.ts'), 'utf8');
    for (const field of ['methodologyId', 'methodologyVersion', 'evidenceSnapshotVersion']) {
      expect(code, `${field} must stay optional — required would force synthesis`).toContain(
        `${field}?: string;`
      );
      expect(code).not.toContain(`${field}: string;`);
    }
  });

  it('should type-check a pre-change event with NO provenance and NO cast', () => {
    /* No `as`: if any field became required this line stops compiling, which is
       the guarantee the cast-based fixtures cannot give. */
    const legacy: StrategyEnteredV2 = {
      ...base,
      schemaVersion: 2,
      modeledNetworkFee: '0.03',
    };
    expect(entryNetworkFeeOf(legacy)).toBe('0.03');
  });

  it('should leave the fields UNDEFINED on a pre-change event — never defaulted', () => {
    /**
     * The whole point. A default ('', '0', 'unknown') would be a claim about
     * how a historical fee was derived that nobody ever recorded — the
     * MISSING != 0 rule applied to provenance.
     */
    const legacy = { ...base, schemaVersion: 2, modeledNetworkFee: '0.03' } as StrategyEnteredV2;
    expect(legacy.methodologyId).toBeUndefined();
    expect(legacy.methodologyVersion).toBeUndefined();
    expect(legacy.evidenceSnapshotVersion).toBeUndefined();
    expect('methodologyId' in legacy).toBe(false);
  });

  it('should carry the same three fields on the EXIT event', () => {
    const exit = {
      ...base,
      type: 'StrategyExited' as const,
      schemaVersion: 2,
      modeledExitFee: '0.25',
      modeledNetworkFee: '0.03',
      grossAmount: '505.00',
      methodologyId: 'arb-usdc-strategy-entry',
      methodologyVersion: '1',
      evidenceSnapshotVersion: '7',
    } as unknown as StrategyExitedV2;
    expect(exitFeesOf(exit)).toEqual({ exitFee: '0.25', networkFee: '0.03' });
    expect(exit.evidenceSnapshotVersion).toBe('7');
  });
});

describe('what event provenance must NOT do', () => {
  const src = () =>
    readFileSync(join(process.cwd(), 'src/ledger/events.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

  it('should not bump schemaVersion merely because optional fields were added', () => {
    /* V1 -> V2 discriminated a RENAME, which changed an existing field's
       meaning. Optional additions change none, so a V3 would be churn that
       forces every reader to branch for nothing. */
    const code = src();
    expect(code).toContain('schemaVersion: 2;');
    expect(code, 'a V3 would mean an optional addition was treated as a rename').not.toContain(
      'schemaVersion: 3'
    );
  });

  it('should not make the projection depend on provenance', () => {
    /* Replay reads the committed fee, never the versions. If the projection
       ever read them, a purged snapshot version would change history. */
    const projection = readFileSync(join(process.cwd(), 'src/ledger/projection/core.ts'), 'utf8');
    for (const field of ['methodologyId', 'methodologyVersion', 'evidenceSnapshotVersion']) {
      expect(
        projection,
        `${field} in the projection would couple replay to provenance`
      ).not.toContain(field);
    }
  });

  it('should not synthesise a provenance default anywhere in the ledger', () => {
    const code = src();
    for (const synth of [
      "methodologyId ?? '",
      "methodologyVersion ?? '",
      "evidenceSnapshotVersion ?? '",
      'methodologyId ||',
      'evidenceSnapshotVersion ||',
    ]) {
      expect(code, `${synth} would invent provenance nobody recorded`).not.toContain(synth);
    }
  });
});
