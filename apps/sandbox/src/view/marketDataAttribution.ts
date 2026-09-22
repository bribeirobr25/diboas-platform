/**
 * WHICH RENDERED OUTCOMES INCORPORATE A MARKET-DATA PROVIDER'S PRICE SERIES.
 *
 * Legal ruling 2026-09-22 (replay-outcome scope):
 *
 * ```text
 * TRIGGER    a displayed simulated outcome incorporates CoinGecko historical
 *            price data THROUGH REPLAY CALCULATION
 * AGGREGATE  also triggers if it CONTAINS such an outcome
 * RAW PRICE VISIBILITY REQUIRED   NO
 * SURFACE PRESENCE ALONE          NOT A TRIGGER
 * ```
 *
 * ⚑ THIS READS RECORDED PROVENANCE. NOTHING ELSE.
 *
 * The ruling forbids inferring the trigger from a strategy name, a screen name,
 * "growth strategy = always CoinGecko", or provider-name equality invented in
 * Product. So the answer comes from the ledger's own record of what the replay
 * actually consumed: `AccrualApplied.legsReplayed[]`, which the planner writes
 * with each leg's `kind` and its `source`. A market leg that replayed a
 * PROVIDER-sourced price series is the trigger; a market leg that fell back to
 * the fixture series is not, because no provider data entered the calculation.
 *
 * ⚑ WHY `legsReplayed` IS THE RIGHT RECORD, AND WHEN IT IS ABSENT. The planner
 * emits `ratesUsed` for a SOLE LENDING LEG and `legsReplayed` otherwise. So its
 * absence is not missing data — it positively means "one lending leg, no market
 * leg", which is a NON-trigger. The two arms are mutually exclusive by
 * construction, which is what makes reading one of them truthful rather than an
 * approximation.
 *
 * ⚑ PROVIDER-AGNOSTIC BY CONSTRUCTION. Nothing here spells a vendor name. It
 * asks the source REGISTRY whether a source is a provider (`kind: 'provider'`),
 * so a substituted price source triggers attribution on the day it is cleared,
 * and an unknown id recorded by some future writer is treated as NOT
 * attributable rather than silently credited to whoever is rendering. `5.440`
 * is the reason: a provider-name equality test is a defect, not a design.
 */

import { EVIDENCE_SOURCES, type EvidenceSourceId } from '@diboas/defi';
import type { LedgerEvent } from '@diboas/banking';

/** Is this recorded source id a market-data PROVIDER (not a fixture, not unknown)? */
function isProviderSource(source: string): boolean {
  const entry = (EVIDENCE_SOURCES as Record<string, { kind: string } | undefined>)[source];
  return entry?.kind === 'provider';
}

/**
 * The provider sources whose PRICE series fed this accrual's market legs.
 * Empty for a lending-only span, and empty when a market leg replayed fixtures.
 */
function marketPriceSourcesOf(event: LedgerEvent): EvidenceSourceId[] {
  if (event.type !== 'AccrualApplied') return [];
  const legs = event.legsReplayed ?? [];
  return legs
    .filter((leg) => leg.kind === 'market' && isProviderSource(leg.source))
    .map((leg) => leg.source as EvidenceSourceId);
}

/** positionId -> goalId, from the entry events that created each position. */
function goalOfPosition(events: readonly LedgerEvent[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of events) {
    if (e.type === 'StrategyEntered') map.set(e.positionId, e.goalId);
  }
  return map;
}

/**
 * Goal ids whose accrued outcome incorporates a provider price series, mapped to
 * the sources that contributed. A goal absent from this map has no such
 * contribution and must NOT be attributed.
 */
export function marketPriceSourcesByGoal(
  events: readonly LedgerEvent[]
): Map<string, Set<EvidenceSourceId>> {
  const byPosition = goalOfPosition(events);
  const out = new Map<string, Set<EvidenceSourceId>>();
  for (const event of events) {
    const sources = marketPriceSourcesOf(event);
    if (sources.length === 0) continue;
    const goalId = byPosition.get((event as { positionId: string }).positionId);
    if (!goalId) continue;
    const set = out.get(goalId) ?? new Set<EvidenceSourceId>();
    for (const s of sources) set.add(s);
    out.set(goalId, set);
  }
  return out;
}

/** Every provider price source contributing to ANY rendered outcome in `events`. */
/** Module-private: `anyOutcomeUsesCoinGeckoPrices` is its only caller, and an
 * export kept for nothing is still an export kept for nothing. */
function marketPriceSourcesOverall(events: readonly LedgerEvent[]): Set<EvidenceSourceId> {
  const all = new Set<EvidenceSourceId>();
  for (const event of events) for (const s of marketPriceSourcesOf(event)) all.add(s);
  return all;
}

/** The id the ratified attribution copy belongs to. */
const COINGECKO = 'coingecko';

/** Does this goal's rendered outcome incorporate CoinGecko price data? */
export function goalUsesCoinGeckoPrices(events: readonly LedgerEvent[], goalId: string): boolean {
  return marketPriceSourcesByGoal(events).get(goalId)?.has(COINGECKO) ?? false;
}

/** Does ANY rendered outcome in `events` incorporate CoinGecko price data? */
export function anyOutcomeUsesCoinGeckoPrices(events: readonly LedgerEvent[]): boolean {
  return marketPriceSourcesOverall(events).has(COINGECKO);
}
