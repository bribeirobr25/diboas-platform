# Asset Management

## Overview

All static assets live in `apps/web/public/assets/` and are served from the `/assets/` URL path. The codebase uses two referencing patterns: a centralized `ASSET_PATHS` config for shared/reusable assets, and direct string paths in page-level configs. All images are AVIF format, optimized via `next/image`.

## Directory Structure

```
apps/web/public/assets/
├── icons/              # Decorative UI icons (AVIF, ~30 files)
│   ├── card.avif
│   ├── chart-growing.avif
│   ├── investing.avif
│   ├── learn-*.avif    # Learning section icons
│   ├── money-*.avif    # Finance-related icons
│   ├── rewards-*.avif  # Rewards section icons
│   └── safe-money.avif
├── images/             # Photography and product shots (~20 files)
│   ├── bed-*.avif      # Lifestyle scenes (bright/dark variants)
│   ├── card-*.avif     # Card product shots
│   ├── friends-*.avif  # Social/lifestyle
│   ├── global-*.avif   # International themes
│   ├── hand-*.avif     # Detail shots
│   ├── kitchen-*.avif  # Interior scenes
│   ├── payment-*.avif  # Payment UI mockups
│   ├── phone-*.avif    # App screen mockups
│   ├── street-*.avif   # Urban scenes
│   └── table-sunlight.avif
├── logos/              # Brand logos (5 files)
│   ├── logo.avif           # Full logo
│   ├── logo-icon.avif      # Icon only (used as favicon/apple-touch)
│   ├── logo-wordmark.avif  # Wordmark
│   ├── logo-icon-b2b.avif  # B2B icon variant
│   └── logo-wordmark-b2b.avif
└── navigation/         # Page-specific banners (7 files)
    ├── about-banner.avif
    ├── business-banner.avif
    ├── diboas-banner.avif
    ├── handy-ultra.avif
    ├── learn-banner.avif
    ├── rewards-banner.avif
    └── security-banner.avif
```

**Note:** The `ASSET_PATHS` config in `assets.ts` also defines paths for `socials/` and `mascots/` subdirectories. The `socials/` assets have shipped (`apps/web/public/assets/socials/`, referenced from `assets.ts`); `mascots/` physical files are not added yet (config pre-wired for upcoming assets).

## Image Formats

All assets use **AVIF** exclusively. Next.js `<Image>` handles format negotiation and responsive sizing at build time. The `next.config.js` image optimization is configured for AVIF and WebP output formats.

When adding new assets:

- Convert to AVIF before committing (best compression for modern browsers)
- Use kebab-case file names (e.g., `phone-balance.avif`)
- Keep icons under 50 KB; hero/product images under 500 KB

## Asset References

### Centralized config (preferred for shared assets)

`apps/web/src/config/assets.ts` exports `ASSET_PATHS` and type-safe helper functions. It supports an optional `NEXT_PUBLIC_CDN_URL` env var for CDN prefixing in production.

```typescript
import { ASSET_PATHS } from '@/config/assets';

// Direct access
<Image src={ASSET_PATHS.LOGOS.ICON} alt="diBoaS" ... />

// Helper functions
import { getNavigationAsset, getSocialRealAsset } from '@/config/assets';
const banner = getNavigationAsset('LEARN_BANNER');
```

Used by: navigation components, SEO constants, PreDemo screens, WaitingListModal.

### Direct paths in page configs

Landing page configs (`landing-b2c.ts`, `landing-b2b.ts`, `benefitsCards-pages.ts`) use inline `/assets/...` strings mapped to section image props.

```typescript
// apps/web/src/config/landing-b2c.ts
const IMAGES = {
  hero: '/assets/images/phone-banner.avif',
  step1: '/assets/images/payment-bright.avif',
  // ...
};
```

### SEO and metadata

`layout.tsx` and `metadata-factory.ts` reference logo paths directly for `apple-touch-icon` and JSON-LD structured data.

## Logo Variants

> Rebuilt 2026-07-13/16 (F-BRAND / G-3 brand wiring — see `docs/tech/implementation-notes.md` for the full rationale). The legacy `logo.avif` / `logo-icon.avif` / `logo-wordmark.avif` / `*-b2b.avif` set was deleted after zero-ref verification.

| File                                        | Use case                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `logo-icon-monogram.avif`                   | Palm-"B" monogram (256px) — JSON-LD/SEO logo references                              |
| `logo-wordmark-onlight.{avif,webp}`         | Transparent wordmark FOR light surfaces (`BrandWordmark` component)                  |
| `logo-wordmark-ondark.{avif,webp}`          | Transparent wordmark FOR dark surfaces (`BrandWordmark` component)                   |
| `public/favicon.ico` + `public/icons/*.png` | Favicon set (16/32) + PWA icons (apple-touch, 192, 512, maskable) — monogram-derived |
| `apps/web/brand-source/*.png`               | Official ~900 KB source PNGs (git-kept for re-export; moved OUT of the served tree)  |

Naming rule: `-onlight` / `-ondark` = FOR light/dark surfaces. Favicon is always the monogram, never the wordmark (illegible at 16–32px).

## Adding New Assets

1. **Add the file** to the appropriate `public/assets/` subdirectory using kebab-case naming and AVIF format.
2. **Register in config** (if the asset will be reused across components): add a key to `ASSET_PATHS` in `apps/web/src/config/assets.ts`.
3. **Reference via `next/image`**: always use the `<Image>` component for automatic optimization, responsive sizing, and lazy loading. Set `priority={true}` only for above-the-fold images.
4. **Provide alt text**: all images require descriptive alt text for accessibility.
