# diBoaS Platform — Comprehensive Audit Report

**Date:** March 3, 2026  
**Scope:** Full documentation review + source code audit  
**Auditor:** Claude (AI Board Assistant)  
**Status:** DRAFT — Awaiting CEO review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What Was Audited](#2-what-was-audited)
3. [Platform Identity & Positioning](#3-platform-identity--positioning)
4. [Architecture & Tech Stack](#4-architecture--tech-stack)
5. [Landing Pages — Code Audit](#5-landing-pages--code-audit)
6. [PreDemo — Interactive Demo](#6-predemo--interactive-demo)
7. [PreDream — Dream Mode Simulation](#7-predream--dream-mode-simulation)
8. [Waitlist System — Full Stack Audit](#8-waitlist-system--full-stack-audit)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Design System & Tokens](#10-design-system--tokens)
11. [Share & OG Image System](#11-share--og-image-system)
12. [Security Audit](#12-security-audit)
13. [Email System](#13-email-system)
14. [Fee Structure — Cross-Reference Audit](#14-fee-structure--cross-reference-audit)
15. [Compliance & Regulatory](#15-compliance--regulatory)
16. [Analytics & Monitoring](#16-analytics--monitoring)
17. [Navigation, Footer & Layout](#17-navigation-footer--layout)
18. [Documentation vs Code Reality](#18-documentation-vs-code-reality)
19. [Board Audit Findings Status](#19-board-audit-findings-status)
20. [Critical Issues & Recommendations](#20-critical-issues--recommendations)
21. [What's Working Well](#21-whats-working-well)
22. [Open Questions for CEO](#22-open-questions-for-ceo)

---

## 1. Executive Summary

The diBoaS platform is in a pre-launch state with **landing pages, waitlist system, interactive demo, and dream mode fully implemented** as working code. The codebase shows strong engineering discipline in areas like config-driven architecture, i18n, security, and component patterns. However, there are significant gaps between what the documentation describes and what actually exists in code, plus unresolved contradictions in fee structures and regulatory positioning that must be cleaned up before any public launch.

**Current Implementation Completeness:**

| Area | Status | Notes |
|------|--------|-------|
| Landing Pages (B2C, B2B, About, Strategies, Protocols) | ✅ Complete | Config-driven, 11-14 sections each, full i18n |
| Waitlist System | ✅ Complete | Neon PostgreSQL, encrypted PII, 4-tier system, referral engine |
| Interactive Demo (PreDemo) | ✅ Complete | Deposit/Send/Buy flows with real fee calculations |
| Dream Mode (PreDream) | ✅ Complete | Path selection, simulation, results with share |
| Share System + OG Images | ✅ Complete | Edge-rendered OG, ShareModal, platform sharing |
| Email System (Resend) | ✅ Complete | Welcome, referral, GDPR deletion emails |
| i18n (4 locales) | ✅ Complete | EN, DE, ES, PT-BR with namespace loading |
| Legal Pages (Terms, Privacy, Cookies) | ✅ Complete | Locale-aware, proper metadata |
| Middleware (CSP + i18n) | ✅ Complete | Per-request nonce, locale detection |
| Design Tokens | ✅ Complete | 2,345+ lines CSS custom properties |
| Backend Services (Banking, Investing, DeFi) | ❌ Not Started | Only documented in specs |
| Transaction Orchestration | ❌ Not Started | Only documented in specs |
| Provider Integrations (Turnkey, Onramper) | ❌ Not Started | Only documented in specs |
| Real Money Features (Add, Send, Withdraw) | ❌ Not Started | Planned Q2 2026 |
| Adelaide Newsletter | 🟡 Analytics pipeline v3 complete | Newsletter delivery not implemented |

---

## 2. What Was Audited

### Documentation Reviewed (Previous Sessions)

- `/docs/architecture.md` — 3-app Next.js architecture, DDD, monorepo
- `/docs/business.md` — Provider-centric integration requirements
- `/docs/fees.md` v3.4 — CANONICAL fee structure
- `/docs/asset-management.md` — Centralized asset management
- `/docs/user-experience.md` — Transaction wizard framework
- `/docs/ui-ux-onboarding.md` — Design audit 7.2/10
- `/docs/analytics-integration.md` — Dual-layer analytics
- `/docs/coding-standards.md` — 12 Principles of Excellence
- `/docs/security-risk-assessment-condensed.md` — Core technical risks
- `/docs/component-architecture-pattern.md` — FeatureShowcase blueprint
- `/docs/error-boundary-guide.md` — Complete error handling system
- `/docs/icon-library.md` — 25 icons across financial domains
- `/docs/section-components-guide.md` — 11 components, 13 variants
- `/docs/project-structure.md` — Domain-driven monorepo
- `/docs/full-view/diBoaS-V1-Blueprint-FINAL-v1.2.md` — V1 payments MVP scope
- `/docs/audit/` — CLO, QR, Strategy Board audit reports
- `/docs/new-copy/` — Complete localized landing page copy (4 languages)
- `/docs/revenue/` — Fee Lab v3.3 interactive model + audit guide
- `/docs/crm-email/` — Kit.com replacement analysis
- 100+ additional project knowledge files (analytics v3/v4 specs, strategy board sessions, CTO handoffs, CMO deliverables, research reports)

### Source Code Audited (This Session)

**Landing Pages:**
- `apps/web/src/app/[locale]/(landing)/page.tsx` — B2C landing (11 sections)
- `apps/web/src/app/[locale]/(landing)/business/page.tsx` — B2B landing (14 sections)
- `apps/web/src/app/[locale]/(landing)/about/page.tsx` — About page (8 sections + transitions)
- `apps/web/src/app/[locale]/(landing)/strategies/page.tsx` — Strategies (9 sections)
- `apps/web/src/app/[locale]/(landing)/protocols/page.tsx` — Protocols (9 sections)
- `apps/web/src/app/[locale]/(landing)/layout.tsx` — Landing layout with providers
- `apps/web/src/app/[locale]/(landing)/demo/page.tsx` — Demo entry point
- `apps/web/src/app/[locale]/(landing)/dream-mode/page.tsx` — Dream Mode entry point
- `apps/web/src/app/[locale]/(landing)/share/page.tsx` — Share redirect with OG metadata

**Landing Page Configs:**
- `apps/web/src/config/landing-b2c.ts` — B2C 12-section config
- `apps/web/src/config/landing-b2b.ts` (referenced)
- `apps/web/src/config/landing-strategies.ts` (referenced)
- `apps/web/src/config/landing-protocols.ts` (referenced)
- `apps/web/src/config/landing-about.ts` (referenced)

**PreDemo System:**
- `apps/web/src/components/PreDemo/PreDemo.tsx` — Main orchestrator
- `apps/web/src/components/PreDemo/preDemoReducer.ts` — State management
- `apps/web/src/components/PreDemo/types.ts` — TypeScript interfaces
- `apps/web/src/lib/pre-demo/calculations.ts` — Fee calculation engine
- `apps/web/src/lib/pre-demo/constants.ts` — Asset prices, fee rates, chain configs

**PreDream System:**
- `apps/web/src/components/PreDream/PreDream.tsx` — Main orchestrator
- `apps/web/src/components/PreDream/preDreamReducer.ts` — State management
- `apps/web/src/components/PreDream/PreDreamProvider.tsx` — Context provider

**Waitlist System:**
- `apps/web/src/app/api/waitlist/signup/route.ts` — Signup endpoint
- `apps/web/src/app/api/waitlist/position/route.ts` — Position lookup
- `apps/web/src/app/api/waitlist/referral/route.ts` — Referral validation
- `apps/web/src/app/api/waitlist/stats/route.ts` — Waitlist statistics
- `apps/web/src/app/api/waitlist/delete/route.ts` — GDPR deletion
- `apps/web/src/lib/waitingList/store.ts` — Neon PostgreSQL store
- `apps/web/src/lib/waitingList/constants.ts` — Config and validation
- `apps/web/src/lib/database/schema.ts` — TypeScript schema types
- `apps/web/src/lib/database/client.ts` — Neon HTTP driver
- `apps/web/src/components/WaitingList/WaitingListProvider.tsx` — Global provider
- `apps/web/src/components/WaitingList/WaitlistForm.tsx` — Signup form
- `apps/web/src/components/WaitingList/WaitlistConfirmation.tsx` — Post-signup
- `apps/web/src/components/WaitingList/ReferralLink.tsx` — Referral sharing

**i18n System:**
- `apps/web/src/lib/i18n/pageNamespaceLoader.ts` — Server-side namespace loading
- `apps/web/src/lib/i18n/config-translator.ts` — Config translation integration
- `apps/web/src/components/Providers/I18nProvider.tsx` — Root provider
- `apps/web/src/components/Providers/PageI18nProvider.tsx` — Page-level merge provider
- `packages/i18n/translations/` — 4 locale directories with 20+ namespace files each

**Security:**
- `apps/web/src/lib/security/encryption.ts` — AES-256-GCM + HMAC-SHA256
- `apps/web/middleware.ts` — CSP nonce + i18n routing

**Email:**
- `packages/email/src/EmailService.ts` — Email service factory
- `packages/email/src/providers/ResendProvider.ts` — Resend integration
- `apps/web/src/lib/email/deliveryLogger.ts` — Delivery audit logging

**Share & OG:**
- `apps/web/src/components/Share/ShareModal.tsx` — Share orchestrator
- `apps/web/src/app/api/og/share/route.tsx` — Edge OG image generation

**Layout:**
- `apps/web/src/components/Layout/Navigation/MinimalNavigation.tsx`
- `apps/web/src/components/Layout/Footer/MinimalFooter.tsx`

**Design System:**
- `apps/web/src/styles/design-tokens.css` — 2,345+ lines CSS custom properties

**Section Components (via page compositions):**
- HeroSection, FAQAccordion, ProseSection, ScenarioCards, FeeTable, DemoLauncher, ExpandableSection, FounderSection, SocialProofSection, ProductCarouselFactory, WaitlistSection, TwoWorldsSection, DualCtaSection, CashflowExplainerSection, AppFeaturesCarousel, BenefitsCardsSection, CalculatorFactory, SectionContainer, SectionErrorBoundary

---

## 3. Platform Identity & Positioning

### What diBoaS IS (V1 Blueprint — confirmed by CEO)

diBoaS is a **non-custodial orchestration interface** — software that connects users to financial protocols. V1 scope is deliberately narrow: **deposit money, send money, withdraw money.** It is NOT a bank, broker, custodian, DeFi protocol, investment adviser, or money transmitter.

Five non-negotiable principles:
1. Never retain user funds (non-custodial, MPC wallet via Turnkey — zero diBoaS key shares)
2. Never touch fiat directly (Onramper handles all KYC and fiat rails)
3. Never access user private keys
4. Never auto-sign transactions
5. Never hide fees

### The Two Stories Problem (STILL UNRESOLVED)

**Story A — Full OneFi Platform** (80%+ of documentation): Banking + Investing + DeFi, three mascots (Acqua/Mystic/Coral), five domains, yield strategies, portfolio management, DEX swaps, liquidity pools. This describes a product that would take 20-26 weeks and multiple regulatory licenses to build.

**Story B — V1 Payments MVP** (V1 Blueprint + CEO memory edits): Non-custodial orchestration, deposit/send/withdraw, MPC wallet Turnkey, on-ramp Onramper, P2P USDC transfers, web-only, real money Q2 2026.

Both stories are valid — Story A is the vision, Story B is the launch. But **they are not reconciled anywhere in the documentation**. A new developer, board member, or investor reading `/docs` would think they're joining a comprehensive multi-domain fintech. The actual V1 scope is dramatically smaller. This creates confusion, misaligned expectations, and wasted engineering effort.

**Recommendation:** Create a single `SCOPE.md` or `ROADMAP.md` that explicitly maps: "Here is what V1 does. Here is what V2 adds. Here is the full vision." Every other document should reference this as the source of truth for scope.

### Confirmed Technical Decisions (CEO, March 2026)

- MPC wallet via Turnkey (zero diBoaS key shares)
- HYBRID contracts: own contracts for strategy routing/fee collection, direct for other actions
- User deposits USDC → diBoaS contract swaps to sUSDS/other on-chain → user sees USDC value
- On-ramp: 0.48% diBoaS fee ON TOP of provider fees, Onramper handles ALL KYC
- P2P = on-chain USDC transfer, can send to ANY external address
- GTM = all 3 markets (US/EU/Brazil) simultaneously
- Solo founder + AI boards, bootstrapped pre-seed

---

## 4. Architecture & Tech Stack

### What's Actually Running (from `package.json` and code)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | **16.1.5** (per standalone build output) |
| React | React | 18.3.1 |
| TypeScript | TypeScript | 5.2.2 |
| Styling | Tailwind CSS + CSS Modules + Design Tokens | 3.4.17 |
| i18n | react-intl (via @diboas/i18n) | 6.4.7 |
| Database | Neon PostgreSQL (HTTP driver) | @neondatabase/serverless |
| Email | Resend | via @diboas/email package |
| Monitoring | Sentry | @sentry/nextjs 10.25.0 |
| Performance | web-vitals | 5.1.0 |
| Icons | Lucide React | 0.544.0 |
| Component Dev | Storybook | 9.1.10 |
| Package Manager | pnpm | 8.15.0 |
| Monorepo | Turborepo | 2.5.8 |
| Security | DOMPurify, crypto (Node.js built-in) | — |

### Documentation vs Reality — Version Discrepancies

| Item | Documentation Says | Code Actually Uses |
|------|-------------------|-------------------|
| Next.js version | 14 (infrastructure) / 15 (architecture) / 15.5.3 (README) / 16.0.7 (ui-ux-onboarding) | **16.1.5** (standalone build) |
| Font | Inter (design-system doc) | Geist Sans (actual layout) BUT design-tokens.css says Inter |
| State management | Zustand + React Query (business/infrastructure docs) | React Context + useReducer (actual code) |
| API layer | tRPC (business doc) | Next.js API Routes (actual code) |
| Queue system | BullMQ (architecture) / RabbitMQ (backend) | None implemented — not needed for V1 |

**Font Conflict:** `design-tokens.css` declares `--font-family-primary: 'Inter'` but the actual root layout loads Geist Sans via `next/font/google`. This means design tokens don't match the running font. Either update tokens to reference Geist or switch back to Inter.

### Monorepo Structure

```
diboas-platform/
├── apps/
│   └── web/           ← Main Next.js app (only active app)
├── packages/
│   ├── i18n/          ← Shared i18n (translations + utilities)
│   ├── email/         ← Email service (Resend provider)
│   └── ui/            ← Shared UI components (Button, etc.)
├── docs/              ← 100+ documentation files
├── config/            ← Global configuration
└── scripts/           ← Build & utility scripts
```

The architecture is designed for 3 apps (web/app/business) but only `web` currently exists. The `app` and `business` subdomains are not implemented.

---

## 5. Landing Pages — Code Audit

### Page Inventory

| Page | Route | Sections | Status |
|------|-------|----------|--------|
| B2C Landing | `/{locale}` | 11 (Hero, Origin Story, Scenarios, How It Works, Fees, What's the Catch, Under the Hood, Demo, Social Proof, Founder, Waitlist, FAQ, Footer) | ✅ Complete |
| B2B Landing | `/{locale}/business` | 14 (Hero, Two Worlds, Cashflow Calculator, Treasury Calculator, How It Works, Features, Cashflow Investing, Origin Story, Fees, Fit Assessment, Founder, Dual CTA, FAQ, Footer) | ✅ Complete |
| About | `/{locale}/about` | 8 + 4 transitions (Hero, Story, What We Do, Beliefs, Mission, Business CTA, Contact, Waitlist) | ✅ Complete |
| Strategies | `/{locale}/strategies` | 9 (CVM Banner, Hero, Matrix, Cards, Protocol Table, Fee Table, How to Choose, FAQ, Waitlist, Disclaimers) | ✅ Complete |
| Protocols | `/{locale}/protocols` | 9 (CVM Banner, Hero, Intro, Grid, Selection, TVL, Not-Is, FAQ, Waitlist, Disclaimers) | ✅ Complete |
| Demo | `/{locale}/demo` | Full interactive PreDemo experience | ✅ Complete |
| Dream Mode | `/{locale}/dream-mode` | Full PreDream simulation | ✅ Complete |
| Share | `/{locale}/share` | OG metadata generator + redirect | ✅ Complete |
| Legal (Terms) | `/{locale}/legal/terms` | Full terms content | ✅ Complete |
| Legal (Privacy) | `/{locale}/legal/privacy` | Full privacy content | ✅ Complete |
| Legal (Cookies) | `/{locale}/legal/cookies` | Full cookies content | ✅ Complete |

### Architecture Pattern (Excellent)

Every landing page follows a consistent pattern:

1. **Server Component** (`page.tsx`) — loads i18n namespaces, generates metadata, renders structured data
2. **Config Object** (`config/landing-*.ts`) — all content as i18n keys, images, analytics settings
3. **Section Components** — wrapped in `SectionErrorBoundary` with section ID tracking
4. **PageI18nProvider** — merges page-specific translations with layout-level common translations
5. **MinimalFooter** — locale-conditional disclosures (MiCA for DE/ES, CVM for PT-BR, US regulatory for EN)

This is production-quality architecture. The config-driven approach means content changes never require code changes — only translation file updates.

### Section Component Reuse

The same section components are reused across pages with different configs:
- `HeroSection` → B2C, B2B (variant: fullBackground)
- `ProseSection` → B2C Origin Story, B2C Catch, B2B Origin Story
- `FAQAccordion` → B2C (12 items), B2B (10 items), Strategies (10 items), Protocols (8 items)
- `FeeTable` → B2C (8 rows), B2B (different rows), Strategies
- `FounderSection` → B2C, B2B
- `WaitlistSection` → Every page
- `ProductCarouselFactory` → B2C (How It Works), B2C (Persona variant)
- `SectionErrorBoundary` → Wraps every single section on every page

### CVM Banner

Both Strategies and Protocols pages include `<CvmBanner>` before the Hero — this renders the Brazilian CVM mandatory disclaimer for PT-BR locale only. Good regulatory compliance implementation.

### SEO Implementation

Every page has:
- `generateMetadata()` with locale-aware title/description from translations
- Canonical URLs with `alternates.languages` for all 4 locales + x-default
- OpenGraph and Twitter Card metadata
- `StructuredData` component (JSON-LD for Organization and Breadcrumbs)
- Proper `robots` directives (demo/dream-mode set to `noindex`)

---

## 6. PreDemo — Interactive Demo

### Flow

```
Login → Creating Account (loading) → Creating Wallet (loading) → Home →
├── Deposit → Confirm → Processing → Approved → Complete → Home
├── Send → Confirm → Processing → Complete → Home  
├── Buy → Confirm → Processing → Complete → Home
├── Wallet Details
└── Dream Mode → (transitions to PreDream component)
```

### State Management

Uses `useReducer` with a well-typed `PreDemoState`:
- Tracks `cashBalance` (USDC), `solBalance` (for gas), `investments` (assets map)
- Sequential unlock: deposit → send → buy → goals
- Each transaction type has its own reducer action with full fee breakdown
- SOL gas reserve logic: keeps 0.03 SOL for network fees, auto-swaps USDC→SOL when reserve depleted

### Fee Calculations in Demo (Critical Finding)

The PreDemo fee constants (`lib/pre-demo/constants.ts`) match the canonical v3.4 fee structure:

| Action | diBoaS Fee in Demo | Canonical v3.4 |
|--------|-------------------|----------------|
| Deposit (Add Money) | 0.48% | 0.48% ✅ |
| Send | FREE (0%) | FREE ✅ |
| Buy (execution) | 0.39% | 0.39% ✅ |
| Buy min/max | $0.25 / $25 | $0.25 / $25 ✅ |

The demo also shows pass-through fees (card processing 2.9%, network fees, miner fees, swap fees, LP fees) exactly as documented. **This is the most accurate fee representation in the entire codebase.**

### Assets in Demo

- **Enabled for trading:** BTC ($97,250) and XAUT/Tether Gold ($2,945)
- **Visible but disabled:** ETH, SOL, SUI, ETFs (SPY/QQQ/IWM), Stocks (TSLA/GOOGL/NVDA)
- **Chains:** SOL (primary), BTC, ETH, SUI (coming soon), TRX (coming soon)

The disabled assets are Story A features that won't be in V1. They give users a preview of the roadmap without implying availability.

### Accessibility

Good focus management: uses `data-autofocus` attribute and fallback to first focusable element on screen transitions.

---

## 7. PreDream — Dream Mode Simulation

### Flow

```
Disclaimer → Welcome → Path Selector → Input (amount + monthly) → Timeframe → Simulation (animation) → Results
```

### Paths

Three investment paths for the simulation (configured in `lib/pre-dream/constants.ts`):
- Conservative
- Balanced  
- Aggressive

Each path has multipliers per timeframe that determine the simulated DeFi return.

### Calculation

```
totalInvestment = initial + (monthly × months)
defiBalance = totalInvestment × multiplier
bankBalance = totalInvestment × (1 + bankApy/100)^years
difference = defiBalance - bankBalance
```

The simulation compares DeFi returns against a traditional bank APY baseline. Results show total investment, DeFi projected balance, bank balance, and the difference.

### Important: Disclaimer Screen

Dream Mode starts with a mandatory disclaimer screen that must be accepted before proceeding. This is CLO-required — hypothetical performance framing. The disclaimer persists through resets (the `disclaimerAccepted` flag survives `RESET` actions).

### Share Integration

From Results screen, users can share their simulation via the ShareModal (generates a share card image + share URL with OG metadata).

---

## 8. Waitlist System — Full Stack Audit

### Database Schema (Neon PostgreSQL)

Four tables:
1. **`waitlist_entries`** — Core waitlist data
2. **`waitlist_counters`** — Atomic counters (position, entry_id, founding_member_count, founding_member_cap)
3. **`email_delivery_logs`** — Email audit trail
4. **`deletion_tokens`** — GDPR deletion tokens

PII encryption: `email` column is AES-256-GCM encrypted (random IV per row), `email_hash` column is HMAC-SHA256 blind index for deterministic lookups. Same pattern for name.

### Four-Tier System

| Tier | Condition | Permanent |
|------|-----------|-----------|
| `founding_member` | First 1,200 direct signups OR invited while founding cap not full | Yes |
| `early_member` | Invited by founding/early member after cap is full | Yes |
| `priority_waitlist` | Direct signup after cap full, or referrer at invite limit | Yes |
| `standard` | Invited by standard/priority_waitlist tier | Yes |

Tiers are determined at signup and are **permanent** — they never change.

### Referral System

- Each user gets a unique referral code (format: `REF` + 6 alphanumeric chars)
- Founding members and early members can invite up to **5 people**
- When a founding/early member invites someone AND the founding cap isn't full, the invitee gets `founding_member` tier
- When cap is full, invitee gets `early_member` tier
- Standard/priority_waitlist members can still share links, but invitees get `standard` tier
- Referral processing is atomic (PostgreSQL UPDATE with WHERE guards)

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/waitlist/signup` | POST | New signup with email, locale, GDPR consent, optional referral |
| `/api/waitlist/signup` | GET | Status check (anti-enumeration: always returns generic response) |
| `/api/waitlist/position` | GET | Position lookup (anti-enumeration: returns HMAC-derived dummy data for non-existent emails) |
| `/api/waitlist/position` | POST | Internal position update (requires admin auth) |
| `/api/waitlist/referral` | GET | Referral code validation (before signup) |
| `/api/waitlist/stats` | GET | Public stats (count, countries, founding member spots remaining) |
| `/api/waitlist/delete` | POST | GDPR deletion request (generates confirmation token) |
| `/api/waitlist/delete` | DELETE | GDPR deletion confirmation (with token) |

### Security Measures

1. **Anti-enumeration:** Existing signups return identical response structure to new signups. Position lookups return HMAC-derived deterministic dummy values for non-existent emails. GET check endpoint always returns generic response.
2. **Timing attack prevention:** Artificial 100-300ms random delay on lookup endpoints.
3. **Rate limiting:** Redis-backed with in-memory fallback. Strict preset for signups, standard for lookups, lenient for stats.
4. **CSRF protection:** On all mutating endpoints.
5. **Idempotency:** Signup endpoint supports idempotency keys.
6. **Input sanitization:** Email normalization, name sanitization, XSS prevention.
7. **Encryption at rest:** AES-256-GCM for PII, separate HMAC key for blind indexes.

### Email Integration

On successful signup, two fire-and-forget email sends:
1. **Welcome email** to new user (position, referral code, tier badge, founding member spots remaining)
2. **Referral notification** to referrer (if applicable — referral count, invites remaining, tier)

Both use `@diboas/email` package → `ResendProvider` → Resend API. Failures are logged to `email_delivery_logs` but never block the signup response.

### Stats Endpoint

Priority: env variable override → live store data → fallback values. Supports `?fresh=1` for cache bypass after signup. 5-minute cache with stale-while-revalidate.

### GDPR Compliance

Full Article 17 "Right to Erasure" implementation:
1. User requests deletion → server generates token, stores hashed in DB, sends confirmation email
2. User confirms via email link with token → server verifies token, deletes waitlist entry, sends completion email
3. Token expires after 15 minutes
4. Deletion tokens table uses encrypted email + HMAC blind index (same pattern as waitlist entries)

---

## 9. Internationalization (i18n)

### Architecture

```
@diboas/i18n package
├── translations/
│   ├── en/     (20+ JSON files)
│   ├── de/     (20+ JSON files)
│   ├── es/     (20+ JSON files)
│   └── pt-BR/  (20+ JSON files)
├── server exports (loadMessages, flattenMessages, isValidLocale)
└── client exports (I18nProvider, useTranslation)
```

### Namespace System

Each page loads only the namespaces it needs:
- B2C Landing: `landing-b2c`, `calculator`, `waitlist`, `share`, `dreamMode`
- B2B Landing: `landing-b2b`, `waitlist`
- About: `about`, `common`, `waitlist`, `landing-b2c`
- Strategies: `strategies`, `waitlist`, `share`, `common`
- Protocols: `protocols`, `common`, `waitlist`, `landing-b2c`

### Translation Flow

1. **Server:** `loadPageNamespaces()` loads and flattens multiple JSON files with correct prefixes
2. **Layout:** `I18nProvider` wraps app with common translations
3. **Page:** `PageI18nProvider` merges page-specific translations with parent (page overrides parent)
4. **Components:** `useConfigTranslation()` hook auto-translates config objects by detecting translation keys

The `config-translator.ts` system is clever: it recursively walks config objects and resolves any string that looks like a translation key (`namespace.key.path` format). This means configs contain i18n keys as values, and the translation happens transparently at render time.

### Completeness Check

All 4 locale directories have the same file structure (verified: `en/` and `pt-BR/` are identical in structure). Individual key-level completeness was not audited in this session but was previously flagged: **FAQ translations contain legacy fee values (60+ strings with 0.09%/0.9% fees)** — this is a known tech debt item (Issue K, blocked on CMO).

### Locale Detection

Middleware handles locale detection:
1. Check URL path for locale prefix
2. If missing, redirect to `/en{path}` (default locale)
3. Set `Content-Language` response header

Accept-Language / cookie-based detection is NOT in the current middleware — it always defaults to `en`. The docs describe cookie → Accept-Language → default detection, but the code only does path-based.

---

## 10. Design System & Tokens

### CSS Custom Properties (`design-tokens.css`)

2,345+ lines of CSS variables covering:
- Typography: font family (Inter declared, Geist used), weights, sizes (desktop/tablet/mobile), line heights, letter spacing
- Padding: section padding responsive breakpoints, hero/nav specific
- Colors: primary palette, semantic colors, section backgrounds
- Components: buttons, cards, inputs, modals
- Spacing: consistent spacing scale
- Shadows, borders, transitions

### Font Conflict (Issue)

```css
/* design-tokens.css says: */
--font-family-primary: 'Inter', system-ui, ...

/* But layout.tsx loads: */
const geistSans = Geist({ ... });
```

This means the CSS variable `--font-family-primary` doesn't match the actually loaded font. Components referencing the token would render in Inter (or system fallback), while the app shell uses Geist. This needs to be reconciled.

### Semantic Components (`semantic-components.css`)

1,856 lines of semantic component tokens that map design tokens to specific UI patterns. This provides the abstraction layer described in the docs.

---

## 11. Share & OG Image System

### Share Flow

1. User completes waitlist signup or Dream Mode simulation
2. ShareModal opens with card data
3. `CardRenderer` generates a visual card (canvas-based)
4. `ShareManager` handles platform-specific sharing (WhatsApp, Twitter, LinkedIn, copy, download)
5. Each action is tracked via analytics

### OG Image Generation

Edge-rendered at `/api/og/share` using `next/og` (Vercel's `ImageResponse`):
- **Waitlist:** Shows position number, optional name, locale-aware text
- **Calculator:** Shows projected amount, years, strategy
- **Default:** Generic diBoaS branding

The Share page (`/{locale}/share`) generates dynamic OG metadata based on query parameters, then redirects to the main landing page. Social crawlers get the OG tags; users get redirected.

### Share URL Format

```
Waitlist: /share?type=waitlist&position=247&name=John
Calculator: /share?type=calculator&amount=125000&years=10&strategy=balanced
```

---

## 12. Security Audit

### Encryption (AES-256-GCM)

- **Algorithm:** AES-256-GCM with 12-byte random IV per encryption
- **Key management:** 32-byte base64-encoded key from `ENCRYPTION_KEY` env var
- **HMAC:** Separate `HMAC_KEY` env var (falls back to `ENCRYPTION_KEY` in dev)
- **Legacy handling:** Gracefully handles unencrypted data (checks if value looks like email/name before failing decryption)
- **Key rotation notes:** Documented in code — rotating HMAC_KEY breaks all email_hash lookups, rotating ENCRYPTION_KEY breaks stored PII decryption. These are independent operations.

### Content Security Policy

Middleware generates per-request CSP with nonce:
- `script-src 'nonce-{uuid}'` (no `unsafe-inline` in production)
- `style-src 'unsafe-inline'` (still needed for CSS-in-JS)
- `frame-ancestors 'none'` (clickjacking protection)
- `object-src 'none'`
- Connects to: vitals.vercel-analytics.com, api.diboas.com, Google Analytics

### Rate Limiting

Three presets used across endpoints:
- **Strict:** Signup endpoint
- **Standard:** Position lookup, position update
- **Lenient:** Stats, referral lookup

Redis-backed with in-memory fallback.

### Known Security Gaps (from documentation review)

- No MFA implemented (documented as needed for production)
- No WebSocket security (WebSocket not implemented)
- Floating point precision for financial calculations — docs flag "CRITICAL: use Decimal.js" but PreDemo uses native JavaScript `number` type. For demo purposes this is acceptable, but production money handling MUST use Decimal.js or BigInt.

---

## 13. Email System

### Architecture

```
@diboas/email package
├── EmailService.ts      ← Factory function (createEmailService)
├── providers/
│   └── ResendProvider.ts ← Resend API integration
├── templates/
│   ├── welcome.ts
│   ├── referral-success.ts
│   ├── deletion-confirmation.ts
│   └── deletion-complete.ts
├── config.ts            ← From/reply-to addresses
└── types.ts             ← TypeScript interfaces
```

### Email Types

| Template | Trigger | Content |
|----------|---------|---------|
| Welcome | Waitlist signup | Position, referral code, tier badge, founding spots remaining |
| Referral Success | Someone uses your invite | Referral count, invites remaining, tier |
| Deletion Confirmation | GDPR deletion request | Confirmation link with token (15min expiry) |
| Deletion Complete | After confirmed deletion | Confirmation that data has been erased |

### Delivery Logging

Every email send (success or failure) is logged to `email_delivery_logs` with:
- Encrypted recipient email + HMAC blind index
- Template name, subject, locale
- Provider message ID
- Status (sent/failed) + error message
- Timestamps (sent_at, delivered_at, opened_at)

The `delivered_at` and `opened_at` columns exist in schema but webhook-based delivery/open tracking is not yet implemented (empty webhooks directory).

---

## 14. Fee Structure — Cross-Reference Audit

### CANONICAL Fee Structure (fees.md v3.4 — CEO confirmed)

| Action | diBoaS Fee | Third-Party |
|--------|-----------|-------------|
| Add Money (on-ramp) | 0.48% | Card processing (~2.9%) + network — pass-through at cost |
| Cash Out (off-ramp) | 0.48% | Provider fee — pass-through at cost |
| Buy / Invest | **FREE** | Protocol/network fees — pass-through at cost |
| Send | **FREE** | Network fee — pass-through at cost |
| Swap / Bridge | **FREE** | DEX LP fee — pass-through at cost |
| Strategy Entry | **FREE** | Protocol entry fee — pass-through at cost |
| Sell / Close / Strategy Exit | 0.39% ($0.25 min, $25 max) | Protocol/network fees — pass-through at cost |

### Where Fees Are Correct in Code

| Location | Matches v3.4? |
|----------|---------------|
| PreDemo constants (`FEE_RATES.deposit.diboas = 0.0048`) | ✅ 0.48% |
| PreDemo constants (`FEE_RATES.send.diboas = 0`) | ✅ FREE |
| PreDemo constants (`FEE_RATES.buy.diboas = 0.0039`) | ✅ 0.39% |
| PreDemo buy min/max ($0.25/$25) | ✅ Correct |
| B2C FeeTable config (i18n keys) | ✅ Points to translation keys — actual values in translation files |
| B2B FeeTable config (i18n keys) | ✅ Points to translation keys |
| Strategies FeeTable (i18n keys) | ✅ Points to translation keys |
| `/docs/new-copy/Fees-Section.md` | ✅ Matches v3.4 |

### Where Fees Are WRONG (Known Contamination)

| Location | Wrong Value | Should Be |
|----------|-------------|-----------|
| FAQ translations (60+ strings, 4 locales) | 0.09% invest, 0.9% off-ramp | FREE invest, 0.48% ramp, 0.39% sell |
| `/docs/payment-methods.md` | 0.009% platform fee | 0.48% / FREE / 0.39% |
| `/docs/ideation/` | 0.09% invest, 0.5% deposit, $1.99 withdrawal | v3.4 canonical |
| `/docs/backend.md` | 0.5% deposit example | 0.48% |
| Strategy Board Session 006 | 0.75% off-ramp, 0.12% B2B | LEGACY — confirmed replaced |

### Risk Assessment

The FAQ translation contamination is the most dangerous because FAQ pages are user-facing. If the site goes live with FAQ content showing "0.09% on investments" while the actual FeeTable shows "FREE" and the demo charges 0.39% on sells, this creates:
1. **FTC Section 5 violation** (deceptive practices — US)
2. **CVM violation** (misleading fee disclosure — Brazil)
3. **MiCA violation** (cost transparency — EU)
4. User trust destruction on day one

**Status:** Known tech debt (Issue K), blocked on CMO approval for new FAQ copy. The new copy exists in `/docs/new-copy/` but has not been deployed to translation files.

---

## 15. Compliance & Regulatory

### What's Implemented in Code

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| CVM 3-warning banner (Brazil) | ✅ | `CvmBanner` component on Strategies + Protocols pages (PT-BR only) |
| MiCA Article 68 disclosures (EU) | ✅ | Locale-conditional footer disclosures for DE, ES |
| MiCA Article 7 (EU) | ✅ | Footer disclosures for EN, ES, DE |
| US regulatory disclaimers | ✅ | Footer disclosures for EN locale only |
| AI disclosure | ✅ | Footer disclosure (all locales) |
| GDPR Article 17 (Right to Erasure) | ✅ | Full deletion flow with token-based confirmation |
| GDPR consent (waitlist) | ✅ | `gdprAccepted` required field on signup |
| Cookie consent | ✅ | `CookieConsent` component in landing layout |
| Hypothetical performance framing | ✅ | Dream Mode disclaimer screen (mandatory) |
| Geo-blocking | ❌ | NOT implemented — CLO Board flagged as critical gap |
| SB 942 AI disclosure (California) | ❌ | NOT implemented — CLO Board flagged |
| MiCA Article 68 verbatim text | 🟡 | Present in translation keys but needs verification against exact regulatory wording |

### Locale-Conditional Disclosure Logic

The `MinimalFooter` implements smart disclosure filtering:
- `general`, `crypto`, `stories`, `ai`, `closing` → ALL locales
- `mica` → DE, ES only (not PT-BR — they use CVM)
- `micaArticle7` → EN, ES, DE
- `cvm`, `bcb` → PT-BR only
- `us` → EN only

This is well-implemented and correctly separates regulatory requirements by jurisdiction.

### CLO Board Findings (from `/docs/audit/`)

The CLO Board audit flagged **9 critical compliance gaps** and rated the platform **🔴 NOT READY** for launch:
1. Geo-blocking not implemented
2. AI disclosure missing SB 942 compliance
3. CVM 3-warning implementation needs verification
4. MiCA Article 68 needs verbatim text verification
5. 4 conflicting fee claims across documentation
6. Dream Mode / Share Cards PASSED
7. Other gaps in regulatory specifics

**Current status of these findings:** Geo-blocking and SB 942 remain unimplemented. Fee conflicts partially resolved (PreDemo is correct, FAQ still contaminated). CVM banner exists in code. MiCA disclosures exist in footer.

---

## 16. Analytics & Monitoring

### What's Implemented

1. **Client Analytics:** `analyticsService` tracks 25+ events across features (Dream Mode, waitlist, share, calculator, navigation)
2. **Server Events:** `ApplicationEventBus` emits server-side events for signup, referral, errors
3. **Web Vitals:** `WebVitalsTracker` component + `usePerformanceTracking` hook
4. **Scroll Depth:** `ScrollDepthTracker` component in landing layout
5. **Sentry:** `@sentry/nextjs` configured for error reporting
6. **Email Delivery Logging:** Database-backed audit trail for all email sends

### What's Not Implemented

- PostHog provider exists (`PostHogProvider.tsx`) but may not be fully configured
- Prometheus/Grafana monitoring (documented but not implemented)
- Real-time WebSocket updates (documented but not implemented)
- A/B testing infrastructure (documented in CMO specs but not in code)

---

## 17. Navigation, Footer & Layout

### Landing Layout

The `(landing)` route group uses:
- `LocaleProvider` → `I18nProvider` → `PageErrorBoundary` → `WaitingListProvider`
- `MinimalNavigation` (logo + landing page links + language switcher + CTA)
- `CookieConsent` component
- `ScrollDepthTracker`
- `ReferralCapture` (captures `?ref=CODE` from URL into cookie)
- Skip navigation link for accessibility

### MinimalNavigation

Five landing page links: For Business, Strategies, Future You, About, Protocols. CTA button links to Demo page. Mobile hamburger menu with inline language switcher. Desktop language switcher as dropdown.

### MinimalFooter

Modular footer with:
- Optional tagline
- Product nav links (configurable per page)
- Locale-conditional regulatory disclosures
- Legal links (Privacy, Terms, Cookies)
- Brand name + copyright
- Language switcher (dark theme)
- Social media icons (Instagram, Twitter, YouTube, LinkedIn)

### WaitingListProvider (Global Click Interceptor)

Clever pattern: intercepts all clicks on `app.diboas.com` or `localhost:3001` links globally and opens the waitlist modal instead. This means any CTA pointing to the app URL automatically becomes a waitlist capture point. When the app eventually launches, this interceptor can be removed.

---

## 18. Documentation vs Code Reality

### What Docs Describe That EXISTS in Code

| Documented Feature | Code Location | Verified |
|-------------------|---------------|----------|
| Config-driven landing pages | `config/landing-*.ts` + page compositions | ✅ |
| SectionErrorBoundary on all sections | Every page wraps sections | ✅ |
| i18n with 4 locales | `packages/i18n/translations/` | ✅ |
| Waitlist with referral system | `lib/waitingList/store.ts` + API routes | ✅ |
| AES-256-GCM PII encryption | `lib/security/encryption.ts` | ✅ |
| Interactive demo (PreDemo) | `components/PreDemo/` | ✅ |
| Dream Mode simulation | `components/PreDream/` | ✅ |
| Share system with OG images | `components/Share/` + `api/og/` | ✅ |
| Email via Resend | `packages/email/` | ✅ |
| CSP nonce middleware | `middleware.ts` | ✅ |
| Design token system | `styles/design-tokens.css` | ✅ |
| Cookie consent | `components/CookieConsent/` | ✅ |
| GDPR deletion | `api/waitlist/delete/` | ✅ |

### What Docs Describe That DOES NOT Exist in Code

| Documented Feature | Mentioned In | Status |
|-------------------|-------------|--------|
| Full transaction orchestration engine | architecture.md, backend.md | ❌ Not implemented |
| Balance aggregation service | architecture.md | ❌ Not implemented |
| Provider registry with circuit breakers | business.md, architecture.md | ❌ Not implemented |
| Webhook security layer | architecture.md | ❌ Not implemented (empty webhooks directory) |
| MFA / multi-factor authentication | security docs | ❌ Not implemented |
| KYC/AML verification flows | business.md | ❌ Not implemented (Onramper will handle) |
| Real-time WebSocket updates | user-experience.md | ❌ Not implemented |
| Zustand + React Query state management | infrastructure.md, business.md | ❌ Uses React Context + useReducer |
| tRPC API layer | business.md | ❌ Uses Next.js API Routes |
| BullMQ / RabbitMQ queues | architecture.md, backend.md | ❌ Not implemented |
| Prometheus / Grafana monitoring | architecture.md | ❌ Not implemented |
| Three-app subdomain architecture | architecture.md, project-structure.md | ❌ Only web app exists |
| Banking domain (Acqua mascot) | ideation, user-experience.md | ❌ Not implemented |
| Investing domain (Mystic mascot) | ideation, user-experience.md | ❌ Not implemented |
| DeFi domain (Coral mascot) | ideation, user-experience.md | ❌ Not implemented |
| Onboarding / account creation flow | user-experience.md | ❌ Not implemented |
| Transaction wizard framework | user-experience.md | ❌ Not implemented |

This is not necessarily a problem — these are design specs for future implementation. But the documentation reads as if these systems exist today, which creates confusion.

---

## 19. Board Audit Findings Status

### CLO Board: 🔴 NOT READY (9 Critical Gaps)

| Gap | Current Status |
|-----|---------------|
| Geo-blocking not implemented | ❌ Still not implemented |
| AI disclosure missing SB 942 | ❌ Still not implemented |
| CVM 3-warning verification | 🟡 CvmBanner exists, needs content verification |
| MiCA Article 68 verbatim | 🟡 Disclosures exist in footer, needs wording verification |
| 4 conflicting fee claims | 🟡 PreDemo/FeeTable correct, FAQ still contaminated |
| Dream Mode compliance | ✅ Passed — disclaimer implemented |
| Share Cards compliance | ✅ Passed |

### QR Board: 🔴 NOT READY (12 Blocking Issues)

| Issue | Category |
|-------|----------|
| Loss probability 10× understated | Data accuracy |
| Cross-system inconsistencies | Data integrity |
| 3 CEO decisions required | Governance |

### Strategy Board: 🔴 CONDITIONAL (4 Blocking Issues)

| Issue | Category |
|-------|----------|
| Three-version problem (v2.1 project / v2.0 analytics / outdated translations) | Configuration |
| Strategy allocation discrepancies | Data accuracy |

---

## 20. Critical Issues & Recommendations

### P0 — Must Fix Before Any Public Launch

1. **FAQ Fee Contamination:** 60+ translation strings across 4 locales showing wrong fees. Deploy the corrected copy from `/docs/new-copy/`. This is a ticking compliance bomb.

2. **Font Conflict:** Design tokens declare Inter, actual app loads Geist Sans. Either update `design-tokens.css` to reference Geist or change the app to load Inter. The visual discrepancy may cause rendering inconsistencies.

3. **Locale Detection Incomplete:** Middleware only does path-based detection and defaults to English. The documented cookie → Accept-Language → default flow is not implemented. Users from Brazil visiting the root URL get English, not Portuguese.

### P1 — Should Fix Before Launch

4. **Scope Reconciliation Document:** Create a single `ROADMAP.md` or `SCOPE.md` that maps V1 → V2 → Full Vision. Every other document should reference this.

5. **Geo-blocking:** CLO Board flagged as critical. Even if V1 scope doesn't include regulated activities, marketing claims about strategies/protocols may trigger regulatory scrutiny in restricted jurisdictions.

6. **Documentation Cleanup:** Mark docs that describe future-state systems with a clear header like "⚠️ DESIGN SPEC — NOT YET IMPLEMENTED". This prevents confusion for new team members or due diligence reviewers.

7. **Webhook Delivery Tracking:** `email_delivery_logs` has `delivered_at` and `opened_at` columns but no webhook integration with Resend. Set up Resend webhooks for delivery/open/bounce tracking.

### P2 — Nice to Have

8. **Version Consistency:** Update all docs to reference the actual Next.js version (16.1.5) and actual font (Geist) instead of various outdated versions.

9. **Accept-Language Detection:** Add cookie/header-based locale detection to middleware for better UX for non-English users.

10. **PostHog Integration:** PostHogProvider exists but may not be fully active. Consider enabling for analytics beyond basic event tracking.

---

## 21. What's Working Well

### Architecture & Engineering Quality

The codebase demonstrates strong engineering discipline:

1. **Config-driven composition** is implemented flawlessly. Every landing page is assembled from config objects + reusable section components. Content changes never require code changes.

2. **Error boundaries** wrap every section on every page with section-specific context for error reporting. This means one broken section can't crash the entire page.

3. **i18n architecture** is production-ready. The namespace loading + PageI18nProvider merge + config-translator auto-resolution pattern is elegant and performant.

4. **Waitlist security** is exceptional. Anti-enumeration, timing attack prevention, encrypted PII, HMAC blind indexes, GDPR deletion — this is enterprise-grade for a pre-seed startup.

5. **PreDemo fee calculations** are the most accurate fee representation in the entire codebase and match the canonical v3.4 structure perfectly.

6. **WaitingListProvider global interceptor** is a clever pattern that turns every app URL link into a waitlist capture point.

7. **Locale-conditional compliance** (CVM for Brazil, MiCA for EU, FTC for US) is properly implemented in the footer disclosure system.

8. **Email system** is well-architected: factory pattern, provider abstraction, fire-and-forget with audit logging, template separation, GDPR-compliant delivery tracking.

### Code Quality

- TypeScript throughout with proper interfaces
- Consistent naming conventions
- Well-documented functions with JSDoc comments
- Proper separation of concerns (components/config/lib)
- Accessibility considerations (skip links, ARIA labels, focus management, keyboard navigation)

---

## 22. Open Questions for CEO

1. **Font decision:** Should the platform use Inter (as design tokens specify) or Geist (as currently loaded)? This affects visual consistency across the entire app.

2. **FAQ fee fix timeline:** The contaminated FAQ translations are a compliance risk. When should the corrected copy from `/docs/new-copy/` be deployed to the translation files? Is this blocked on anything specific?

3. **Geo-blocking priority:** The CLO Board flagged this as critical. Given V1's "software provider/interface" positioning and the fact that Onramper handles KYC, is geo-blocking needed for V1 or can it wait?

4. **Accept-Language detection:** Should the middleware implement cookie → Accept-Language → default locale detection for better UX, or is path-based (`/en`, `/pt-BR`) sufficient for V1?

5. **Marketing pages (`(marketing)` route group):** The codebase has an extensive `(marketing)` route group with pages for personal banking, investing, cryptocurrency, DeFi strategies, rewards, careers, etc. These appear to be Story A content. Should these be removed/hidden for V1 to avoid confusion, or are they intentionally kept for SEO/future use?

6. **Strategy Board v2.1 vs v2.0 reconciliation:** The three-version problem (project v2.1, analytics v2.0, translations outdated) was flagged as blocking. Has this been resolved?

7. **Contract auditability:** CEO confirmed own smart contracts for routing/fees but said audit "NOT YET DECIDED." When does this decision need to be made relative to Q2 2026 real money launch?

8. **Founding member cap (1,200):** This is hardcoded in the waitlist_counters table. Is 1,200 the confirmed number? Can this be changed via env var or does it require a database update?

---

*End of Comprehensive Audit Report*

*This document should be reviewed by the CEO and relevant board personas. Issues marked P0 should be addressed before any public-facing launch. The codebase is in strong shape for a pre-launch product — the primary risks are documentation/fee inconsistencies rather than code quality issues.*
