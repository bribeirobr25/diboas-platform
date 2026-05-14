/**
 * Mock SDK type surface — mirrors the future `@analytics-platform/client`
 * package per `diboas-analytics/docs/sdk/09_analytics_client_sdk_specification.md` §3.
 *
 * Iteration 5 swap: when the real SDK ships, this file is deleted and consumers
 * import the same names from the npm package. The shapes here are the contract.
 *
 * Distinct from `apps/web/src/lib/analytics/types.ts` (host PostHog/GA4
 * event-tracking service). No type-name collisions: this file carries
 * `RegimeData`, `SignalGroup`, etc.; that file carries `AnalyticsEvent`,
 * `AnalyticsService`, etc.
 */

import type { SupportedLocale } from '@diboas/i18n/server';

// ---------------------------------------------------------------------------
// Shared enums (per docs/mvp/platform/07_api_contract_response_schema.md §9)
// ---------------------------------------------------------------------------

export type RegimeCode =
  | 'VERY_FAVORABLE'
  | 'CONSTRUCTIVE'
  | 'NEUTRAL_MIXED'
  | 'DEFENSIVE'
  | 'HOSTILE';

export type RegimeLabel =
  | 'Very Favorable'
  | 'Constructive'
  | 'Neutral / Mixed'
  | 'Defensive'
  | 'Hostile';

export type SignalState = 'ACTIVE' | 'INACTIVE' | 'STALE' | 'UNAVAILABLE' | 'ERROR';

export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW';

export type FreshnessStatus = 'FRESH' | 'STALE' | 'DELAYED' | 'UNAVAILABLE';

export type SignalCategory =
  | 'BTC_STRUCTURE'
  | 'MACRO_ENVIRONMENT'
  | 'INSTITUTIONAL_DEMAND'
  | 'RELATIVE_STRENGTH';

export type EnvironmentBias =
  | 'STRONG_ALIGNMENT'
  | 'CONSTRUCTIVE'
  | 'MIXED'
  | 'DEFENSIVE'
  | 'HOSTILE';

export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY';

// ---------------------------------------------------------------------------
// Shared objects (per doc 07 §10)
// ---------------------------------------------------------------------------

export interface Freshness {
  status: FreshnessStatus;
  last_updated_at: string | null;
  expected_next_update_at: string | null;
  stale_after: string | null;
  source: string;
  message: string | null;
}

/**
 * Mock-iteration signal shape. Future SDK will extend with `weight`, `value`,
 * `threshold`, `timeframe`, `source`, `freshness`, `interpretation`,
 * `methodology` per doc 09 §3 — iteration-5 swap adds those fields without
 * renaming. Mock SDK + page consume the fields below only.
 */
export interface Signal {
  id: string;
  category: SignalCategory;
  title: string;
  state: string;
  points_awarded: number;
  max_points: number;
  summary: string;
  last_updated_at: string;
}

/**
 * `signals` is optional because /regime returns SignalGroup summaries only;
 * /signals returns the same shape with `signals[]` populated.
 */
export interface SignalGroup {
  id: string;
  category: SignalCategory;
  title: string;
  status: 'CONSTRUCTIVE' | 'MIXED' | 'WEAK';
  points_awarded: number;
  max_points: number;
  summary: string;
  signals?: Signal[];
}

export interface RegimeSummary {
  short: string;
  detailed: string;
  confidence_level: ConfidenceLevel;
  mixed_signals: boolean;
  key_supportive_factors: string[];
  key_headwinds: string[];
}

export interface DataStatus {
  overall_confidence: ConfidenceLevel;
  last_successful_update_at: string | null;
  sources: Array<{
    source: string;
    status: FreshnessStatus;
    last_updated_at: string | null;
    expected_next_update_at: string | null;
    stale_after: string | null;
    message: string | null;
  }>;
  delayed_sources: string[];
  unavailable_sources: string[];
}

// ---------------------------------------------------------------------------
// Endpoint payloads (per doc 07 §12-18)
// ---------------------------------------------------------------------------

export interface RegimeData {
  score: number;
  max_score: 14;
  regime_code: RegimeCode;
  regime_label: RegimeLabel;
  environment_bias: EnvironmentBias;
  summary: RegimeSummary;
  signal_groups: SignalGroup[];
  data_status: DataStatus;
  last_updated_at: string;
}

/**
 * Mock-iteration historical snapshot — compact shape sufficient for chart.
 * Future SDK adds confidence_level, summary_short, signal_states.
 */
export interface HistoricalRegimeSnapshot {
  date: string;
  score: number;
  regime_code: RegimeCode;
}

export interface HistoricalRegimes {
  range: string;
  snapshots: HistoricalRegimeSnapshot[];
}

/**
 * Mock-iteration methodology shape — pragmatic subset of doc 09 §3. Future SDK
 * adds per-regime descriptions, signal_categories, and inline disclaimer. Mock
 * page reads the published canonical methodology_url for full text.
 */
export interface MethodologyData {
  version: string;
  published_at: string;
  methodology_url: string;
  framework_name: string;
  max_score: number;
  score_bands: Array<{
    code: RegimeCode;
    label: RegimeLabel;
    min_score: number;
    max_score: number;
  }>;
  groups: Array<{
    id: string;
    title: string;
    max_points: number;
    weight_label: string;
  }>;
}

export interface ProductDisclaimerData {
  text: Record<SupportedLocale, string>;
}

// ---------------------------------------------------------------------------
// Provider context (per doc 09 §3.1)
// ---------------------------------------------------------------------------

export interface AnalyticsError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface FallbackMessages {
  outageTitle: string;
  outageBody: string;
  partialOutageTitle: string;
  partialOutageBody: string;
}

export interface AnalyticsInitialData {
  regime?: RegimeData | null;
  historical?: HistoricalRegimes | null;
  signals?: { signal_groups: SignalGroup[] } | null;
  dataStatus?: DataStatus | null;
  methodology?: MethodologyData | null;
  productDisclaimer?: ProductDisclaimerData | null;
}

export interface AnalyticsProviderProps {
  /** Real-SDK API base URL. Ignored in mock mode; kept for iteration-5 parity. */
  apiBaseUrl: string;
  /** Optional API key for non-canonical hosts. Ignored in mock mode. */
  apiKey?: string;
  /** Locale negotiation target. */
  locale: SupportedLocale;
  /** Theme token overrides. */
  theme?: Record<string, string>;
  /** SSR-fetched initial data per NF5 — client hooks resolve from this. */
  initialData?: AnalyticsInitialData;
  /** Error reporter callback for host's monitoring. */
  onError?: (err: AnalyticsError) => void;
  /** Host-translated fallback copy for outage states. */
  fallbackMessages?: FallbackMessages;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Hook return shapes (per doc 09 §3.2)
// ---------------------------------------------------------------------------

export interface HookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: AnalyticsError | null;
  refetch: () => Promise<void>;
}
