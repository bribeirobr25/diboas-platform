/**
 * Market Macro view registry (M2 — `MARKET_MACRO_PROGRAM_2026-08-12`, plan v3
 * D-M2-2). One entry per market view on `/market`; the registry is the single
 * source of truth for routing, ordering, data location, and the grammar seam.
 *
 * `status` drives routing (the `lib/learn/registry.ts` precedent, adopted per
 * CTO-board finding E — this REPLACES the plan-v1 308-redirect mechanism):
 *   - 'live-at-root' — served by `/market` itself. Exactly ONE entry holds
 *     this (Bitcoin) until the umbrella ships alongside the second live view.
 *   - 'announced'    — registered (namespace/data may already exist) but NOT
 *     routable: `/market/<slug>` responds `notFound()`.
 *   - 'live'         — served at `/market/<slug>`.
 * Going live per view = flip `status` + add its `PAGE_SEO_CONFIG` entry
 * (which auto-emits the sitemap URL via `getAllUrls()`) + register the route
 * in the pa11y AND Lighthouse page lists — plan §9 rider 4(e); the registry
 * drift test enforces the pairing so an unlisted page can never be a live one.
 *
 * Presentation order derives from the prev/next SPINE (`next`), never from
 * object-key order, a hand-numbered field, or scores — R-4 (anti-ranking,
 * MM-2 ruling 2026-08-12) is structural: the switcher and the future umbrella
 * can only ever walk the spine.
 *
 * `dataDir: '.'` is the D-M2-3(ii) documented asymmetry: Bitcoin's data files
 * live at `apps/web/data/market/` root until the post-2026-08-17 migration;
 * every new market uses `apps/web/data/market/<slug>/`.
 */

/** MM-2 (2026-08-12): scored views share the five band words; state views use
 *  qualitative vocabularies (e.g. Steady/Watch/Stressed) and carry no score. */
export type MarketViewGrammar = 'scored' | 'state';

export type MarketViewStatus = 'live-at-root' | 'announced' | 'live';

import type { OGPageType } from '@/lib/og';

export interface MarketViewDef {
  /** URL segment under /market/ (and the registry key). */
  slug: string;
  grammar: MarketViewGrammar;
  status: MarketViewStatus;
  /** i18n namespace carrying this view's page strings. */
  namespace: string;
  /** PAGE_SEO_CONFIG key + OG template this view uses once live ('market' for
   *  the root view; each new view registers its own OG type at its status
   *  flip — plan §9 rider 4a — which is what keeps this OGPageType-typed). */
  seoConfigKey: OGPageType;
  /** Data directory under apps/web/data/market/ ('.' = the Bitcoin root asymmetry). */
  dataDir: string;
  /** Raw upstream provenance ids → i18n label keys for the data-sources panel. */
  sourceLabelKeys: Record<string, string>;
  /** Next view in the presentation spine (null = end). */
  next: string | null;
}

export const MARKET_VIEW_SPINE_START = 'bitcoin';

export const MARKET_VIEWS: Record<string, MarketViewDef> = {
  bitcoin: {
    slug: 'bitcoin',
    grammar: 'scored',
    status: 'live-at-root',
    namespace: 'market',
    seoConfigKey: 'market',
    dataDir: '.',
    sourceLabelKeys: {
      'in-repo:monthlyPrices.json (BTC)': 'dashboard.sources.btc',
      'FRED:DGS10': 'dashboard.sources.us10y',
      'FRED:DTWEXBGS': 'dashboard.sources.dxy',
      'FRED:M2SL': 'dashboard.sources.m2',
      'FRED:NASDAQCOM': 'dashboard.sources.nasdaq',
      'Yahoo:GC=F': 'dashboard.sources.gold',
      'CoinGlass:ETF': 'dashboard.sources.btcEtf',
    },
    next: 'backdrop',
  },
  // M3 (plan v3 D-M3-2): the Macro Backdrop — the first 'state'-grammar view.
  // A PRESENTATION of the shared weekly run's macro slice (dataDir '.', the
  // same files Bitcoin reads — NOT the D-M2-3 new-market case; see 5.92 for
  // the migration's shared-dir naming call). 'announced' until the M3c
  // activation; its loader exists from THIS commit (the R-1′ invariant:
  // registered ⇒ loadable, drift-asserted).
  backdrop: {
    slug: 'backdrop',
    grammar: 'state',
    status: 'announced',
    namespace: 'market-backdrop',
    seoConfigKey: 'market-backdrop',
    dataDir: '.',
    sourceLabelKeys: {
      'FRED:DGS10': 'dashboard.sources.us10y',
      'FRED:DTWEXBGS': 'dashboard.sources.dxy',
      'FRED:M2SL': 'dashboard.sources.m2',
    },
    next: null,
  },
};

/** All views in spine order — throws on a broken or cyclic spine so a bad
 *  registry edit fails every consumer loudly instead of reordering silently. */
export function viewOrder(): MarketViewDef[] {
  const ordered: MarketViewDef[] = [];
  const seen = new Set<string>();
  let cursor: string | null = MARKET_VIEW_SPINE_START;
  while (cursor !== null) {
    if (seen.has(cursor)) throw new Error(`market view spine cycle at "${cursor}"`);
    const def: MarketViewDef | undefined = MARKET_VIEWS[cursor];
    if (!def) throw new Error(`market view spine points at unknown slug "${cursor}"`);
    seen.add(cursor);
    ordered.push(def);
    cursor = def.next;
  }
  const missing = Object.keys(MARKET_VIEWS).filter((slug) => !seen.has(slug));
  if (missing.length) {
    throw new Error(`market views not reachable from the spine: ${missing.join(', ')}`);
  }
  return ordered;
}

/** The single view served by /market itself — valid ONLY while a live-at-root
 *  view exists; the general entry point is resolveRootRendering() (M3 v2). */
export function rootView(): MarketViewDef {
  const roots = viewOrder().filter((v) => v.status === 'live-at-root');
  if (roots.length !== 1) {
    throw new Error(`exactly one live-at-root market view required, found ${roots.length}`);
  }
  return roots[0];
}

/** M3 registry-v2 semantics (plan D-M3-1): what does /market render?
 *  - exactly one 'live-at-root' view → that view (today: Bitcoin);
 *  - zero 'live-at-root' AND ≥1 'live' → the UMBRELLA (the M3c activation
 *    state — Bitcoin and Backdrop flip 'live' in one registry edit);
 *  - anything else → throw loudly (a mis-edited registry must never render).
 *  `views` is injectable for tests so both modes are assertable without
 *  flipping the committed statuses. */
export function resolveRootRendering(
  views: Record<string, MarketViewDef> = MARKET_VIEWS
): { mode: 'view'; view: MarketViewDef } | { mode: 'umbrella' } {
  const all = Object.values(views);
  const roots = all.filter((v) => v.status === 'live-at-root');
  if (roots.length === 1) return { mode: 'view', view: roots[0] };
  if (roots.length === 0 && all.some((v) => v.status === 'live')) return { mode: 'umbrella' };
  throw new Error(
    `unrenderable market registry: ${roots.length} live-at-root, ` +
      `${all.filter((v) => v.status === 'live').length} live`
  );
}

/** Slugs routable at /market/<slug> — status 'live' only. */
export function routableViewSlugs(): string[] {
  return viewOrder()
    .filter((v) => v.status === 'live')
    .map((v) => v.slug);
}

export function getRoutableView(slug: string): MarketViewDef | null {
  const def = MARKET_VIEWS[slug];
  return def && def.status === 'live' ? def : null;
}

/** Canonical path for a view. */
export function viewPath(view: MarketViewDef): string {
  return view.status === 'live-at-root' ? '/market' : `/market/${view.slug}`;
}

/** Switcher/umbrella destinations: the root view + live views, spine order.
 *  The switcher renders nothing below two destinations (plan D-M2-6). */
export function switcherDestinations(): MarketViewDef[] {
  return viewOrder().filter((v) => v.status === 'live-at-root' || v.status === 'live');
}
