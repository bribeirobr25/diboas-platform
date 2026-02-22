# Session Handoff: B2C Landing Page Rebuild

> **Last updated:** 2026-02-20
> **Branch:** `waitlist-launch`
> **Status:** Implementation complete, visual browser testing pending

---

## What Was Done (All 7 Phases Complete)

### Phase 1: Design Tokens & Font Consolidation
- Replaced Geist font with Inter in `apps/web/src/app/layout.tsx`
- Added text color tokens, section background tokens, and prose tokens to `apps/web/src/styles/design-tokens.css`

### Phase 2: Translation Files — Complete Rewrite
- Rewrote all 4 locale files with CLO-approved copy:
  - `packages/i18n/translations/en/landing-b2c.json`
  - `packages/i18n/translations/pt-BR/landing-b2c.json`
  - `packages/i18n/translations/de/landing-b2c.json`
  - `packages/i18n/translations/es/landing-b2c.json`
- Added locale-conditional footer disclaimer keys (empty strings for non-applicable locales for key parity)
- Restored InteractiveDemo screen keys (`demo.pain.*`, `demo.hope.*`, `demo.action.*`, `demo.reward.*`) that were initially lost during rewrite

### Phase 3: Bug Fixes
- Fixed FAQ HTML rendering with DOMPurify in `AccordionItem.tsx`
- Fixed MinimalFooter social icons (were rendering letters instead of icons)
- Fixed HeroSection description rendering and gradient overlay

### Phase 4: Updated Existing Components
- Added `quote` field to ProductCarousel config and rendering
- Updated MinimalFooter with tagline, product nav links, locale-conditional disclosures
- Updated WaitlistSection — updated `waitlist.json` in all 4 locales with new approved copy ("Want early access?" replacing "Ready?")
- Updated FAQ with 5 new CLO-approved items

### Phase 5: Built 3 New Components
- `ProseSection` — reusable prose block for Origin Story (Section 2) and The Catch (Section 7)
- `ScenarioCards` — 3-card grid for real-life scenarios (Section 4)
- `FeeTable` — transparent fee table with responsive mobile layout (Section 6)
- All with config files, CSS modules, barrel exports

### Phase 6: Config & Page Assembly
- Complete rewrite of `apps/web/src/config/landing-b2c.ts` with 11 section configs
- Complete rewrite of `apps/web/src/app/[locale]/(landing)/page.tsx` with 11-section layout
- Fixed nested `<main>` issue (page used `<main>` inside layout's `<main>`, changed to `<div>`)
- Removed broken MinimalFooter from `apps/web/src/app/[locale]/(landing)/layout.tsx` (was using non-existent B2C key)

### Phase 7: Polish & CLO Compliance
- Hero CSS: `min-height: 100svh`
- All 12 CLO compliance items verified
- Locale-conditional disclaimers working correctly:
  - EN: US regulatory disclosure
  - DE: MiCA Article 68
  - ES: MiCA Article 68
  - PT-BR: MiCA + CVM + BCB

---

## Files Modified (~20 files)

| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | Geist → Inter font |
| `apps/web/src/styles/design-tokens.css` | New text/bg/prose tokens |
| `apps/web/src/app/[locale]/(landing)/page.tsx` | 11-section layout rewrite, `<main>` → `<div>` |
| `apps/web/src/app/[locale]/(landing)/layout.tsx` | Removed broken MinimalFooter, removed landing-b2c namespace loading |
| `apps/web/src/config/landing-b2c.ts` | Complete config rewrite |
| `packages/i18n/translations/en/landing-b2c.json` | New copy + demo screen keys |
| `packages/i18n/translations/pt-BR/landing-b2c.json` | New copy + demo screen keys |
| `packages/i18n/translations/de/landing-b2c.json` | New copy + demo screen keys |
| `packages/i18n/translations/es/landing-b2c.json` | New copy + demo screen keys |
| `packages/i18n/translations/en/waitlist.json` | Updated header/subheader |
| `packages/i18n/translations/pt-BR/waitlist.json` | Updated header/subheader |
| `packages/i18n/translations/de/waitlist.json` | Updated header/subheader |
| `packages/i18n/translations/es/waitlist.json` | Updated header/subheader |
| `apps/web/src/components/Layout/Footer/MinimalFooter.tsx` | Tagline, nav, disclosures, locale logic |
| `apps/web/src/components/Layout/Footer/MinimalFooter.module.css` | New styles |
| `apps/web/src/components/Sections/HeroSection/.../HeroFullBackground.module.css` | 100svh |
| `apps/web/src/components/Sections/index.ts` | Export new components |

## Files Created (~12 files)

| File | Purpose |
|------|---------|
| `apps/web/src/components/Sections/ProseSection/ProseSection.tsx` | Prose component |
| `apps/web/src/components/Sections/ProseSection/ProseSection.module.css` | Prose styles |
| `apps/web/src/components/Sections/ProseSection/index.ts` | Barrel export |
| `apps/web/src/config/proseSection.ts` | Prose config interface |
| `apps/web/src/components/Sections/ScenarioCards/ScenarioCards.tsx` | Scenarios component |
| `apps/web/src/components/Sections/ScenarioCards/ScenarioCards.module.css` | Scenarios styles |
| `apps/web/src/components/Sections/ScenarioCards/index.ts` | Barrel export |
| `apps/web/src/components/Sections/ScenarioCards/components/ScenarioCard.tsx` | Individual card |
| `apps/web/src/config/scenarioCards.ts` | Scenarios config interface |
| `apps/web/src/components/Sections/FeeTable/FeeTable.tsx` | Fee table component |
| `apps/web/src/components/Sections/FeeTable/FeeTable.module.css` | Fee table styles |
| `apps/web/src/components/Sections/FeeTable/index.ts` | Barrel export |
| `apps/web/src/config/feeTable.ts` | Fee table config interface |

---

## Verification Status

| Check | Status |
|-------|--------|
| `pnpm type-check` | PASS |
| `pnpm lint` | PASS (0 errors, 119 pre-existing warnings) |
| `pnpm test` | PASS (153/153) |
| `pnpm build` | PASS |
| `pnpm validate:translations` | PASS (all 4 locales in sync) |
| curl content verification (all 4 locales, all 11 sections) | PASS |
| Locale-conditional disclaimers | PASS |
| No untranslated keys in visible content | PASS |

---

## What's Pending

### Visual Browser Testing (the ONE remaining task)
- Need to use Playwright MCP browser tools to take screenshots at:
  - **Desktop:** 1440x900
  - **iPhone 14:** 390x844
  - **iPhone SE:** 375x667
- Need to visually verify for both EN and PT-BR:
  - All 11 sections render correctly
  - No layout overflow on mobile
  - Touch targets >= 48px
  - Fee table responsive card layout on mobile
  - Scenario cards stack vertically on mobile
  - Footer disclaimers readable
  - Images degrade gracefully (dark gradient fallback)

### How to run the visual test
1. Make sure Docker Desktop is running
2. Make sure MCP Docker server is configured: `claude mcp list` should show it
3. Start dev server: `pnpm dev:web`
4. Navigate to `http://host.docker.internal:3000/en` using the Playwright browser tools
5. Take full-page screenshots at desktop and mobile viewports
6. Scroll through each section and verify visually

### Known Non-Issues (pre-existing, not part of this work)
- Image quality warning: `logo-icon.avif` using quality 80 not in `images.qualities` config
- Google Analytics connection errors in dev (expected — no GA in local dev)
- 119 ESLint warnings (all pre-existing, none from our changes)

---

## Plan File
The full implementation plan is at: `/Users/simonekugler/.claude/plans/ancient-munching-babbage.md`

## Source Documents
- `docs/new-copy/B2C_LANDING_PAGE_CLAUDE_CODE_HANDOFF.md` — Implementation spec
- `docs/new-copy/diBoaS_B2C_Landing_Page_{EN,PTBR,DE,ES}_Final.md` — Authoritative copy per locale
