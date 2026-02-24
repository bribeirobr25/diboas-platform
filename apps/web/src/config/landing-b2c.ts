/**
 * B2C Landing Page Configuration
 *
 * Domain-Driven Design: B2C landing page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized landing page content
 * No Hardcoded Values: All values from design tokens and i18n keys
 *
 * 11-Section Layout:
 * 1. Hero
 * 2. Origin Story (ProseSection)
 * 3. How It Works (ProductCarousel)
 * 4. Scenarios (ScenarioCards)
 * 5. Features (FeatureShowcase)
 * 6. Fees (FeeTable)
 * 7. What's the Catch? (ProseSection)
 * 8. Demo (DemoEmbed)
 * 9. Waitlist
 * 10. FAQ
 * 11. Footer (MinimalFooter)
 */

import { ROUTES } from './routes';
import type { FAQAccordionVariantConfig, FAQItem } from './faqAccordion';
import type { HeroVariantConfig } from './hero';
import type { ProductCarouselVariantConfig } from './productCarousel';
import type { ProseSectionConfig } from './proseSection';
import type { ScenarioCardsConfig } from './scenarioCards';
import type { FeeTableConfig } from './feeTable';

/**
 * B2C Landing Page Image Paths
 * Handoff naming convention: /assets/images/{section}-{name}.avif
 */
const B2C_IMAGES = {
  hero: '/assets/images/phone-banner.avif',
  heroMobile: '/assets/images/phone-banner.avif',
  step1: '/assets/images/payment-bright.avif',
  step2: '/assets/images/phone-grow.avif',
  step3: '/assets/images/phone-features3.avif',
  scenarioDinner: '/assets/images/friends-dinner.avif',
  scenarioGlobal: '/assets/images/global2.avif',
  scenarioEmergency: '/assets/images/bed-dark3.avif',
  featureSend: '/assets/images/global-rio-sweden.avif',
  featureGoals: '/assets/images/phone-features.avif',
  featureAlwaysOn: '/assets/images/bed-bright.avif',
  originStory: '/assets/images/hand-bright2.avif',
  catchSection: '/assets/images/phone-diboas.avif',
} as const;

/**
 * Section 1: Hero Configuration
 */
export const B2C_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.hero.headline',
    description: 'landing-b2c.hero.subheadline',
    ctaText: 'landing-b2c.hero.cta',
    ctaHref: '#demo',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: B2C_IMAGES.hero,
    backgroundImageMobile: B2C_IMAGES.heroMobile,
    overlayOpacity: 0.1
  },
  seo: {
    titleTag: 'diBoaS - Make Your Money Work',
    imageAlt: {
      background: 'Financial growth background illustration'
    }
  },
  analytics: {
    trackingPrefix: 'hero_b2c_landing',
    enabled: true
  }
} as const;

/**
 * Section 2: Origin Story Configuration (ProseSection)
 * "Why This Exists", white background, 5 paragraphs + signature line
 */
export const B2C_ORIGIN_STORY_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.origin.header',
    paragraphs: [
      'landing-b2c.origin.paragraphs.p1',
      'landing-b2c.origin.paragraphs.p2',
      'landing-b2c.origin.paragraphs.p3',
      'landing-b2c.origin.paragraphs.p4',
    ],
    signatureLine: 'landing-b2c.origin.paragraphs.p5',
  },
  image: {
    src: B2C_IMAGES.originStory,
    alt: 'Person holding a phone with diBoaS app',
    position: 'right',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'Origin story, why diBoaS exists',
  },
  analytics: {
    sectionId: 'origin-story-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 3: How It Works Configuration (ProductCarousel)
 * 3 steps with quotes
 */
export const B2C_HOW_IT_WORKS_CONFIG: ProductCarouselVariantConfig = {
  variant: 'default',
  content: {
    heading: 'landing-b2c.howItWorks.header',
    slides: [
      {
        id: 'step-1-deposit',
        title: 'landing-b2c.howItWorks.step1.title',
        subtitle: 'landing-b2c.howItWorks.step1.description',
        image: B2C_IMAGES.step1,
        imageAlt: 'Step 1: Add money to your account',
        quote: 'landing-b2c.howItWorks.step1.quote',
      },
      {
        id: 'step-2-earn',
        title: 'landing-b2c.howItWorks.step2.title',
        subtitle: 'landing-b2c.howItWorks.step2.description',
        image: B2C_IMAGES.step2,
        imageAlt: 'Step 2: Pick your strategy',
        quote: 'landing-b2c.howItWorks.step2.quote',
      },
      {
        id: 'step-3-withdraw',
        title: 'landing-b2c.howItWorks.step3.title',
        subtitle: 'landing-b2c.howItWorks.step3.description',
        image: B2C_IMAGES.step3,
        imageAlt: 'Step 3: Grow or withdraw anytime',
        quote: 'landing-b2c.howItWorks.step3.quote',
      }
    ]
  },
  settings: {
    autoPlay: false,
    autoPlayInterval: 5000,
    transitionDuration: 500,
    pauseOnHover: true,
    enableKeyboard: true,
    enableTouch: true,
    enableDots: true,
    enablePlayPause: false
  },
  seo: {
    headingTag: 'h2',
    ariaLabel: 'How diBoaS works in three steps'
  },
  analytics: {
    trackingPrefix: 'how_it_works_b2c',
    enabled: true
  }
};

/**
 * Section 4: Scenarios Configuration (ScenarioCards)
 * 3 real-life scenario cards
 */
export const B2C_SCENARIOS_CONFIG: ScenarioCardsConfig = {
  section: {
    title: 'landing-b2c.scenarios.header',
  },
  cards: [
    {
      id: 'scenario-dinner',
      title: 'landing-b2c.scenarios.card1.title',
      description: 'landing-b2c.scenarios.card1.description',
      backgroundImage: B2C_IMAGES.scenarioDinner,
      imageAlt: 'Friends splitting dinner',
    },
    {
      id: 'scenario-global',
      title: 'landing-b2c.scenarios.card2.title',
      description: 'landing-b2c.scenarios.card2.description',
      backgroundImage: B2C_IMAGES.scenarioGlobal,
      imageAlt: 'Sending payment internationally',
    },
    {
      id: 'scenario-emergency',
      title: 'landing-b2c.scenarios.card3.title',
      description: 'landing-b2c.scenarios.card3.description',
      backgroundImage: B2C_IMAGES.scenarioEmergency,
      imageAlt: 'Emergency money transfer to family',
    },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Real-life scenarios where diBoaS helps',
  },
  analytics: {
    sectionId: 'scenarios-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 5: Features Configuration (FeatureShowcase)
 * 3 feature slides with tagline/title/description
 */
export const B2C_FEATURES_CONFIG = {
  variant: 'default' as const,
  slides: [
    {
      id: 'feature-send',
      content: {
        tagline: 'landing-b2c.features.slide1.tagline',
        title: 'landing-b2c.features.slide1.title',
        description: 'landing-b2c.features.slide1.description',
        ctaText: '',
        ctaHref: '',
      },
      assets: {
        primaryImage: B2C_IMAGES.featureSend,
      },
      seo: {
        imageAlt: 'Send and receive money instantly',
      },
    },
    {
      id: 'feature-goals',
      content: {
        tagline: 'landing-b2c.features.slide2.tagline',
        title: 'landing-b2c.features.slide2.title',
        description: 'landing-b2c.features.slide2.description',
        ctaText: '',
        ctaHref: '',
      },
      assets: {
        primaryImage: B2C_IMAGES.featureGoals,
      },
      seo: {
        imageAlt: 'Goal-based investment strategies',
      },
    },
    {
      id: 'feature-always-on',
      content: {
        tagline: 'landing-b2c.features.slide3.tagline',
        title: 'landing-b2c.features.slide3.title',
        description: 'landing-b2c.features.slide3.description',
        ctaText: '',
        ctaHref: '',
      },
      assets: {
        primaryImage: B2C_IMAGES.featureAlwaysOn,
      },
      seo: {
        imageAlt: 'Your money works 24/7',
      },
    },
  ],
  settings: {
    showNavigation: true,
    showDots: true,
    enableAnalytics: true,
    transitionDuration: 250,
  },
  analytics: {
    trackingPrefix: 'features_b2c_landing',
    enabled: true,
  },
};

/**
 * Section 6: Fees Configuration (FeeTable)
 * 8 fee rows, 4-column comparison layout
 */
export const B2C_FEES_CONFIG: FeeTableConfig = {
  content: {
    title: 'landing-b2c.fees.title',
    subtitle: 'landing-b2c.fees.subtitle',
    disclaimer: 'landing-b2c.fees.disclaimer',
    example: 'landing-b2c.fees.example',
    headers: {
      action: 'landing-b2c.fees.headers.action',
      diboas: 'landing-b2c.fees.headers.diboas',
      competitors: 'landing-b2c.fees.headers.competitors',
      difference: 'landing-b2c.fees.headers.difference',
    },
    rows: [
      {
        id: 'account',
        action: 'landing-b2c.fees.rows.account.action',
        diboas: 'landing-b2c.fees.rows.account.diboas',
        competitors: 'landing-b2c.fees.rows.account.competitors',
        difference: 'landing-b2c.fees.rows.account.difference',
        isFree: true,
      },
      {
        id: 'adding',
        action: 'landing-b2c.fees.rows.adding.action',
        diboas: 'landing-b2c.fees.rows.adding.diboas',
        competitors: 'landing-b2c.fees.rows.adding.competitors',
        difference: 'landing-b2c.fees.rows.adding.difference',
        isHighlight: true,
      },
      {
        id: 'sending',
        action: 'landing-b2c.fees.rows.sending.action',
        diboas: 'landing-b2c.fees.rows.sending.diboas',
        competitors: 'landing-b2c.fees.rows.sending.competitors',
        difference: 'landing-b2c.fees.rows.sending.difference',
        isFree: true,
      },
      {
        id: 'buying',
        action: 'landing-b2c.fees.rows.buying.action',
        diboas: 'landing-b2c.fees.rows.buying.diboas',
        competitors: 'landing-b2c.fees.rows.buying.competitors',
        difference: 'landing-b2c.fees.rows.buying.difference',
        isHighlight: true,
      },
      {
        id: 'selling',
        action: 'landing-b2c.fees.rows.selling.action',
        diboas: 'landing-b2c.fees.rows.selling.diboas',
        competitors: 'landing-b2c.fees.rows.selling.competitors',
        difference: 'landing-b2c.fees.rows.selling.difference',
        isHighlight: true,
      },
      {
        id: 'swapping',
        action: 'landing-b2c.fees.rows.swapping.action',
        diboas: 'landing-b2c.fees.rows.swapping.diboas',
        competitors: 'landing-b2c.fees.rows.swapping.competitors',
        difference: 'landing-b2c.fees.rows.swapping.difference',
        isFree: true,
      },
      {
        id: 'strategies',
        action: 'landing-b2c.fees.rows.strategies.action',
        diboas: 'landing-b2c.fees.rows.strategies.diboas',
        competitors: 'landing-b2c.fees.rows.strategies.competitors',
        difference: 'landing-b2c.fees.rows.strategies.difference',
        isFree: true,
      },
      {
        id: 'cashout',
        action: 'landing-b2c.fees.rows.cashout.action',
        diboas: 'landing-b2c.fees.rows.cashout.diboas',
        competitors: 'landing-b2c.fees.rows.cashout.competitors',
        difference: 'landing-b2c.fees.rows.cashout.difference',
        isHighlight: true,
      },
    ],
  },
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Complete fee transparency table',
  },
  analytics: {
    sectionId: 'fees-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 7: What's the Catch? Configuration (ProseSection)
 * Warm background, 6 paragraphs, emphasis line
 */
export const B2C_CATCH_CONFIG: ProseSectionConfig = {
  content: {
    header: 'landing-b2c.catch.header',
    paragraphs: [
      'landing-b2c.catch.paragraphs.p1',
      'landing-b2c.catch.paragraphs.p2',
      'landing-b2c.catch.paragraphs.p3',
      'landing-b2c.catch.paragraphs.p4',
      'landing-b2c.catch.paragraphs.p5',
    ],
    earlyEmphasisLine: 'landing-b2c.catch.earlyEmphasis',
  },
  image: {
    src: B2C_IMAGES.catchSection,
    alt: 'diBoaS app showing transparent features',
    position: 'left',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: {
    ariaLabel: 'What is the catch, honest transparency',
  },
  analytics: {
    sectionId: 'catch-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 8: Demo Configuration
 */
export const B2C_DEMO_CONFIG = {
  content: {
    header: 'landing-b2c.demo.header',
    subtext: 'landing-b2c.demo.subtext',
    ctaPrimary: 'landing-b2c.demo.ctaPrimary',
    ctaSecondary: 'landing-b2c.demo.ctaSecondary',
  },
  seo: {
    headingLevel: 'h2' as const,
    ariaLabel: 'Interactive demo section',
  },
  analytics: {
    sectionId: 'demo-section-b2c',
    category: 'landing-b2c',
  },
} as const;

/**
 * Section 9: Waitlist Configuration
 */
export const B2C_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-b2c',
  backgroundColor: 'var(--section-bg-brand)',
  headline: 'landing-b2c.waitlist.header',
  subheadline: 'landing-b2c.waitlist.description',
} as const;

/**
 * Section 10: FAQ Items for B2C Landing Page
 * 5 new CLO-approved items
 */
export const B2C_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'isBank',
    question: 'landing-b2c.faq.items.isBank.question',
    answer: 'landing-b2c.faq.items.isBank.answer',
    category: 'general'
  },
  {
    id: 'howPossible',
    question: 'landing-b2c.faq.items.howPossible.question',
    answer: 'landing-b2c.faq.items.howPossible.answer',
    category: 'fees'
  },
  {
    id: 'safety',
    question: 'landing-b2c.faq.items.safety.question',
    answer: 'landing-b2c.faq.items.safety.answer',
    category: 'security'
  },
  {
    id: 'understanding',
    question: 'landing-b2c.faq.items.understanding.question',
    answer: 'landing-b2c.faq.items.understanding.answer',
    category: 'getting-started'
  },
  {
    id: 'minimum',
    question: 'landing-b2c.faq.items.minimum.question',
    answer: 'landing-b2c.faq.items.minimum.answer',
    category: 'getting-started'
  }
];

/**
 * Section 10: FAQ Section Configuration
 */
export const B2C_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'landing-b2c.faq.header',
    description: '',
    ctaText: '',
    ctaHref: '',
    items: B2C_FAQ_ITEMS
  },
  settings: {
    enableAnimations: true,
    animationDuration: 400,
    autoClose: true,
    enableKeyboardNav: true,
    scrollIntoView: true
  },
  seo: {
    ariaLabel: 'Frequently asked questions',
    region: 'faq'
  },
  analytics: {
    trackingPrefix: 'faq_b2c_landing',
    enabled: true
  }
};

/**
 * Section 11: Footer disclaimer key
 */
export const B2C_DISCLAIMER_KEY = 'landing-b2c.footer.disclosures.general';

/**
 * Footer nav links for B2C landing page
 */
export const B2C_FOOTER_NAV = [
  { id: 'forYou', labelKey: 'landing-b2c.footer.nav.forYou', href: ROUTES.PERSONAL.ACCOUNT },
  { id: 'forBusiness', labelKey: 'landing-b2c.footer.nav.forBusiness', href: ROUTES.BUSINESS_LANDING },
  { id: 'adelaideDaily', labelKey: 'landing-b2c.footer.nav.adelaideDaily', href: ROUTES.LEARN.OVERVIEW },
  { id: 'about', labelKey: 'landing-b2c.footer.nav.about', href: ROUTES.ABOUT },
  { id: 'help', labelKey: 'landing-b2c.footer.nav.help', href: ROUTES.HELP.FAQ },
  { id: 'legal', labelKey: 'landing-b2c.footer.nav.legal', href: ROUTES.LEGAL.TERMS },
] as const;

/**
 * Footer disclosure keys, locale-conditional
 */
export const B2C_FOOTER_DISCLOSURES = {
  // All locales
  general: 'landing-b2c.footer.disclosures.general',
  crypto: 'landing-b2c.footer.disclosures.crypto',
  stories: 'landing-b2c.footer.disclosures.stories',
  ai: 'landing-b2c.footer.disclosures.ai',
  closing: 'landing-b2c.footer.disclosures.closing',
  // Locale-conditional (keys may not exist in all locales)
  mica: 'landing-b2c.footer.disclosures.mica',
  cvm: 'landing-b2c.footer.disclosures.cvm',
  bcb: 'landing-b2c.footer.disclosures.bcb',
  us: 'landing-b2c.footer.disclosures.us',
} as const;
