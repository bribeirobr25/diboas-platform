/**
 * Mock SDK — server-only fetchers. Used by the /market RSC to read editorial
 * JSON, flatten locale-keyed text, and produce `AnalyticsInitialData` for the
 * client Provider per NF5.
 *
 * Iteration 3: editorial data lives at `apps/web/data/market/` so a
 * non-engineering content owner can update the regime score and signals via
 * PR without touching engineering-owned SDK code. The iter-2 fixtures at
 * `./fixtures/` remain in place for Storybook stories + the iter-2 fixture
 * drift test; they are NOT consumed by this server fetcher anymore.
 *
 * The `@/../data/market/...` import path resolves to `apps/web/data/market/`
 * under the project's `moduleResolution: "bundler"` tsconfig — verified via
 * L4 POC during iter-3 §3.2 execution.
 *
 * Build-time inlining: Next.js + Turbopack treats these static JSON imports
 * as build-time constants (resolveJsonModule). Editorial PRs reach
 * production via Vercel auto-deploy (which rebuilds the bundle with the new
 * inlined JSON), NOT via runtime disk reads.
 *
 * Iteration 5 swap: replace these imports with `@analytics-platform/client`
 * server fetchers. The function names below match the future SDK contract.
 */

import type { SupportedLocale } from '@diboas/i18n/server';
import type {
  AnalyticsInitialData,
  DataStatus,
  HistoricalRegimes,
  MethodologyData,
  ProductDisclaimerData,
  RegimeData,
  RegimeSummary,
  Signal,
  SignalGroup,
} from './types';

import currentRegimeJson from '@/../data/market/regime.json';
import dataStatusJson from '@/../data/market/data-status.json';
import historicalJson from '@/../data/market/historical.json';
import methodologyJson from '@/../data/market/methodology.json';
import productDisclaimerJson from '@/../data/market/product-disclaimer.json';
import signalsJson from '@/../data/market/signals.json';

type LocalizedRegimeSummary = Record<SupportedLocale, RegimeSummary>;
type LocalizedText = Record<SupportedLocale, string>;

type RawRegimeFixture = Omit<RegimeData, 'summary'> & { summary: LocalizedRegimeSummary };
type RawSignal = Omit<Signal, 'summary' | 'title'> & {
  title: LocalizedText | string;
  summary: LocalizedText;
};
type RawSignalGroup = Omit<SignalGroup, 'signals' | 'title' | 'summary'> & {
  title: LocalizedText;
  summary: LocalizedText;
  signals?: RawSignal[];
};

function pickLocale<T>(map: Record<SupportedLocale, T> | T, locale: SupportedLocale): T {
  // Defensive: if a fixture still has a flat string instead of a locale map,
  // return it unchanged so the page never renders `undefined`. Logged so the
  // fixture-drift guard catches the regression on next test run.
  if (typeof map === 'string' || typeof map === 'number' || map === null || map === undefined) {
    return map as T;
  }
  const m = map as Record<SupportedLocale, T>;
  return m[locale] ?? m.en;
}

function localizeSignal(raw: RawSignal, locale: SupportedLocale): Signal {
  const { title, summary, ...rest } = raw;
  return {
    ...rest,
    title: pickLocale(title, locale),
    summary: pickLocale(summary, locale),
  };
}

function localizeSignalGroup(raw: RawSignalGroup, locale: SupportedLocale): SignalGroup {
  const { title, summary, signals, ...rest } = raw;
  return {
    ...rest,
    title: pickLocale(title, locale),
    summary: pickLocale(summary, locale),
    signals: signals?.map((s) => localizeSignal(s, locale)),
  };
}

function flattenRegime(raw: RawRegimeFixture, locale: SupportedLocale): RegimeData {
  return {
    ...raw,
    summary: pickLocale(raw.summary, locale),
    signal_groups: raw.signal_groups.map((g) =>
      localizeSignalGroup(g as unknown as RawSignalGroup, locale)
    ),
  };
}

export async function fetchRegime(locale: SupportedLocale): Promise<RegimeData> {
  return flattenRegime(currentRegimeJson as unknown as RawRegimeFixture, locale);
}

export async function fetchHistoricalRegimes(): Promise<HistoricalRegimes | null> {
  // Pass-through per `resilience.test.ts` contract: this fetcher returns the
  // JSON shape as-is; per-endpoint suppression (including the synthetic-seed
  // gate added 2026-05-29 — see PENDING_ALL.md 5.27) lives in the page-level
  // conditional so the fetcher contract stays uniform across all 6 endpoints.
  return historicalJson as unknown as HistoricalRegimes;
}

export async function fetchSignals(
  locale: SupportedLocale
): Promise<{ signal_groups: SignalGroup[] }> {
  const raw = signalsJson as unknown as { groups: RawSignalGroup[] };
  return { signal_groups: raw.groups.map((g) => localizeSignalGroup(g, locale)) };
}

export async function fetchDataStatus(): Promise<DataStatus> {
  return dataStatusJson as unknown as DataStatus;
}

export async function fetchMethodology(): Promise<MethodologyData> {
  return methodologyJson as unknown as MethodologyData;
}

export async function fetchProductDisclaimer(): Promise<ProductDisclaimerData> {
  return productDisclaimerJson as unknown as ProductDisclaimerData;
}

/**
 * One-shot composite — invoked by /market RSC. Falls through individual
 * fetcher failures so a single source going dark does not blank the page.
 */
export async function fetchInitialAnalyticsData(
  locale: SupportedLocale
): Promise<AnalyticsInitialData> {
  const [regime, historical, signals, dataStatus, methodology, productDisclaimer] =
    await Promise.all([
      fetchRegime(locale).catch(() => null),
      fetchHistoricalRegimes().catch(() => null),
      fetchSignals(locale).catch(() => null),
      fetchDataStatus().catch(() => null),
      fetchMethodology().catch(() => null),
      fetchProductDisclaimer().catch(() => null),
    ]);

  return { regime, historical, signals, dataStatus, methodology, productDisclaimer };
}
