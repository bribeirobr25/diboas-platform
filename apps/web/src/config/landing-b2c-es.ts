/**
 * B2C Landing Page — /es composition config (Draper restructure, EU twin, Spain).
 *
 * Fairness-led spine ("Es tu dinero. El rendimiento también."): pain (2%) ->
 * "nunca guardamos tu dinero" -> "el rendimiento es para ti" -> hope. Reuses the
 * existing section components with es copy (the `draper.*` keys in es/landing-b2c.json),
 * on-brand in-repo images, and the dusk -> dawn token ordering. Peninsular "tú",
 * 5 € minimum. No hardcoded colors/strings. See LANDING_REBUILD_PLAN_ES.md.
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

const ES_IMAGES = {
  hero: '/assets/images/veil-of-dawn.avif',
  neverHold: '/assets/images/private-control.avif',
  upside: '/assets/images/power-of-us.avif',
  pictureFuture: '/assets/images/saved-through-time.avif',
  catch: '/assets/images/moment-of-ease.avif',
  founder: '/assets/images/moments-we-share.avif',
} as const;

/** §1 Hero — real-photo full-bleed, dawn light, single <h1>. */
export const B2C_ES_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.draper.hero.headline',
    description: 'landing-b2c.draper.hero.subtitle',
    ctaText: 'landing-b2c.draper.hero.cta',
    ctaHref: '#como-funciona',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: ES_IMAGES.hero,
    backgroundImageMobile: ES_IMAGES.hero,
    overlayOpacity: 0.45,
  },
  // Background is decorative (rendered alt="" aria-hidden); the <title> comes from
  // the page generateMetadata. No per-hero titleTag needed for fullBackground.
  seo: { imageAlt: { background: '' } },
  analytics: { trackingPrefix: 'hero_b2c_es', enabled: true },
} as const;

/** §3 Nunca guardamos tu dinero (the pillar) — first dawn light. */
export const B2C_ES_NEVERHOLD_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.neverHold.header',
    paragraphs: ['landing-b2c.draper.neverHold.body'],
  },
  image: { src: ES_IMAGES.neverHold, alt: 'landing-b2c.draper.neverHold.imageAlt', position: 'left' },
  style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.neverHold.header' },
  analytics: { sectionId: 'neverhold-section-es', category: 'landing-b2c' },
} as const;

/** §4 El rendimiento es para ti (the fairness clincher) — morning building. */
export const B2C_ES_UPSIDE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.upside.header',
    paragraphs: ['landing-b2c.draper.upside.body'],
  },
  image: { src: ES_IMAGES.upside, alt: 'landing-b2c.draper.upside.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-white)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.upside.header' },
  analytics: { sectionId: 'upside-section-es', category: 'landing-b2c' },
} as const;

/** §5 Imagina unos años (the hope peak) — full golden dawn. */
export const B2C_ES_PICTUREFUTURE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.pictureFuture.header',
    paragraphs: ['landing-b2c.draper.pictureFuture.body'],
  },
  image: { src: ES_IMAGES.pictureFuture, alt: 'landing-b2c.draper.pictureFuture.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'generous', headerStyle: 'centered' },
  seo: { ariaLabel: 'landing-b2c.draper.pictureFuture.header' },
  analytics: { sectionId: 'picture-future-section-es', category: 'landing-b2c' },
} as const;

/** §6 Cómo funciona (3 pasos + puerta de salida) — clear day. */
export const B2C_ES_HOWITWORKS_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.howItWorks.header',
    paragraphs: [
      'landing-b2c.draper.howItWorks.step1',
      'landing-b2c.draper.howItWorks.step2',
      'landing-b2c.draper.howItWorks.step3',
    ],
  },
  style: { backgroundColor: 'var(--section-bg-white)', verticalPadding: 'standard', headerStyle: 'centered' },
  seo: { ariaLabel: 'landing-b2c.draper.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-es', category: 'landing-b2c' },
} as const;

/** §7 ¿Cuál es la trampa? (the honest letter) — paper-and-ink dark. */
export const B2C_ES_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.catch.header',
    paragraphs: ['landing-b2c.draper.catch.body'],
  },
  image: { src: ES_IMAGES.catch, alt: 'landing-b2c.draper.catch.imageAlt', position: 'left' },
  style: { backgroundColor: 'var(--section-bg-dark)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.catch.header' },
  analytics: { sectionId: 'catch-section-es', category: 'landing-b2c' },
} as const;

/** §10 Construido por Bar (the founder story) — warm, intimate. */
export const B2C_ES_FOUNDER_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.founder.header',
    paragraphs: ['landing-b2c.draper.founder.body'],
  },
  image: { src: ES_IMAGES.founder, alt: 'landing-b2c.draper.founder.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.founder.header' },
  analytics: { sectionId: 'founder-section-es', category: 'landing-b2c' },
} as const;

/** §8 No te fíes solo de nuestra palabra (Demo) — es copy override for DemoLauncher. */
export const B2C_ES_DEMO_CONFIG = {
  content: {
    header: 'landing-b2c.draper.demo.header',
    subtext: 'landing-b2c.draper.demo.body',
    ctaPrimary: 'landing-b2c.draper.demo.cta',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: { headingLevel: 'h2' as const, ariaLabel: 'landing-b2c.draper.demo.header' },
  analytics: { sectionId: 'demo-section-b2c', category: 'landing-b2c' },
} as const;

/** §11 Únete (final CTA) — es copy override for WaitlistSection. */
export const B2C_ES_WAITLIST_CONFIG = {
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
