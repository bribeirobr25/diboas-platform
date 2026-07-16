/**
 * BrandWordmark — the official "diBoaS" wordmark image for the navigation
 * (F-BRAND wiring, 2026-07-16; plan: docs/audit/_archive/PLAN_BRAND_WIRING_2026-07-13.md).
 *
 * Renders BOTH theme variants as <picture> (AVIF + WebP fallback); the nav state
 * classes in semantic-components.css toggle which one is visible:
 *   - default / nav-solid / nav-transparent--on-light → `-onlight` (dark ink)
 *   - nav-transparent (over-dark hero)                → `-ondark` (cream ink)
 * This preserves the existing pure-CSS scroll transition with zero JS.
 *
 * Derivatives are pre-optimized, committed files generated with sharp from the
 * official sources in `apps/web/brand-source/` (background-keyed to transparent,
 * trimmed, height 88px). Naming is `-onlight`/`-ondark` = FOR light/dark surfaces
 * (the source files' "light/dark-palette" naming was inversion-prone).
 *
 * `alt=""`: the wrapping LocaleLink already carries the localized home aria-label,
 * so the image is decorative-redundant (avoids double announcement).
 * Explicit width/height on both variants prevents CLS.
 */

const WORDMARK_HEIGHT = 88;
const ONLIGHT_WIDTH = 375;
const ONDARK_WIDTH = 366;

export function BrandWordmark() {
  return (
    <span className="brand-wordmark">
      <picture className="brand-wordmark-img brand-wordmark-img--onlight">
        <source srcSet="/assets/logos/logo-wordmark-onlight.avif" type="image/avif" />
        <img
          src="/assets/logos/logo-wordmark-onlight.webp"
          alt=""
          width={ONLIGHT_WIDTH}
          height={WORDMARK_HEIGHT}
          decoding="async"
        />
      </picture>
      <picture className="brand-wordmark-img brand-wordmark-img--ondark">
        <source srcSet="/assets/logos/logo-wordmark-ondark.avif" type="image/avif" />
        <img
          src="/assets/logos/logo-wordmark-ondark.webp"
          alt=""
          width={ONDARK_WIDTH}
          height={WORDMARK_HEIGHT}
          decoding="async"
        />
      </picture>
    </span>
  );
}
