/**
 * Market view registry drift guard (M2 — `MARKET_MACRO_PROGRAM_2026-08-12`
 * plan v3 §4, the `faqRegistry.test` pattern). Locks the registry to every
 * surface it governs: routing status semantics, the R-4 spine, the SEO
 * config, the i18n namespaces, the data directories, and — per §9 rider 4(e)
 * — the pa11y + Lighthouse page lists, so a view can never go `live` without
 * being measured.
 *
 * M3c (2026-08-12) EXECUTED the named ROUTE-ACTIVATION REWRITE (delete-and-
 * rewrite by design — plan v3 §4): zero live-at-root views, /market renders
 * the umbrella, bitcoin + backdrop route as live subpath views.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  MARKET_VIEWS,
  MARKET_VIEW_SPINE_START,
  viewOrder,
  rootView,
  resolveRootRendering,
  routableViewSlugs,
  getRoutableView,
  viewPath,
  switcherDestinations,
  type MarketViewDef,
} from '../viewRegistry';
import { hasViewDataLoader } from '@/lib/analytics-sdk/mock-client.server';
import { PAGE_SEO_CONFIG } from '@/lib/seo/constants';

const WEB_ROOT = join(__dirname, '../../../..');
const TRANSLATIONS = join(WEB_ROOT, '../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

describe('registry structure (D-M2-2)', () => {
  it('should reach every view from the spine with no cycle', () => {
    const ordered = viewOrder();
    expect(ordered.map((v) => v.slug)).toContain(MARKET_VIEW_SPINE_START);
    expect(ordered).toHaveLength(Object.keys(MARKET_VIEWS).length);
  });

  it('should have zero live-at-root views after the M3c activation', () => {
    // rootView() is the pre-activation accessor and throws loudly at zero
    // roots by design; post-M3c the registry resolves the umbrella instead —
    // a reappearing live-at-root view would silently demote /market back to
    // a single-view page.
    expect(() => rootView()).toThrow();
    expect(resolveRootRendering().mode).toBe('umbrella');
  });

  it('should keep the remaining Bitcoin asymmetry (dataDir) until the 5.92 migration', () => {
    const bitcoin = MARKET_VIEWS.bitcoin;
    // dataDir '.' is the LAST asymmetry — migrating it is pending item 5.92
    // (post-2026-08-17, after the first hands-free run). namespace +
    // seoConfigKey flipped WITH the M3c activation.
    expect(bitcoin.dataDir).toBe('.');
    expect(bitcoin.namespace).toBe('market-bitcoin');
    expect(bitcoin.grammar).toBe('scored');
    expect(bitcoin.seoConfigKey).toBe('market-bitcoin');
  });

  it('should resolve every view data directory on disk', () => {
    for (const view of viewOrder()) {
      const dir = join(WEB_ROOT, 'data/market', view.dataDir === '.' ? '' : view.dataDir);
      expect(existsSync(dir), `data dir missing for view "${view.slug}": ${dir}`).toBe(true);
    }
  });

  it('should have every ROUTABLE view namespace present in all 4 locales', () => {
    // 'announced' entries are registered intent — their namespaces land with
    // their content phase (M3b); the go-live pairing below enforces the full
    // set the moment a view is 'live' or 'live-at-root'.
    for (const view of viewOrder()) {
      if (view.status === 'announced') continue;
      for (const locale of LOCALES) {
        const nsFile = join(TRANSLATIONS, locale, `${view.namespace}.json`);
        expect(existsSync(nsFile), `${locale}/${view.namespace}.json missing`).toBe(true);
      }
    }
  });

  it('should have a data loader for EVERY registered slug (R-1′ invariant)', () => {
    // A registered-but-unloadable view degrades to six silent nulls through
    // the composite catch — this assertion closes that window structurally.
    for (const view of viewOrder()) {
      expect(hasViewDataLoader(view.slug), `no data loader for "${view.slug}"`).toBe(true);
    }
  });
});

describe('routing status semantics (D-M2-1 — the status-flip mechanism)', () => {
  it('should route bitcoin at /market/bitcoin after the M3c activation', () => {
    const bitcoin = getRoutableView('bitcoin');
    expect(bitcoin?.slug).toBe('bitcoin');
    expect(viewPath(bitcoin!)).toBe('/market/bitcoin');
    expect(getRoutableView('backdrop')?.slug).toBe('backdrop');
  });

  it('should not route unknown or announced slugs', () => {
    expect(getRoutableView('gold')).toBeNull();
    expect(getRoutableView('nonsense')).toBeNull();
  });

  it('should keep the routable set (routableViewSlugs) equal to the live set', () => {
    // The [view] page routes via getRoutableView; when 5.67 makes SSG real,
    // its generateStaticParams maps over THIS function (plan §4, reality-
    // corrected in the M2 parity pass — see the [view] page header).
    const live = viewOrder().filter((v) => v.status === 'live');
    expect(routableViewSlugs()).toEqual(live.map((v) => v.slug));
    // M3c state: both views live, spine order (R-4 — never by score).
    expect(routableViewSlugs()).toEqual(['bitcoin', 'backdrop']);
  });
});

describe('registry-v2 root rendering (M3 D-M3-1)', () => {
  const mk = (status: MarketViewDef['status'], slug = 'x'): MarketViewDef => ({
    slug,
    grammar: 'scored',
    status,
    namespace: 'market',
    seoConfigKey: 'market',
    dataDir: '.',
    sourceLabelKeys: {},
    next: null,
  });

  it('should render the umbrella from the REAL registry (the M3c state)', () => {
    expect(resolveRootRendering().mode).toBe('umbrella');
  });

  it('should render a single live-at-root view when one exists (injected)', () => {
    const r = resolveRootRendering({ a: mk('live-at-root', 'a') });
    expect(r.mode).toBe('view');
    if (r.mode === 'view') expect(r.view.slug).toBe('a');
  });

  it('should render the umbrella when zero roots and ≥1 live view (the M3c state)', () => {
    const r = resolveRootRendering({ a: mk('live', 'a'), b: mk('live', 'b') });
    expect(r.mode).toBe('umbrella');
  });

  it('should throw loudly on an unrenderable registry', () => {
    expect(() => resolveRootRendering({ a: mk('announced', 'a') })).toThrow();
    expect(() =>
      resolveRootRendering({ a: mk('live-at-root', 'a'), b: mk('live-at-root', 'b') })
    ).toThrow();
  });
});

describe('go-live pairing (plan §9 rider 4e — measured pages only)', () => {
  const liveViews = () => viewOrder().filter((v) => v.status === 'live');

  it('should give every live view a PAGE_SEO_CONFIG entry (sitemap derivation follows it)', () => {
    for (const view of liveViews()) {
      expect(
        view.seoConfigKey in PAGE_SEO_CONFIG,
        `live view "${view.slug}" has no PAGE_SEO_CONFIG["${view.seoConfigKey}"] entry`
      ).toBe(true);
    }
  });

  it('should register every live view in the pa11y page list', () => {
    const pa11y = JSON.parse(readFileSync(join(WEB_ROOT, '.pa11yci.json'), 'utf8'));
    // pa11y urls are { url, screenCapture } objects, not strings.
    const urls: { url: string }[] = pa11y.urls ?? [];
    for (const view of liveViews()) {
      expect(
        urls.some((u) => u.url.includes(viewPath(view))),
        `live view "${view.slug}" missing from .pa11yci.json`
      ).toBe(true);
    }
  });

  it('should register every live view in the Lighthouse page list', () => {
    const lh = JSON.parse(readFileSync(join(WEB_ROOT, '.lighthouserc.json'), 'utf8'));
    const urls: string[] = lh.ci?.collect?.url ?? [];
    for (const view of liveViews()) {
      expect(
        urls.some((u: string) => u.includes(viewPath(view))),
        `live view "${view.slug}" missing from .lighthouserc.json`
      ).toBe(true);
    }
  });

  it('should give every live view a switcher label key in the shared market namespace', () => {
    const market = JSON.parse(readFileSync(join(TRANSLATIONS, 'en', 'market.json'), 'utf8'));
    for (const view of liveViews()) {
      expect(
        market.views?.[view.slug],
        `live view "${view.slug}" has no market.views.${view.slug} switcher label`
      ).toBeTruthy();
    }
  });
});

describe('switcher visibility (D-M2-6 — M2 ships invisible)', () => {
  it('should expose both destinations after the M3c activation (switcher visible)', () => {
    // The switcher renders null below two destinations; with bitcoin +
    // backdrop live it is now VISIBLE on every view page by design.
    expect(switcherDestinations()).toHaveLength(2);
  });

  it('should order destinations by the spine, never by score (R-4)', () => {
    const slugs = switcherDestinations().map((v) => v.slug);
    const spineOrder = viewOrder()
      .filter((v) => v.status === 'live-at-root' || v.status === 'live')
      .map((v) => v.slug);
    expect(slugs).toEqual(spineOrder);
  });
});
