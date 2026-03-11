/**
 * About Page Configuration
 *
 * 8-section layout using reusable section components:
 * 1. Hero (HeroSection centered)
 * 2. Story (ProseSection — Adelaide narrative)
 * 3. What We Do (ProseSection — product capabilities)
 * 4. What We Believe (BenefitsCardsSection — 3 cards)
 * 5. Mission (ProseSection — mission statement)
 * 6. Business CTA (ProseSection — B2B pitch)
 * 7. Founder / Contact (FounderSection)
 * 8. Waitlist (WaitlistSection)
 * 9. Footer (MinimalFooter)
 *
 * Domain-Driven Design: About page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';
import type { BenefitsCardsConfig } from '@/components/Sections/BenefitsCards';
import type { FounderSectionConfig } from './founderSection';

// ─── Section 1: Hero ─────────────────────────────────────────

export const ABOUT_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'about.hero.title',
    description: 'about.hero.subtitle',
    ctaText: '',
    ctaHref: '#story',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: '/assets/images/hand-bright2.avif',
    backgroundImageMobile: '/assets/images/hand-bright2.avif',
    overlayOpacity: 0.3,
  },
  seo: {
    titleTag: 'About diBoaS',
    imageAlt: {
      background: 'About diBoaS background',
    },
  },
  analytics: {
    trackingPrefix: 'hero_about',
    enabled: true,
  },
} as const;

// ─── Section 2: The Story (Adelaide narrative) ───────────────

export const ABOUT_STORY_CONFIG: ProseSectionConfig = {
  content: {
    transitionHook: 'about.transitions.t1',
    header: 'about.story.header',
    paragraphs: [
      'about.story.paragraph1',
      'about.story.paragraph2',
      'about.story.paragraph3',
      'about.story.gapExplanation',
      'about.story.accessLocked',
      'about.story.turning',
      'about.story.namedAfterHer',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'The Story, her name was Adelaide',
  },
  analytics: {
    sectionId: 'story-about',
    category: 'about',
  },
} as const;

// ─── Section 3: What diBoaS Does ────────────────────────────

export const ABOUT_WHAT_WE_DO_CONFIG: ProseSectionConfig = {
  content: {
    transitionHook: 'about.transitions.t2',
    header: 'about.whatWeDo.header',
    paragraphs: [
      'about.whatWeDo.transfers',
      'about.whatWeDo.transfersDisclaimer',
      'about.whatWeDo.growth',
      'about.whatWeDo.adelaide',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-neutral)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'What diBoaS does',
  },
  analytics: {
    sectionId: 'what-we-do-about',
    category: 'about',
  },
} as const;

// ─── Section 4: What We Believe (3 belief cards) ─────────────

export const ABOUT_BELIEFS_CONFIG: BenefitsCardsConfig = {
  section: {
    title: 'about.beliefs.header',
    backgroundColor: 'enterprise',
  },
  cards: [
    {
      id: 'belief-money',
      icon: 'trending-up',
      title: 'about.beliefs.money.title',
      description: 'about.beliefs.money.description',
      iconAlt: 'Your money should work for you',
    },
    {
      id: 'belief-honesty',
      icon: 'target',
      title: 'about.beliefs.honesty.title',
      description: 'about.beliefs.honesty.description',
      iconAlt: 'Honesty over hype',
    },
    {
      id: 'belief-start-small',
      icon: 'check-circle',
      title: 'about.beliefs.startSmall.title',
      description: 'about.beliefs.startSmall.description',
      iconAlt: 'Start small and learn',
    },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'What we believe',
  },
  analytics: {
    sectionId: 'beliefs-about',
    category: 'about',
  },
};

// ─── Section 5: The Mission ─────────────────────────────────

export const ABOUT_MISSION_CONFIG: ProseSectionConfig = {
  content: {
    header: 'about.mission.header',
    paragraphs: [
      'about.mission.story',
      'about.mission.statement',
      'about.mission.pillars',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-neutral)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: {
    ariaLabel: 'Our mission',
  },
  analytics: {
    sectionId: 'mission-about',
    category: 'about',
  },
} as const;

// ─── Section 6: For Businesses (CTA) ────────────────────────

export const ABOUT_BUSINESS_CONFIG: ProseSectionConfig = {
  content: {
    transitionHook: 'about.transitions.t3',
    header: 'about.business.header',
    paragraphs: [
      'about.business.description',
      'about.business.pitch',
      'about.business.cta',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'diBoaS for businesses',
  },
  analytics: {
    sectionId: 'business-about',
    category: 'about',
  },
} as const;

// ─── Section 7: Founder / Contact ────────────────────────────

export const ABOUT_FOUNDER_CONFIG: FounderSectionConfig = {
  content: {
    header: 'about.contact.header',
    paragraphs: [
      'about.contact.personal',
    ],
    emailText: 'about.contact.emailValue',
    emailHref: 'hello@diboas.com',
    socialLinks: [
      { label: 'about.contact.personalEmail', href: 'mailto:bar@diboas.com', icon: 'email' },
    ],
  },
  seo: {
    ariaLabel: 'Contact and founder information',
  },
  analytics: {
    sectionId: 'founder-about',
    category: 'about',
  },
} as const;

// ─── Waitlist ────────────────────────────────────────────────

export const ABOUT_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-about',
  backgroundColor: 'var(--section-bg-brand)',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'about' as const,
} as const;

// ─── Footer Disclosures ─────────────────────────────────────

export const ABOUT_FOOTER_DISCLOSURES = {
  mica: 'about.footer.mica',
  micaArticle7: 'about.footer.micaArticle7',
  ai: 'about.footer.ai',
  cvm: 'about.footer.cvm',
  us: 'about.footer.us',
} as const;
