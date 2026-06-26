/**
 * B2C Landing Page — /en composition config (Draper restructure, US audience).
 *
 * Fairness-led spine ("It's your money. The upside should be too."): pain (0.38%)
 * -> "we never hold your money" -> "the upside goes to you" -> hope. Reuses the
 * existing section components with en copy (the reference-locale `draper.*` keys),
 * on-brand in-repo images, and the dusk -> dawn token ordering. $5 minimum, no FX
 * label (USD is genuinely FX-free). No hardcoded colors/strings. See LANDING_REBUILD_PLAN_EN.md.
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

const EN_IMAGES = {
  hero: '/assets/images/veil-of-dawn.avif',
  neverHold: '/assets/images/private-control.avif',
  upside: '/assets/images/power-of-us.avif',
  pictureFuture: '/assets/images/sunlit-future.avif',
  catch: '/assets/images/moment-of-ease.avif',
  founder: '/assets/images/saved-through-time.avif',
} as const;

/** §1 Hero — real-photo full-bleed, dawn light, single <h1>. */
export const B2C_EN_HERO_CONFIG: HeroVariantConfig = {
  variant: 'cinematic',
  content: {
    title: 'landing-b2c.draper.hero.headline',
    description: 'landing-b2c.draper.hero.subtitle',
    ctaText: 'landing-b2c.draper.hero.cta',
    ctaHref: '#how-it-works',
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
  analytics: { trackingPrefix: 'hero_b2c_en', enabled: true },
} as const;

/** §3 We never hold your money (the pillar) — first dawn light. */
export const B2C_EN_NEVERHOLD_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.neverHold.header',
    paragraphs: ['landing-b2c.draper.neverHold.body'],
  },
  image: {
    src: EN_IMAGES.neverHold,
    alt: 'landing-b2c.draper.neverHold.imageAlt',
    position: 'left',
  },
  style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.neverHold.header' },
  analytics: { sectionId: 'neverhold-section-en', category: 'landing-b2c' },
} as const;

/** §4 The upside goes to you (the fairness clincher) — morning building. */
export const B2C_EN_UPSIDE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.upside.header',
    paragraphs: ['landing-b2c.draper.upside.body'],
  },
  image: { src: EN_IMAGES.upside, alt: 'landing-b2c.draper.upside.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-white)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.upside.header' },
  analytics: { sectionId: 'upside-section-en', category: 'landing-b2c' },
} as const;

/** §5 Picture a few years out (the hope peak) — full golden dawn. */
export const B2C_EN_PICTUREFUTURE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.pictureFuture.header',
    paragraphs: ['landing-b2c.draper.pictureFuture.body'],
  },
  image: {
    src: EN_IMAGES.pictureFuture,
    alt: 'landing-b2c.draper.pictureFuture.imageAlt',
    position: 'right',
  },
  // Match the whatIs/neverHold inline-title layout (CEO request): a centered
  // header floats the title too far from the body when an image is present.
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.pictureFuture.header' },
  analytics: { sectionId: 'picture-future-section-en', category: 'landing-b2c' },
  // Rotating CTA (per visit): EN best-converter candidates + demo. Click analytics
  // (`future_cta_click {tool}`) reveal the winner to lock later.
  cta: [
    {
      id: 'compound-interest',
      text: 'landing-b2c.toolCtas.compoundInterest',
      href: '/tools/compound-interest',
    },
    { id: 'idle-cash', text: 'landing-b2c.toolCtas.idleCash', href: '/tools/idle-cash' },
    { id: 'demo', text: 'landing-b2c.toolCtas.demo', href: '/demo' },
  ],
} as const;

/** §6 How it works (3 steps + the exit door) — clear day. */
export const B2C_EN_HOWITWORKS_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.howItWorks.header',
    paragraphs: [
      'landing-b2c.draper.howItWorks.step1',
      'landing-b2c.draper.howItWorks.step2',
      'landing-b2c.draper.howItWorks.step3',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-white)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: { ariaLabel: 'landing-b2c.draper.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-en', category: 'landing-b2c' },
} as const;

/** §7 What's the catch? (the honest answer) — paper-and-ink dark. */
export const B2C_EN_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.catch.header',
    // All-in fee receipt (CC8): index 1 is replaced at render by the live-value
    // fee citation (`buildAllFeeValues` → sellRate/exampleFee/maxFee). DRY: reuses
    // the proven `catch.feeParagraph` key (shared across locales).
    paragraphs: ['landing-b2c.draper.catch.body', 'landing-b2c.catch.feeParagraph'],
    feeParagraph: 'landing-b2c.catch.feeParagraph',
    feeParagraphAt: { en: 1 },
  },
  image: { src: EN_IMAGES.catch, alt: 'landing-b2c.draper.catch.imageAlt', position: 'left' },
  style: { backgroundColor: 'var(--section-bg-dark)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.catch.header' },
  analytics: { sectionId: 'catch-section-en', category: 'landing-b2c' },
} as const;

/** §10 Built by Bar (the founder story) — warm, intimate. */
export const B2C_EN_FOUNDER_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.founder.header',
    paragraphs: ['landing-b2c.draper.founder.body'],
  },
  image: { src: EN_IMAGES.founder, alt: 'landing-b2c.draper.founder.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.founder.header' },
  analytics: { sectionId: 'founder-section-en', category: 'landing-b2c' },
} as const;

/** §8 See it yourself (Demo) — en copy override for DemoLauncher. */
export const B2C_EN_DEMO_CONFIG = {
  content: {
    header: 'landing-b2c.draper.demo.header',
    subtext: 'landing-b2c.draper.demo.body',
    ctaPrimary: 'landing-b2c.draper.demo.cta',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: { headingLevel: 'h2' as const, ariaLabel: 'landing-b2c.draper.demo.header' },
  analytics: { sectionId: 'demo-section-b2c', category: 'landing-b2c' },
} as const;

/** §11 Join (final CTA) — en copy override for WaitlistSection. */
export const B2C_EN_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2c',
  backgroundColor: 'var(--section-bg-dark)',
  ariaLabel: 'landing-b2c.sections.waitlist.ariaLabel',
  headingLevel: 'h2' as const,
  headline: 'landing-b2c.draper.finalCta.header',
  subheadline: 'landing-b2c.draper.finalCta.body',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'landing_b2c' as const,
} as const;
