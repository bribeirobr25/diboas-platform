# Frontend Guide

> React components, pages, and UI patterns for the diBoaS pre-launch marketing site.

## 1. Overview

The frontend is a single Next.js 16 application (App Router, Turbopack) deployed at `diboas.com`. It serves as a marketing and onboarding site with waitlist functionality. There are no consumer-app or business-app subdomains; all routes live under `apps/web/`.

Key technologies: TypeScript (strict mode), React 18, Tailwind CSS 3, react-intl (4 locales: en, pt-BR, es, de), Sentry, PostHog (consent-gated), and Storybook 9 for component development.

## 2. Component Architecture

### Factory Pattern with Variants

Section-level components follow a Factory pattern:

```
ComponentName/
  ComponentNameFactory.tsx   # Variant selector
  ComponentName.stories.tsx  # Storybook stories
  index.ts                   # Barrel export
  variants/
    VariantA/
      VariantA.tsx
      index.ts
```

Examples: `HeroSection`, `FAQAccordion`, `BenefitsCards`, `FeatureShowcase`, `OneFeature`, `ProductCarousel`, `AppFeaturesCarousel`, `BgHighlight`, `StepGuide`, `StickyFeaturesNav`, `WaitlistSection`.

### Component Categories

| Directory | Purpose |
|-----------|---------|
| `Sections/` | Page sections (30+ components) with Factory pattern — including the 9-tool calculator suite (`CompoundInterestCalculator`, `EmergencyFundCalculator`, `TimeToTargetCalculator`, `IdleCashCalculator`, `InflationImpactCalculator`, `CurrencyDepreciationCalculator`, `CardFeesCalculator`, plus `Lesson` for `/learn/compound-interest`) |
| `UI/` | Primitives: `CTAButtonLink`, `Container`, `CarouselDots`, `ContentCard`, `CurrencyInput`, `FlexBetween`, `LocaleLink`, `LucideIcon`, `ScrollReveal`, `SocialIcons`, `StickyMobileCTA`, `StrategyCard`, `LessonHero`, `LessonProgressBar`, `CompoundChart`, `DisclaimerNote` |
| `Layout/` | `Footer` (Minimal + Site), `Navigation` (Desktop + Mobile), `ScrollDepthTracker`, `ScrollToHash`, `UtmCapture` |
| `Providers/` | `I18nProvider`, `LocaleProvider`, `PageI18nProvider`, `PostHogProvider`, `SetHtmlLang` |
| `WaitingList/` | Waitlist form, modal, confirmation, referral link, position display |
| `PreDemo/` | Interactive banking demo (client-only, dynamically imported) |
| `PreDream/` | Future-you visualization experience (client-only, dynamically imported) |
| `ErrorBoundary/` | `RouteGroupError`, `RouteGroupLoading`, `PageErrorBoundary`, `NavigationErrorBoundary` |
| `SEO/` | `StructuredData` (JSON-LD injection) |
| `CookieConsent/` | GDPR-compliant cookie consent banner |
| `LanguageSwitcher/` | Locale selection with keyboard navigation |
| `Performance/` | `MonitoringInit`, `WebVitalsTracker`, `PageViewTracker` |
| `Legal/` | `LegalDocument`, privacy/cookie/terms content |
| `Pages/` | Page-level compositions (Protocols, Strategies) |

### Server vs Client Components

`SectionContainer` is a server component (no `'use client'` directive). Most interactive components are client components. Heavy client-only experiences (`PreDemo`, `PreDream`) use `next/dynamic` with `ssr: false`. The `CompoundInterestCalculator` factory accepts an `engine='lesson' | 'tool'` prop (Phase 7 Q7a) — `'lesson'` is the default and uses non-hedged math for `/learn/compound-interest`; tool pages pass `'tool'` to opt into `calculateCompoundProjectionHedged()` for non-USD locale currency hedging.

## 3. Styling

### Tailwind CSS + CSS Modules + Design Tokens

- **Primary:** Tailwind CSS utility classes for layout and spacing.
- **CSS Modules:** Used alongside Tailwind for component-scoped animations and complex states (65+ `.module.css` files across the codebase).
- **Design tokens:** Defined in `apps/web/src/styles/design-tokens.css` as CSS custom properties. Tokens cover typography (3 breakpoint scales), colors, spacing, animation, z-index, and breakpoints.
- **Semantic layer:** `apps/web/src/styles/semantic-components.css` provides reusable class compositions.
- **Shared modules:** `styles/shared/` contains cross-component CSS modules (`carousel-controls.module.css`, `cta-button.module.css`).

All components reference design tokens via CSS custom properties rather than hardcoded values.

## 4. Accessibility (WCAG 2.1 AA)

### Implemented

- **Skip navigation:** The `(landing)` layout includes a skip-to-main-content link, localized via `common.json` translations.
- **Focus trapping:** `useFocusTrap` hook used in modals and mobile navigation (`MobileNav`, `WaitingListModal`, `ExportKeyModal`, `PreDemo`, `PreDream`).
- **Keyboard navigation:** `LanguageSwitcher` handles Escape key with focus return. `useCarousel` handles Arrow keys, Home, End, and Space for play/pause.
- **ARIA attributes:** 124+ usages of `aria-label`, `aria-describedby`, and `aria-live` across 65 files.
- **Reduced motion:** All animations respect `prefers-reduced-motion` (49 files reference it via CSS and JS).
- **Contrast:** Minimum 4.5:1 for text, 3:1 for UI components.
- **Semantic HTML:** Native `<button>` and `<a>` elements for interactive controls. Form groups use `<fieldset>` + `<legend>`.
- **Focus indicators:** Visible focus rings on all interactive elements via Tailwind's `focus-visible:` utilities.

## 5. Performance

### Build-Time Optimization (`next.config.js`)

- **Bundler:** Turbopack — `next build` in Next.js 16 uses Turbopack by default. Do not pass `--webpack` (silently drops middleware; see B1 audit fix). Chunk splitting follows Turbopack's defaults.
- **`experimental.optimizePackageImports`:** Tree-shaking for 17 packages including `lucide-react`, `react-intl`, `@radix-ui/*`, `@diboas/ui`, `@diboas/i18n`.
- **Asset budgets:** Turbopack-aware bundle-budget gate (`scripts/check-bundle-budget.mjs`, run via `pnpm check:budget` after `pnpm build`). Walks `apps/web/.next/static/chunks/*.{js,css}` post-build and fails CI on regression — caps: 650 KB peak asset, 3.7 MB total JS, 500 KB total CSS, 200 JS chunks. Replaced the original webpack-plugin enforcement (was inert under Turbopack — F1 audit 2026-05-08, M3 reworked 2026-05-09).
- **Compiler:** `removeConsole` and `reactRemoveProperties` enabled in production.
- **Compression:** `compress: true` in Next.js config.
- **Standalone output:** Removed 2026-05-08 (W6 audit fix). Vercel handles its own bundling; standalone is for self-hosted Docker only.

### Image Optimization

- **Next.js `<Image>`:** AVIF and WebP formats configured. Device sizes from 640px to 3840px.
- **Priority loading:** Above-fold hero images use `priority` prop.

### Caching

- **Static assets:** Immutable `Cache-Control` headers for `/_next/static/` and `/fonts/`.
- **`SocialProofSection`:** Uses `sessionStorage` cache for waitlist stats (5-minute TTL via `useWaitlistStats`).

### Dynamic Imports

`next/dynamic` with `ssr: false` used for `PreDemo`, `PreDream`, and feature showcase variant registry.

### Performance Targets

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

Tracked via `WebVitalsTracker` and `MonitoringInit` components.

## 6. Responsive Design

### Breakpoints (from `design-tokens.css`)

| Token | Width | Usage |
|-------|-------|-------|
| `--breakpoint-mobile` | 480px | Small phones |
| `--breakpoint-tablet` | 768px | Tablets |
| `--breakpoint-desktop` | 1024px | Laptops (navigation breakpoint) |
| `--breakpoint-wide` | 1280px | Desktop |
| `--breakpoint-ultra` | 1440px | Large displays |

### Approach

- **Mobile-first:** Base styles target mobile; Tailwind responsive prefixes (`md:`, `lg:`, `xl:`) add desktop enhancements.
- **Typography scales:** Design tokens define separate font sizes for mobile, tablet, and desktop.
- **Touch support:** `useSwipeGesture` hook provides swipe-left/right gestures for carousels on touch devices.
- **Mobile navigation:** Dedicated `MobileNav` component with focus trapping and submenu support.
- **Sticky mobile CTA:** `StickyMobileCTA` component for persistent call-to-action on small screens.

## 7. State Management

The pre-launch site uses lightweight client-side state only:

- **`useState` / `useRef`:** Component-local state for forms, carousels, modals, and UI toggles.
- **Context providers:** `LocaleProvider` (current locale), `I18nProvider` / `PageI18nProvider` (translations), `PostHogProvider` (analytics, consent-gated), `WaitingListProvider` (waitlist modal state).
- **`sessionStorage`:** UTM parameters (`useUtmCapture`), waitlist stats cache (`useWaitlistStats`).
- **Race condition prevention:** `useCarousel` uses `StateMachine`, `MutexLock`, `SafeInterval`, and `CleanupManager` from `@/lib/utils/RaceConditionPrevention`.
- **Event bus:** `ApplicationEventBus` for cross-component communication (waitlist signup events propagate stats updates).

No global state library (Redux, Zustand, etc.) is used. No server state fetching library (SWR, React Query) is used.

## 8. Custom Hooks

All hooks live in `apps/web/src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useCarousel` | Carousel state, auto-rotation, keyboard nav, pause-on-hover, swipe integration. Uses mutex locks and state machine for race condition prevention. |
| `useFocusTrap` | Traps keyboard focus within modals/dialogs. Returns focus to trigger element on close. |
| `useImageLoading` | Tracks image load states across multiple images. Fires callback when all images are loaded. |
| `useNavigation` | Navigation open/close state, active menu/submenu tracking, mobile breakpoint detection. |
| `useSwipeGesture` | Touch gesture detection (swipe left/right) for carousel components. Configurable threshold. |
| `useUtmCapture` | Captures UTM parameters from URL on page load, persists to `sessionStorage` for attribution. |
| `useWaitlistStats` | Fetches waitlist stats with `fetchWithRetry`, caches in `sessionStorage` (5-min TTL), listens for real-time updates via `ApplicationEventBus`. |

Additional component-scoped hooks exist in `WaitingList/hooks/` (`useWaitlistForm`, `useWaitlistModalForm`) and `PreDemo/hooks/` (`useScreenTransitionSequence`, `useTimerCleanup`).

## 9. Error Handling

### Error Boundaries (3 layers)

1. **Root:** `global-error.tsx` catches unhandled errors app-wide.
2. **Route group:** `(landing)/error.tsx` catches errors within the landing route group.
3. **Page/component:** `PageErrorBoundary` and `NavigationErrorBoundary` wrap specific UI sections.

### Loading States

- `[locale]/loading.tsx`, `(landing)/loading.tsx` provide Suspense fallbacks per route group.
- `RouteGroupLoading` component provides consistent loading UI.

### API Resilience

- `fetchWithRetry` utility for user-facing API calls (2 retries, exponential backoff).

## 10. SEO

- **Dynamic metadata:** `generateMetadata` in page files produces per-route title, description, Open Graph, and Twitter Card tags.
- **Structured data:** `StructuredData` component injects JSON-LD into pages.
- **OG image generation:** `/api/og` route for dynamic Open Graph images.
- **Sitemap and robots:** Configured for search engine indexing.

---

**For component examples:** Run `pnpm --filter web storybook` (port 6006).
**For design tokens:** See `apps/web/src/styles/design-tokens.css`.
