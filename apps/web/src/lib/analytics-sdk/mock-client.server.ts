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
 * M2 (Market Macro, plan v3 D-M2-4): the static JSON imports moved into
 * per-view data modules (`./loaders/<slug>.server.ts`) so build-time inlining
 * survives per module (Turbopack resolveJsonModule constants — editorial PRs
 * reach production via Vercel rebuild, never runtime disk reads) while views
 * dispatch lazily through the static VIEW_DATA_LOADERS map below. Every
 * fetcher takes an optional `view` slug defaulting to the root view
 * ('bitcoin'), so pre-M2 call sites and tests are unchanged.
 *
 * Iteration 5 swap: per-view loaders map to the analytics API's per-product
 * `/v1` endpoints (doc 18); the function names below match the future SDK
 * contract.
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

import type { RawViewData } from './loaders/bitcoin.server';

/** The default (root) view — Bitcoin, per the M2 view registry. */
const DEFAULT_VIEW = 'bitcoin';

/**
 * Static dispatch map: view slug → lazy import of its data module. STATIC
 * `import()` literals keep Turbopack's build-time JSON inlining per module;
 * the map itself is the registry seam (plan v3 D-M2-4 — new views add one
 * line here plus their `loaders/<slug>.server.ts`).
 */
const VIEW_DATA_LOADERS: Record<string, () => Promise<RawViewData>> = {
  bitcoin: () => import('./loaders/bitcoin.server').then((m) => m.viewData),
};

async function loadViewData(view: string): Promise<RawViewData> {
  const loader = VIEW_DATA_LOADERS[view];
  if (!loader) {
    throw new Error(`unknown market view "${view}" — no data loader registered`);
  }
  return loader();
}

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

export async function fetchRegime(
  locale: SupportedLocale,
  view: string = DEFAULT_VIEW
): Promise<RegimeData> {
  const data = await loadViewData(view);
  return flattenRegime(data.regime as unknown as RawRegimeFixture, locale);
}

export async function fetchHistoricalRegimes(
  view: string = DEFAULT_VIEW
): Promise<HistoricalRegimes | null> {
  // Pass-through per `resilience.test.ts` contract: this fetcher returns the
  // JSON shape as-is; per-endpoint suppression (including the synthetic-seed
  // gate added 2026-05-29 — see PENDING_ALL.md 5.27) lives in the page-level
  // conditional so the fetcher contract stays uniform across all 6 endpoints.
  const data = await loadViewData(view);
  return data.historical as unknown as HistoricalRegimes;
}

export async function fetchSignals(
  locale: SupportedLocale,
  view: string = DEFAULT_VIEW
): Promise<{ signal_groups: SignalGroup[] }> {
  const data = await loadViewData(view);
  const raw = data.signals as unknown as { groups: RawSignalGroup[] };
  return { signal_groups: raw.groups.map((g) => localizeSignalGroup(g, locale)) };
}

export async function fetchDataStatus(view: string = DEFAULT_VIEW): Promise<DataStatus> {
  const data = await loadViewData(view);
  return data.dataStatus as unknown as DataStatus;
}

export async function fetchMethodology(view: string = DEFAULT_VIEW): Promise<MethodologyData> {
  const data = await loadViewData(view);
  return data.methodology as unknown as MethodologyData;
}

export async function fetchProductDisclaimer(
  view: string = DEFAULT_VIEW
): Promise<ProductDisclaimerData> {
  const data = await loadViewData(view);
  return data.productDisclaimer as unknown as ProductDisclaimerData;
}

/**
 * One-shot composite — invoked by the /market view shell RSC. Falls through
 * individual fetcher failures so a single source going dark does not blank
 * the page.
 */
export async function fetchInitialAnalyticsData(
  locale: SupportedLocale,
  view: string = DEFAULT_VIEW
): Promise<AnalyticsInitialData> {
  const [regime, historical, signals, dataStatus, methodology, productDisclaimer] =
    await Promise.all([
      fetchRegime(locale, view).catch(() => null),
      fetchHistoricalRegimes(view).catch(() => null),
      fetchSignals(locale, view).catch(() => null),
      fetchDataStatus(view).catch(() => null),
      fetchMethodology(view).catch(() => null),
      fetchProductDisclaimer(view).catch(() => null),
    ]);

  return { regime, historical, signals, dataStatus, methodology, productDisclaimer };
}
