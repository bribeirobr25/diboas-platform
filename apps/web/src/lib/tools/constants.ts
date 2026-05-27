/**
 * Tools Domain Constants
 *
 * Per-tool defaults are locale-keyed (Record<SupportedLocale, T>) so that
 * a future analytics-driven provider (PENDING_ALL.md P4-9) can swap the
 * source without touching call sites. v1 ships hard-coded fallback values
 * derived from the same locale-bank-rate context as GOAL_CARD_INPUTS.
 */

import type {
  AssetHistoryDefaults,
  CardFeesDefaults,
  CompoundToolDefaults,
  CurrencyDepreciationDefaults,
  EmergencyFundDefaults,
  IdleCashDefaults,
  InflationImpactDefaults,
  TimeToTargetDefaults,
  ToolDescriptor,
  ToolKey,
} from './types';

/**
 * Authoritative ordered list of shipped tools. Used by /tools landing for
 * card ordering AND by metadata generation. The display order is set here
 * (NOT in `TOOL_DESCRIPTORS`, which is a Record and unordered) — Tier 1
 * (6C compound family) → Tier 2 (6D bespoke) → Tier 3 (6E B2B) → Phase E
 * (asset-history retrospective).
 *
 * Phase 4 §4.2 (2026-05-25): consolidated from `app/[locale]/(landing)/tools/page.tsx`
 * to `lib/tools/` so the sync test (`__tests__/registry.test.ts`) can pin
 * `SHIPPED_TOOLS` ↔ `TOOL_DESCRIPTORS` parity without crossing the
 * `app/` ↔ `lib/` boundary (C40 close).
 */
export const SHIPPED_TOOLS: ReadonlyArray<ToolKey> = [
  // Tier 1 (6C)
  'compound-interest',
  'retirement',
  'goal-savings',
  // Tier 2 (6D)
  'inflation-impact',
  'currency-depreciation',
  'emergency-fund',
  'time-to-target',
  // Tier 3 B2B (6E)
  'card-fees',
  'idle-cash',
  // Phase E (2026-05-16) — Asset history retrospective tool
  'asset-history',
];

/** Display order for /tools landing cards within each section. */
export const TOOL_DESCRIPTORS: Record<ToolKey, ToolDescriptor> = {
  'compound-interest': {
    key: 'compound-interest',
    section: 'grow',
    slug: 'compound-interest',
    i18nNamespace: 'tools-compound-interest',
    icon: 'compound',
    forBusiness: false,
  },
  retirement: {
    key: 'retirement',
    section: 'grow',
    slug: 'retirement',
    i18nNamespace: 'tools-retirement',
    icon: 'retirement',
    forBusiness: false,
  },
  'goal-savings': {
    key: 'goal-savings',
    section: 'grow',
    slug: 'goal-savings',
    i18nNamespace: 'tools-goal-savings',
    icon: 'goal',
    forBusiness: false,
  },
  'emergency-fund': {
    key: 'emergency-fund',
    section: 'target',
    slug: 'emergency-fund',
    i18nNamespace: 'tools-emergency-fund',
    icon: 'emergency',
    forBusiness: false,
  },
  // Phase 6D — Tier 2 tools
  'inflation-impact': {
    key: 'inflation-impact',
    section: 'protect',
    slug: 'inflation-impact',
    i18nNamespace: 'tools-inflation-impact',
    icon: 'inflation',
    forBusiness: false,
  },
  'time-to-target': {
    key: 'time-to-target',
    section: 'target',
    slug: 'time-to-target',
    i18nNamespace: 'tools-time-to-target',
    icon: 'timeToTarget',
    forBusiness: false,
  },
  'currency-depreciation': {
    key: 'currency-depreciation',
    section: 'protect',
    slug: 'currency-depreciation',
    i18nNamespace: 'tools-currency-depreciation',
    icon: 'currencyDepreciation',
    forBusiness: false,
  },
  // Phase 6E — Tier 3 B2B
  'card-fees': {
    key: 'card-fees',
    section: 'business',
    slug: 'card-fees',
    i18nNamespace: 'tools-card-fees',
    icon: 'cardFees',
    forBusiness: true,
  },
  'idle-cash': {
    key: 'idle-cash',
    section: 'business',
    slug: 'idle-cash',
    i18nNamespace: 'tools-idle-cash',
    icon: 'idleCash',
    forBusiness: true,
  },
  // Phase E (2026-05-16) — Asset History retrospective tool. Section 'grow'
  // because it lives next to the projection-oriented tools but tells a
  // retrospective story (what already happened to BTC/stocks/gold since
  // 2010 or 2016).
  'asset-history': {
    key: 'asset-history',
    section: 'grow',
    slug: 'asset-history',
    i18nNamespace: 'tools-asset-history',
    icon: 'assetHistory',
    forBusiness: false,
  },
};

/**
 * Tools that reuse the CompoundInterestCalculator (Tier-1 only). Other
 * Tier-2/3 tools have their own calculator with bespoke math.
 */
export type CompoundToolKey = 'compound-interest' | 'retirement' | 'goal-savings';

/**
 * Default inputs for tools that reuse the CompoundInterestCalculator.
 * Per-locale `amount` follows the GOAL_CARD_INPUTS convention so future
 * locale-specific data swaps are zero-call-site.
 */
export const COMPOUND_TOOL_DEFAULTS: Record<CompoundToolKey, CompoundToolDefaults> = {
  'compound-interest': {
    initialAmount: 0,
    amount: { en: 5, 'pt-BR': 25, es: 3, de: 4 },
    cadence: 'daily',
    years: 12,
    // compound-interest defaults are tiny ($5/day); 250 covers them with room.
    recurringSliderMax: { en: 250, 'pt-BR': 250, es: 250, de: 250 },
  },
  retirement: {
    initialAmount: 0,
    amount: { en: 500, 'pt-BR': 2000, es: 400, de: 400 },
    cadence: 'monthly',
    years: 25,
    // C6 close: pt-BR default 2000 needs 3000 ceiling (8× default 250 was useless).
    recurringSliderMax: { en: 1000, 'pt-BR': 3000, es: 800, de: 800 },
  },
  'goal-savings': {
    initialAmount: 0,
    amount: { en: 200, 'pt-BR': 1000, es: 150, de: 150 },
    cadence: 'monthly',
    years: 10,
    // Goal-savings defaults: en 200 → 500; pt-BR 1000 → 2000; es/de 150 → 500.
    recurringSliderMax: { en: 500, 'pt-BR': 2000, es: 500, de: 500 },
  },
};

/** Default inputs for the Emergency Fund time-to-target calculator. */
export const EMERGENCY_FUND_DEFAULTS: EmergencyFundDefaults = {
  monthlyExpenses: { en: 2900, 'pt-BR': 2700, es: 1500, de: 2000 },
  monthlySavings: { en: 300, 'pt-BR': 270, es: 150, de: 200 },
  targetMultiplier: 6,
};

/** Default inputs for the Inflation Impact calculator (6D.1). */
export const INFLATION_IMPACT_DEFAULTS: InflationImpactDefaults = {
  amount: { en: 1000, 'pt-BR': 5000, es: 1000, de: 1000 },
  years: 10,
};

/** Default inputs for the Time-to-Target calculator (6D.2). */
export const TIME_TO_TARGET_DEFAULTS: TimeToTargetDefaults = {
  target: { en: 50000, 'pt-BR': 250000, es: 40000, de: 40000 },
  initialAmount: { en: 0, 'pt-BR': 0, es: 0, de: 0 },
  contribution: { en: 250, 'pt-BR': 1000, es: 200, de: 200 },
  cadence: 'monthly',
};

/** Default inputs for the Currency Depreciation calculator (6D.3).
 *  Defaults sized in local currency for non-USD locales; en falls back to USD/EUR-equivalent. */
export const CURRENCY_DEPRECIATION_DEFAULTS: CurrencyDepreciationDefaults = {
  amount: { en: 10000, 'pt-BR': 50000, es: 10000, de: 10000 },
  years: 5,
};

/** Default inputs for the Card Fee Savings calculator (6E.1).
 *  Processor fee rates are locale-typical blended rates (interchange + scheme + acquirer):
 *   - en (US/global): ~2.9% (Stripe/Square North-American blended)
 *   - pt-BR: ~3.0% (Brazilian adquirentes — Cielo/Stone/Rede typical card-not-present)
 *   - es / de (EU SEPA): ~1.75% (post-Interchange Fee Regulation cap of 0.3% credit + scheme fees + acquirer margin) */
export const CARD_FEES_DEFAULTS: CardFeesDefaults = {
  monthlyVolume: { en: 50000, 'pt-BR': 250000, es: 40000, de: 40000 },
  // Phase C+H (TOOLS_IMPROVEMENT.md, 2026-05-23, Decision Q3): ES/DE lowered to
  // effective MSC (~0.8%) post-IFR caps. EU Regulation 2015/751 caps consumer
  // interchange at 0.2% debit / 0.3% credit; total effective merchant fees
  // average 0.44-1.0% across acquirers and card mixes. Previous 1.75% was the
  // "blended typical published rate" — replaced with the "what merchants
  // actually pay" effective MSC per Decision Q3.
  processorFeeRate: { en: 0.029, 'pt-BR': 0.03, es: 0.008, de: 0.008 },
  avgTransactionAmount: { en: 75, 'pt-BR': 250, es: 60, de: 60 },
};

/** Default inputs for the Idle Cash Yield calculator (6E.2).
 *  Reuses CompoundInterestCalculator under the hood — same pattern as retirement / goal-savings. */
export const IDLE_CASH_DEFAULTS: IdleCashDefaults = {
  idleCash: { en: 100000, 'pt-BR': 500000, es: 80000, de: 80000 },
  years: 3,
};

/** Default inputs for the Asset History calculator (Phase E, 2026-05-16).
 *  Default asset varies per locale: BTC for everyone (the headline question),
 *  start year 2016 (more recent + less LOW-confidence anchor noise than 2010),
 *  DCA mode (the educational ask is "monthly DCA over the past decade"). */
export const ASSET_HISTORY_DEFAULTS: AssetHistoryDefaults = {
  asset: { en: 'BTC', 'pt-BR': 'BTC', es: 'BTC', de: 'BTC' },
  startYear: 2016,
  mode: 'monthlyDca',
  contribution: { en: 100, 'pt-BR': 500, es: 100, de: 100 },
};
