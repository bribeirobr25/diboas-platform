# Deep Project Review — 2026-02-23

Comprehensive codebase analysis covering architecture, implementation, and every layer of the diBoaS platform.

---

## 1. What Does This Project Do?

diBoaS (Digital Bank of Autonomous Services) is a **unified financial services platform** combining traditional banking, cryptocurrency, and DeFi strategies into a single product. It targets both B2C (personal finance) and B2B (startup treasury management).

**Current state: pre-launch/waitlist phase.** The live web application is a marketing, education, and onboarding site. No production banking features, transactions, or account management are active. The core user-facing functionality today consists of:

- **B2C Landing Page** (`/en`) — 11-section sales page with hero, origin story, product carousel, feature showcase, fee table, social proof, FAQ, and waitlist signup.
- **B2B Landing Page** (`/en/business`) — 9-section treasury management pitch with interactive calculator, app features carousel, benefits cards, and FAQ.
- **PreDemo** (`/en/demo`) — Interactive simulation of the banking app experience (login → deposit → send → buy crypto → wallet details). Uses `useContext` + `useReducer` state machine with 10 screens. No real transactions — all client-side simulation with mock data.
- **PreDream / Dream Mode** (`/en/dream-mode`) — Investment projection simulator. Users select a risk path (conservative/balanced/aggressive), enter amounts, choose a timeframe, and see simulated growth results. Gated behind waitlist membership (checks localStorage). Includes CLO compliance watermark and regional disclaimers.
- **Future You Calculator** (`/en/future-you`) — Financial projection tool showing compound growth over time.
- **Strategies Page** (`/en/strategies`) — Displays 10 investment strategies with risk/reward profiles.
- **Protocols Page** (`/en/protocols`) — Transparency page listing 26 DeFi protocols with TVL data and selection criteria.
- **38 Marketing Pages** — Covering personal banking, business banking, cryptocurrency, DeFi, investing, credit, learning hub (7 pages), rewards program (7 pages), security (3 pages), help center (5 pages), careers, investors, and why-diboas.
- **Waitlist System** — Email signup with position tracking, referral codes, GDPR-compliant data deletion, and Kit.com (ConvertKit) sync via Circuit Breaker pattern. File-based JSON store (`.waitlist-data.json`).
- **Share System** — Canvas-rendered shareable cards for Dream Mode results with platform-specific sharing (Twitter, LinkedIn, Facebook, WhatsApp, Email) and UTM tracking.
- **Cookie Consent** — GDPR-compliant consent banner gating all analytics (PostHog, GA4) behind user approval.
- **Legal Pages** — Privacy policy, terms of use, cookie policy with reusable Legal component system.
- **About Page** — Founder story built around a grandmother narrative.

The platform is **fully internationalized** in 4 languages (English, Brazilian Portuguese, Spanish, German) and serves all content through locale-prefixed routes (`/en/`, `/pt-BR/`, `/es/`, `/de/`).

---

## 2. What Technologies Does This Project Use?

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16 | App Router, SSR, ISR, Edge Functions, Turbopack |
| React | 18 | UI rendering |
| TypeScript | 5.2 | Type safety (strict mode) |
| Tailwind CSS | 3 | Utility-first styling |

### Monorepo & Build
| Technology | Purpose |
|-----------|---------|
| Turborepo | Task orchestration, caching, dependency graph |
| pnpm | 8.15 — Package management with workspaces |
| tsup | Library bundling for packages/ui and packages/i18n |
| Turbopack | Dev server bundler (Next.js 16 default) |
| Webpack | Production bundler with 9-group chunk splitting |

### Internationalization
| Technology | Purpose |
|-----------|---------|
| react-intl | 6.4.7 — Message formatting and locale providers |
| @formatjs/intl-localematcher | Locale negotiation |
| negotiator | Accept-Language header parsing |

### Design System
| Technology | Purpose |
|-----------|---------|
| class-variance-authority (CVA) | Component variant management (Button) |
| clsx | Conditional class names |
| tailwind-merge | Tailwind class conflict resolution |
| AJV | Design token JSON Schema validation |

### Monitoring & Analytics
| Technology | Purpose |
|-----------|---------|
| Sentry (@sentry/nextjs) | Error tracking, tracing (10% prod sample), session replay |
| PostHog | Product analytics (consent-gated, lazy-loaded) |
| Google Analytics 4 | Page/event tracking (consent-gated) |
| web-vitals | Core Web Vitals (FCP, LCP, CLS, TTFB, INP) |

### Security
| Technology | Purpose |
|-----------|---------|
| DOMPurify | Input sanitization (XSS prevention) |
| Upstash Redis | Rate limiting (strict/standard/lenient presets) |
| AES-256-GCM | PII field encryption |
| crypto.randomUUID() | CSP nonce generation per request |

### Testing
| Technology | Purpose |
|-----------|---------|
| Vitest | Unit/integration testing (153 tests) |
| @vitest/coverage-v8 | Code coverage (v8 provider) |
| Lighthouse CI | Performance auditing |
| pa11y | WCAG 2.1 AA accessibility auditing |

### Component Development
| Technology | Purpose |
|-----------|---------|
| Storybook | 9 — Component stories and visual testing |

### Icons
| Technology | Purpose |
|-----------|---------|
| lucide-react | Tree-shakable SVG icon library |

### CI/CD
| Technology | Purpose |
|-----------|---------|
| GitHub Actions | Security audit workflow (weekly + on push/PR) |
| Dependabot | Automated dependency monitoring |

---

## 3. Where Is the Main Entry Point?

The application has several layers of entry points:

### Root Layout (HTML shell)
**`apps/web/src/app/layout.tsx`**
- Generates the `<html>` and `<body>` tags
- Loads Inter font via `next/font/google` (self-hosted for GDPR)
- Injects GA4 consent mode script (defaults to deny)
- Reads CSP nonce from `x-nonce` header
- Wraps children with `PostHogProvider` and `WebVitalsTracker` (10% sample)
- Sets metadata template: `{title} | diBoaS`
- Defines viewport, theme colors, and favicon

### Middleware (request processing)
**`apps/web/middleware.ts`**
- Runs on every non-static request
- Generates CSP nonce via `crypto.randomUUID()`
- Builds full Content-Security-Policy header (nonce-based, no `unsafe-inline` for scripts)
- Detects locale from URL path segment
- Redirects to `/en` if no locale prefix
- Sets `Content-Language` response header

### Route Layouts (per route group)
- **`apps/web/src/app/[locale]/(marketing)/layout.tsx`** — Marketing pages: loads `LocaleProvider` → `I18nProvider` → `PageErrorBoundary` → `WaitingListProvider` → `Navigation` → children → `SiteFooter` → `ScrollDepthTracker` → `CookieConsent`. Only loads `common` namespace at layout level.
- **`apps/web/src/app/[locale]/(landing)/layout.tsx`** — Landing pages: similar provider stack with `MinimalNavigation` instead of full `Navigation`.

### Home Page
**`apps/web/src/app/[locale]/(landing)/page.tsx`** — The B2C landing page with 11 sections, each wrapped in `SectionErrorBoundary`. Loads 7 i18n namespaces (landing-b2c, calculator, waitlist, share, dreamMode, preDemo, preDream).

### Root Page
**`apps/web/src/app/page.tsx`** — Catch-all that redirects to `/en` (default locale).

### Build Entry Points
- **`package.json` (root)** — Defines Turborepo scripts (`pnpm dev:web`, `pnpm build`, etc.)
- **`turbo.json`** — Task dependency graph: `generate:design-tokens` → `build` → `lighthouse`/`pa11y`
- **`next.config.js`** — Webpack/Turbopack configuration, security headers, image optimization, bundle splitting

---

## 4. Folder Structure

```
diboas-platform/
├── apps/
│   └── web/                           # Next.js 16 application
│       ├── src/
│       │   ├── app/                   # App Router
│       │   │   ├── layout.tsx         # Root HTML layout
│       │   │   ├── page.tsx           # Root redirect → /en
│       │   │   ├── error.tsx          # Route-level error boundary
│       │   │   ├── global-error.tsx   # Fatal error boundary
│       │   │   ├── not-found.tsx      # 404 page
│       │   │   ├── sitemap.ts         # XML sitemap generator
│       │   │   ├── globals.css        # Global styles + Tailwind imports
│       │   │   ├── [locale]/
│       │   │   │   ├── (landing)/     # Landing pages (B2C home, about, demo, dream-mode, etc.)
│       │   │   │   │   ├── page.tsx   # B2C home — 11 sections
│       │   │   │   │   ├── about/
│       │   │   │   │   ├── business/  # B2B landing — 9 sections
│       │   │   │   │   ├── demo/      # PreDemo interactive flow
│       │   │   │   │   ├── dream-mode/# Dream Mode simulator
│       │   │   │   │   ├── future-you/# Future projection calculator
│       │   │   │   │   ├── strategies/# 10 investment strategies
│       │   │   │   │   ├── protocols/ # 26 DeFi protocols
│       │   │   │   │   ├── share/     # Share result pages
│       │   │   │   │   ├── legal/     # Privacy, Terms, Cookies
│       │   │   │   │   ├── error.tsx  # Landing error boundary
│       │   │   │   │   └── loading.tsx# Landing Suspense fallback
│       │   │   │   └── (marketing)/   # Marketing content pages
│       │   │   │       ├── layout.tsx  # Providers + Navigation + Footer
│       │   │   │       ├── main/      # Marketing home
│       │   │   │       ├── personal/  # 6 B2C feature pages
│       │   │   │       ├── business/  # 7 B2B feature pages
│       │   │   │       ├── learn/     # 7 education pages
│       │   │   │       ├── rewards/   # 7 gamification pages
│       │   │   │       ├── security/  # 3 security pages
│       │   │   │       ├── help/      # 5 support pages
│       │   │   │       ├── why-diboas/
│       │   │   │       ├── investors/
│       │   │   │       ├── careers/
│       │   │   │       ├── error.tsx  # Marketing error boundary
│       │   │   │       └── loading.tsx# Marketing Suspense fallback
│       │   │   └── api/               # API routes
│       │   │       ├── health/        # Liveness/readiness probes
│       │   │       ├── waitlist/      # Signup, delete, position, referral, stats
│       │   │       ├── og/            # OG image generation (edge runtime)
│       │   │       ├── consent/       # Cookie consent CRUD
│       │   │       └── webhooks/kit/  # Kit.com webhook receiver
│       │   ├── components/
│       │   │   ├── Sections/          # 21 section components (Factory pattern)
│       │   │   │   ├── ProductCarousel/
│       │   │   │   ├── FeatureShowcase/
│       │   │   │   ├── AppFeaturesCarousel/
│       │   │   │   ├── OneFeature/
│       │   │   │   ├── FAQAccordion/
│       │   │   │   ├── SocialProofSection/
│       │   │   │   ├── BenefitsCards/
│       │   │   │   ├── BgHighlight/
│       │   │   │   ├── StepGuide/
│       │   │   │   ├── StickyFeaturesNav/
│       │   │   │   ├── HeroSection/
│       │   │   │   ├── PageHeroSection/
│       │   │   │   ├── SectionContainer/
│       │   │   │   ├── ProseSection/
│       │   │   │   ├── ScenarioCards/
│       │   │   │   ├── FeeTable/
│       │   │   │   ├── CalculatorSection/
│       │   │   │   ├── DemoLauncher/
│       │   │   │   ├── TreasuryCalculator/
│       │   │   │   ├── WaitlistSection/
│       │   │   │   └── index.ts
│       │   │   ├── PreDemo/           # 10-screen interactive demo
│       │   │   ├── PreDream/          # 8-screen dream simulator
│       │   │   ├── DreamMode/         # Full dream mode with focus trap
│       │   │   ├── FutureYouCalculator/
│       │   │   ├── WaitingList/       # Modal, form, provider, referral
│       │   │   ├── CookieConsent/     # GDPR consent banner
│       │   │   ├── Share/             # Social sharing modal
│       │   │   ├── Legal/             # Reusable legal page components
│       │   │   ├── Layout/
│       │   │   │   ├── Navigation/    # Desktop + Mobile + Minimal nav
│       │   │   │   ├── Footer/        # SiteFooter + MinimalFooter
│       │   │   │   ├── ScrollDepthTracker.tsx
│       │   │   │   └── ScrollToHash.tsx
│       │   │   ├── UI/                # Primitives (LocaleLink, Container, etc.)
│       │   │   ├── Icons/             # SVG icon components
│       │   │   ├── LanguageSwitcher/
│       │   │   ├── Providers/         # Context providers
│       │   │   ├── SEO/               # Structured data components
│       │   │   ├── Performance/       # Performance monitoring
│       │   │   ├── ErrorBoundary/
│       │   │   └── Pages/             # Page-level wrappers
│       │   ├── config/                # 37 configuration files
│       │   │   ├── landing-b2c.ts     # B2C page section composition
│       │   │   ├── landing-b2b.ts     # B2B page section composition
│       │   │   ├── navigation.ts      # Menu structure + routes
│       │   │   ├── footer.ts          # Footer content
│       │   │   ├── routes.ts          # All route definitions
│       │   │   ├── env.ts             # Environment variable validation
│       │   │   ├── security.ts        # Security settings
│       │   │   ├── monitoring.ts      # Monitoring configuration
│       │   │   ├── design-system.ts   # Design token mappings
│       │   │   ├── hero.ts / hero-pages.ts
│       │   │   ├── featureShowcase.ts / featureShowcase-pages.ts
│       │   │   ├── faqAccordion.ts / faqAccordion-pages.ts
│       │   │   ├── benefitsCards.ts / benefitsCards-pages.ts
│       │   │   ├── productCarousel.ts
│       │   │   ├── appFeaturesCarousel.ts
│       │   │   ├── oneFeature.ts
│       │   │   ├── stickyFeaturesNav.ts / stickyFeaturesNav-pages.ts
│       │   │   ├── stepGuide.ts
│       │   │   ├── bgHighlight.ts
│       │   │   ├── scenarioCards.ts
│       │   │   ├── feeTable.ts
│       │   │   ├── proseSection.ts
│       │   │   ├── cta.ts
│       │   │   ├── brand.ts
│       │   │   ├── assets.ts
│       │   │   ├── formats.ts
│       │   │   ├── ui-constants.ts
│       │   │   ├── waitlist-stats.ts
│       │   │   ├── performance-thresholds.ts
│       │   │   └── index.ts
│       │   ├── hooks/                 # 5 custom hooks
│       │   │   ├── useCarousel.ts     # Carousel state machine
│       │   │   ├── useFocusTrap.ts    # WCAG focus management
│       │   │   ├── useImageLoading.ts # Image load tracking
│       │   │   ├── useNavigation.ts   # Navigation state
│       │   │   ├── useSwipeGesture.ts # Touch detection
│       │   │   └── __tests__/
│       │   ├── lib/                   # 17 library modules
│       │   │   ├── analytics/         # PostHog, GA4, web-vitals, scroll depth
│       │   │   ├── calculator/        # Financial math functions
│       │   │   ├── dream-mode/        # Dream projections + regional detection
│       │   │   ├── errors/            # Error boundaries, reporting, breadcrumbs
│       │   │   ├── events/            # ApplicationEventBus + SectionEventBus
│       │   │   ├── i18n/              # Config translation, namespace loading
│       │   │   ├── monitoring/        # Alerting, logging, perf monitoring
│       │   │   ├── og/                # OG image templates
│       │   │   ├── performance/       # Budgets, analysis, dynamic loader
│       │   │   ├── pre-demo/          # Demo calculations + formatting
│       │   │   ├── pre-dream/         # Dream calculations + formatting
│       │   │   ├── security/          # Encryption, CSRF, rate limiting, auth, cookies
│       │   │   ├── seo/               # Metadata factory, structured data, helpers
│       │   │   ├── share/             # Canvas rendering, platform handlers, UTM
│       │   │   ├── utils/             # Circuit breaker, fetchWithRetry, sanitize, race condition prevention
│       │   │   ├── waitingList/       # Domain, store, helpers, types
│       │   │   └── colors.ts
│       │   ├── styles/
│       │   │   ├── design-tokens.css  # Auto-generated from config/design-tokens.json
│       │   │   ├── semantic-components.css
│       │   │   └── shared/
│       │   ├── types/                 # global.d.ts, navigation.ts, page.ts
│       │   └── test/                  # setup.ts (Vitest config + mocks)
│       ├── public/
│       │   └── assets/
│       │       ├── icons/             # 28+ AVIF icon files
│       │       ├── images/            # 45+ AVIF product/feature images
│       │       ├── logos/             # 5 AVIF logo variants
│       │       └── navigation/        # 7 AVIF navigation banners
│       ├── middleware.ts              # CSP nonce + i18n locale detection
│       ├── next.config.js             # Webpack, headers, images, splits
│       ├── tailwind.config.ts         # Design token integration
│       ├── vitest.config.mts          # Test configuration
│       ├── eslint.config.mjs          # Flat ESLint config
│       ├── sentry.client.config.ts    # Client Sentry (replay, PII removal)
│       ├── sentry.server.config.ts    # Server Sentry (10% sampling)
│       ├── sentry.edge.config.ts      # Edge Sentry
│       └── .env.example               # Environment template
├── packages/
│   ├── i18n/                          # @diboas/i18n
│   │   ├── src/
│   │   │   ├── config.ts             # SUPPORTED_LOCALES, LOCALE_CONFIG
│   │   │   ├── translations-map.ts   # Static import map for all namespaces
│   │   │   ├── utils.ts              # loadMessages, flattenMessages
│   │   │   ├── provider.tsx           # IntlProvider wrapper
│   │   │   ├── hooks.ts              # useTranslation, useCurrencyFormat
│   │   │   ├── middleware.ts          # Locale detection factory
│   │   │   ├── client.ts             # Client-only exports
│   │   │   ├── server.ts             # Server-only exports
│   │   │   └── index.ts
│   │   ├── translations/
│   │   │   ├── en/                    # 17+ namespace JSON files
│   │   │   ├── pt-BR/
│   │   │   ├── es/
│   │   │   └── de/
│   │   └── scripts/                   # extract-messages, validate-translations
│   └── ui/                            # @diboas/ui
│       └── src/
│           ├── primitives/Button.tsx   # CVA-based button with 7 variants
│           ├── utils/cn.ts            # clsx + tailwind-merge
│           └── index.ts
├── config/
│   ├── design-tokens.json             # Design token definitions (v1.1.0)
│   └── design-tokens.schema.json      # JSON Schema v7 validation
├── scripts/
│   ├── generate-design-tokens.js      # JSON → CSS custom properties
│   ├── validate-design-tokens.js      # Schema + business rule validation
│   └── pre-launch-audit.sh            # 15-point audit script
├── docs/                              # 28+ documentation files
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── component-architecture-pattern.md
│   ├── design-system.md
│   ├── section-components-guide.md
│   ├── internationalization.md
│   ├── analytics-integration.md
│   ├── error-boundary-guide.md
│   ├── security-risk-assessment-condensed.md
│   ├── business.md
│   ├── backend.md
│   ├── api.md
│   ├── operations.md
│   ├── integrations.md
│   ├── user-experience.md
│   ├── ui-ux-onboarding.md
│   ├── audit/                         # Audit reports (code, visual, board-level)
│   ├── crm-email/                     # Kit.com replacement plans
│   └── session-handover-20260223.md
├── .github/
│   ├── workflows/security.yml         # Weekly security audit + PR checks
│   └── dependabot.yml                 # Dependency monitoring
├── CLAUDE.md                          # Project instructions for AI assistants
├── turbo.json                         # Turborepo task configuration
├── pnpm-workspace.yaml                # Workspace: apps/*, packages/*
├── knip.json                          # Dead code detection config
└── package.json                       # Root scripts + devDependencies
```

---

## 5. Documentation Summary

All 28+ documentation files in `docs/` were read in full. Here is a summary of each:

### Core Architecture & Standards

**`docs/architecture.md`**
System architecture overview. Describes the monorepo structure, data flow between packages, Next.js App Router conventions, middleware pipeline, and deployment targets. Covers the provider hierarchy (Locale → I18n → Error → Waitlist → Navigation → Content).

**`docs/coding-standards.md`**
The "12 Principles of Excellence" in full detail: Domain-Driven Design, Event-Driven Architecture, Service Agnostic Abstraction, Code Reusability & DRY, Semantic Naming, File Decoupling, Error Handling & Recovery, Security & Audit, Performance & SEO, Product KPIs & Analytics, Concurrency & Race Conditions, Monitoring & Observability. Each principle includes rules, examples, and anti-patterns.

**`docs/component-architecture-pattern.md`**
Detailed guide for the Factory pattern used in all Section components. Covers the directory structure (Factory → variants → registry → types), config resolution pipeline, analytics integration, and how to add new variants. Includes code examples and naming conventions.

**`docs/design-system.md`**
Design token system documentation. Covers the JSON → CSS pipeline, token categories (brand, typography, spacing, animation, z-index, breakpoints), Tailwind integration, and how to add new tokens. Documents the `DESIGN_SYSTEM` constant in `config/design-system.ts`.

**`docs/section-components-guide.md`**
Usage guide for all 21 section components. Documents props, config shapes, variant options, and composition patterns for building pages from sections. Shows how marketing pages compose sections from page-specific configs.

### Feature Documentation

**`docs/internationalization.md`**
i18n architecture: 4 locales, namespace-based JSON files, client/server split exports, middleware locale detection, `flattenMessages()` for react-intl compatibility, `useConfigTranslation` for config-driven translations. Covers the translation workflow and validation scripts.

**`docs/analytics-integration.md`**
Analytics implementation guide. Covers GA4 consent mode (default deny), PostHog lazy loading behind consent, web-vitals integration (10% sample rate), scroll depth tracking, section event bus analytics bridge, and the error-resilient analytics service.

**`docs/error-boundary-guide.md`**
Error handling patterns: 3-layer boundary system (Root → Route Group → Section), `SectionErrorBoundary` props and usage, error reporting to Sentry, breadcrumb collection, retry mechanisms, and custom fallback UIs.

**`docs/security-risk-assessment-condensed.md`**
Security analysis covering: CSP nonce-based policy, rate limiting presets (Upstash Redis), CSRF protection, input sanitization (DOMPurify), AES-256-GCM encryption for PII, cookie security (HttpOnly, Secure, SameSite), anti-enumeration measures (timing attacks mitigated), and GDPR compliance (Article 17 deletion workflow).

### Business & Product

**`docs/business.md`**
Business logic documentation. Covers the waitlist domain model (signup → position → referral → deletion), B2C and B2B value propositions, the 10 investment strategies, Dream Mode simulation logic, and treasury calculator formulas.

**`docs/backend.md`**
Backend integration details. Documents the API routes, the file-based waitlist store (`.waitlist-data.json`), Kit.com webhook integration, health check system, rate limiting implementation, and the planned migration to Neon PostgreSQL.

**`docs/api.md`**
API documentation for all endpoints: `/api/waitlist/*` (signup, delete, position, referral, stats), `/api/health/*` (live, ready), `/api/consent` (GET/POST/DELETE), `/api/og/*` (edge OG image generation), `/api/webhooks/kit`. Includes request/response schemas, rate limit tiers, and error codes.

**`docs/operations.md`**
Operations guide. Covers deployment workflow, environment variable management, monitoring setup (Sentry, PostHog, GA4), health check integration, and the pre-launch audit script (`pre-launch-audit.sh`).

**`docs/integrations.md`**
Third-party integrations: Kit.com (ConvertKit) for email list management — webhook receiver + subscriber sync via Circuit Breaker; Cal.com for demo booking; Sentry for error tracking; PostHog for product analytics; Google Analytics 4 for page tracking.

**`docs/user-experience.md`**
UX guidelines covering the demo flow, dream mode journey, waitlist signup conversion funnel, navigation patterns, mobile-first responsive design, and accessibility standards.

**`docs/ui-ux-onboarding.md`**
Onboarding design documentation. Details the PreDemo 10-screen flow, Dream Mode 8-screen flow, and waitlist modal interaction patterns. Covers progressive disclosure, delight moments, and conversion optimization.

### Audit Reports

**`docs/audit/RAKIA_UNIFIED_AUDIT_REPORT_FEB2026.md`** — Quality assurance audit
**`docs/audit/CLO_BOARD_UNIFIED_AUDIT_REPORT_FEB2026.md`** — Chief Legal Officer review
**`docs/audit/CMO_BOARD_UNIFIED_AUDIT_REPORT_FEB2026.md`** — Chief Marketing Officer review
**`docs/audit/QR_BOARD_UNIFIED_AUDIT_REPORT_FEB2026.md`** — QA review
**`docs/audit/STRATEGY_BOARD_UNIFIED_AUDIT_REPORT_FEB2026.md`** — Strategy review

**`docs/audit/code/00-overview-20260223.md`** — Original codebase audit findings
**`docs/audit/code/01-12.md`** — 12 files covering each Principle of Excellence audit
**`docs/audit/code/cleanup-20260223.md`** — Cleanup session audit trail (Rounds 1-3)

### Migration Plans

**`docs/crm-email/kit-replacement-analysis.md`** — Analysis of replacing Kit.com with Neon PostgreSQL + Resend
**`docs/crm-email/tier2-implementation-plan.md`** — 5-phase implementation plan for email system migration

### Session History

**`docs/session-handover-20260223.md`** — Previous session handoff with cleanup results and next tasks

---

## 6. Implementation Review — File by File

### Configuration Files

**`next.config.js`** (~378 lines)
- Experimental: `optimizeCss`, `optimizePackageImports` for 17+ packages
- Compiler: `removeConsole` and `reactRemoveProperties` in production
- Image: AVIF/WebP, responsive device sizes, remote patterns for diboas.com CDN
- Security headers: X-Frame-Options DENY, HSTS preload, X-Content-Type-Options nosniff, Permissions-Policy (camera/mic/geo disabled)
- Cache: Static assets 1 year immutable, fonts immutable
- Webpack (prod): 9 cache groups — framework (react/next), uiLibs (@diboas/ui), i18n (@diboas/i18n/react-intl), sections, designSystem, components, vendor, common, default. Max chunk 200KB
- Webpack (dev): All optimizations disabled for speed
- Redirects: /favicon.ico → /favicon.avif
- Sentry: Conditional wrapping, source map upload if token present
- Transpile: @diboas/ui, @diboas/i18n
- Output: Standalone in production

**`middleware.ts`**
- CSP nonce generation per request via `crypto.randomUUID()`
- Full CSP policy: `default-src 'self'`, script-src with nonce, no `unsafe-inline` for scripts, `unsafe-eval` in dev only
- Connect-src allows Vercel analytics, Google Analytics, API endpoints
- Frame-ancestors: none. Object-src: none. Base-uri: self
- Locale detection from URL path, redirect to `/en` if missing

**`turbo.json`**
- `generate:design-tokens` → `build` dependency chain
- `build` outputs: `.next/**`, `dist/**`
- `dev`: no cache, persistent
- `lint`/`type-check`/`test`: depend on `^` (package dependencies)
- `lighthouse`/`pa11y`: depend on `build`

**`tailwind.config.ts`**
- Content paths: apps/web/src, packages/ui/src, packages/i18n/src
- Extended theme: design token colors (primary teal, secondary, neutral, semantic, brand, social), custom screens (sm:640, md:1024, lg:1280, xl:1440, 2xl:1536), font sizes, spacing, animations

**`eslint.config.mjs`** (Flat config, ESLint v9)
- Security rules: no-eval, no-implied-eval, no-new-func, no-script-url
- React: jsx-key (error), no-array-index-key (warn), exhaustive-deps (warn)
- Next.js: no-img-element (warn), no-head-element (error)
- DRY: no-duplicate-imports (error)

**`vitest.config.mts`**
- Environment: node (default)
- Setup: `src/test/setup.ts` (mocks Logger, sets ENCRYPTION_KEY)
- Coverage: v8 provider, text/json/html reporters
- Path alias: `@/*` → `./src/*`

### Styles

**`apps/web/src/styles/design-tokens.css`** (auto-generated)
- CSS custom properties for all token categories
- Font families, weights, responsive sizes
- Spacing scale, animation durations/easing
- Z-index values, breakpoints
- Utility classes: `.typography-*`, `.section-container` with media queries

**`apps/web/src/styles/semantic-components.css`**
- Navigation styles: skip link (visible on focus), keyboard focus indicators
- WCAG-compliant focus ring styling

**`apps/web/src/app/globals.css`**
- Tailwind directives: `@tailwind base/components/utilities`
- Custom component layers
- Design token CSS variable imports

### Assets

**`apps/web/public/assets/`**
- `icons/` — 28+ AVIF files (favicons, feature icons, reward icons, learning icons)
- `images/` — 45+ AVIF files (phone mockups, scenes, lifestyle, hands, cards)
- `logos/` — 5 AVIF files (logo-icon, logo-wordmark, B2B variants)
- `navigation/` — 7 AVIF files (banners for mega-menu dropdowns)

All images are in AVIF format for optimal compression. No PNG/JPG/WebP originals remain in the public directory.

---

## 7. Section & Component Deep Dive

### Section Components (Factory Pattern)

All 21 section components share this architecture:
```
SectionName/
  SectionNameFactory.tsx    # Config resolution, variant selection, analytics
  SectionName.stories.tsx   # Storybook stories
  index.ts                  # Barrel export
  types.ts                  # Props and config interfaces
  variants/
    registry.ts             # Variant name → component mapping
    types.ts                # Variant-specific types
    SectionNameDefault/
      SectionNameDefault.tsx
      index.ts
```

**ProductCarousel** — Auto-playing 3-card center-focused carousel. Cross-fade subtitle animations. Touch/swipe via `useSwipeGesture`. Play/pause controls. Image failure detection pre/post hydration. Analytics: navigation, slide_change, cta_click, play, pause events. Uses `useCarousel` hook with race condition prevention (MutexLock, SafeTimer, SafeInterval, StateMachine).

**FeatureShowcase** — Left-text/right-image layout with slide navigation. Performance monitoring (render time recording). Supports `ctaTarget` for external links. Analytics: navigation, slide changes, CTA clicks.

**AppFeaturesCarousel** — Mobile-first compact carousel variant. Fewer animations for mobile performance. Shares `useCarousel` hook.

**OneFeature** — Single feature display (not a carousel). Feature click analytics with external/internal link handling. Config-driven headings, descriptions, CTA links.

**FAQAccordion** — Accordion expand/collapse. Memoized component. Single 'default' variant. Uses `useConfigTranslation` for i18n.

**SocialProofSection** — Real-time waitlist statistics fetched from `/api/waitlist/stats`. sessionStorage caching (5-minute TTL). Fallback to env config on API failure. Locale-aware number formatting via `Intl.NumberFormat`. AbortController cleanup. No factory pattern — single component.

**BenefitsCards** — Grid of benefit cards with icons/images. Factory with variant map.

**BgHighlight** — Full-width background image with content overlay and gradient.

**StepGuide** — Numbered step-by-step guide with icons per step.

**StickyFeaturesNav** — Sticky navigation that condenses on scroll. Category switching with callbacks. Configurable condense threshold.

**HeroSection** — Hero banner with fullBackground variant for landing pages.

**PageHeroSection** — Marketing page hero with breadcrumbs.

**SectionContainer** — Server component wrapper for consistent section padding/margins.

**ProseSection** — Long-form text content display (origin stories, "what's the catch").

**ScenarioCards** — Real-life scenario cards (B2C landing).

**FeeTable** — Transparent pricing table.

**CalculatorSection** — Wrapper for calculator components.

**DemoLauncher** — Launch button/link for PreDemo/PreDream.

**TreasuryCalculator** — Interactive B2B treasury yield calculator.

**WaitlistSection** — Inline waitlist signup (non-modal).

### Interactive Components

**PreDemo** (10 screens)
State machine via `useContext` + `useReducer`. Screens: Login → Loading → Home → Deposit → Send → Buy → Confirmation → Processing → WalletDetails → DreamMode trigger. Mock data throughout. Sub-components: DemoHeader, DemoFooter, BalanceCard, ActivityFeed, QuickActions, FeeBreakdown, ChainIcons. Body scroll locked on mount. Dynamic import with `ssr: false`.

**PreDream** (8 screens)
State machine via `useContext` + `useReducer`. Screens: Disclaimer → Welcome → PathSelector → Input → Timeframe → Simulation → Results → ShareDream. Three paths: conservative/balanced/aggressive. Math engine for compound growth projections. Regional currency handling.

**DreamMode** (enhanced PreDream)
Full-screen modal behavior. `useFocusTrap` for accessibility. SimulationWatermark component (CLO compliance). Regional disclaimer logic. Gated behind waitlist membership (localStorage check).

**WaitingList**
`WaitingListProvider` — Global context with click interceptor (catches `app.diboas.com` links, opens modal instead). `WaitingListModal` — Full-screen modal with form, success state, referral display. `useWaitlistForm` hook — Form state, validation, submission via `fetchWithRetry`. Referral tracking via URL params and cookies. Analytics: form submissions, impressions.

**CookieConsent**
Async consent check via API endpoint. Consent stored in HttpOnly cookie + localStorage fallback. Version tracking for re-prompting. Analytics gated behind consent. 1500ms initial delay, fade-in animation. Emits CONSENT_GIVEN/WITHDRAWN events.

**Share**
ShareModal with canvas-rendered card preview. Platform handlers: Twitter, LinkedIn, Facebook, WhatsApp, Email. Native Share API with fallbacks. Copy-to-clipboard with success feedback. Download card as image. UTM tracking on shared URLs.

**Legal**
Composable legal components: LegalTableOfContents, LegalContentSection, LegalSubsection, LegalParagraph, LegalTable, LegalList, LegalContactInfo, LegalRetentionList, LegalBackToTop. Auto ID generation from title slugification. Pre-filled content components for Privacy, Terms, Cookies.

---

## 8. Navigation, Footer, lib/, and UI Deep Dive

### Navigation

**Navigation.tsx** — Orchestrator: uses `useNavigation()` hook, closes menu on route change via `usePathname()`, manages body scroll prevention, tracks interactions to analytics.

**DesktopNav.tsx** — Logo + main menu + language switcher + CTA buttons. Mega-menu dropdown on hover with banner image + sub-items grid. Accessible: aria-expanded, aria-haspopup.

**MobileNav.tsx** — Full-screen mobile menu with `useFocusTrap()`. Nested navigation levels (MobileNavHeader → MobileMenuMain → MobileSubmenu). Scrolls to top on submenu open. Back button for parent menu.

**MinimalNavigation.tsx** — Simplified landing-page variant. Flat link structure (For Business, Strategies, Future You, About, Protocols). Hamburger menu on mobile. No mega-menu.

### Footer

**SiteFooter.tsx** — Desktop: column grid. Mobile: accordion sections with expand/collapse. Social icons via lucide-react. Language switcher. Legal info.

**MinimalFooter.tsx** — Landing page variant. Optional tagline and product nav. Locale-conditional regulatory disclosures (MiCA, CVM, BCB, US). Legal links.

### lib/ Directory (17 modules)

**analytics/** — `AnalyticsServiceImpl` singleton with event queuing, batch flush, GA4 + PostHog integration. `AnalyticsResilientService` with retry (maxRetries=3, exponential backoff + jitter), offline detection, failed event re-queueing. Web-vitals integration (FCP, LCP, CLS, TTFB, INP). Scroll depth tracking via IntersectionObserver.

**calculator/** — Financial math: compound interest, DeFi yield, currency conversion.

**dream-mode/** — Investment projections, regional currency detection, scenario calculations.

**errors/** — `ErrorReportingService` singleton: global error handlers, error deduplication via fingerprints, occurrence tracking, breadcrumb collection, Sentry integration, sampling, alert routing. `SectionErrorBoundary`: React error boundary with retry, custom fallback UI, event bus emission.

**events/** — `ApplicationEventBus`: domain events (waitlist, share, dream, consent, webhook). `SectionEventBus`: UI events (carousel, CTA, performance, errors, keyboard). Both: event validation, listener registration, event history audit trail, error isolation, slow event logging (>50ms).

**i18n/** — `useConfigTranslation` for translating config-driven content. `pageNamespaceLoader` for dynamic namespace loading per page.

**monitoring/** — `AlertingService`, `Logger` (structured logging), `PerformanceMonitor` component, performance config/observers/utils, `usePerformanceMonitor` hook.

**og/** — OG image templates for dream mode, share cards, page-specific.

**performance/** — `PerformanceBudgets` class, budget definitions (300KB asset, 800KB entrypoint, 4MB total), analysis utilities, dynamic loader, metric collectors.

**pre-demo/** — Transaction simulation calculations, formatting utilities.

**pre-dream/** — Projection pre-computation, data formatting.

**security/** — `encrypt`/`decrypt` (AES-256-GCM), `checkRateLimit` (Upstash Redis), `validateOrigin`/`csrfProtection`, `generateDeletionToken`/`hashToken`/`verifyToken`, `setConsentCookie`/`getConsentFromRequest`/`clearConsentCookie`, `getIdempotentResponse`/`cacheIdempotentResponse`.

**seo/** — `MetadataFactory` for generating Next.js metadata with locale-aware title/description. SEO constants, helpers, structured data generation.

**share/** — `CardRenderer` (canvas rendering), `ShareManager` (orchestration), `platformHandlers` (Twitter/LinkedIn/Facebook/WhatsApp/Email), UTM tracking, canvas utilities.

**utils/** — `CircuitBreaker` pattern (3 failures → 60s reset), `fetchWithRetry` (2 retries, exponential backoff), `RaceConditionPrevention` (MutexLock, ConcurrencyControl), `sanitize` (DOMPurify), `SafeTimers`, `CleanupManager`.

**waitingList/** — Domain model (`WaitingListDomain`), file-based store, helpers, types.

### UI Components

**LocaleLink** — Auto-prefixes paths with current locale. Skips external URLs.
**Container** — Centralized layout container (sm/md/lg/xl/full).
**FlexBetween** — Flex layout with space-between, polymorphic `as` prop.
**LucideIcon** — Icon wrapper with size system (xs/sm/md/lg/xl). Pre-configured exports: MenuIcon, CloseIcon, ChevronRight/Left, SparklesIcon, NavigationToggle.
**CTAButtonLink** — Link wrapper for CTA buttons. External links get rel="noopener noreferrer". Internal links use Next.js `Link`.
**CurrencyInput** — Currency input with linked range slider. Currency symbol prefix, clamping, unique IDs via `useId()`.
**CarouselDots** — WCAG tablist with role=tablist, aria-selected, aria-label patterns.
**ContentCard** — Memoized card container with 4 variants (default/muted/highlight/accent).
**StrategyCard** — Investment strategy card with risk-level coloring, growth badge, stats grid.

### @diboas/ui Package

**Button.tsx** — CVA-based with 7 variants (primary, secondary, outline, ghost, link, gradient, destructive), 6 sizes (xs, sm, default, lg, xl, icon), loading state with spinner, analytics tracking integration, forwarded ref, UTM support.
**cn.ts** — `twMerge(clsx(inputs))` for class conflict resolution.

---

## 9. SEO, Testing, Deployment, Routing, API, and Database

### SEO

**Sitemap** (`apps/web/src/app/sitemap.ts`) — Generates URLs from `navigationConfig` and `PAGE_SEO_CONFIG`. Home: priority 1.0 daily. Others: 0.8 weekly. Includes `alternates.languages` for hreflang.

**Metadata** — Each page has a `generateMetadata` function loading translations for locale-aware title/description. Marketing pages use `generateStaticPageMetadata(pageKey, locale)`. Breadcrumbs via `MetadataFactory.generateBreadcrumbs()`.

**Structured Data** — Organization JSON-LD in root layout. Breadcrumb JSON-LD per page via `StructuredData` component.

**OG Images** — Edge runtime at `/api/og/[page]`. 1200x630, 24-hour cache. Page types: default, b2c, b2b, strategies, future-you, protocols, about, legal.

**Headers** — Security headers via `next.config.js`. CSP via middleware. `Content-Language` per request.

### Testing

**Configuration** — Vitest with node environment, v8 coverage provider.
**Setup** — Mocked Logger, test encryption key, auto-mock cleanup.
**Test count** — 153 tests passing.
**Coverage targets** — 80% for lib/hooks, 60% for components, 100% for security.
**Test locations** — `lib/errors/__tests__/`, `lib/security/__tests__/`, `lib/utils/__tests__/`, `lib/waitingList/__tests__/`, `hooks/__tests__/`, `app/api/waitlist/__tests__/`.
**Naming convention** — `should [expected behavior] when [condition]`.

### Deployment & Infrastructure

**Build** — Turborepo orchestrates: `generate:design-tokens` → package builds → app build. Standalone output.
**CI/CD** — GitHub Actions: security audit on push/PR/weekly cron. Dependabot for dependency monitoring. Slack alert on vulnerability found.
**Monitoring** — Sentry: 10% trace sampling, session replay with PII masking, hydration error filtering. PostHog: consent-gated. GA4: consent mode default deny. Health check: `/api/health` with Redis + memory checks.
**Infrastructure** — No Dockerfile. Designed for Vercel deployment (edge middleware, ISR, image optimization).

### Routing

**App Router** with two route groups under `[locale]/`:
- `(landing)` — B2C-focused pages with MinimalNavigation
- `(marketing)` — Full marketing site with Navigation + SiteFooter

**Locale routing** — Middleware detects locale from first path segment. Redirects to `/en` if missing. `generateStaticParams()` returns all 4 locales.

**API routes** — All under `/api/` (not locale-prefixed):
- `GET/HEAD /api/health` — Health checks
- `POST /api/waitlist/signup` — Waitlist registration
- `POST /api/waitlist/delete` + `DELETE /api/waitlist/delete` — GDPR deletion
- `GET /api/waitlist/position` — Position check
- `GET /api/waitlist/referral` — Referral tracking
- `GET /api/waitlist/stats` — Waitlist statistics
- `GET/POST/DELETE /api/consent` — Cookie consent
- `GET /api/og/[page]` — OG image generation
- `GET /api/og/dream` — Dream mode OG
- `GET /api/og/share` — Share card OG
- `POST /api/webhooks/kit` — Kit.com webhook

### Database

**Current: No database.** The waitlist uses a file-based JSON store (`.waitlist-data.json`) read/written via Node.js `fs` module. The `WaitingListDomain` class manages CRUD operations, position assignment, and referral code tracking in-memory with file persistence.

**Planned:** Migration to Neon PostgreSQL (free tier) as documented in `docs/crm-email/tier2-implementation-plan.md`.

---

## 10. Internationalization Implementation

### Architecture

**Package:** `@diboas/i18n` (`packages/i18n/`)

**Locales:** en (reference), pt-BR, es, de

**Library:** react-intl 6.4.7 with `@formatjs/intl-localematcher` and `negotiator` for locale detection.

### Translation Structure

Translations are organized by feature namespace in flat JSON files:

```
packages/i18n/translations/
  en/
    common.json          # Navigation, buttons, footer, forms, errors
    home.json            # Marketing home page
    about.json           # About page
    landing-b2c.json     # B2C landing (hero, origin, scenarios, fees, etc.)
    landing-b2b.json     # B2B landing (treasury, calculator, etc.)
    marketing.json       # Marketing copy
    faq.json             # FAQ questions and answers
    dreamMode.json       # Dream Mode UI strings
    calculator.json      # Calculator labels
    preDemo.json         # PreDemo screen text
    preDream.json        # PreDream screen text
    waitlist.json        # Waitlist form, success, referral
    share.json           # Share modal text
    strategies.json      # Investment strategies
    protocols.json       # DeFi protocols
    future-you.json      # Future You calculator
    why-diboas.json      # Why diBoaS page
    careers.json         # Careers page
    investors.json       # Investors page
    legal/               # Privacy, terms, cookies
    personal/            # 6 B2C feature pages
    business/            # 7 B2B feature pages
    learn/               # 7 education pages
    rewards/             # 7 rewards pages
    security/            # 3 security pages
    help/                # 5 help pages
  pt-BR/                 # Same structure, Portuguese
  es/                    # Same structure, Spanish
  de/                    # Same structure, German
```

### Loading Mechanism

**Layout level:** Only `common` namespace loaded (via `flattenMessages`). This keeps the layout bundle minimal.

**Page level:** Each page loads its specific namespaces. For example, the B2C landing loads: `landing-b2c`, `calculator`, `waitlist`, `share`, `dreamMode`, `preDemo`, `preDream`. Marketing pages load their namespace + `home` + `faq`.

**`translations-map.ts`** — Static import map that maps namespace names to their translation file paths. This ensures reliable bundler resolution (no dynamic `require()` at runtime).

**`flattenMessages()`** — Converts nested JSON to dot-notation keys for react-intl compatibility. Example: `{ "hero": { "title": "Welcome" } }` → `{ "hero.title": "Welcome" }`.

**`loadMessages(locale, namespace)`** — Loads a single namespace for a locale, with fallback to English if the translation file is missing.

### Provider Hierarchy

```
Root Layout
  └── [locale] Layout
       └── LocaleProvider(initialLocale)       # Sets locale context
            └── I18nProvider(locale, messages)  # Wraps react-intl IntlProvider
                 └── SetHtmlLang(locale)        # Sets <html lang="...">
                      └── Page Content
```

**I18nProvider** wraps `IntlProvider` from react-intl with error handling for missing translations.

### Client/Server Split

- `packages/i18n/src/server.ts` — Server-only exports (loadMessages, message loading utilities). Does not import React.
- `packages/i18n/src/client.ts` — Client-only exports (hooks: useTranslation, useMessage, useCurrencyFormat, useDateFormat).
- This split prevents bundling React on the server and prevents server-only code from reaching the client bundle.

### Config Translation

**`useConfigTranslation`** hook resolves translation keys in component configs. Section components store i18n keys in their config (e.g., `titleKey: "landing-b2c.hero.title"`), and `useConfigTranslation` resolves them at render time using the current locale's messages.

### Locale Detection Flow

1. Middleware reads first URL segment (e.g., `/pt-BR/about`)
2. If no locale prefix → redirect to `/en`
3. Locale set via cookie (`NEXT_LOCALE`, 30-day TTL)
4. `LocaleProvider` makes locale available via React context
5. `I18nProvider` loads messages for that locale
6. `SetHtmlLang` sets `<html lang>` attribute
7. `LanguageSwitcher` component allows runtime locale change (navigates to new locale prefix)

### Locale-Specific Behavior

**`LOCALE_CONFIG`** in `packages/i18n/src/config.ts` defines per-locale:
- Currency (USD, BRL, EUR, EUR)
- Date format pattern
- Number formatting (decimal/grouping separators)
- Regional data (country, timezone)

**MinimalFooter** renders locale-conditional regulatory disclosures:
- `pt-BR`: CVM + BCB disclaimers
- `de`: MiCA compliance note
- `en`: US regulatory disclaimer
- Each uses locale-specific translation keys

### Content Rendering Pattern

Marketing pages follow a uniform pattern:
1. `generateMetadata()` loads translations for locale-aware `<title>` and `<meta description>`
2. Page component loads page-specific namespaces via `loadPageNamespaces(locale, [...namespaces])`
3. `PageI18nProvider` wraps content with loaded messages
4. Section components receive config objects with translation keys
5. `useConfigTranslation` resolves keys → rendered text
6. Number/currency formatting uses `Intl.NumberFormat` with locale

---

## Summary of Key Findings

### Strengths
1. **Comprehensive error handling** — 3-layer boundary system with Sentry integration, breadcrumbs, and sampling
2. **Security-first approach** — CSP nonce per request, rate limiting, CSRF, encryption, anti-enumeration, GDPR compliance
3. **Performance optimization** — 9-group chunk splitting, 17-package tree shaking, image optimization, web-vitals monitoring
4. **Accessibility** — WCAG 2.1 AA compliance, focus traps, keyboard navigation, semantic HTML, reduced motion respect
5. **Event-driven architecture** — Two event buses (Application + Section) with audit trails and error isolation
6. **Race condition prevention** — MutexLock, SafeTimer, SafeInterval, StateMachine, AbortController patterns throughout
7. **Config-driven pages** — Marketing pages composed from section configs, enabling rapid page creation

### Areas to Note
1. **No database** — Waitlist uses file-based JSON store. Planned migration to Neon PostgreSQL.
2. **Kit.com dependency** — ConvertKit integration for email list. Planned replacement with Resend.
3. **@diboas/ui is minimal** — Only Button primitive + cn utility. Most UI components live in apps/web/src/components/UI/.
4. **38 marketing pages** share nearly identical structure — Hero → FeatureShowcase → BenefitsCards → StickyFeaturesNav → FAQAccordion. Content differentiation is entirely through config objects and translation keys.
5. **All cleanup work from previous session is uncommitted** — Changes are unstaged on the `waitlist-launch` branch.
6. **Image paths were updated best-effort** — Visual verification still needed for replacement images.
