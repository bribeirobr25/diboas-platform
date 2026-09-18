import { describe, expect, it } from 'vitest';
import { DIBOAS_FEE_CATEGORY } from '@diboas/banking';
import { COST_CATEGORIES, isCategoryClaimTruthful, presentedCategory } from '@diboas/defi';
import type { CostCoverage } from '@diboas/defi';

/**
 * The shared cost taxonomy has ONE source of truth.
 *
 * ⚑ THIS TEST LIVES IN THE APP ON PURPOSE. `packages/banking` does not depend
 * on `packages/defi`, so `fees.ts` restates the word `'diboas'` rather than
 * importing `CostCategory`. Pinning them together inside `packages/defi` would
 * have required adding a banking dependency to the evidence package — inverting
 * the package graph to make a test convenient, which is a worse trade than
 * restating one word. The sandbox already depends on both, so the agreement is
 * asserted here, where no graph changes.
 */

describe('cost taxonomy — one authoritative list, no drift', () => {
  it('should keep the banking fee category a member of the shared taxonomy', () => {
    /* Sabotage: change DIBOAS_FEE_CATEGORY to a non-member, or rename the
       member in COST_CATEGORIES, and this fails. */
    expect([...COST_CATEGORIES]).toContain(DIBOAS_FEE_CATEGORY);
  });

  it('should classify by economic OWNER, not by historical label', () => {
    /* FE-1's ramp/exit fees are diBoaS's own revenue → `diboas`. A third-party
       ramp cost charged through later is `provider`, despite carrying the same
       "ramp" label in the schedule — so the two must stay distinguishable. */
    expect(DIBOAS_FEE_CATEGORY).toBe('diboas');
    expect([...COST_CATEGORIES]).toContain('provider');
    expect(DIBOAS_FEE_CATEGORY).not.toBe('provider');
  });

  it('should refuse to present a bundled cost as one of its parts (canon §9)', () => {
    /* The rule stated at the app boundary, where costs are actually rendered:
       `network + protocol + provider ≠ network`. */
    const bundled: CostCoverage = {
      kind: 'aggregate',
      categories: ['network', 'protocol', 'provider'],
    };
    expect(presentedCategory(bundled)).toBe('other');
    expect(isCategoryClaimTruthful(bundled, 'network')).toBe(false);

    const networkOnly: CostCoverage = { kind: 'single', category: 'network' };
    expect(isCategoryClaimTruthful(networkOnly, 'network')).toBe(true);
    expect(isCategoryClaimTruthful(networkOnly, DIBOAS_FEE_CATEGORY)).toBe(false);
  });
});
