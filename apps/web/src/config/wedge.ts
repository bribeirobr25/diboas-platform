/**
 * Per-market wedge configuration (Phase 4 redesign).
 *
 * "One engine, four expressions." Each locale enters the landing page through a
 * different market *truth* — not N hand-built pages. The differentiation is:
 *   - which LIVE metric drives the headline figure (never a hardcoded number),
 *   - which lead tool / experience the wedge drives into,
 *   - the visual tone,
 *   - and the transcreated copy (shared i18n keys, per-locale translations).
 *
 * Wedges (per `REDESIGN_BUILD_PLAN.md` §3 Phase 4):
 *   🇺🇸 en    — idle-money + honesty: "Your bank pays {rate}." → demo-forward.
 *   🇧🇷 pt-BR — dollar hedge (killer wedge): "O real perdeu {x}% pro dólar desde
 *               2010." → Currency-Depreciation tool. Warmest tone.
 *   🇪🇸 es    — inflation / ahorro: "La inflación se comió {x}%." → Inflation tool.
 *   🇩🇪 de    — Tagesgeld, data-first: "Dein Tagesgeld bringt {rate}." → Inflation
 *               tool. Most typographically disciplined (neutral tone).
 *
 * Every figure is resolved at runtime from `marketDataService` by `useMarketWedge`
 * — no figure lives here (Principle 3, service-agnostic).
 */

import type { SupportedLocale } from '@diboas/i18n/config';

/** Which live metric drives the wedge's headline figure. */
export type WedgeMetric = 'bankSavings' | 'brlDollarLoss' | 'inflationCumulative';

export interface WedgeExpression {
  /** The live metric resolved into the headline figure (see `useMarketWedge`). */
  readonly metric: WedgeMetric;
  /** Lead tool / experience the wedge drives into (locale-relative href). */
  readonly ctaHref: string;
  /** Visual accent — BR warmest, DE most disciplined. */
  readonly tone: 'action' | 'warm' | 'neutral';
}

export const WEDGE_CONFIG: Record<SupportedLocale, WedgeExpression> = {
  en: { metric: 'bankSavings', ctaHref: '/demo', tone: 'action' },
  'pt-BR': { metric: 'brlDollarLoss', ctaHref: '/tools/currency-depreciation', tone: 'warm' },
  es: { metric: 'inflationCumulative', ctaHref: '/tools/inflation-impact', tone: 'action' },
  de: { metric: 'bankSavings', ctaHref: '/tools/inflation-impact', tone: 'neutral' },
} as const;

/**
 * Shared i18n keys — resolved to the CURRENT locale's transcreated copy (each
 * locale's `landing-b2c.json` carries that market's wedge wording). The claim
 * interpolates `{value}` (the live figure).
 */
export const WEDGE_I18N = {
  eyebrow: 'landing-b2c.wedge.eyebrow',
  claim: 'landing-b2c.wedge.claim',
  honest: 'landing-b2c.wedge.honest',
  cta: 'landing-b2c.wedge.cta',
} as const;
