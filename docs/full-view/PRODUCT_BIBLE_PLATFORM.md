# diBoaS Platform — Product Bible

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Scope:** Complete product specification, architecture, features, decisions, and technical details for the diboas-platform (Next.js frontend and planned backend services).

---

## 1. What Is diBoaS Platform?

diBoaS is a **OneFi (One Finance) platform** that unifies traditional banking, investment management, and decentralized finance (DeFi) in a single interface. The name stands for **digital Banking on a Solana** — reflecting its Solana-first DeFi approach — though the platform supports multiple blockchains (Bitcoin, Ethereum, Solana, Sui).

The platform is designed for underserved populations — starting with low-middle class users who have a smartphone and savings — and provides access to institutional-grade financial tools with transparent pricing and accessible minimums.

### Core Value Proposition

"OneFi: One platform for Banking, Investing, and DeFi."

**What makes diBoaS different:**
- Banking + Crypto + DeFi in one place (not separate apps)
- Non-custodial wallets (users own their keys)
- Transparent fee structure (no hidden costs)
- Adelaide intelligence (AI-driven market guidance)
- Low minimums ($5/€5/R$10)
- Multi-language, multi-jurisdiction from day 1

---

## 2. Platform Architecture

### Three-App Subdomain Architecture

| Subdomain | Purpose | Auth Required | Status |
|-----------|---------|--------------|--------|
| `diboas.com` | Marketing website | No | ✅ Complete (landing pages) |
| `app.diboas.com` | Consumer application | Yes | 🔲 Planned |
| `business.diboas.com` | B2B application | Yes + MFA | 🔲 Planned (Q2 2026) |

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 15.5.3 |
| UI Library | React | 18.3.1 |
| Language | TypeScript | 5.2.2 |
| Build System | Turborepo | 2.5.8 |
| Package Manager | pnpm | 8.15.0 |
| Styling | Tailwind CSS | 3.4.17 |
| i18n | react-intl | 6.4.7 |
| Component Development | Storybook | 9.1.10 |
| Error Tracking | Sentry | 10.25.0 |
| Performance | web-vitals | 5.1.0 |
| Security | DOMPurify | 3.3.0 |
| Icons | Lucide React | 0.544.0 |
| CSS Utilities | class-variance-authority, clsx, tailwind-merge | Various |

### Monorepo Structure

```
diboas-platform/
├── apps/
│   └── web/                    # Marketing website (diboas.com)
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   │   ├── [locale]/   # Locale-based routing (en, pt-BR, es, de)
│       │   │   │   └── (marketing)/ # Marketing route group
│       │   │   │       ├── page.tsx           # Home page
│       │   │   │       ├── about/
│       │   │   │       ├── business/          # B2B pages
│       │   │   │       ├── personal/          # B2C pages
│       │   │   │       ├── learn/             # Educational content
│       │   │   │       ├── rewards/           # Rewards program
│       │   │   │       ├── legal/             # Terms, privacy, cookies
│       │   │   │       └── security/          # Security information
│       │   │   ├── layout.tsx  # Root layout (Geist fonts, metadata)
│       │   │   ├── middleware.ts # i18n routing + security headers
│       │   │   └── globals.css # Global styles
│       │   ├── components/     # React components
│       │   │   ├── Sections/   # Landing page sections (factory pattern)
│       │   │   ├── Layout/     # Navigation, Footer, Header
│       │   │   ├── UI/         # Reusable primitives
│       │   │   ├── SEO/        # Structured data, meta tags
│       │   │   ├── WaitingList/ # Waitlist functionality
│       │   │   └── Performance/ # Web vitals tracking
│       │   ├── config/         # Configuration files
│       │   ├── lib/            # Utilities and business logic
│       │   └── styles/         # Design tokens + semantic components
│       └── public/             # Static assets
├── packages/
│   ├── i18n/                   # Shared internationalization (@diboas/i18n)
│   └── ui/                     # Shared UI components (@diboas/ui)
├── config/                     # Global configuration
├── docs/                       # Documentation (25+ files)
├── scripts/                    # Build and utility scripts
└── .claude/                    # Claude Code configuration
```

### Domain-Driven Design

The platform separates business logic into three domains:

| Domain | Package | Scope |
|--------|---------|-------|
| **Banking** | `@diboas/banking` | Fiat operations, deposits, withdrawals, transfers, ACH, wire |
| **Investing** | `@diboas/investing` | Crypto buy/sell, portfolio management, market data |
| **DeFi** | `@diboas/defi` | Yield strategies, liquidity pools, smart contract interactions |

Cross-domain communication happens through events only (Event-Driven Architecture).

---

## 3. The Marketing Website (Current State)

The marketing website at `diboas.com` is **complete** and represents the current state of the platform codebase.

### Landing Page Architecture

The home page renders multiple sections using a **Component Factory Pattern:**

```typescript
// Each section uses variants:
<Hero variant="fullBackground" />
<ProductCarousel variant="default" />
<FeatureShowcase variant="default" />
<FAQAccordion variant="default" />
```

**Landing Page Sections:**
1. **HeroSection** — Main value proposition, CTA to waitlist
2. **ProductCarousel** — Banking, Investing, DeFi domain showcase (3 slides)
3. **FeatureShowcase** — Platform feature highlights (3 features)
4. **AppFeaturesCarousel** — App feature demonstrations (4 features)
5. **BenefitsCards** — User benefits (4 benefits)
6. **OneFeature** — Single highlighted feature
7. **FAQAccordion** — Frequently asked questions

### Business Pages

**Personal (B2C):**
- `/personal/banking/` — Banking services overview
- `/personal/investing/` — Investment tools overview
- `/personal/cryptocurrency/` — Crypto trading overview

**Business (B2B):**
- `/business/account/` — Business account overview
- `/business/banking/` — Business banking services
- `/business/yield-strategies/` — Corporate yield strategies

**Other Pages:**
- `/learn/` — Financial literacy resources
- `/rewards/` — Rewards program
- `/help/` — Support center
- `/legal/` — Terms of service, privacy policy, cookie policy
- `/security/` — Security information
- `/about/` — About diBoaS

### Waiting List

The current waitlist system uses **localStorage** (frontend only). Backend persistence is planned (PostgreSQL with GDPR/LGPD consent storage).

---

## 4. Internationalization

### Supported Locales (4)

| Locale | Market | Status | URL Pattern |
|--------|--------|--------|-------------|
| `en` | US/EU | ✅ Complete | `diboas.com/en/` |
| `pt-BR` | Brazil | ✅ Complete | `diboas.com/pt-BR/` |
| `es` | Spanish-speaking | ✅ Complete | `diboas.com/es/` |
| `de` | Germany | ✅ Complete | `diboas.com/de/` |

### Implementation Details

- **200+ translation keys** across all locales
- **Config-translator pattern:** All config files use translation keys (not hardcoded strings)
- **Automatic locale detection** via `Accept-Language` header in middleware
- **SEO:** Unique titles and descriptions per locale, `hreflang` tags, canonical URLs
- **Number/date formatting:** Locale-aware via `react-intl` (FormattedDate, FormattedNumber)
- **Package architecture:** Server bundle (~40KB, no React), Client bundle (~1.5KB + react-intl)

### Translation File Structure

```
packages/i18n/translations/
├── en/
│   ├── common.json      (80+ keys: nav, buttons, forms, accessibility, SEO, footer)
│   └── marketing.json   (120+ keys: hero, products, mascots, features, benefits)
├── pt-BR/
│   ├── common.json
│   └── marketing.json
├── es/
│   ├── common.json
│   └── marketing.json
└── de/
    ├── common.json
    └── marketing.json
```

---

## 5. Design System

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary (Teal)** | `#0d9488` (teal-600) | Primary buttons, links, brand elements. WCAG AAA (7.3:1) |
| **Accent (Teal)** | `#14b8a6` (teal-500) | Accent elements. WCAG AA only (4.5:1), use sparingly |
| **Purple (Mystic)** | `#a855f7` | Investing & strategy contexts |
| **Coral** | `#ef4444` | DeFi & innovation elements |
| **Success** | `#10b981` | Positive actions |
| **Warning** | `#f59e0b` | Caution states |
| **Error** | `#ef4444` | Error states |
| **Info** | `#3b82f6` | Informational |

### Typography

- **Sans-serif:** Geist Sans (with system-ui fallback)
- **Monospace:** Geist Mono
- **Scale:** 12px (xs) through 64px (6xl)
- **Weights:** 300 (light) through 800 (extrabold)

### Mascot System

Three AI mascot characters guide users through the platform:

| Mascot | Color | Audience | Domain | Personality |
|--------|-------|----------|--------|-------------|
| **Acqua** | Teal/Cyan | Beginner | Banking, basic investing, onboarding | Friendly, helpful, trustworthy |
| **Mystic** | Purple | Intermediate | Advanced investing, DeFi strategy | Analytical, insightful, strategic |
| **Coral** | Red/Coral | Advanced | Advanced DeFi, complex strategies | Confident, innovative, risk-aware |

Each mascot has emotional states: waving, thinking, celebrating, sympathetic, monitoring, focused.

### Component Reusability Hierarchy

| Level | Reuse Rate | Examples |
|-------|-----------|---------|
| Level 1: Primitives | 95% | Button, Input, Card, Typography, Badge |
| Level 2: Patterns | 85% | Modal, Navigation, Footer, Breadcrumbs |
| Level 3: Marketing UI | 80% | Hero, FeaturePromotion, TrustBuilder |
| Level 4: App-Specific | 70% | Dashboard, TransactionWizard, BalanceCards |

### Design Tokens

- **File:** `/apps/web/src/styles/design-tokens.css` (2,345 lines)
- **Semantic Components:** `/apps/web/src/styles/semantic-components.css` (1,856 lines)
- **Structure:** Primitive Tokens → Semantic Tokens → Component Tokens

### Component Factory Pattern

All section components use a factory pattern for variant management:

```typescript
const VARIANTS = {
  default: HeroDefault,
  minimal: HeroMinimal,
  gradient: HeroGradient,
} as const;

export function Hero({ variant = 'default', ...props }) {
  const Component = VARIANTS[variant] || VARIANTS.default;
  return <Component {...props} />;
}
```

---

## 6. Three Business Domains

### Banking Domain

**Core Operations:**
- Add Funds (On-Ramp): Fiat → crypto via Stripe/MoonPay
- Send Money: Wallet-to-wallet or external transfers
- Withdraw Funds (Off-Ramp): Crypto → fiat via Stripe

**Payment Methods:** Bank transfer (ACH, wire), credit/debit card, Apple Pay, Google Pay, PayPal

**Compliance:** KYC verification (Persona/Jumio), AML screening, suspicious activity detection, SAR filing

### Investing Domain

**Core Operations:**
- Buy Crypto: Purchase BTC, ETH, SOL, SUI and other assets
- Sell Crypto: Convert holdings to fiat or other crypto
- Portfolio Management: View holdings, performance, allocation

**Providers:** Coinbase, Binance, Kraken (with failover between exchanges)

**Features:** Real-time market data, order types (market, limit, stop-loss), portfolio rebalancing, tax reporting

### DeFi Domain

**Core Operations:**
- Start DeFi Strategy: Deploy automated yield strategies (mapped to 10 analytics strategies)
- Stop DeFi Strategy: Withdraw from active strategies
- Harvest Yield: Collect earned rewards (80% reinvest, 20% to balance)

**Protocols:** Sky SSR, Jupiter JLP, Jito, Ethena, Morpho, Aave, Compound

**Features:** Gas optimization, risk assessment, impermanent loss calculation, yield projections

---

## 7. Multi-Chain Support

| Network | Uses | Wallet Type |
|---------|------|-------------|
| **Bitcoin** | Value storage, transfers | Non-custodial BTC wallet |
| **Ethereum L1** | Smart contracts, DeFi (Aave, Compound, Morpho, Ethena) | Non-custodial ETH wallet |
| **Solana** | High-speed DeFi (Jupiter JLP, Jito, Sky SSR) | Non-custodial SOL wallet |
| **Sui** | Next-gen blockchain operations | Non-custodial SUI wallet |

**Non-Custodial Architecture:** Users maintain full control of assets through 4 specialized wallets. diBoaS never holds user private keys.

**Wallet Provider:** Privy or Dynamic (2,500 MAU free tier).

---

## 8. Fee Structure

### Platform Fees

| Operation | Fee | Competitive Reference |
|-----------|-----|----------------------|
| Deposit (on-ramp) | 0.5% | Banks: 0%, but no crypto access |
| Withdrawal (off-ramp) | $1.99 flat | Banks: $25-50 for wire |
| Transfer | $0.25 flat | Banks: $3-10 |
| Crypto Trade | 0.25% | Coinbase: 0.5-4% |
| Portfolio Rebalancing | 0.1% | Manual: hours of work |
| DeFi Strategy Management | 0.5% APY | Yearn: 2% APY |
| Yield Performance | 10% of earned yield | Yearn: 20% performance |

### DeFi-Specific Fees (from analytics pipeline)

| Operation | Platform Fee |
|-----------|-------------|
| Off-ramp / transfers | 0.75% |
| Sell / close DeFi positions | 0.12% |

### Investment Minimums

| Market | Minimum |
|--------|---------|
| EN (US/EU) | $5 |
| ES/DE (Europe) | €5 |
| PT-BR (Brazil) | R$10 |

### Five-Tier Fee Transparency

Every transaction shows a complete breakdown:
1. **Platform Fee** (diBoaS revenue)
2. **Provider Fee** (pass-through: Stripe, exchange, etc.)
3. **Network Fee** (pass-through: gas costs)
4. **Compliance Fee** (regulatory: KYC, AML for large transactions)
5. **Premium Fee** (subscription features)

### Volume Discounts

| Volume | Discount |
|--------|----------|
| $1K+ | 5% |
| $10K+ | 15% |
| $50K+ | 30% |
| $100K+ | 50% |

---

## 9. Transaction Architecture

### Provider-Centric Approach

**Key insight:** diBoaS acts as **orchestrator and status manager** (30% of traditional fintech work), while providers handle actual execution (70% of work).

**diBoaS responsibilities:**
- Initiate: Validate requests, reserve balances, send to providers
- Monitor: Listen for provider webhooks, track progress
- Complete: Update balances, release reservations, notify users
- Compensate: Handle failures, release funds, retry

**Provider responsibilities:**
- Execute: Blockchain transactions, fiat processing, DeFi interactions
- Update: Send status updates via webhooks
- Deliver: Complete transactions and confirmations
- Report: Detailed transaction information

### Transaction State Machine

```
INITIATED → VALIDATING → BALANCE_RESERVED → SENT_TO_PROVIDER
→ PROVIDER_PROCESSING → PROVIDER_CONFIRMING → COMPLETED
                                          → FAILED → COMPENSATING → COMPENSATED
                                          → EXPIRED → CANCELLED
```

### Transaction Types (7)

1. `ADD_ON_RAMP` — Fiat to crypto
2. `SEND_ON_CHAIN` — Wallet to wallet
3. `WITHDRAW_OFF_RAMP` — Crypto to fiat
4. `BUY_CRYPTO` — Purchase assets
5. `SELL_CRYPTO` — Sell assets
6. `START_DEFI` — Deploy strategy
7. `STOP_DEFI` — Withdraw from strategy

### Circuit Breaker Pattern

Protects against provider failures:
- **CLOSED:** Normal operation
- **OPEN:** Provider failing, requests blocked (after 5 failures)
- **HALF_OPEN:** Testing recovery (after 60 second timeout, needs 3 successes to close)

### Provider Scoring Algorithm

| Factor | Weight |
|--------|--------|
| Success rate | 40% |
| Average speed | 20% |
| Low fees | 20% |
| Uptime | 10% |
| Support quality | 10% |

Failover: Up to 3 provider attempts before failure.

---

## 10. Security Architecture

### Zero-Trust Principles

1. Never trust, always verify
2. Multi-layer validation (Auth + Device + Risk + Permissions)
3. Dynamic permissions (risk-based access control)
4. Security context per request (immutable)
5. Correlation tracking (end-to-end request tracing)

### Subdomain Security Policies

| Subdomain | Auth | MFA | Rate Limit | Session | Encryption |
|-----------|------|-----|-----------|---------|-----------|
| diboas.com | Optional | No | 1000/hr/IP | 30 days | TLS |
| app.diboas.com | Required | For sensitive ops | 100/min/user | 24h (30m idle) | AES-256 |
| business.diboas.com | Enterprise SSO | Always | 500/min/org | 8h (15m idle) | AES-256-GCM + mTLS |

### Data Protection

- **Field-level encryption:** SSN, account numbers, private keys, API keys
- **Data masking:** SSN → `XXX-XX-####`, Account → `****####`
- **PII detection:** Automatic scanning for sensitive patterns
- **Audit logging:** Immutable append-only logs, 7-year retention
- **HMAC verification:** Log integrity verification

### URL Security

- NEVER put transaction IDs, user IDs, or sensitive data in URLs
- Encrypted transaction references with session binding
- Modal system for transaction details (no URL changes)
- 1-hour reference expiry with checksum verification

### Compliance Frameworks

| Framework | Domain | Requirements |
|-----------|--------|-------------|
| SOX / PCI DSS | Banking | Financial controls, card data protection |
| GDPR / LGPD | All | Data protection, consent, right to be forgotten |
| SEC / FINRA | Investing | Trading regulations, best execution |
| MiCA | DeFi (EU) | Crypto asset regulations |
| CVM | DeFi (Brazil) | Brazilian crypto regulations |

---

## 11. User Experience

### Transaction Wizards

Multi-step guided flows with mascot guidance:

| Domain | Wizard Steps | Mascot |
|--------|-------------|--------|
| Banking Deposit | Amount → Bank Account → Compliance → Review → Confirm | Acqua |
| Crypto Purchase | Asset → Amount → Exchange → Fees → Review → Confirm | Mystic |
| DeFi Strategy | Protocol → Pool → Amount → Gas → Risks → Review → Confirm | Coral |

### Real-Time Status Tracking

- WebSocket-powered live updates
- Domain-specific progress indicators
- Mascot animations per status transition
- Push notifications for significant changes
- Estimated completion times

### Nubank-Inspired 3-Part Content Strategy

| Phase | Weight (Marketing) | Weight (App) | Weight (Business) |
|-------|-------------------|-------------|-------------------|
| **Promote** (benefits) | 60% | 30% | 25% |
| **Trust** (credibility) | 30% | 20% | 50% |
| **Action** (CTA) | 10% | 50% | 25% |

### Accessibility

- **Target:** WCAG 2.1 AA (95%+ compliance)
- **Current Score:** 6.5/10 (improvement in progress)
- Keyboard navigation support
- Screen reader optimization
- Color contrast 4.5:1 minimum (7.3:1 for primary teal)
- Touch targets: 44-48px minimum
- Skip to main content link
- ARIA labels throughout

### Mobile-First Design

- **60%+ traffic from mobile devices**
- Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- Touch-friendly targets (48px minimum)
- Bottom navigation bar on mobile
- Progressive enhancement approach

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | ≤ 2.5s |
| FID (First Input Delay) | ≤ 100ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 |
| FCP (First Contentful Paint) | ≤ 1.8s |
| TTFB (Time to First Byte) | ≤ 800ms |
| Lighthouse Score | 90+ |
| Bundle Size | < 4 MB (target, currently 6.96 MB) |

---

## 12. Revenue Model

### Fee-Based Revenue (at scale)

| Source | Monthly Target | Basis |
|--------|---------------|-------|
| Banking | $50K | $10M monthly volume × 0.5% |
| Investing | $62.5K | $25M volume × 0.25% |
| DeFi | $120K | $50M AUM × 0.5% + performance |
| Premium Subscriptions | $140K | Mixed tiers |
| **Total** | **~$373K/month** | **~$4.5M annually** |

### Growth Targets

| Milestone | Users | Volume | Timeline |
|-----------|-------|--------|----------|
| Beta | 100 | - | Month 1 |
| Early Growth | 1,000 | $100K/mo | Month 6 |
| Growth | 10,000 | $1M/mo | Month 12 |
| Scale | 100,000 | - | Year 2 |
| Break-even | 50,000 active | - | Month 18 |

### Infrastructure Cost Scaling

| Phase | Cost | Users |
|-------|------|-------|
| Launch | $0/month | 0-100 |
| Growth | ~$400/month | 100-1,000 |
| Scale | ~$5,000/month | 1,000-10,000 |

---

## 13. Integration with diBoaS Analytics

The platform integrates with the analytics pipeline to power:

- **Adelaide Newsletter Display:** Adelaide market page showing latest Pulse and Weekly editions
- **Strategy Performance:** Real-time strategy performance dashboards
- **Dream Mode:** Monte Carlo projections visualized for users
- **Future You Calculator:** Compound interest visualization using analytics data
- **Risk Indicators:** Market regime and crisis level displayed in app
- **Trigger Alerts:** Active intelligence triggers shown to users

---

## 14. Key Product Decisions (Chronological)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024 | Next.js 15 + App Router | SSR, performance, developer experience |
| 2024 | Turborepo monorepo | Efficient builds, shared packages |
| 2024 | Non-custodial wallets | User asset ownership |
| 2024 | 4-chain support (BTC, ETH, SOL, SUI) | Cover major blockchain ecosystems |
| 2024 | 3 subdomains (marketing, app, business) | Clear separation of concerns |
| 2024 | Provider-centric architecture (30/70 split) | Reduce implementation complexity |
| 2024 | 3 mascots (Acqua, Mystic, Coral) | Progressive user guidance |
| 2025 | 4 locale support (EN, PT-BR, ES, DE) | Multi-market from day 1 |
| 2025 | react-intl for i18n | Industry standard, good formatting support |
| 2025 | Storybook 9 for components | Visual component development |
| 2025 | Factory pattern for sections | Variant management without code changes |
| 2025 | Geist fonts | Modern, clean, excellent readability |
| 2025 | Teal-600 as primary (not teal-500) | WCAG AAA compliance (7.3:1 vs 4.5:1) |
| 2025 | Design tokens CSS variables | Theme-able, consistent, maintainable |
| 2025 | Waitlist localStorage (temporary) | Ship fast, backend later |
| 2026 | Landing pages complete | Ready for launch |
| 2026 | Feb 12 launch target | Analytics + platform both ready |

---

## 15. Implementation Status (February 2026)

### Complete (✅)

| Component | Details |
|-----------|---------|
| Marketing website | All landing page sections, all business pages |
| 4-locale i18n | 200+ keys, automatic detection, SEO metadata |
| Design system | 2,345 lines of tokens, 1,856 lines of semantic CSS |
| Navigation | Desktop + mobile, fully translated |
| Waiting list | Frontend implementation (localStorage) |
| SEO | Structured data, metadata, hreflang tags |
| Performance monitoring | Web vitals tracking |
| Error boundary | Component error handling |
| Cookie consent | GDPR-compliant |
| Security headers | CSP, HSTS, XSS protection |
| Component architecture | Factory pattern, variant system |
| Storybook | Component documentation |

### Not Started (🔲)

All backend services, app.diboas.com, business.diboas.com, and transaction functionality are planned but not yet implemented. See the FUTURE_FEATURES_PLATFORM.md document for the complete pending implementation list.

---

*This document represents the complete product specification for diBoaS Platform as of February 2026.*
