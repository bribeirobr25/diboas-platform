/**
 * B2C Landing Page — pt-BR composition config (Draper restructure).
 *
 * Per-locale composition (LandingPtBR). DRY: reuses the existing section
 * components (Hero/Wedge/ProseSection/Demo/FeeTable/Waitlist) with pt-BR copy
 * (the `ptbr.*` keys in landing-b2c.json), on-brand in-repo documentary images,
 * and the dusk -> dawn surface-token ordering. No hardcoded colors/strings: all
 * via design tokens + i18n keys. See LANDING_REBUILD_PLAN.md.
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

/** On-brand documentary images (already in-repo, licensed). */
const PTBR_IMAGES = {
  hero: '/assets/images/veil-of-dawn.avif',
  whatIs: '/assets/images/future-in-hand.avif',
  imagine: '/assets/images/sunlit-future.avif',
  trust: '/assets/images/hands-of-hope.avif',
  adelaide: '/assets/images/saved-through-time.avif',
} as const;

/** §1 Hero — real-photo full-bleed (no WebGL), dawn light, single <h1>. */
export const B2C_PTBR_HERO_CONFIG: HeroVariantConfig = {
  variant: 'cinematic',
  content: {
    title: 'landing-b2c.ptbr.hero.headline',
    description: 'landing-b2c.ptbr.hero.subtitle',
    ctaText: 'landing-b2c.ptbr.hero.cta',
    ctaHref: '#como-funciona',
    ctaTarget: '_self',
  },
  // Live cinematic hero (CEO request): WebGL dawn-water scene + duotone poster.
  cinematic: {
    scene: 'dawn-water',
    theme: 'dark',
    align: 'left',
    sectionId: 'hero-b2c',
    posterImage: '/assets/images/still-tide.avif',
    posterDuotone: false,
  },
  seo: { imageAlt: { background: '' } },
  analytics: { trackingPrefix: 'hero_b2c_ptbr', enabled: true },
} as const;

/** §3 O que é o diBoaS (the mechanism, cofre) — first dawn light. */
export const B2C_PTBR_WHATIS_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.ptbr.whatIsSection.header',
    paragraphs: ['landing-b2c.ptbr.whatIsSection.body'],
  },
  image: {
    src: PTBR_IMAGES.whatIs,
    alt: 'landing-b2c.ptbr.whatIsSection.imageAlt',
    position: 'left',
  },
  style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.ptbr.whatIsSection.header' },
  analytics: { sectionId: 'whatis-section-ptbr', category: 'landing-b2c' },
} as const;

/** §4 Imagine o futuro (the hope peak) — full golden dawn. */
export const B2C_PTBR_IMAGINE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.ptbr.imagineFuture.header',
    paragraphs: ['landing-b2c.ptbr.imagineFuture.body'],
  },
  image: {
    src: PTBR_IMAGES.imagine,
    alt: 'landing-b2c.ptbr.imagineFuture.imageAlt',
    position: 'right',
  },
  // Match the whatIs inline-title layout (CEO request): a centered header floats
  // the title too far from the body when an image is present.
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.ptbr.imagineFuture.header' },
  analytics: { sectionId: 'imagine-section-ptbr', category: 'landing-b2c' },
  // Rotating CTA (per visit): pt-BR best-converter candidates + demo (the dollar
  // hedge leads, since it's the killer wedge for the BR audience).
  cta: [
    { id: 'currency-depreciation', text: 'landing-b2c.toolCtas.currencyDepreciation', href: '/tools/currency-depreciation' },
    { id: 'compound-interest', text: 'landing-b2c.toolCtas.compoundInterest', href: '/tools/compound-interest' },
    { id: 'demo', text: 'landing-b2c.toolCtas.demo', href: '/demo' },
  ],
} as const;

/** §5 Como funciona (3 passos + porta de saída) — clear day. */
export const B2C_PTBR_HOWITWORKS_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.ptbr.howItWorks.header',
    paragraphs: [
      'landing-b2c.ptbr.howItWorks.step1',
      'landing-b2c.ptbr.howItWorks.step2',
      'landing-b2c.ptbr.howItWorks.step3',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-white)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: { ariaLabel: 'landing-b2c.ptbr.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-ptbr', category: 'landing-b2c' },
} as const;

/** §6 E se der errado? (the honest letter, trust) — paper-and-ink dark. */
export const B2C_PTBR_TRUST_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.ptbr.trust.header',
    // All-in fee receipt (CC8): index 1 is replaced at render by the live-value
    // fee citation (`buildAllFeeValues` → sellRate/exampleFee/maxFee). DRY: reuses
    // the proven `catch.feeParagraph` key (shared across locales).
    paragraphs: ['landing-b2c.ptbr.trust.body', 'landing-b2c.catch.feeParagraph'],
    feeParagraph: 'landing-b2c.catch.feeParagraph',
    feeParagraphAt: { 'pt-BR': 1 },
  },
  image: {
    src: PTBR_IMAGES.trust,
    alt: 'landing-b2c.ptbr.trust.imageAlt',
    position: 'left',
  },
  style: { backgroundColor: 'var(--section-bg-dark)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.ptbr.trust.header' },
  analytics: { sectionId: 'trust-section-ptbr', category: 'landing-b2c' },
} as const;

/** §9 A Adelaide (the founder story) — warm, intimate. */
export const B2C_PTBR_ADELAIDE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.ptbr.adelaide.header',
    paragraphs: ['landing-b2c.ptbr.adelaide.body'],
  },
  image: {
    src: PTBR_IMAGES.adelaide,
    alt: 'landing-b2c.ptbr.adelaide.imageAlt',
    position: 'right',
  },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.ptbr.adelaide.header' },
  analytics: { sectionId: 'adelaide-section-ptbr', category: 'landing-b2c' },
} as const;

/** §7 Demo — pt-BR copy override for the reused DemoLauncher. */
export const B2C_PTBR_DEMO_CONFIG = {
  content: {
    header: 'landing-b2c.ptbr.demo.header',
    subtext: 'landing-b2c.ptbr.demo.body',
    ctaPrimary: 'landing-b2c.ptbr.demo.cta',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: { headingLevel: 'h2' as const, ariaLabel: 'landing-b2c.ptbr.demo.header' },
  analytics: { sectionId: 'demo-section-b2c', category: 'landing-b2c' },
} as const;

/** §10 Comece com R$10 — pt-BR copy override for the reused WaitlistSection. */
export const B2C_PTBR_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2c',
  backgroundColor: 'var(--section-bg-dark)',
  ariaLabel: 'landing-b2c.sections.waitlist.ariaLabel',
  headingLevel: 'h2' as const,
  headline: 'landing-b2c.ptbr.finalCta.header',
  subheadline: 'landing-b2c.ptbr.finalCta.body',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'landing_b2c' as const,
} as const;
