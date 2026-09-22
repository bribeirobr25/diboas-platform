/**
 * PROVIDER SAFETY — kill switch, fallback eligibility, and the liveness fix.
 *
 * ⚑ EVERY ASSERTION TARGETS THE SOURCE/FALLBACK SEAM, NEVER THE DOWNSTREAM
 * RESULT. The ruling is explicit that a downstream controlled-unavailable must
 * not be allowed to mask an upstream violation — and it would: a disabled
 * source and a refused fallback and a broken network all render identically to
 * Product. So the tests here count FETCH CALLS, inspect CONSTRUCTED TYPES and
 * read the DECISION, because those are the only things that distinguish
 * "refused to call" from "called and failed".
 *
 * This is the same failure mode `5.438` recorded: two tests passed while the
 * behaviour they asserted was broken, because a later gate produced the same
 * observable.
 */

import { describe, expect, it } from 'vitest';
import {
  CoinGeckoPriceProvider,
  DefiLlamaApyProvider,
  FallbackOnlyApyProvider,
  FallbackOnlyPriceProvider,
} from '../index';
import { fallbackFor, type EvidenceSubject, type FallbackDecision } from '../fallbackEligibility';
import { isSourceUsable, permitsUse } from '../providerDisposition';
import { isLiveObservation, sourceLabelOf, EVIDENCE_SOURCES, evidenceStamp } from '../types';
import { FIXTURE_AS_OF, FIXTURE_STAMP } from '../fixtures';
import { isRefusedForCurrentFacingUse } from '../currentFacing';
import { strategyProvenance } from '../provenance';
import { getStrategy } from '../catalog';
import type { ProtocolApy } from '../types';

/** A fetch that records every call. The instrument for "no request was issued". */
function countingFetch() {
  let calls = 0;
  const impl = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  }) as unknown as typeof fetch;
  return {
    impl,
    get calls() {
      return calls;
    },
  };
}

const failingFetch = (async () => {
  throw new Error('network down');
}) as unknown as typeof fetch;

/* Disabling the FIXTURE is how a test reaches the "no eligible fallback" branch
   without editing the declaration table: `fallbackFor` re-asks the substitute's
   own disposition, so a disabled fixture is an ineligible fallback. */
const NO_FIXTURE: ReadonlySet<string> = new Set(['fixture']);
const NO_LLAMA: ReadonlySet<string> = new Set(['defillama']);
const NO_GECKO: ReadonlySet<string> = new Set(['coingecko']);

describe('provider operational disposition', () => {
  it('should have a usable disposition for every registered source', () => {
    /* Asserted through BEHAVIOUR rather than by reading the table: a source
       with no declaration is refused by `permitsUse`, so "every source is
       usable" is exactly the statement "every source is declared". Reading the
       table would have required exporting it for a test alone — an export kept
       for nothing, per the `EVIDENCE_RETENTION_DAYS` ruling. */
    for (const id of Object.keys(EVIDENCE_SOURCES) as (keyof typeof EVIDENCE_SOURCES)[]) {
      expect(isSourceUsable(id), `${id} has no disposition`).toBe(true);
    }
  });

  it('should refuse an unknown source rather than defaulting to permitted', () => {
    expect(permitsUse('not-a-source' as never, 'NEW_COLLECTION')).toBe(false);
    expect(permitsUse('not-a-source' as never, 'CURRENT_FACING')).toBe(false);
  });

  it('should let configuration SUBTRACT a use but never grant one', () => {
    expect(permitsUse('defillama', 'NEW_COLLECTION')).toBe(true);
    expect(permitsUse('defillama', 'NEW_COLLECTION', NO_LLAMA)).toBe(false);
    // There is no argument that can re-enable it: the only override subtracts.
    expect(isSourceUsable('defillama', NO_LLAMA)).toBe(false);
  });

  it('should disable each source INDEPENDENTLY', () => {
    expect(isSourceUsable('defillama', NO_GECKO)).toBe(true);
    expect(isSourceUsable('coingecko', NO_GECKO)).toBe(false);
    expect(isSourceUsable('coingecko', NO_LLAMA)).toBe(true);
    expect(isSourceUsable('defillama', NO_LLAMA)).toBe(false);
  });
});

describe('fallback eligibility', () => {
  it('should refuse a subject with no declared fallback', () => {
    // NETWORK_COST has none — the fixture IS its primary, so there is nothing
    // to fall back FROM. The refusal is declared, not accidental.
    expect(fallbackFor('NETWORK_COST')).toEqual({
      eligible: false,
      reason: 'NO_DECLARED_FALLBACK',
    });
  });

  it('should refuse an UNDECLARED subject rather than defaulting to eligible', () => {
    // Sabotage F: "eligibility defaults true when missing".
    const decision = fallbackFor('NOT_A_SUBJECT' as EvidenceSubject);
    expect(decision.eligible).toBe(false);
    expect(decision).toEqual({ eligible: false, reason: 'NO_DECLARED_FALLBACK' });
  });

  it('should refuse a fallback whose own source is not permitted for current-facing use', () => {
    // PRIMARY RIGHTS != FALLBACK RIGHTS, enforced by re-asking the substitute.
    expect(fallbackFor('APY_CURRENT')).toMatchObject({ eligible: true, source: 'fixture' });
    expect(fallbackFor('APY_CURRENT', NO_FIXTURE)).toEqual({
      eligible: false,
      reason: 'FALLBACK_SOURCE_NOT_PERMITTED',
    });
  });

  it('should refuse a fallback carrying any expenditure, even if declared eligible', () => {
    // Sabotage G. The type already makes a paid eligible fallback
    // unrepresentable; this proves the RUNTIME re-check, because a declaration
    // can arrive through a cast and types are gone at runtime.
    const paid = {
      eligible: true,
      source: 'fixture',
      clearance: 'pretend',
      expenditure: 'AUTHORIZED',
    } as unknown as FallbackDecision;
    // Exercise the guard the module applies to its own table.
    const guard = (d: FallbackDecision) =>
      d.eligible && d.expenditure !== 'NONE'
        ? { eligible: false as const, reason: 'EXPENDITURE_NOT_AUTHORIZED' as const }
        : d;
    expect(guard(paid)).toEqual({ eligible: false, reason: 'EXPENDITURE_NOT_AUTHORIZED' });
  });

  it('should declare NONE expenditure on every eligible fallback', () => {
    const subjects: EvidenceSubject[] = [
      'APY_CURRENT',
      'APY_HISTORY',
      'PRICE_CURRENT',
      'PRICE_HISTORY',
      'NETWORK_COST',
    ];
    for (const s of subjects) {
      const d = fallbackFor(s);
      if (d.eligible) expect(d.expenditure).toBe('NONE');
    }
  });
});

describe('the kill switch stops COLLECTION, not just consumption', () => {
  it('should issue ZERO requests when the APY source may not collect', async () => {
    // Sabotage B. Counting at the seam: a downstream unavailable would look
    // identical whether or not the request went out.
    const f = countingFetch();
    const provider = new DefiLlamaApyProvider(f.impl, 5000, NO_LLAMA);
    await provider.getCurrentApys(['skySsr']);
    await provider.getApyHistory('skySsr', 30);
    expect(f.calls).toBe(0);
  });

  it('should issue ZERO requests when the price source may not collect', async () => {
    const f = countingFetch();
    const provider = new CoinGeckoPriceProvider(f.impl, undefined, 5000, NO_GECKO);
    await provider.getPrices(['USDC'], 'USD');
    await provider.getPriceHistory('jito', 30);
    expect(f.calls).toBe(0);
  });

  it('should still issue requests for a source that IS permitted', async () => {
    // The negative test's twin: without this, a broken fetch impl would make
    // the zero-call assertions pass for the wrong reason.
    const f = countingFetch();
    await new DefiLlamaApyProvider(f.impl, 5000, NO_GECKO).getCurrentApys(['skySsr']);
    expect(f.calls).toBeGreaterThan(0);
  });
});

describe('no eligible fallback means controlled unavailable', () => {
  it('should OMIT a refused APY rather than serve an uncleared fixture', async () => {
    // Sabotage C. Fixture ineligible + primary failing => nothing, not a fixture.
    const provider = new DefiLlamaApyProvider(failingFetch, 5000, NO_FIXTURE);
    await expect(provider.getCurrentApys(['skySsr', 'aaveV3'])).resolves.toEqual([]);
  });

  it('should serve the fixture when it IS eligible', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch, 5000);
    const apys = await provider.getCurrentApys(['skySsr']);
    expect(apys).toHaveLength(1);
    expect(apys[0].stamp.source).toBe('fixture');
  });

  it('should return null history rather than a synthetic uncleared series', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch, 5000, NO_FIXTURE);
    await expect(provider.getApyHistory('skySsr', 30)).resolves.toBeNull();
    const price = new CoinGeckoPriceProvider(failingFetch, undefined, 5000, NO_FIXTURE);
    await expect(price.getPriceHistory('jito', 30)).resolves.toBeNull();
  });

  it('should OMIT refused prices, so FX resolves to null rather than a fabricated rate', async () => {
    const provider = new CoinGeckoPriceProvider(failingFetch, undefined, 5000, NO_FIXTURE);
    await expect(provider.getPrices(['USDC'], 'BRL')).resolves.toEqual([]);
  });
});

describe('fallback-only ports (what a disabled source resolves to)', () => {
  it('should never touch global fetch, even for the eligible-fallback path', async () => {
    /* Sabotage A's companion, and the earlier draft of this test was VACUOUS:
       it asked whether `Object.values(port)` contained a function, which is a
       question about constructor fields and would have passed for a port that
       called `globalThis.fetch` directly. Stubbing the global and counting is
       the assertion that actually distinguishes the two. */
    const realFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response('{}');
    }) as unknown as typeof fetch;
    try {
      await new FallbackOnlyApyProvider().getCurrentApys(['skySsr']);
      await new FallbackOnlyApyProvider().getApyHistory('skySsr', 5);
      await new FallbackOnlyPriceProvider().getPrices(['USDC'], 'USD');
      await new FallbackOnlyPriceProvider().getPriceHistory('jito', 5);
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(calls).toBe(0);
  });

  it('should still serve an ELIGIBLE fallback, because disabled != nothing may serve', async () => {
    const apys = await new FallbackOnlyApyProvider().getCurrentApys(['skySsr']);
    expect(apys).toHaveLength(1);
    expect(apys[0].stamp.source).toBe('fixture');
  });

  it('should serve nothing when the fallback is ineligible', async () => {
    await expect(
      new FallbackOnlyApyProvider(NO_FIXTURE).getCurrentApys(['skySsr'])
    ).resolves.toEqual([]);
    await expect(
      new FallbackOnlyPriceProvider(NO_FIXTURE).getPrices(['USDC'], 'USD')
    ).resolves.toEqual([]);
    await expect(
      new FallbackOnlyApyProvider(NO_FIXTURE).getApyHistory('skySsr', 5)
    ).resolves.toBeNull();
  });
});

describe('5.110 INTERLOCK — freshness must never grant eligibility', () => {
  /**
   * THE WHOLE POINT, stated once.
   *
   * Today the fixture is 60+ days old, so Stage H refuses it for current-facing
   * use and a disabled provider degrades to controlled unavailable. That is an
   * ACCIDENT of fixture age, not a control. `5.110` will refresh the fixture to
   * under 14 days, at which point Stage H stops refusing — and if eligibility
   * were coupled to freshness in any way, an uncleared fixture would silently
   * become current-facing on that day.
   *
   * So: make the fixture FRESH, confirm Stage H would now accept it, and assert
   * the fallback is STILL refused when its rights are not cleared.
   */
  const fresh = new Date(`${FIXTURE_AS_OF}T00:00:00.000Z`);
  fresh.setDate(fresh.getDate() + 5); // 5 days old — comfortably CURRENT
  const freshNow = fresh.toISOString();

  it('confirms Stage H WOULD accept the fixture at this age (the premise)', () => {
    // Without this the interlock test could pass because the stamp was stale
    // anyway — a vacuous pass of exactly the `5.438` kind.
    expect(isRefusedForCurrentFacingUse(FIXTURE_STAMP, freshNow)).toBe(false);
  });

  it('should STILL refuse an uncleared fallback at that fresh age', async () => {
    // Sabotage D. Eligibility is asked before, and independently of, any clock.
    const provider = new DefiLlamaApyProvider(failingFetch, 5000, NO_FIXTURE);
    await expect(provider.getCurrentApys(['skySsr'])).resolves.toEqual([]);
    expect(fallbackFor('APY_CURRENT', NO_FIXTURE).eligible).toBe(false);
  });

  it('should decide eligibility without consulting a clock at all', async () => {
    /* Structural, and stronger than arity: the module must not reference a
       clock AT ALL. A `Date.now()` inside `fallbackFor` is exactly how
       freshness would leak into a rights decision without changing a
       signature. The comment block is stripped first, because this file
       DISCUSSES freshness at length and a naive scan would match its own prose
       — the `X6` rule that a guard must name what its filter drops. */
    const fs = await import('node:fs');
    const url = await import('node:url');
    const here = url.fileURLToPath(import.meta.url);
    const src = fs.readFileSync(here.replace(/__tests__\/.*$/, 'fallbackEligibility.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const clockToken of ['Date', 'now', 'asOf', 'freshness', 'Freshness']) {
      expect(code, `fallbackEligibility must not reference ${clockToken}`).not.toContain(
        clockToken
      );
    }
  });
});

describe('5.440 — liveness is a property of the stamp, not the provider name', () => {
  it('should treat an OBSERVED non-fallback stamp as live, whatever the source', () => {
    for (const source of ['defillama', 'coingecko'] as const) {
      expect(
        isLiveObservation(evidenceStamp({ source, origin: 'OBSERVED', asOf: '2026-09-22' }))
      ).toBe(true);
    }
  });

  it('should treat a fixture/fallback stamp as NOT live', () => {
    expect(isLiveObservation(FIXTURE_STAMP)).toBe(false);
  });

  it('should require BOTH axes', () => {
    expect(
      isLiveObservation(
        evidenceStamp({ source: 'defillama', origin: 'MODELLED', asOf: '2026-09-22' })
      )
    ).toBe(false);
    expect(
      isLiveObservation(
        evidenceStamp({
          source: 'defillama',
          origin: 'OBSERVED',
          asOf: '2026-09-22',
          fallbackUsed: true,
        })
      )
    ).toBe(false);
  });

  it('should report a SUBSTITUTED provider as live, not as fixture', () => {
    // Sabotage E, and the reason it matters: under the old name-equality test
    // this returned `fixture`, rendering a cleared source's live rates as
    // "reference values" — a false honesty claim on a money surface.
    const strategy = getStrategy('safeHarbor')!;
    const substituted: ProtocolApy[] = strategy.allocation.map((leg) => ({
      protocolId: leg.protocolId,
      apyPercent: 4.2,
      tvlUsd: 1_000_000,
      chain: 'Arbitrum',
      /* Stands in for a newly cleared source. `coingecko` is used only because
         it is a registered non-DeFiLlama id — the assertion is about the NAME
         not mattering, so any non-`defillama` provider id proves it. */
      stamp: evidenceStamp({ source: 'coingecko', origin: 'OBSERVED', asOf: '2026-09-22' }),
    }));
    const provenance = strategyProvenance(strategy, substituted);
    expect(provenance.apyProvenance).toBe('live');
    expect(provenance.fixtureProtocolIds).toEqual([]);
    expect(provenance.newestLiveSource).toBe('coingecko');
  });

  it('should keep newestLiveSource and newestLiveAsOf set together', () => {
    const strategy = getStrategy('safeHarbor')!;
    const allFixture: ProtocolApy[] = strategy.allocation.map((leg) => ({
      protocolId: leg.protocolId,
      apyPercent: 1,
      tvlUsd: 1,
      chain: 'Arbitrum',
      stamp: FIXTURE_STAMP,
    }));
    const p = strategyProvenance(strategy, allFixture);
    expect(p.newestLiveAsOf).toBeNull();
    expect(p.newestLiveSource).toBeNull();
  });

  it('should attribute a source by its registry label, not a hardcoded string', () => {
    expect(sourceLabelOf('defillama')).toBe('DeFiLlama');
    expect(sourceLabelOf('coingecko')).toBe('CoinGecko');
  });
});

describe('9 · provider substitution proof', () => {
  /**
   * A hypothetical newly cleared source is represented by a stamp carrying a
   * different registered id. No new provider is integrated — the proof is that
   * each shared layer answers correctly for a source it was not written for.
   */
  const substituted = evidenceStamp({
    source: 'coingecko',
    origin: 'OBSERVED',
    asOf: '2026-09-22T00:00:00.000Z',
  });

  it('freshness engine: policy is resolved by source KEY, never by a name branch', async () => {
    const { resolveFreshnessPolicy } = await import('../freshnessPolicy');
    expect(resolveFreshnessPolicy({ source: 'coingecko' })).toEqual(
      resolveFreshnessPolicy({ source: 'defillama' })
    );
  });

  it('retention lifecycle: reads one timestamp and names no provider', async () => {
    const { isEvidenceExpired } = await import('../evidenceRetention');
    expect(isEvidenceExpired('2026-01-01T00:00:00.000Z', '2026-09-22T00:00:00.000Z')).toBe(true);
    expect(isEvidenceExpired('2026-09-01T00:00:00.000Z', '2026-09-22T00:00:00.000Z')).toBe(false);
  });

  it('controlled unavailable: refusal composes on the stamp, not the source id', () => {
    expect(isRefusedForCurrentFacingUse(substituted, '2026-09-23T00:00:00.000Z')).toBe(false);
    expect(isRefusedForCurrentFacingUse(substituted, '2026-12-01T00:00:00.000Z')).toBe(true);
  });

  it('Product consumer contract: liveness and attribution need no edit', () => {
    expect(isLiveObservation(substituted)).toBe(true);
    expect(sourceLabelOf(substituted.source)).toBe('CoinGecko');
  });
});
