/**
 * FALLBACK-ONLY PORTS — what a port resolves to when its source may not be used.
 *
 * ⚑ WHY A SEPARATE CLASS RATHER THAN A FLAG ON THE ADAPTER. The adapters guard
 * collection internally, so a disabled source already cannot fetch. That was
 * not enough: the ruling asks that a disabled source not be CONSTRUCTED, and
 * "the object exists but promises not to call out" is a weaker guarantee than
 * "the object holding the network call was never built". These classes hold no
 * `fetchImpl`, no endpoint and no timeout — there is nothing in them to issue a
 * request WITH, which is a structural guarantee rather than a behavioural one.
 *
 * ⚑ DISABLED IS NOT THE SAME AS "NOTHING MAY SERVE". A disabled primary means
 * the primary is unavailable; whether anything may stand in for it is the
 * separate eligibility question, and it is asked here exactly as the adapters
 * ask it. A cleared fallback still serves; an uncleared one still does not.
 * Collapsing the two would have made the kill switch silently stricter than
 * Legal's ruling, which is its own kind of wrong answer.
 */

import { fallbackFor } from '../fallbackEligibility';
import {
  FIXTURE_APYS,
  FIXTURE_FX_FROM_USD,
  FIXTURE_PRICES_USD,
  FIXTURE_STAMP,
  fixturePriceSeries,
} from '../fixtures';
import type {
  AssetId,
  DisplayCurrency,
  IApyProvider,
  IPriceProvider,
  PriceQuote,
  ProtocolApy,
  ProtocolApyHistory,
  ProtocolId,
  ProtocolPriceHistory,
} from '../types';

/** The same shape `defillama.ts` builds; kept local rather than exported as API. */
const fixtureApyFor = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  ...FIXTURE_APYS[protocolId],
});

const mayFixtureServe = (
  subject: Parameters<typeof fallbackFor>[0],
  alsoDisabled?: ReadonlySet<string>
): boolean => {
  const decision = fallbackFor(subject, alsoDisabled);
  return decision.eligible && decision.source === 'fixture';
};

/** APY port for a source that may not be used. Issues nothing; may still degrade. */
export class FallbackOnlyApyProvider implements IApyProvider {
  constructor(private readonly alsoDisabled?: ReadonlySet<string>) {}

  async getCurrentApys(protocolIds: ProtocolId[]): Promise<ProtocolApy[]> {
    if (!mayFixtureServe('APY_CURRENT', this.alsoDisabled)) return [];
    return protocolIds.map(fixtureApyFor);
  }

  async getApyHistory(protocolId: ProtocolId, days: number): Promise<ProtocolApyHistory | null> {
    if (!mayFixtureServe('APY_HISTORY', this.alsoDisabled)) return null;
    const fx = fixtureApyFor(protocolId);
    const today = new Date();
    const points = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toISOString().slice(0, 10), apyPercent: fx.apyPercent };
    });
    return { protocolId, points, stamp: fx.stamp };
  }
}

/** Price port for a source that may not be used. */
export class FallbackOnlyPriceProvider implements IPriceProvider {
  constructor(private readonly alsoDisabled?: ReadonlySet<string>) {}

  async getPrices(assetIds: AssetId[], currency: DisplayCurrency): Promise<PriceQuote[]> {
    if (!mayFixtureServe('PRICE_CURRENT', this.alsoDisabled)) return [];
    return assetIds.map((assetId) => ({
      assetId,
      currency,
      price: FIXTURE_PRICES_USD[assetId] * FIXTURE_FX_FROM_USD[currency],
      stamp: FIXTURE_STAMP,
    }));
  }

  async getPriceHistory(
    protocolId: ProtocolId,
    days: number
  ): Promise<ProtocolPriceHistory | null> {
    if (!mayFixtureServe('PRICE_HISTORY', this.alsoDisabled)) return null;
    return { protocolId, points: fixturePriceSeries(protocolId, days), stamp: FIXTURE_STAMP };
  }
}
