# CLAUDE.md - diBoaS Platform

## Overview

diBoaS (Digital Bank of Autonomous Services) is a unified financial services platform combining traditional banking, cryptocurrency, and DeFi strategies. Currently in **pre-launch/waitlist** phase. The web app is a marketing and onboarding site with waitlist functionality - no production banking features are live yet.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS 3, Radix UI, React Aria
- **Monorepo:** Turborepo + pnpm 8.15 workspaces
- **i18n:** react-intl (4 locales: en, pt-BR, es, de)
- **Testing:** Vitest, @testing-library/react, Lighthouse CI, pa11y
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
- CSP headers configured in next.config.js
- No hardcoded secrets - use environment variables
- CSRF protection on mutation endpoints

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
