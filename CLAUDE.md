# CLAUDE.md - diBoaS Platform

## Overview

diBoaS (Digital Bank of Autonomous Services) is a unified financial services platform combining traditional banking, cryptocurrency, and DeFi strategies. Currently in **pre-launch/waitlist** phase. The web app is a marketing and onboarding site with waitlist functionality - no production banking features are live yet.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS 3
- **Monorepo:** Turborepo + pnpm 8.15 workspaces
- **i18n:** react-intl (4 locales: en, pt-BR, es, de)
- **Testing:** Vitest, @vitest/coverage-v8, Lighthouse CI, pa11y
- **Monitoring:** Sentry (error tracking), PostHog (analytics), web-vitals
- **Security:** DOMPurify, Upstash Redis rate limiting, AES-256-GCM encryption
- **Component dev:** Storybook 9

## Architecture

```
diboas-platform/
  apps/web/            # Next.js web application (only app)
  packages/i18n/       # @diboas/i18n - Internationalization
  packages/ui/         # @diboas/ui - Design system components
  config/              # Design tokens JSON + schema
  scripts/             # Build/validation scripts
  docs/                # Project documentation
```

### App Router Structure

```
apps/web/src/app/
  [locale]/
    (marketing)/       # Marketing pages (personal, business, learn, security, rewards, etc.)
    (landing)/         # Landing pages (about, demo, strategies, dream-mode, legal, etc.)
  api/                 # API routes (waitlist, consent, health, og, webhooks)
```

### Source Organization (apps/web/src/)

- `components/` - UI components (Factory pattern with variants)
- `config/` - Feature configs, page configs, navigation
- `hooks/` - Custom React hooks
- `lib/` - Utilities, security, services
- `styles/` - Global CSS, design tokens CSS
- `types/` - TypeScript type definitions
- `stories/` - Storybook stories
- `test/` - Test setup and utilities

## Commands

### Development
```bash
pnpm dev:web          # Start web app dev server
pnpm dev:fresh        # Clean rebuild + dev server
pnpm dev:clean        # Kill port 3000 + restart
```

### Quality
```bash
pnpm type-check       # TypeScript checking (all workspaces)
pnpm lint             # ESLint (all workspaces)
pnpm test             # Vitest (all workspaces)
pnpm build            # Production build (all workspaces)
```

### Validation
```bash
pnpm validate:all              # Full pipeline: type-check -> lint -> test -> build -> tokens -> translations
pnpm validate:design-tokens    # Validate design tokens against schema
pnpm validate:translations     # Check translation key parity across locales
pnpm check:dead-code           # Dead code detection (knip)
```

### Audits
```bash
pnpm audit:full                # 15-point pre-launch audit
pnpm security:audit            # pnpm audit for vulnerabilities
pnpm performance:audit         # Lighthouse CI
pnpm accessibility:audit       # pa11y WCAG2AA
```

## Coding Standards

### Component Pattern
Components use a **Factory pattern** with variant directories:
```
ComponentName/
  ComponentNameFactory.tsx    # Variant selector
  ComponentName.stories.tsx   # Storybook stories
  index.ts                    # Barrel export
  variants/
    VariantA/
      VariantA.tsx
      index.ts
```

### Key Conventions
- **Path alias:** `@/*` maps to `apps/web/src/*`
- **Barrel exports:** Every directory has `index.ts`
- **Strict TypeScript:** No implicit any, strict null checks
- **Tailwind CSS:** Utility-first styling, design tokens via CSS custom properties
- **Error boundaries:** Layered (page-level, navigation-level, global)
- **Provider pattern:** Context providers for i18n, locale, analytics

### Security
- All user input sanitized with DOMPurify
- API routes require rate limiting (Upstash Redis)
- PII encrypted with AES-256-GCM
- CSP: Nonce-based CSP generated per-request in `middleware.ts` (`'unsafe-inline'` prohibited for scripts)
- No hardcoded secrets - use environment variables
- CSRF protection on mutation endpoints
- Analytics libraries: lazy-loaded behind consent check via dynamic `import()` (never static import)
- PostHog: never imported at module level; use `import('posthog-js')` after consent

### React Performance Guidelines

Prioritized by real-world impact (ref: Vercel React Best Practices).

#### Already in place (do not regress)
- **Bundle optimization:** `optimizePackageImports` for 17+ packages, 9-group webpack splitChunks, 300KB asset budget (`next.config.js`)
- **Analytics deferral:** GA4 `afterInteractive`, PostHog consent-gated lazy init, web-vitals dynamic `import()` with sample rate
- **Production compiler:** `removeConsole`, `reactRemoveProperties` enabled
- **SSR-safe localStorage:** All reads wrapped in try-catch inside `useEffect` (never in `useState` initializer for SSR components)

#### Apply now (all new code)
- **Defer `await` until needed:** Move `await` inside conditional branches — don't block on fetches that may not be used
- **`Promise.all()` for independent operations:** Never chain sequential `await`s when operations are independent
- **Lazy `useState` initialization:** Use `useState(() => compute())` when initial value requires computation (parsing, filtering, index building)
- **Derived state during render:** Compute values from props/state inline — don't store in state or sync via `useEffect`
- **Functional `setState`:** Use `setState(prev => ...)` when new state depends on previous state
- **Event handlers over effects:** Run user-triggered side effects in event handlers, not in `useEffect`
- **Explicit conditional rendering:** Use ternary `condition ? <X /> : null` instead of `&&` to avoid rendering falsy values like `0`
- **Extract default non-primitive values:** Hoist default objects/functions to module scope (`const NOOP = () => {}`)

#### Apply post-launch (product features)
- **Strategic Suspense boundaries:** Wrap async data sections to show shell UI while loading
- **`next/dynamic` with `ssr: false`:** For heavy client-only components (charts, editors, rich text)
- **Cross-request LRU caching:** For frequently accessed data shared across requests
- **`React.cache()` for per-request dedup:** Wrap repeated DB queries or auth checks within a single request
- **`after()` from `next/server`:** Schedule non-blocking work (logging, analytics, email) after response is sent
- **SWR for client-side data fetching:** Automatic deduplication, caching, and revalidation
- **`content-visibility: auto`:** For long scrollable lists (transaction history, activity feeds)
- **`useRef` for transient values:** Store frequently-changing non-UI values (mouse position, intervals) without re-renders
- **`useTransition` for non-urgent updates:** Mark search filtering, pagination as transitions to keep UI responsive
- **React Compiler:** When adopted, removes need for manual `useMemo`/`memo`

## i18n

- Reference locale: `en` (source of truth)
- Translations: `packages/i18n/translations/{locale}/`
- Namespaced JSON files (common, marketing, personal, business, learn, etc.)
- Client/server split exports to avoid bundling React on server
- All new user-facing strings must be added to all 4 locales

## Design Tokens

- Source: `config/design-tokens.json`
- Schema: `config/design-tokens.schema.json`
- Generated CSS: `apps/web/src/styles/design-tokens.css`
- Validate: `pnpm validate:design-tokens`
- Generate: `pnpm generate:design-tokens`
- Categories: brand colors, typography, spacing, animation, z-index, breakpoints

## Environment Variables

- Documented in `apps/web/.env.example`
- `NEXT_PUBLIC_*` prefix for client-side variables
- Key categories: App URL, Kit.com, Cal.com, Analytics (GA4, Sentry, PostHog), Security, Rate limiting, Feature flags

## Dependencies Between Packages

- `apps/web` depends on `@diboas/i18n` and `@diboas/ui`
- `@diboas/i18n` must be built before `apps/web` dev/build (`pnpm dev:fresh` handles this)
- Turborepo handles build ordering via `turbo.json` task dependencies

## 12 Principles of Excellence

Condensed reference from `docs/coding-standards.md`:

1. **Domain-Driven Design** — Organize around business domains, clear boundaries, events for cross-domain
2. **Event-Driven Architecture** — All state changes emit events (eventId, type, timestamp, correlationId)
3. **Service Agnostic Abstraction** — Interface-based, swappable providers, factory pattern
4. **Code Reusability & DRY** — Write once, shared packages, no duplication
5. **Semantic Naming** — [Domain][Entity][Action]Service, SCREAMING_SNAKE_CASE constants
6. **File Decoupling** — Single responsibility, Services ≤200 lines, Components ≤150, Utils ≤100
7. **Error Handling & Recovery** — Never crash, retry with backoff, circuit breakers, fallbacks
8. **Security & Audit** — Input validation, output encoding, rate limiting, encryption, PII masking
9. **Performance & SEO** — Code splitting, lazy loading, LCP <2.5s, FID <100ms, CLS <0.1
10. **Product KPIs & Analytics** — Track interactions, enrich with context, conversion funnels
11. **Concurrency & Race Conditions** — Locks, optimistic locking, queues, idempotency
12. **Monitoring & Observability** — Tracing, structured logging, health checks, Sentry

## Race Condition & Async Patterns

- Every `useEffect` with timers → store IDs, clear in cleanup
- Every `useEffect` with async → use `mounted` flag or `AbortController`
- Every `addEventListener` → corresponding `removeEventListener` in cleanup
- Use refs (not state) for values that should not trigger re-renders
- Service classes with global listeners → store bound references, remove in `destroy()`
- Never include state-setter output in same effect's dependency array if the effect sets that state

## Accessibility Standards

- WCAG 2.1 AA minimum compliance
- All interactive elements: native `<button>` or `<a>` (never `div role="button"`)
- All modals/dialogs: use `useFocusTrap` hook with `returnFocus: true`
- Minimum contrast: 4.5:1 for text, 3:1 for UI components — use `text-gray-500` minimum
- Form groups: `<fieldset>` + `<legend>` for screen readers
- Dropdowns: handle Escape key, return focus to trigger
- Reduced motion: all animations must respect `prefers-reduced-motion`
- Skip navigation link required on all page layouts

## Error Handling Patterns

- Error boundaries: 3 layers — Root (`global-error.tsx`) > Route group (`(marketing)/error.tsx`, `(landing)/error.tsx`) > Page
- Loading states: `loading.tsx` in every route group for Suspense
- API calls: use `fetchWithRetry` for user-facing operations (2 retries, exponential backoff)
- Third-party scripts: always dynamic `import()` with fallback (never static import for analytics)
- Global error handlers: single coordinator pattern — MonitoringService registers, delegates to ErrorReportingService

## Testing Requirements

- 80% coverage minimum for `lib/`, `hooks/`
- 60% coverage minimum for components
- 100% for security utilities
- Naming: `should [expected behavior] when [condition]`
- Required: hooks with async behavior, error handlers, security utilities, API routes
- Tools: Vitest + @testing-library/react
- Environment: node (default); add jsdom as dev dependency for DOM-based component tests

## Audit Tracker

| ID | Phase | Finding | Status |
|----|-------|---------|--------|
| 1 | 1 | CookieConsent setTimeout cleanup | Done |
| 2 | 1 | CalEmbed script listener cleanup | Done |
| 3 | 1 | ErrorReportingService bound handler cleanup | Done |
| 4 | 1 | MonitoringService bound handler cleanup | Done |
| 5 | 1 | ThemeManager bound handler cleanup | Done |
| 6 | 1 | web-vitals beforeunload cleanup | Done |
| 7 | 1 | ShareModal isRendering race condition | Done |
| 8 | 1 | PostHogProvider isInitialized race condition | Done |
| 9 | 2 | CSP nonce-based in middleware | Done |
| 10 | 2 | PostHog lazy-load behind consent | Done |
| 11 | 3 | Route group loading.tsx files | Done |
| 12 | 3 | Route group error.tsx files | Done |
| 13 | 3 | fetchWithRetry utility + useWaitlistForm | Done |
| 14 | 3 | Deduplicate global error handlers | Done |
| 15 | 4 | DreamMode useFocusTrap | Done |
| 16 | 4 | Native buttons (HomeScreen, BalanceCard) | Done |
| 17 | 4 | Aria labels (ShareableCard, InputScreen) | Done |
| 18 | 4 | LanguageSwitcher escape focus return | Done |
| 19 | 4 | WCAG AA contrast (text-gray-500) | Done |
| 20 | 4 | WaitlistForm fieldset + legend | Done |
| 21 | 4 | MobileNav useFocusTrap | Done |
| 22 | 5 | Remove 'use client' from SectionContainer | Done |
| 23 | 5 | Dynamic imports (DreamMode, PreDemo) | Done |
| 24 | 5 | SocialProofSection sessionStorage cache | Done |
| 25 | 5 | next/image for PreDemo logos | Done |
| 26 | 5 | logo-icon.png compression | Done (replaced with logo-icon.avif) |
| 27 | 6 | usePerformanceMonitor useEffect deps comment | Done |
| 28 | 6 | Stable keys (CarouselDots, LoadingScreen) | Done |
| 29 | 6 | Typed gtag + PerformanceMemory interface | Done |
| 30 | 6 | usePerformanceMonitor @ts-expect-error removal | Done |
| 31 | 6 | Extract ChainIcons from WalletDetailsScreen | Done |
| 32 | 6 | CSS module classes for inline styles | Done |
| 33 | 8 | SetHtmlLang component for locale | Done |

## Visual Development — Human-First Design Workflow

### Design document precedence

When working on any frontend UI, read these docs in order of priority:
1. `docs/brand-brief.md` — product truth, audience, emotional target, what must never be invented
2. `docs/design-principles.md` — implementation rules for typography, color, layout, interaction
3. `docs/design-system-notes.md` — token source, component library, icon set, breakpoints
4. `docs/anti-slop-checklist.md` — canonical anti-pattern list and review criteria

If these conflict: product truth comes from brand-brief, UI rules from design-principles,
anti-patterns from anti-slop-checklist, tokens from `apps/web/src/styles/design-tokens.css`.

### Anti-slop defaults

Avoid these patterns in all frontend work unless brand rules explicitly allow them:
- Default purple/blue startup gradients or shiny AI orbs
- Gradient profile circles with initials as decoration
- Pure black (#000) or pure white (#FFF) — use palette-derived neutrals
- Repeated KPI strips showing the same data in multiple places
- Card soup — too many cards with equal visual weight and no hierarchy
- Mixed icon families or inconsistent icon weights
- Emoji used as core UI icons
- Empty charts or decorative analytics that communicate nothing real
- Too much border-radius on everything with no variation
- Hierarchy created only by colored boxes instead of typography + spacing
- Generic SaaS layout templates repeated across screens
- Fake metrics, fake workflows, fake pricing, or hallucinated features
- Lorem ipsum or "Acme Inc" placeholder copy in any deliverable
- Legacy fee figures (0.75%, 0.12%, 0.09%, subscription tiers) — current fees in `docs/fees.md`

### Quick visual check (after every frontend change)

**IMMEDIATELY** after implementing any front-end change:
1. Navigate to affected pages using Playwright MCP (`browser_navigate`)
2. Take screenshots at desktop (1440px) and mobile (375px) viewports
3. Compare against design direction and `docs/design-principles.md`
4. Check console for errors using `browser_console_messages`
5. Click through the primary user flow — verify interactions work
6. Test at least one edge case (empty state, long content, error state)
7. Fix visual and interaction issues before declaring done

If Playwright MCP is NOT available: explicitly say "I could not visually verify this — browser tooling is not available." Never imply visual verification was performed when it was not.

### Comprehensive design review

Invoke `@agent design-reviewer` for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing
- Running `/mydesign review` or `/review-ui`

### Slash commands available

- `/mydesign` — unified design workflow (build, review, audit, explore, tweak)
- `/build-ui` — focused build workflow with interactive context gathering
- `/review-ui` — focused review workflow against anti-slop checklist

### Build rules for UI work

- Always use existing design tokens from `apps/web/src/styles/design-tokens.css` — never hardcode colors, spacing, or font sizes
- Always use the project's custom Icon component (`@/components/UI/Icon`) — never import Lucide, Hero Icons, or other external icon libraries
- Always check `docs/brand-brief.md` before generating sample content — never invent product claims, fee figures, or capabilities not confirmed there
- All new user-facing strings must be added to all 4 locales (en, pt-BR, es, de)
- German text is ~30% longer than English — verify components handle text expansion
- Regulatory disclaimers (MiCA for EU, CVM 3-warning for BR, FTC for US) have required text per locale — check brand-brief
- Use Factory pattern with variants for all new components
- Motion must respect `prefers-reduced-motion` (already in Accessibility Standards above)
