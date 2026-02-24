# Principle 9: Performance & SEO Optimization

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Full codebase performance and SEO review against Principle 9 requirements
**Platform Phase:** Pre-launch / Waitlist

---

## Principle Requirements

From `docs/coding-standards.md`:

- Code splitting for large bundles
- Lazy loading for below-the-fold content
- Image optimization with Next.js Image
- Font optimization with next/font
- API response caching
- Database query optimization (select only needed fields)
- Preload critical resources
- Proper meta tags and structured data

**Performance Targets:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 300KB per route

---

## Findings

### 9.1 Code Splitting & Bundle Optimization

**Status: Compliant**

The codebase implements a comprehensive, multi-layered code splitting strategy.

**webpack splitChunks configuration** (`next.config.js` lines 221-317) defines 9 cache groups with carefully tuned priorities:

| Cache Group | Priority | Target | Max Chunk Size |
|-------------|----------|--------|----------------|
| `framework` | 40 | React, React DOM, Next.js | 200KB (global) |
| `uiLibs` | 35 | Radix UI, Lucide, CVA, clsx, tailwind-merge | 200KB |
| `i18n` | 32 | @formatjs, react-intl, negotiator | 200KB |
| `sections` | 30 | Section components (heaviest code) | 200KB |
| `designSystem` | 25 | Config, styles, lib | 200KB |
| `components` | 20 | Non-section components | 200KB |
| `vendor` | 10 | Remaining node_modules | 150KB |
| `common` | 5 | Shared code (minChunks: 2) | 200KB |
| `default` | -20 | Fallback | 200KB |

**Tree shaking optimizations** (lines 319-328): `usedExports: true`, `sideEffects: false`, `concatenateModules: true`, `innerGraph: true`.

**Package imports optimization** (`experimental.optimizePackageImports`, lines 8-33): 17 packages configured for tree shaking including lucide-react, Radix UI, react-intl, date-fns, lodash-es, and workspace packages.

**Dynamic imports** are used for heavy client components:

| Component | File | Strategy |
|-----------|------|----------|
| `PreDemo` | `apps/web/src/app/[locale]/(landing)/demo/DemoPageContent.tsx` | `dynamic(() => import(...))` with loading skeleton |
| `DreamMode` | `apps/web/src/app/[locale]/(landing)/dream-mode/DreamModePageContent.tsx` | `dynamic(() => import(...))` with loading skeleton |
| `PreDream` | `apps/web/src/components/Sections/DemoLauncher/DemoLauncher.tsx` | `dynamic(() => import(...))` |
| `FeatureShowcaseBenefits` | `apps/web/src/components/Sections/FeatureShowcase/variants/registry.ts` | `dynamic(() => import(...))` |
| Social icons | `apps/web/src/components/Layout/Footer/components/SocialIcon.tsx` | Lazy `import()` per icon |

**Analytics libraries** are all dynamically imported behind consent gates:
- `web-vitals` via `import('web-vitals')` (3 call sites)
- `posthog-js` and `posthog-js/react` via `Promise.all([import(...)])` after consent
- `@sentry/nextjs` via dynamic `import()` in instrumentation
- GA4 via `next/script` with `strategy="afterInteractive"`

**Production compiler** removes console logs and React dev properties.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/next.config.js`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/[locale]/(landing)/demo/DemoPageContent.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/[locale]/(landing)/dream-mode/DreamModePageContent.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/Providers/PostHogProvider.tsx`

---

### 9.2 Image Optimization

**Status: Compliant**

All image rendering in the application uses `next/image` (`Image` component). No raw `<img>` tags were found in application code (the only `<img>` references are in sanitization test files for XSS testing).

**next/image imports** found in 20 component files:
- Navigation: `DesktopNav`, `MinimalNavigation`, `MobileNavHeader`, `MobileSubmenu`
- Sections: `HeroDefault`, `HeroFullBackground`, `ProductCarousel`, `FeatureShowcaseDefault`, `FeatureShowcaseBenefits`, `ProseSection`, `ScenarioCard`, `BgHighlight`, `StickyFeaturesNav`, `OneFeature`, `AppFeaturesCarousel`
- Other: `ShareableCard`, `WaitingListModal`, `LoginScreen`, `DemoHeader`

**Image configuration** (`next.config.js` lines 49-71):
- Modern formats enabled: AVIF and WebP (`formats: ['image/avif', 'image/webp']`)
- Quality settings: `[75, 80]`
- Full device size range: 640 to 3840px
- Proper image sizes: 16 to 384px
- Remote patterns restricted to diboas.com domains
- SVG safety: `dangerouslyAllowSVG` only in non-production
- CSP for images: `"default-src 'self'; script-src 'none'; sandbox;"`

**`sizes` prop usage** -- critical for responsive image optimization. All `fill` images properly include the `sizes` prop:

| Component | `sizes` Value |
|-----------|--------------|
| `HeroFullBackground` (desktop) | `'(min-width: 1024px) 100vw, 0px'` or `'100vw'` |
| `HeroFullBackground` (mobile) | `'(max-width: 1023px) 100vw, 0px'` |
| `ProductCarousel` | Dynamic `imageSizes` prop |
| `ScenarioCard` | `'(max-width: 768px) 100vw, 33vw'` |
| `FeatureShowcaseDefault` | `'(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px'` |
| `FeatureShowcaseBenefits` | `'(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 320px'` |
| `StickyFeaturesNav` | `'(max-width: 768px) 100vw, 50vw'` |
| `BgHighlight` | `'100vw'` |
| `ShareableCard` | `'(max-width: 768px) 100vw, 400px'` |
| `ProseSection` | `'(max-width: 768px) 100vw, 40vw'` |
| `DesktopNav` banner | `'(max-width: 768px) 100vw, 384px'` |
| `MobileSubmenu` banner | `'(max-width: 768px) 384px, 384px'` |

**Gap identified:** `WaitingListModal` uses `fill` and `priority` but is missing the `sizes` prop (line 96). Next.js defaults to `100vw` when `sizes` is omitted on `fill` images, which causes the browser to download unnecessarily large images.

**`priority` prop** is correctly applied to above-the-fold images:
- `HeroFullBackground` -- both desktop and mobile hero images have `priority`
- `MobileSubmenu` and `DesktopNav` banners have `priority` for navigation images
- `WaitingListModal` banner has `priority` (shown in modal overlay)
- `ProductCarousel` conditionally applies `priority` to the first N slides

**`alt` text** -- all Image components include alt text, either from config objects (`imageAlt`, `seo.imageAlt`), i18n translations (`intl.formatMessage`), or constant brand names. Decorative background images correctly use `alt=""`.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/WaitingList/WaitingListModal.tsx` (missing `sizes`)
- All 20 files listed above with `next/image` imports

**Recommendation:** Add `sizes="(max-width: 768px) 100vw, 50vw"` to the `WaitingListModal` Image component.

---

### 9.3 Font Optimization

**Status: Compliant**

Font loading is properly configured using `next/font/google` with all recommended optimizations.

**Configuration** (`apps/web/src/app/layout.tsx` lines 13-20):
```typescript
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',          // Prevents FOIT (Flash of Invisible Text)
  preload: true,             // Preloads font files
  adjustFontFallback: true,  // Reduces CLS from font swap
  fallback: ['system-ui', 'arial'],
});
```

Key optimizations:
- **Self-hosted**: Uses `next/font/google` which self-hosts fonts at build time (no external Google Fonts requests at runtime). Comment on line 61 confirms: "Google Fonts removed for GDPR compliance - using next/font/google self-hosted"
- **`display: 'swap'`**: Ensures text is visible immediately with fallback font, preventing FOIT
- **`preload: true`**: Critical font files are preloaded via `<link rel="preload">`
- **`adjustFontFallback: true`**: Automatically adjusts the fallback font metrics to minimize CLS
- **CSS variable**: Font applied via `--font-inter` CSS variable, enabling consistent usage throughout
- **Tailwind integration**: `fontFamily.sans` configured as `['Inter', 'system-ui', 'sans-serif']` in `tailwind.config.ts`
- **Immutable caching**: Font files served with `Cache-Control: public, max-age=31536000, immutable` (`next.config.js` line 114)

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/layout.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/tailwind.config.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/next.config.js` (cache headers)

---

### 9.4 API Response Caching

**Status: Compliant**

API routes implement appropriate caching strategies based on their nature (read-only vs. mutation).

| Route | Cache Strategy | Evidence |
|-------|---------------|----------|
| `GET /api/waitlist/stats` | `public, max-age=300, s-maxage=300, stale-while-revalidate=60` + `revalidate = 300` | Read-only stats endpoint; 5-minute cache |
| `GET /api/og/share` | `public, max-age=3600, stale-while-revalidate=86400` | OG image generation; 1hr cache, 24hr SWR |
| `GET /api/og/dream` | `public, max-age=3600, stale-while-revalidate=86400` | OG image generation; 1hr cache, 24hr SWR |
| `GET /api/health` | `no-store, no-cache, must-revalidate` | Health checks must be real-time |
| `POST /api/waitlist/signup` | No caching (mutation) | Correct -- mutations should not be cached |
| `POST /api/consent` | No caching (mutation) | Correct -- consent changes must be immediate |
| `GET /api/consent` | No caching | Correct -- consent state must be current |

**Static asset caching** (`next.config.js` lines 88-118):
- `/_next/static/(.*)`: `public, max-age=31536000, immutable` (1 year, immutable)
- `/assets/(.*)`: `public, max-age=31536000` (1 year)
- `/fonts/(.*)`: `public, max-age=31536000, immutable` (1 year, immutable)

**Gap identified:** The `GET /api/og/[page]` route (`route.tsx` line 32) does not set `Cache-Control` headers, unlike the `/api/og/share` and `/api/og/dream` routes which properly cache for 1 hour. Since OG images are computationally expensive to generate (using `ImageResponse` on the edge), this route should also include caching headers.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/stats/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/og/share/route.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/og/dream/route.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/og/[page]/route.tsx` (missing cache headers)
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/health/route.ts`

**Recommendation:** Add `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` headers to the `/api/og/[page]` route's `ImageResponse`.

---

### 9.5 Meta Tags & Structured Data

**Status: Compliant**

The codebase implements comprehensive SEO metadata and structured data across all pages.

#### 9.5.1 Metadata Generation

**Every page** uses `generateMetadata()` or `export const metadata`. Audit found:
- **Root layout** (`layout.tsx`): Static `metadata` export with title template, description, icons
- **51 page files** with `generateMetadata()` functions (all landing and marketing pages)
- **MetadataFactory class** provides reusable metadata generation for static and dynamic pages

Metadata includes:
- Title with template pattern (`%s | diBoaS`)
- Description from i18n or SEO config
- Keywords per page
- `alternates.canonical` with proper locale paths
- `alternates.languages` with all 4 locales + `x-default`
- OpenGraph: title, description, type, locale, url, siteName, images (1200x630)
- Twitter Card: `summary_large_image`, title, description, images
- `robots: { index: true, follow: true }`
- `metadataBase` URL set for absolute URL resolution
- Google/Yandex site verification support

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/seo/metadata-factory.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/seo/service.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/seo/constants.ts` (47 page SEO configs)

#### 9.5.2 Structured Data (JSON-LD)

The root layout injects **Organization** structured data inline (`layout.tsx` lines 65-78). Additionally, the `StructuredData` component and `MetadataFactory` generate page-specific structured data:

| Schema Type | Usage |
|-------------|-------|
| `Organization` | Root layout + all pages via MetadataFactory |
| `WebPage` | All static pages via MetadataFactory |
| `BreadcrumbList` | Landing pages (B2C, B2B) |
| `Service` | Personal, business, rewards, and security pages |
| `Course` | Learn center pages |
| `FAQPage` | FAQ page with 7 default questions |

**55 files** reference `schema.org` or structured data patterns.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/SEO/StructuredData.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/seo/metadata-factory.ts`

#### 9.5.3 Sitemap

Dynamic sitemap generation at `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/sitemap.ts`:
- Pulls URLs from `navigationConfig.mainMenu`, `mobileHighlights`, and `PAGE_SEO_CONFIG`
- Generates entries for all 4 locales
- Includes `alternates.languages` (hreflang) for each entry
- Sets `changeFrequency` (daily for home, weekly for others)
- Sets `priority` (1.0 for home, 0.8 for others)

#### 9.5.4 Robots.txt

Static file at `/Users/simonekugler/Desktop/diboas-platform/apps/web/public/robots.txt`:
- Disallows `/api/`, `/_next/`, `/admin/`, `/private/` for all bots
- Specific rules for Googlebot and Bingbot
- References `Sitemap: https://diboas.com/sitemap.xml`

#### 9.5.5 OG Image Generation

Three dynamic OG image routes:
- `/api/og/[page]` -- Default branding per page type (B2C, B2B, strategies, future-you)
- `/api/og/share` -- Personalized waitlist position / calculator result cards
- `/api/og/dream` -- Dream mode calculator results

All use `ImageResponse` from `next/og` with standard 1200x630 dimensions, input validation, and sanitization.

#### 9.5.6 Viewport Configuration

Proper viewport export (`layout.tsx` lines 22-30):
- `width: 'device-width'`, `initialScale: 1`, `maximumScale: 5`
- Theme color responsive to `prefers-color-scheme` (light: #ffffff, dark: #0f172a)

---

### 9.6 Bundle Budget Enforcement

**Status: Compliant**

Multiple layers of bundle budget enforcement are in place.

**Layer 1: Native webpack performance hints** (`next.config.js` lines 213-219):
```javascript
config.performance = {
  hints: 'warning',
  maxAssetSize: 300 * 1024,      // 300KB
  maxEntrypointSize: 800 * 1024,  // 800KB
};
```

**Layer 2: Custom WebpackPerformancePlugin** (`next.config.js` lines 191-208):
- Runs at build time in production
- Budgets: 300KB max asset, 800KB max entrypoint, 4MB max total, 40 max assets
- Generates detailed `performance-report.json` in `.next/`
- Validates against budgets and logs violations
- `failOnBudgetExceeded: false` (warns but does not break builds)

**Layer 3: Runtime PerformanceBudgetMonitor** (`PerformanceBudgets.ts`):
- Client-side monitoring of Core Web Vitals against budgets
- Section render time monitoring via `MutationObserver`
- Carousel interaction delay monitoring
- Image loading performance monitoring via `PerformanceObserver`
- Hourly and daily automated budget checks
- Alert integration via `AlertingService` for violations

**Layer 4: Performance thresholds** (`performance-thresholds.ts`):
- Web Vitals: LCP good < 2500ms, FID good < 100ms, CLS good < 0.1 (matches targets)
- Bundle sizes: JS good < 250KB, CSS good < 50KB, images good < 500KB, fonts good < 100KB
- API response time: good < 100ms
- System metrics: memory, CPU, disk, network

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/performance/webpack-performance-plugin.js`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/performance/PerformanceBudgets.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/performance-thresholds.ts`

---

### 9.7 Web Vitals Tracking

**Status: Compliant**

Web Vitals tracking is implemented with multiple layers of redundancy.

**Primary tracker**: `WebVitalsTracker` component (`apps/web/src/components/Performance/WebVitalsTracker.tsx`):
- Mounted in root layout for all pages
- GDPR-compliant: only tracks after analytics consent
- Sample rate configurable (10% in production)
- Dynamically imports `web-vitals` library (no SSR bundle impact)
- Tracks: FCP, LCP, CLS, TTFB, INP
- Deduplicates metrics via `trackedMetrics` ref set
- Reports to `performanceService` and Google Analytics
- Listens for consent changes via `cookie-consent-changed` event
- Proper cleanup on unmount

**Secondary tracker**: `initializeWebVitals()` in `apps/web/src/lib/analytics/web-vitals.ts`:
- Batches vitals (sends when 3+ accumulated)
- Sends remaining on `beforeunload`
- Proper cleanup of `beforeunload` listener

**Performance thresholds** match Google's Core Web Vitals standards:
- LCP: good <= 2500ms, poor > 4000ms
- FID: good <= 100ms, poor > 300ms
- CLS: good <= 0.1, poor > 0.25
- INP: good <= 200ms, poor > 500ms

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/Performance/WebVitalsTracker.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/analytics/web-vitals.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/performance-thresholds.ts`

---

### 9.8 Preload Critical Resources

**Status: Compliant**

Critical resource preloading is configured:

1. **Font preloading**: `preload: true` in `next/font/google` Inter configuration ensures font files are preloaded via `<link rel="preload">` automatically by Next.js.

2. **DNS prefetching** (`layout.tsx` lines 62-64):
   - `<link rel="preconnect" href="https://vitals.vercel-analytics.com" />`
   - `<link rel="dns-prefetch" href="https://diboas.com" />`
   - `<link rel="dns-prefetch" href="https://cdn.diboas.com" />`
   - `X-DNS-Prefetch-Control: on` header set in `next.config.js`

3. **Image priority loading**: Above-fold hero images use `priority` prop on `next/image`, which automatically adds `<link rel="preload">` for those images.

4. **Script loading strategy**: GA4 scripts use `strategy="afterInteractive"` to avoid blocking critical rendering path.

**Minor gap:** No explicit `<link rel="preload">` for critical CSS or design tokens. However, Next.js automatically inlines critical CSS in production builds, making this a non-issue for the current setup.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/layout.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/next.config.js`

---

### 9.9 CSS Optimization

**Status: Compliant**

Multiple CSS optimization strategies are in place:

1. **Experimental CSS optimization**: `optimizeCss: true` in `next.config.js` line 7 enables CSS minification and optimization at build time.

2. **Tailwind CSS purging** (`tailwind.config.ts` lines 83-89):
   ```typescript
   content: [
     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/styles/**/*.css",
     "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   ```
   All content paths are specified, ensuring unused CSS classes are purged in production.

3. **CSS Modules**: Components use CSS Modules (`.module.css` files) for scoped styling, preventing style bloat and class name collisions.

4. **`prefers-reduced-motion` compliance**: Found in 10+ files including CSS module files for sections (`HeroFullBackground`, `ProductCarousel`, `FeatureShowcase`, `ScenarioCards`, `ProseSection`, `DemoLauncher`, `FeeTable`) and design tokens. All animations respect user motion preferences.

5. **Compression**: `compress: true` in `next.config.js` enables gzip compression for all responses.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/tailwind.config.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/next.config.js`

---

### 9.10 Route-Level Loading & Error States

**Status: Compliant**

Route group `loading.tsx` files provide instant loading UI for route transitions, reducing perceived latency:
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/[locale]/(marketing)/loading.tsx`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/[locale]/(landing)/loading.tsx`

These wrap route content in React Suspense boundaries, showing skeleton UI while the page component streams.

---

### 9.11 Database Query Optimization

**Status: N/A**

The platform is in pre-launch/waitlist phase. There are no database connections. The waitlist store uses an in-memory data structure. When a database is introduced, this requirement should be revisited to ensure:
- SELECT only needed fields (no `SELECT *`)
- Proper indexing for query patterns
- Connection pooling
- Query result caching where appropriate

---

### 9.12 Security Headers for Performance

**Status: Compliant**

Performance-relevant security headers are configured (`next.config.js`):
- `X-DNS-Prefetch-Control: on` -- enables DNS prefetching for faster navigation
- `poweredByHeader: false` -- removes `X-Powered-By` header (smaller response)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` -- HSTS preload for faster HTTPS

**Standalone output**: `output: 'standalone'` in production for minimal Docker image size.

---

## Summary

| Sub-Requirement | Status | Notes |
|----------------|--------|-------|
| 9.1 Code Splitting | Compliant | 9 cache groups, dynamic imports, tree shaking, 17 optimized packages |
| 9.2 Image Optimization | Compliant | All images use next/image; 1 minor `sizes` gap in WaitingListModal |
| 9.3 Font Optimization | Compliant | next/font/google with swap, preload, fallback adjustment |
| 9.4 API Response Caching | Compliant | Proper caching on read endpoints; 1 OG route missing headers |
| 9.5 Meta Tags & Structured Data | Compliant | 51 pages with generateMetadata, 6 schema types, sitemap, robots.txt, OG images |
| 9.6 Bundle Budget Enforcement | Compliant | 4-layer enforcement: webpack hints, custom plugin, runtime monitor, thresholds |
| 9.7 Web Vitals Tracking | Compliant | GDPR-compliant, consent-gated, sampled, multi-metric, deduplicated |
| 9.8 Preload Critical Resources | Compliant | Font preload, DNS prefetch, image priority, script deferral |
| 9.9 CSS Optimization | Compliant | optimizeCss, Tailwind purging, CSS Modules, reduced-motion, compression |
| 9.10 Loading States | Compliant | Route group loading.tsx for both marketing and landing |
| 9.11 Database Optimization | N/A | Pre-launch phase; no database present |
| 9.12 Security Headers | Compliant | DNS prefetch, HSTS preload, no powered-by header |

**Overall Assessment: Compliant** -- The codebase demonstrates thorough performance and SEO optimization with only minor gaps.

---

## Action Items

| Priority | Item | Location | Effort |
|----------|------|----------|--------|
| Low | Add `sizes` prop to WaitingListModal Image | `apps/web/src/components/WaitingList/WaitingListModal.tsx:96` | Trivial |
| Low | Add `Cache-Control` headers to `/api/og/[page]` route | `apps/web/src/app/api/og/[page]/route.tsx` | Trivial |
| Future | Implement database query optimization standards when DB is introduced | N/A | Medium |
| Future | Consider `content-visibility: auto` for long section lists on landing pages | Section components | Low |
| Future | Consider `next/dynamic` with `ssr: false` for additional heavy client components post-launch | Chart/editor components | Medium |

---

*Audit conducted against the `waitlist-launch` branch at commit `f999c8a`.*
