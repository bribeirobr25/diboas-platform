/**
 * About Page Configuration
 *
 * 9-section layout: Hero → t1 → Story → t2 → What We Do → Beliefs
 * → Mission → t3 → Business CTA → t4 → Contact → Waitlist → Footer
 *
 * Phase 3C migration: extracts all content keys from the AboutPageContent
 * orchestrator into config-driven composition objects.
 *
 * Domain-Driven Design: About page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

// ─── Section 1: Hero ─────────────────────────────────────────

/** Hero section config for the About page. */
export const ABOUT_HERO_CONFIG = {
  title: 'about.hero.title',
  subtitle: 'about.hero.subtitle',
} as const;

// ─── Section 2: The Story (Adelaide narrative) ───────────────

/** Adelaide origin story section with multi-paragraph narrative. */
export const ABOUT_STORY_CONFIG = {
  content: {
    header: 'about.story.header',
    paragraph1: 'about.story.paragraph1',
    paragraph2: 'about.story.paragraph2',
    paragraph3: 'about.story.paragraph3',
    gapExplanation: 'about.story.gapExplanation',
    accessLocked: 'about.story.accessLocked',
    turning: 'about.story.turning',
    namedAfterHer: 'about.story.namedAfterHer',
  },
  seo: { ariaLabel: 'The Story — Her name was Adelaide' },
} as const;

// ─── Section 3: What diBoaS Does ────────────────────────────

/** Product capabilities section: transfers, growth, and Adelaide AI. */
export const ABOUT_WHAT_WE_DO_CONFIG = {
  content: {
    header: 'about.whatWeDo.header',
    transfers: 'about.whatWeDo.transfers',
    transfersDisclaimer: 'about.whatWeDo.transfersDisclaimer',
    growth: 'about.whatWeDo.growth',
    adelaide: 'about.whatWeDo.adelaide',
  },
  seo: { ariaLabel: 'What diBoaS does' },
} as const;

// ─── Section 4: What We Believe (3 belief cards) ─────────────

/** Three belief cards: money, honesty, start small. */
export const ABOUT_BELIEFS_CONFIG = {
  content: {
    header: 'about.beliefs.header',
    cards: {
      money: {
        title: 'about.beliefs.money.title',
        description: 'about.beliefs.money.description',
      },
      honesty: {
        title: 'about.beliefs.honesty.title',
        description: 'about.beliefs.honesty.description',
      },
      startSmall: {
        title: 'about.beliefs.startSmall.title',
        description: 'about.beliefs.startSmall.description',
      },
    },
  },
  seo: { ariaLabel: 'What we believe' },
} as const;

// ─── Section 5: The Mission ─────────────────────────────────

/** Mission statement with Adelaide callback and founding pillars. */
export const ABOUT_MISSION_CONFIG = {
  content: {
    header: 'about.mission.header',
    story: 'about.mission.story',
    statement: 'about.mission.statement',
    pillars: 'about.mission.pillars',
  },
  seo: { ariaLabel: 'Our mission' },
} as const;

// ─── Section 6: For Businesses (CTA) ────────────────────────

/** Business CTA section linking to the B2B landing page. */
export const ABOUT_BUSINESS_CONFIG = {
  content: {
    header: 'about.business.header',
    description: 'about.business.description',
    pitch: 'about.business.pitch',
    cta: 'about.business.cta',
  },
  ctaHref: '/business',
  seo: { ariaLabel: 'diBoaS for businesses' },
} as const;

// ─── Section 7: Contact ─────────────────────────────────────

/**
 * Contact section with founder details and email addresses.
 * emailHref and personalEmailHref are literal mailto: URIs, not i18n keys.
 */
export const ABOUT_CONTACT_CONFIG = {
  content: {
    header: 'about.contact.header',
    founder: 'about.contact.founder',
    founderName: 'about.contact.founderName',
    location: 'about.contact.location',
    locationValue: 'about.contact.locationValue',
    email: 'about.contact.email',
    emailValue: 'about.contact.emailValue',
    personal: 'about.contact.personal',
    personalEmail: 'about.contact.personalEmail',
  },
  emailHref: 'mailto:hello@diboas.com',
  personalEmailHref: 'mailto:bar@diboas.com',
  seo: { ariaLabel: 'Contact information' },
} as const;

// ─── Transition Hooks ───────────────────────────────────────

/** Transition copy between major sections. */
export const ABOUT_TRANSITIONS = {
  t1: 'about.transitions.t1',
  t2: 'about.transitions.t2',
  t3: 'about.transitions.t3',
  t4: 'about.transitions.t4',
} as const;

// ─── Footer Disclosures ─────────────────────────────────────

/**
 * Locale-conditional footer disclosures.
 * Uses the same interface as MinimalFooter's disclosureKeys prop.
 *
 * MiCA Art. 68: DE, ES only
 * MiCA Art. 7: EN, DE, ES
 * CVM 3-warning: PT-BR only
 * US disclosure: EN only
 */
export const ABOUT_FOOTER_DISCLOSURES = {
  mica: 'about.footer.mica',
  micaArticle7: 'about.footer.micaArticle7',
  ai: 'about.footer.ai',
  cvm: 'about.footer.cvm',
  us: 'about.footer.us',
} as const;
