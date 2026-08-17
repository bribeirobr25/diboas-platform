/**
 * Umbrella card model (M3 — plan v3 D-M3-3). Pure derivation, no rendering,
 * no I/O — unit-testable against every degraded state (the CTO R-1′ class).
 *
 * Cards derive per destination, INDEPENDENTLY: a null feed degrades that one
 * card (label + calm unavailable line — never blank, never dropped, spine
 * order untouched per R-4); it never blanks the umbrella. No numeric scores
 * anywhere (MM-2: band WORDS are the cross-market grammar).
 */

import type { AnalyticsInitialData, RegimeCode } from '@/lib/analytics-sdk/types';
import { viewPath, type MarketViewDef } from './viewRegistry';

export type UmbrellaDirection = 'up' | 'down' | 'held';

export interface UmbrellaCardModel {
  slug: string;
  path: string;
  grammar: MarketViewDef['grammar'];
  /** false ⇒ render the calm unavailable line instead of the reads. */
  available: boolean;
  /** Scored views: the band code (the i18n regimeLabels map renders the word). */
  bandCode?: RegimeCode;
  /** Scored views: week-over-week direction from the last two snapshots;
   *  omitted when fewer than two real snapshots exist. */
  direction?: UmbrellaDirection;
  /** State views: MAC component states in fixed component order
   *  (dollar, rates, liquidity) — true = the supportive reading is ACTIVE. */
  conditions?: { id: string; active: boolean }[];
  /** View-voice wave (2026-08-14, founder feedback): the card's PLAIN-language
   *  primary line — scored views take the first sentence of the grandmother
   *  `summary.plain`; state views take the macro group's generated summary.
   *  Band words / condition words demote to the secondary meta row. Optional:
   *  cycles predating the plain layer render the meta row alone (never blank). */
  plainLine?: string;
}

/** First sentence of a plain summary — the card-sized cut. The grandmother
 *  templates end sentences with '. '; fall back to the whole string. */
function firstSentence(text: string): string {
  const idx = text.indexOf('. ');
  return idx > 0 ? text.slice(0, idx + 1) : text;
}

const BACKDROP_COMPONENT_ORDER = ['MAC-01', 'MAC-02', 'MAC-03'] as const;

const KNOWN_REGIMES: ReadonlySet<string> = new Set([
  'VERY_FAVORABLE',
  'CONSTRUCTIVE',
  'NEUTRAL_MIXED',
  'DEFENSIVE',
  'HOSTILE',
]);

export function umbrellaCardModel(
  view: MarketViewDef,
  data: AnalyticsInitialData
): UmbrellaCardModel {
  const base = { slug: view.slug, path: viewPath(view), grammar: view.grammar };

  if (view.grammar === 'scored') {
    const code = data.regime?.regime_code;
    if (!code || !KNOWN_REGIMES.has(code)) {
      return { ...base, available: false };
    }
    const snaps = data.historical?.snapshots ?? [];
    const real = data.historical?.synthetic_seed ? [] : snaps;
    let direction: UmbrellaDirection | undefined;
    if (real.length >= 2) {
      const [prev, last] = real.slice(-2);
      direction = last.score > prev.score ? 'up' : last.score < prev.score ? 'down' : 'held';
    }
    const plain = data.regime?.summary?.plain;
    return {
      ...base,
      available: true,
      bandCode: code as RegimeCode,
      direction,
      plainLine: plain ? firstSentence(plain) : undefined,
    };
  }

  // 'state' grammar: the MAC component reads.
  const groups = data.signals?.signal_groups ?? [];
  const macro = groups.find((g) => g.id === 'macro_environment');
  const signals = macro?.signals ?? [];
  const conditions = BACKDROP_COMPONENT_ORDER.flatMap((id) => {
    const sig = signals.find((s) => s.id === id);
    return sig ? [{ id, active: sig.state === 'ACTIVE' }] : [];
  });
  if (conditions.length !== BACKDROP_COMPONENT_ORDER.length) {
    return { ...base, available: false };
  }
  return {
    ...base,
    available: true,
    conditions,
    plainLine: macro?.summary || undefined,
  };
}
