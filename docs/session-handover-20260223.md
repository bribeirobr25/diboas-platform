# Session Handover — 2026-02-23

## What Was Accomplished

### Round 1: Initial Cleanup (4 phases from pre-written plan)

1. **Phase 1 — Documentation cleanup:** Deleted 6 stale content spec files from repo root (B2B/B2C landing page specs, Future You, Strategies, Codebase Review Report, Verification Report)
2. **Phase 2 — Orphaned test files:** Deleted 4 root-level ad-hoc test scripts + `responsive-test/` directory
3. **Phase 3 — Dead code:** Removed deprecated Legal components, `COMPONENTS` export from design-system.ts, legacy CSP infrastructure from security.ts, backup file, empty directory
4. **Phase 4 — Config fix:** Removed stale `'services/*'` from `pnpm-workspace.yaml`

### Round 2: Deep Audit Cleanup

5. **Phase A — Git hygiene:** `git rm --cached` for `screenshots/` (194 files, ~84MB), `.lighthouseci/` (20 files, ~18MB), `test-results/`. Updated `.gitignore`.
6. **Phase B — Dead modules:** Deleted 10 entire directories (lib/theme, lib/optimization, lib/patterns, lib/content, lib/hooks, lib/constants, components/BookCall, components/InteractiveDemo, Sections/DemoEmbed, Sections/FutureYouPreviewSection) + 9 individual dead files (StaticPageTemplate, Strategies constants, business-metrics, dashboards, ratings, assets, i18n-simple, withSectionErrorBoundary, Storybook boilerplate)
7. **Phase C — Config consolidation:** Merged `config/environment.ts` into `config/env.ts` (5 consumers migrated). Cleaned dead monitoring provider configs from `config/monitoring.ts` (DataDog, NewRelic, LogRocket).

### Round 3: Remaining Medium + Low Items

8. **Dependency cleanup:** Removed 8 unused deps from packages/ui (Radix, React Aria), apps/web (@testing-library/react, @next/bundle-analyzer), root (@playwright/test, prettier). Added @vitest/coverage-v8.
9. **Duplicate export fixes:** Removed `export default` from 6 files that also had named exports. Updated 3 barrel index.ts files.
10. **Dead files & barrels:** Deleted WaitingListService.ts, Navigation/types.ts, useTransactionAnimation.ts, 3 example-config.ts files, 3 superseded FAQAccordion pre-factory files (FAQAccordion.tsx, AccordionItem.tsx, faqUtils.ts), eventBusAnalyticsBridge.ts. Updated 4 barrel exports.
11. **Placeholder phone numbers:** Removed `XXX-XXX-XXXX` from 8 translation files (4 locales × faq.json + marketing.json).

### Post-Cleanup: Image Path Fixes

12. **User manually deleted:** `logo-icon.png`, `assets/mascots/` directory, `assets/socials/` directory (drawing + real), `docs/demo/` directory
13. **Broken references fixed (27 total):** Updated image paths in layout.tsx, WaitingListModal.tsx, featureShowcase.ts (5 paths), oneFeature.ts, and 4 Storybook files (ProductCarousel, FeatureShowcase, AppFeaturesCarousel, OneFeature stories)
14. **Image path mapping:** All old `/assets/socials/` and `/assets/mascots/` paths now point to `/assets/images/`, `/assets/icons/`, or `/assets/logos/`
15. **CLAUDE.md updated:** Audit item #26 marked Done, tech stack updated (removed Radix UI/React Aria, replaced @testing-library/react with @vitest/coverage-v8)

### Audit Report

Full audit trail at: `docs/audit/code/cleanup-20260223.md`

---

## Current Codebase State

- **Branch:** `waitlist-launch`
- **All checks pass:** `pnpm type-check` (3/3), `pnpm build` (success), `pnpm test` (153/153 tests)
- **All 33 audit items:** Done
- **Image paths:** All updated to new `/assets/images/`, `/assets/icons/`, `/assets/logos/` structure — but visual verification is still needed (see Task 1 below)
- **Uncommitted changes:** All cleanup work is unstaged. A commit should be created once visual verification is complete.

### Asset Directory Structure (current)

```
apps/web/public/assets/
  icons/       # 28 AVIF files (favicons, charts, rewards, learning icons)
  images/      # 45 AVIF files (scenes, phones, cards, hands, lifestyle)
  logos/       # 5 AVIF files (logo-icon, logo-wordmark, b2b variants)
  navigation/  # 7 AVIF files (banners, navigation assets)
```

---

## Next Tasks (in order)

### Task 1: Visual Screenshot Capture

**Goal:** Capture baseline screenshots before proceeding with Kit.com replacement. These serve as visual regression reference.

**Requirements:**
- Install Playwright: `pnpm add -D @playwright/test && npx playwright install chromium`
- Start dev server: `pnpm dev:web`

**Pages to capture:**

| Page | Route | Notes |
|------|-------|-------|
| B2C Landing (home) | `/en` | Main landing page with all sections |
| PreDemo | `/en/demo` | Interactive demo experience |
| PreDream Mode | `/en/dream-mode` | Dream mode simulation |

**Screenshot organization:**

```
screenshots/
  desktop/
    b2c-landing/     # Full page + individual sections
    predemo/         # Each screen of the demo flow
    predream/        # Each screen of the dream mode flow
  mobile/
    b2c-landing/     # Same pages at mobile viewport (375px)
    predemo/
    predream/
```

**Viewport sizes:**
- Desktop: 1440×900
- Mobile: 375×812 (iPhone-like)

**Capture approach:** Scroll through each page and capture individual sections (hero, features, FAQ, social proof, etc.) plus a full-page screenshot.

**Important:** The image path replacements from the cleanup were best-effort based on naming similarity. Visually verify that the replacement images look appropriate in context. The key areas to check:
- `WaitingListModal.tsx` — hero image (was `phone-hero.avif`, now `phone-banner.avif`)
- `featureShowcase.ts` — 5 feature slide images
- `oneFeature.ts` — security section hero image (was `safe.avif`, now `safe-money.avif`)

### Task 2: Kit.com Replacement (Tier 2)

**Plan documents:**
- Analysis: `docs/crm-email/kit-replacement-analysis.md`
- Implementation plan: `docs/crm-email/tier2-implementation-plan.md`

**Summary:** Replace Kit.com (ConvertKit) with:
1. **Neon PostgreSQL (free tier)** replacing the file-based `.waitlist-data.json` store
2. **`packages/email`** monorepo package using **Resend (free tier)** as email provider
3. **4 transactional email templates** for lifecycle events (welcome, position update, referral reward, milestone)
4. **Full removal** of all Kit.com code, config, and environment variables

**Implementation phases (from the plan):**
1. Phase 1: Database migration (file store → Neon PostgreSQL)
2. Phase 2: Email package (`packages/email` with Resend)
3. Phase 3: Integration (wire email triggers into API routes)
4. Phase 4: Kit.com removal (delete all Kit.com code + env vars)
5. Phase 5: Testing & validation

**Pre-requirements (owner action needed):**
- Neon PostgreSQL account + connection string
- Resend account + API key
- DNS records for email sending domain

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project specification (updated this session) |
| `docs/audit/code/cleanup-20260223.md` | Full cleanup audit trail (Rounds 1-3) |
| `docs/audit/code/00-overview-20260223.md` | Original codebase audit |
| `docs/crm-email/kit-replacement-analysis.md` | Kit.com replacement analysis |
| `docs/crm-email/tier2-implementation-plan.md` | Detailed implementation plan |
| `pnpm-workspace.yaml` | Workspace config (will need `packages/email` added in Task 2) |

---

## Verification Commands

```bash
pnpm type-check       # TypeScript checking (3 workspaces)
pnpm build            # Production build
pnpm test             # Vitest (153 tests)
pnpm validate:all     # Full pipeline
```
