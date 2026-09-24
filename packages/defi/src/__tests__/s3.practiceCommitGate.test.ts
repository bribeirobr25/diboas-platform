import { describe, expect, it } from 'vitest';

import { legRequiresCurrentRate } from '../catalogueEvidence';
import { strategyRateAvailability } from '../rateAvailability';
import { STRATEGY_CATALOG } from '../catalog';
import { FIXTURE_STAMP } from '../fixtures';
import { observedStamp } from '../testing';
import type { ProtocolApy, ProtocolId, StrategyDef } from '../types';

const NOW = '2026-09-22T00:00:00Z';
const live = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: observedStamp('defillama', '2026-09-20T00:00:00Z'),
});
const stale = (p: ProtocolId): ProtocolApy => ({ ...live(p), stamp: FIXTURE_STAMP });

const accrualOf = (s: StrategyDef) =>
  s.allocation.filter((l) => legRequiresCurrentRate(l.protocolId));

/**
 * `GoalDetailScreen:169` — `approveEntry()` refuses unless `rateAvailable`:
 *
 * ```ts
 * if (!strategy || !canInvest || busy || feeLocal === null || !rateAvailable) return;
 * ```
 *
 * `5.436` deliberately put the refusal on the commit path, not only on the
 * control that opens it. So the availability verdict decides whether a user may
 * commit — **in the simulation**. Practice is simulated: no real money moves,
 * and Real is neither implemented nor authorized. This asserts the evidence
 * question that gate asks, which is what `5.444` changes.
 */
describe('S3 · the Practice simulated commit path follows REQUIRED evidence', () => {
  const HETERO = STRATEGY_CATALOG.filter((s) =>
    s.allocation.some((l) => !legRequiresCurrentRate(l.protocolId))
  );

  it('should REACH the commit when only a NON-REQUIRED market rate is missing', () => {
    /* A market leg owes no rate. Missing one must not refuse a simulated commit. */
    for (const s of HETERO) {
      const onlyAccrual = accrualOf(s).map((l) => live(l.protocolId));
      const rateAvailable = strategyRateAvailability(s, onlyAccrual, NOW).available;
      expect(rateAvailable, `${s.id} must be committable`).toBe(true);
    }
  });

  it('should STILL BLOCK the commit when REQUIRED accrual evidence is missing', () => {
    for (const s of HETERO) {
      const none = strategyRateAvailability(s, [], NOW).available;
      expect(none, `${s.id} with no accrual rate must refuse`).toBe(false);
      const outOfDate = strategyRateAvailability(
        s,
        accrualOf(s).map((l) => stale(l.protocolId)),
        NOW
      ).available;
      expect(outOfDate, `${s.id} with a stale accrual rate must refuse`).toBe(false);
    }
  });

  it('should keep the refusal ADJACENT to the action it refuses', () => {
    /**
     * `5.436`/`5.347`: the commit path itself refuses, not merely the button.
     * Asserted at source so a future edit cannot quietly move the guard to the
     * control alone and leave the money path open.
     */
    const src = new URL(
      '../../../../apps/sandbox/src/components/GoalDetailScreen.tsx',
      import.meta.url
    );
    const code = require('node:fs').readFileSync(src, 'utf8') as string;
    const approve = code.slice(code.indexOf('function approveEntry'));
    expect(approve.slice(0, 400)).toContain('!rateAvailable');
  });
});
