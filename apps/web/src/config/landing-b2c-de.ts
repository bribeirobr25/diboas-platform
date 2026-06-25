/**
 * B2C Landing Page — /de composition config (Draper restructure, EU twin).
 *
 * Fairness-led spine ("Es ist dein Geld. Der Gewinn auch."): pain -> "wir halten
 * dein Geld nie" -> "der Gewinn gehört dir" -> hope. Reuses the existing section
 * components with de copy (the `draper.*` keys in de/landing-b2c.json), on-brand
 * in-repo images, and the dusk -> dawn token ordering. "du" register, 5 € minimum.
 * No hardcoded colors/strings. See LANDING_REBUILD_PLAN_DE.md.
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

const DE_IMAGES = {
  hero: '/assets/images/veil-of-dawn.avif',
  neverHold: '/assets/images/private-control.avif',
  upside: '/assets/images/power-of-us.avif',
  pictureFuture: '/assets/images/saved-through-time.avif',
  catch: '/assets/images/moment-of-ease.avif',
  founder: '/assets/images/moments-we-share.avif',
} as const;

/** §1 Hero — real-photo full-bleed, dawn light, single <h1>. */
export const B2C_DE_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.draper.hero.headline',
    description: 'landing-b2c.draper.hero.subtitle',
    ctaText: 'landing-b2c.draper.hero.cta',
    ctaHref: '#so-funktioniert',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: DE_IMAGES.hero,
    backgroundImageMobile: DE_IMAGES.hero,
    overlayOpacity: 0.45,
  },
  // Background is decorative (rendered alt="" aria-hidden); the <title> comes from
  // the page generateMetadata. No per-hero titleTag needed for fullBackground.
  seo: { imageAlt: { background: '' } },
  analytics: { trackingPrefix: 'hero_b2c_de', enabled: true },
} as const;

/** §3 Wir halten dein Geld nie (the pillar) — first dawn light. */
export const B2C_DE_NEVERHOLD_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.neverHold.header',
    paragraphs: ['landing-b2c.draper.neverHold.body'],
  },
  image: { src: DE_IMAGES.neverHold, alt: 'landing-b2c.draper.neverHold.imageAlt', position: 'left' },
  style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.neverHold.header' },
  analytics: { sectionId: 'neverhold-section-de', category: 'landing-b2c' },
} as const;

/** §4 Der Gewinn gehört dir (the fairness clincher) — morning building. */
export const B2C_DE_UPSIDE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.upside.header',
    paragraphs: ['landing-b2c.draper.upside.body'],
  },
  image: { src: DE_IMAGES.upside, alt: 'landing-b2c.draper.upside.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-white)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.upside.header' },
  analytics: { sectionId: 'upside-section-de', category: 'landing-b2c' },
} as const;

/** §5 Stell dir ein paar Jahre vor (the hope peak) — full golden dawn. */
export const B2C_DE_PICTUREFUTURE_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.pictureFuture.header',
    paragraphs: ['landing-b2c.draper.pictureFuture.body'],
  },
  image: { src: DE_IMAGES.pictureFuture, alt: 'landing-b2c.draper.pictureFuture.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'generous', headerStyle: 'centered' },
  seo: { ariaLabel: 'landing-b2c.draper.pictureFuture.header' },
  analytics: { sectionId: 'picture-future-section-de', category: 'landing-b2c' },
} as const;

/** §6 So funktioniert es (3 Schritte + Ausstiegstür) — clear day. */
export const B2C_DE_HOWITWORKS_CONFIG: ProseSectionConfig = {
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
  analytics: { sectionId: 'how-it-works-de', category: 'landing-b2c' },
} as const;

/** §7 Wo ist der Haken? (the honest letter) — paper-and-ink dark. */
export const B2C_DE_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.catch.header',
    paragraphs: ['landing-b2c.draper.catch.body'],
  },
  image: { src: DE_IMAGES.catch, alt: 'landing-b2c.draper.catch.imageAlt', position: 'left' },
  style: { backgroundColor: 'var(--section-bg-dark)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.catch.header' },
  analytics: { sectionId: 'catch-section-de', category: 'landing-b2c' },
} as const;

/** §10 Gebaut von Bar (the founder story) — warm, intimate. */
export const B2C_DE_FOUNDER_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.draper.founder.header',
    paragraphs: ['landing-b2c.draper.founder.body'],
  },
  image: { src: DE_IMAGES.founder, alt: 'landing-b2c.draper.founder.imageAlt', position: 'right' },
  style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
  seo: { ariaLabel: 'landing-b2c.draper.founder.header' },
  analytics: { sectionId: 'founder-section-de', category: 'landing-b2c' },
} as const;

/** §8 Glaub uns nicht einfach (Demo) — de copy override for DemoLauncher. */
export const B2C_DE_DEMO_CONFIG = {
  content: {
    header: 'landing-b2c.draper.demo.header',
    subtext: 'landing-b2c.draper.demo.body',
    ctaPrimary: 'landing-b2c.draper.demo.cta',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: { headingLevel: 'h2' as const, ariaLabel: 'landing-b2c.draper.demo.header' },
  analytics: { sectionId: 'demo-section-b2c', category: 'landing-b2c' },
} as const;

/** §11 Mach mit (final CTA) — de copy override for WaitlistSection. */
export const B2C_DE_WAITLIST_CONFIG = {
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
