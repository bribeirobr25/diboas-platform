# diBoaS Platform — Operational Details

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Scope:** Board governance, session histories, design decisions, development process, and operational workflows for the diboas-platform (Next.js frontend).

---

## 1. Governance Structure

The platform shares the same multi-board governance model as the analytics project. Platform-specific decisions are primarily made by the CTO Board, CMO Board, and CEO Board, with input from CLO (compliance), Innovation (features), and Advisory (strategy).

### Platform-Relevant Boards

| Board | Platform Role |
|-------|--------------|
| **CTO Board** | Architecture decisions, technology choices, implementation standards, code quality |
| **CMO Board** | Landing page content, persona voice on platform, localization, UX messaging |
| **CLO Board** | Legal pages, privacy policy, cookie consent, terms of service, geo-blocking |
| **Innovation Board** | Dream Mode, Future You Calculator, Adelaide Market Page |
| **CEO Board** | Launch decisions, subdomain strategy, cross-board coordination |
| **Advisory Board** | Business model validation, fee structure, market positioning |

---

## 2. Architecture Decision Records

### ADR-001: Next.js 15 with App Router

**Decision:** Use Next.js 15 with App Router (not Pages Router)  
**Date:** 2024  
**Rationale:**
- Server Components reduce client bundle size
- Built-in internationalized routing via `[locale]` segments
- Streaming and Suspense for progressive loading
- Better SEO with server-rendered content
- Industry momentum moving toward App Router

**Tradeoffs:**
- App Router still maturing (some edge cases)
- Team needed to learn new patterns (Server vs Client Components)

### ADR-002: Turborepo Monorepo

**Decision:** Turborepo for monorepo management  
**Date:** 2024  
**Rationale:**
- Efficient incremental builds
- Shared packages (@diboas/i18n, @diboas/ui)
- Single repository for all platform code
- Good caching and parallelization

**Structure:** apps/web + packages/i18n + packages/ui

### ADR-003: Component Factory Pattern

**Decision:** All section components use factory pattern with variants  
**Date:** 2025  
**Rationale:**
- Easy to add visual variants without breaking existing code
- Type-safe variant selection
- Clean API: `<Hero variant="fullBackground" />`
- Follows Open/Closed Principle
- Supports A/B testing of visual variants

### ADR-004: CSS Design Tokens (not CSS-in-JS)

**Decision:** CSS custom properties for design tokens  
**Date:** 2025  
**Rationale:**
- Zero runtime cost (unlike styled-components or emotion)
- Server Component compatible (no client-side JavaScript)
- Theme-able without JS
- 2,345 lines of tokens covering all design needs
- Combined with Tailwind for utility classes

### ADR-005: react-intl for Internationalization

**Decision:** react-intl (FormatJS) for i18n  
**Date:** 2025  
**Rationale:**
- ICU message format (industry standard)
- Built-in date/number/currency formatting
- Good TypeScript support
- Supports pluralization and gender
- Active maintenance by FormatJS team

### ADR-006: Server Components as Default

**Decision:** Server Components by default, Client Components only when needed  
**Date:** 2025  
**Rationale:**
- Smaller client bundle (static sections like Hero, Features don't need JavaScript)
- Better Core Web Vitals
- SEO improvements
- Client Components only for: carousels, forms, state management, event handlers

**Rule:** Add `'use client'` only when the component needs interactivity.

### ADR-007: Teal-600 as Primary Brand Color

**Decision:** Use `#0d9488` (teal-600) instead of `#14b8a6` (teal-500) as primary  
**Date:** 2025  
**Rationale:**
- teal-600: 7.3:1 contrast ratio (WCAG AAA) ✅
- teal-500: 4.5:1 contrast ratio (WCAG AA only) ⚠️
- Financial platform requires highest accessibility standards
- teal-500 allowed only as accent with careful context

### ADR-008: Geist Font Family

**Decision:** Geist Sans + Geist Mono (Google Fonts)  
**Date:** 2025  
**Rationale:**
- Modern, clean design
- Excellent readability at all sizes
- Variable font support (smaller file size)
- Good multilingual glyph coverage (Latin, Cyrillic)
- Self-hosted via `next/font` for performance

### ADR-009: Three-Subdomain Strategy

**Decision:** Separate subdomains for marketing, consumer app, and business app  
**Date:** 2024  
**Rationale:**
- Independent deployments per subdomain
- Different security policies per audience
- Marketing: SEO-optimized, public
- Consumer: Authenticated, real-time, financial data
- Business: Enterprise SSO, MFA always, SLA guarantees
- Shared authentication via JWT across subdomains

### ADR-010: Storybook for Component Development

**Decision:** Storybook 9 for UI component documentation and development  
**Date:** 2025  
**Rationale:**
- Visual component catalog
- Isolated component development
- Documentation for design system
- Integration testing of variants
- Design review workflow

---

## 3. Development Process

### Request Flow

```
User visits: https://diboas.com
    ↓
Middleware (middleware.ts):
  - Detects locale (cookie → Accept-Language → default)
  - Redirects to /{locale} (e.g., /en)
  - Applies security headers (CSP, XSS, HSTS)
  - Blocks suspicious request patterns
    ↓
Root Layout (layout.tsx):
  - HTML shell with Geist fonts
  - Global CSS
  - Web vitals tracking
  - Metadata (title, description, favicons)
    ↓
Locale Layout ([locale]/(marketing)/layout.tsx):
  - Locale validation
  - I18n providers (react-intl)
  - Navigation + Footer components
  - Error boundaries
    ↓
Page Component ([locale]/(marketing)/page.tsx):
  - Renders section components
  - Each section uses factory pattern with variants
```

### Code Organization Standards

**Component Anatomy:**
```
ComponentName/
├── index.ts                      # Factory pattern export
├── types.ts                      # TypeScript interfaces
├── ComponentName.module.css      # Component-scoped styles
└── variants/
    ├── ComponentNameDefault/
    │   ├── ComponentNameDefault.tsx
    │   └── ComponentNameDefault.module.css
    └── ComponentNameMinimal/
        ├── ComponentNameMinimal.tsx
        └── ComponentNameMinimal.module.css
```

**Key Rules:**
- Server Components by default (no `'use client'` unless needed)
- TypeScript strict mode
- CSS Modules for component-specific styles
- Design tokens for all colors, spacing, typography
- Translation keys in config files (never hardcode strings)
- Dynamic imports for below-fold components

### Development Commands

```bash
pnpm install              # Install dependencies
pnpm run dev:web          # Start dev server
pnpm run build            # Production build
pnpm run lint             # ESLint
pnpm run format           # Prettier
pnpm run storybook        # Component development
pnpm run lighthouse       # Performance audit
ANALYZE=true pnpm build   # Bundle analysis
```

---

## 4. Design Audit Results

### Overall Score: 7.2/10 (December 2025)

| Category | Score | Status |
|----------|-------|--------|
| Design System Architecture | 8/10 | ✅ Good |
| Accessibility | 6.5/10 | ⚠️ Needs improvement |
| Mobile Experience | 6/10 | ⚠️ Needs improvement |
| Visual Design | 7/10 | ✅ Good |
| Component Patterns | 7.5/10 | ✅ Good |
| User Experience | 6/10 | ⚠️ Needs improvement |

### Critical Findings

**Missing User Flows:** No onboarding, account creation, portfolio management, or transaction history flows. These are all pending (app.diboas.com development).

**Information Architecture:** 83% SEO score. Missing critical pages were identified (some since added). No breadcrumb navigation or sitemap.

**Mobile Visual Hierarchy:** Desktop-first design approach needs conversion to mobile-first. Touch targets below 44px in some areas.

**CTA Hierarchy:** Multiple competing CTAs. Needs clear primary action per page with action-oriented copy.

**Bundle Size:** Current 6.96 MB (189 files). Target: <4 MB (<80 files).

---

## 5. Board Decisions Affecting Platform

### CTO Board Decisions

| Decision | Impact on Platform |
|----------|-------------------|
| Next.js 15 with App Router | Core framework choice |
| TypeScript strict mode | Code quality enforcement |
| Turborepo monorepo | Project structure |
| Server Components default | Performance optimization |
| CSS Design Tokens | Styling architecture |
| Storybook 9 | Component development workflow |
| Sentry for error tracking | Monitoring (installed, awaiting configuration) |
| pnpm 8.15.0 | Package management |

### CMO Board Decisions

| Decision | Impact on Platform |
|----------|-------------------|
| 3 mascots (Acqua, Mystic, Coral) | UI character system |
| 4 locales (EN, PT-BR, ES, DE) | Translation architecture |
| Nubank-inspired 3-part strategy | Content framework |
| Landing page section order | Home page layout |
| B2B and B2C page structure | Site architecture |

### CLO Board Decisions

| Decision | Impact on Platform |
|----------|-------------------|
| Cookie consent GDPR-compliant | CookieConsent component |
| Privacy policy per jurisdiction | Legal pages |
| Terms of service | Legal pages |
| Security headers mandatory | Middleware configuration |
| UK geo-blocking | Middleware routing |

### CEO Board Decisions

| Decision | Impact on Platform |
|----------|-------------------|
| Three subdomains | Deployment architecture |
| Feb 12, 2026 launch (marketing site) | Deadline |
| March "one thing" = daily tasks | App.diboas.com priority |
| Adelaide Market Page | Future platform integration |

---

## 6. Pending Tasks

### Pre-Launch (Immediate)

| Task | Status | Owner |
|------|--------|-------|
| Marketing site content final review | In progress | CMO |
| SEO metadata verification all locales | Complete | CTO |
| Performance optimization (bundle reduction) | Pending | CTO |
| Accessibility improvements (6.5 → 8.0) | Pending | CTO |
| Mobile experience improvements | Pending | CTO |

### Post-Launch (Q1 2026)

| Task | Priority |
|------|----------|
| Waiting list backend (PostgreSQL) | P1 |
| Sentry error monitoring configuration | P1 |
| Database infrastructure setup | P1 |
| Authentication system (NextAuth.js) | P1 |
| Bundle size optimization (6.96MB → <4MB) | P2 |
| Accessibility audit and fixes | P2 |

### Q2 2026

| Task | Priority |
|------|----------|
| app.diboas.com development begins | P0 |
| Transaction wizard implementation | P1 |
| Balance display and management | P1 |
| Real-time WebSocket updates | P2 |
| Provider integrations (Stripe, exchanges) | P1 |

See FUTURE_FEATURES_PLATFORM.md for the complete 60+ feature pending implementation list.

---

## 7. Cross-Project Integration

### Platform ↔ Analytics Touchpoints

| Integration Point | Platform Side | Analytics Side |
|-------------------|-------------- |---------------|
| Adelaide Market Page | Display component | Newsletter content API |
| Strategy Performance | Dashboard widget | Battle Test + Monte Carlo results |
| Market Regime | Status indicator | Regime classifier output |
| Dream Mode | Interactive UI | Monte Carlo projections |
| Future You Calculator | Calculator component | Strategy compound calculations |
| Trigger Alerts | Notification system | Intelligence trigger evaluator |

### Shared Configuration

| Config | Platform | Analytics |
|--------|---------|-----------|
| Strategy names/IDs | UI labels | Strategy engine |
| Protocol list | Display cards | Monitoring |
| Fee structure | Fee calculator UI | Adelaide content |
| Persona definitions | UI personalization | Newsletter generation |
| Locale list | Translation system | Localization engine |

---

## 8. Quality Metrics

### Current Performance (December 2025 Audit)

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | ~75 | 90+ |
| Lighthouse Accessibility | ~80 | 95+ |
| Lighthouse SEO | 83 | 95+ |
| Bundle Size | 6.96 MB | < 4 MB |
| Asset Count | 189 files | < 80 files |
| WCAG Compliance | 6.5/10 | 9.5/10 |
| Color Contrast Failures | 19 | 0 |
| Test Coverage | 0% | 90% |

### Code Quality

- TypeScript strict mode enforced
- ESLint + Prettier configured
- Component factory pattern followed consistently
- Translation keys used (no hardcoded strings)
- Server/Client Component boundaries clearly defined

---

*This document captures the complete operational history and ongoing work for diBoaS Platform as of February 2026.*
