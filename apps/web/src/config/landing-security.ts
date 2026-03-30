/**
 * Security Page Configuration
 *
 * 7-section layout using reusable section components:
 * 1. Hero (HeroSection fullBackground)
 * 2. Your Wallet, Your Keys (ProseSection)
 * 3. How We Protect Your Funds (ProseSection)
 * 4. The Technology (ProseSection)
 * 5. What We Don't Do (ProseSection)
 * 6. Transparency (ProseSection)
 * 7. Waitlist (WaitlistSection)
 * 8. Footer (MinimalFooter)
 *
 * Domain-Driven Design: Security page domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 */

import type { HeroVariantConfig } from './hero';
import type { ProseSectionConfig } from './proseSection';

// ─── Section 1: Hero ─────────────────────────────────────────

export const SECURITY_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'security.hero.title',
    description: 'security.hero.subtitle',
    ctaText: '',
    ctaHref: '#wallet',
    ctaTarget: '_self',
  },
  backgroundAssets: {
    backgroundImage: '/assets/images/private-control.avif',
    backgroundImageMobile: '/assets/images/private-control.avif',
    overlayOpacity: 0.3,
  },
  seo: {
    titleTag: 'Security at diBoaS',
    imageAlt: {
      background: 'Security at diBoaS background',
    },
  },
  analytics: {
    trackingPrefix: 'hero_security',
    enabled: true,
  },
} as const;

// ─── Section 2: Your Wallet, Your Keys ───────────────────────

export const SECURITY_WALLET_CONFIG: ProseSectionConfig = {
  content: {
    header: 'security.sections.wallet.title',
    paragraphs: [
      'security.sections.wallet.paragraphs.0',
      'security.sections.wallet.paragraphs.1',
      'security.sections.wallet.paragraphs.2',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'security.sections.wallet.ariaLabel',
  },
  analytics: {
    sectionId: 'wallet-security',
    category: 'security',
  },
} as const;

// ─── Section 3: How We Protect Your Funds ────────────────────

export const SECURITY_PROTECTION_CONFIG: ProseSectionConfig = {
  content: {
    header: 'security.sections.protection.title',
    paragraphs: [
      'security.sections.protection.paragraphs.0',
      'security.sections.protection.paragraphs.1',
      'security.sections.protection.paragraphs.2',
      'security.sections.protection.paragraphs.3',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-neutral)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'security.sections.protection.ariaLabel',
  },
  analytics: {
    sectionId: 'protection-security',
    category: 'security',
  },
} as const;

// ─── Section 4: The Technology ───────────────────────────────

export const SECURITY_TECHNOLOGY_CONFIG: ProseSectionConfig = {
  content: {
    header: 'security.sections.technology.title',
    paragraphs: [
      'security.sections.technology.paragraphs.0',
      'security.sections.technology.paragraphs.1',
      'security.sections.technology.paragraphs.2',
      'security.sections.technology.paragraphs.3',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'security.sections.technology.ariaLabel',
  },
  analytics: {
    sectionId: 'technology-security',
    category: 'security',
  },
} as const;

// ─── Section 5: What We Don't Do ─────────────────────────────

export const SECURITY_WHAT_WE_DONT_DO_CONFIG: ProseSectionConfig = {
  content: {
    header: 'security.sections.whatWeDontDo.title',
    paragraphs: [
      'security.sections.whatWeDontDo.paragraphs.0',
      'security.sections.whatWeDontDo.paragraphs.1',
      'security.sections.whatWeDontDo.paragraphs.2',
      'security.sections.whatWeDontDo.paragraphs.3',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-neutral)',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'security.sections.whatWeDontDo.ariaLabel',
  },
  analytics: {
    sectionId: 'what-we-dont-do-security',
    category: 'security',
  },
} as const;

// ─── Section 6: Transparency ─────────────────────────────────

export const SECURITY_TRANSPARENCY_CONFIG: ProseSectionConfig = {
  content: {
    header: 'security.sections.transparency.title',
    paragraphs: [
      'security.sections.transparency.paragraphs.0',
      'security.sections.transparency.paragraphs.1',
      'security.sections.transparency.paragraphs.2',
    ],
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'standard',
    headerStyle: 'centered',
  },
  seo: {
    ariaLabel: 'security.sections.transparency.ariaLabel',
  },
  analytics: {
    sectionId: 'transparency-security',
    category: 'security',
  },
} as const;

// ─── Waitlist ────────────────────────────────────────────────

export const SECURITY_WAITLIST_CONFIG = {
  sectionId: 'waitlist-section-security',
  backgroundColor: 'var(--section-bg-brand)',
  hideBenefits: true,
  hideNoSpam: true,
  source: 'security' as const,
} as const;

// ─── Footer Disclosures ─────────────────────────────────────

export const SECURITY_FOOTER_DISCLOSURES = {
  general: 'security.footer.general',
  crypto: 'security.footer.crypto',
  mica: 'security.footer.mica',
  micaArticle7: 'security.footer.micaArticle7',
  us: 'security.footer.us',
  closing: 'security.footer.closing',
} as const;
