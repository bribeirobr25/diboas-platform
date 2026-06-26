/**
 * B2C Landing — EU spine config (en/de/es), Draper restructure.
 *
 * The three EU locales (en/de/es) share one fairness-led spine and identical
 * section structure; they reuse the same `draper.*` i18n keys (react-intl
 * resolves them per active locale), the same in-repo images, the same dusk->dawn
 * surface tokens, and the same cinematic hero. Only a small, explicit set of
 * values diverges per locale — captured in EU_VARIANTS and applied by
 * `makeEuLandingConfig`. NO ids/anchors are computed: every divergent value is a
 * literal (the `how-it-works-{loc}` section-id has no `-section-` infix; the
 * `founder` anchor is shared while its section-id is locale-suffixed). pt-BR is a
 * genuinely different spine and is NOT covered here. See LANDING_PHASE_B_PLAN.md.
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

export type EuLocale = 'en' | 'de' | 'es';

/** Shared documentary images (identical across en/de/es; verified). */
const IMAGES = {
  neverHold: '/assets/images/private-control.avif',
  upside: '/assets/images/power-of-us.avif',
  pictureFuture: '/assets/images/sunlit-future.avif',
  catch: '/assets/images/moment-of-ease.avif',
  founder: '/assets/images/saved-through-time.avif',
} as const;

/** The fee receipt (CC8) is the same uniform citation across all three locales;
 * ProseSection replaces `paragraphs[feeParagraphAt[activeLocale]]`. */
const FEE_PARAGRAPH_AT = { en: 1, de: 1, es: 1 } as const;

/** Rotating tool CTAs under "Picture a few years out" (per-visit rotation). */
const CTA_EN = [
  {
    id: 'compound-interest',
    text: 'landing-b2c.toolCtas.compoundInterest',
    href: '/tools/compound-interest',
  },
  { id: 'idle-cash', text: 'landing-b2c.toolCtas.idleCash', href: '/tools/idle-cash' },
  { id: 'demo', text: 'landing-b2c.toolCtas.demo', href: '/demo' },
] as const;
const CTA_DE_ES = [
  {
    id: 'inflation-impact',
    text: 'landing-b2c.toolCtas.inflationImpact',
    href: '/tools/inflation-impact',
  },
  {
    id: 'compound-interest',
    text: 'landing-b2c.toolCtas.compoundInterest',
    href: '/tools/compound-interest',
  },
  { id: 'demo', text: 'landing-b2c.toolCtas.demo', href: '/demo' },
] as const;

/**
 * The ONLY per-locale divergences. Section-ids and anchors are exact literals
 * (verified against the pre-refactor LandingEn/De/Es compositions), NOT derived.
 */
interface EuVariant {
  heroCtaHref: string;
  heroTrackingPrefix: string;
  /** data-section-id + analytics.sectionId for the 6 locale-suffixed sections. */
  sectionIds: {
    neverHold: string;
    upside: string;
    pictureFuture: string;
    howItWorks: string;
    catch: string;
    founder: string;
  };
  /** DOM scroll-anchor ids for the 5 translated sections (shared ones live in the spine). */
  anchors: {
    neverHold: string;
    upside: string;
    pictureFuture: string;
    howItWorks: string;
    catch: string;
  };
  pictureCta: readonly { id: string; text: string; href: string }[];
}

const EU_VARIANTS: Record<EuLocale, EuVariant> = {
  en: {
    heroCtaHref: '#how-it-works',
    heroTrackingPrefix: 'hero_b2c_en',
    sectionIds: {
      neverHold: 'neverhold-section-en',
      upside: 'upside-section-en',
      pictureFuture: 'picture-future-section-en',
      howItWorks: 'how-it-works-en',
      catch: 'catch-section-en',
      founder: 'founder-section-en',
    },
    anchors: {
      neverHold: 'we-never-hold',
      upside: 'the-upside',
      pictureFuture: 'picture',
      howItWorks: 'how-it-works',
      catch: 'the-catch',
    },
    pictureCta: CTA_EN,
  },
  de: {
    heroCtaHref: '#so-funktioniert',
    heroTrackingPrefix: 'hero_b2c_de',
    sectionIds: {
      neverHold: 'neverhold-section-de',
      upside: 'upside-section-de',
      pictureFuture: 'picture-future-section-de',
      howItWorks: 'how-it-works-de',
      catch: 'catch-section-de',
      founder: 'founder-section-de',
    },
    anchors: {
      neverHold: 'wir-halten-nie',
      upside: 'der-gewinn',
      pictureFuture: 'stell-dir-vor',
      howItWorks: 'so-funktioniert',
      catch: 'haken',
    },
    pictureCta: CTA_DE_ES,
  },
  es: {
    heroCtaHref: '#como-funciona',
    heroTrackingPrefix: 'hero_b2c_es',
    sectionIds: {
      neverHold: 'neverhold-section-es',
      upside: 'upside-section-es',
      pictureFuture: 'picture-future-section-es',
      howItWorks: 'how-it-works-es',
      catch: 'catch-section-es',
      founder: 'founder-section-es',
    },
    anchors: {
      neverHold: 'nunca-guardamos',
      upside: 'el-rendimiento',
      pictureFuture: 'imagina',
      howItWorks: 'como-funciona',
      catch: 'la-trampa',
    },
    pictureCta: CTA_DE_ES,
  },
};

/** Shared DOM anchors (identical across all EU locales). */
export const EU_SHARED_ANCHORS = {
  demo: 'demo',
  fees: 'fees',
  comparison: 'comparison',
  founder: 'founder',
  waitlist: 'waitlist',
  faq: 'faq',
} as const;

export interface EuLandingConfig {
  hero: HeroVariantConfig;
  neverHold: ProseSectionConfig;
  upside: ProseSectionConfig;
  pictureFuture: ProseSectionConfig;
  howItWorks: ProseSectionConfig;
  catch: ProseSectionConfig;
  founder: ProseSectionConfig;
  demo: {
    content: { header: string; subtext: string; ctaPrimary: string; ctaSecondary: string };
    seo: { headingLevel: 'h2'; ariaLabel: string };
    analytics: { sectionId: string; category: string };
  };
  waitlist: {
    sectionId: string;
    backgroundColor: string;
    ariaLabel: string;
    headingLevel: 'h2';
    headline: string;
    subheadline: string;
    hideBenefits: boolean;
    hideNoSpam: boolean;
    source: 'landing_b2c';
  };
  /** Per-section ids/anchors for the spine JSX (single source of truth). */
  ids: EuVariant['sectionIds'];
  anchors: EuVariant['anchors'];
}

/**
 * Build the section-config bundle for an EU locale. Shared content/images/styles
 * are constructed once; only the EU_VARIANTS literals differ. Keeps every id and
 * anchor exact (no computed infixes).
 */
export function makeEuLandingConfig(locale: EuLocale): EuLandingConfig {
  const v = EU_VARIANTS[locale];

  return {
    hero: {
      variant: 'cinematic',
      content: {
        title: 'landing-b2c.draper.hero.headline',
        description: 'landing-b2c.draper.hero.subtitle',
        ctaText: 'landing-b2c.draper.hero.cta',
        ctaHref: v.heroCtaHref,
        ctaTarget: '_self',
      },
      cinematic: {
        scene: 'dawn-water',
        theme: 'dark',
        align: 'left',
        sectionId: 'hero-b2c',
        posterImage: '/assets/images/still-tide.avif',
        posterDuotone: false,
      },
      seo: { imageAlt: { background: '' } },
      analytics: { trackingPrefix: v.heroTrackingPrefix, enabled: true },
    },

    neverHold: {
      content: {
        header: 'landing-b2c.draper.neverHold.header',
        paragraphs: ['landing-b2c.draper.neverHold.body'],
      },
      image: {
        src: IMAGES.neverHold,
        alt: 'landing-b2c.draper.neverHold.imageAlt',
        position: 'left',
      },
      style: { backgroundColor: 'var(--section-bg-neutral)', verticalPadding: 'standard' },
      seo: { ariaLabel: 'landing-b2c.draper.neverHold.header' },
      analytics: { sectionId: v.sectionIds.neverHold, category: 'landing-b2c' },
    },

    upside: {
      content: {
        header: 'landing-b2c.draper.upside.header',
        paragraphs: ['landing-b2c.draper.upside.body'],
      },
      image: { src: IMAGES.upside, alt: 'landing-b2c.draper.upside.imageAlt', position: 'right' },
      style: { backgroundColor: 'var(--section-bg-white)', verticalPadding: 'standard' },
      seo: { ariaLabel: 'landing-b2c.draper.upside.header' },
      analytics: { sectionId: v.sectionIds.upside, category: 'landing-b2c' },
    },

    pictureFuture: {
      content: {
        header: 'landing-b2c.draper.pictureFuture.header',
        paragraphs: ['landing-b2c.draper.pictureFuture.body'],
      },
      image: {
        src: IMAGES.pictureFuture,
        alt: 'landing-b2c.draper.pictureFuture.imageAlt',
        position: 'right',
      },
      style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
      seo: { ariaLabel: 'landing-b2c.draper.pictureFuture.header' },
      analytics: { sectionId: v.sectionIds.pictureFuture, category: 'landing-b2c' },
      cta: v.pictureCta,
    },

    howItWorks: {
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
      analytics: { sectionId: v.sectionIds.howItWorks, category: 'landing-b2c' },
    },

    catch: {
      content: {
        header: 'landing-b2c.draper.catch.header',
        paragraphs: ['landing-b2c.draper.catch.body', 'landing-b2c.catch.feeParagraph'],
        feeParagraph: 'landing-b2c.catch.feeParagraph',
        feeParagraphAt: FEE_PARAGRAPH_AT,
      },
      image: { src: IMAGES.catch, alt: 'landing-b2c.draper.catch.imageAlt', position: 'left' },
      style: { backgroundColor: 'var(--section-bg-dark)', verticalPadding: 'standard' },
      seo: { ariaLabel: 'landing-b2c.draper.catch.header' },
      analytics: { sectionId: v.sectionIds.catch, category: 'landing-b2c' },
    },

    founder: {
      content: {
        header: 'landing-b2c.draper.founder.header',
        paragraphs: ['landing-b2c.draper.founder.body'],
      },
      image: { src: IMAGES.founder, alt: 'landing-b2c.draper.founder.imageAlt', position: 'right' },
      style: { backgroundColor: 'var(--section-bg-warm)', verticalPadding: 'standard' },
      seo: { ariaLabel: 'landing-b2c.draper.founder.header' },
      analytics: { sectionId: v.sectionIds.founder, category: 'landing-b2c' },
    },

    demo: {
      content: {
        header: 'landing-b2c.draper.demo.header',
        subtext: 'landing-b2c.draper.demo.body',
        ctaPrimary: 'landing-b2c.draper.demo.cta',
        ctaSecondary: 'landing-b2c.demo.ctaSecondary',
      },
      seo: { headingLevel: 'h2', ariaLabel: 'landing-b2c.draper.demo.header' },
      analytics: { sectionId: 'demo-section-b2c', category: 'landing-b2c' },
    },

    waitlist: {
      sectionId: 'waitlist-section-b2c',
      backgroundColor: 'var(--section-bg-dark)',
      ariaLabel: 'landing-b2c.sections.waitlist.ariaLabel',
      headingLevel: 'h2',
      headline: 'landing-b2c.draper.finalCta.header',
      subheadline: 'landing-b2c.draper.finalCta.body',
      hideBenefits: true,
      hideNoSpam: true,
      source: 'landing_b2c',
    },

    ids: v.sectionIds,
    anchors: v.anchors,
  };
}
