/**
 * Footer Configuration
 * 
 * Domain-Driven Design: Footer domain configuration
 * Service Agnostic Abstraction: Decoupled footer data structure
 * Configuration Management: Centralized footer content and links
 */

export interface FooterSection {
  readonly title: string;
  readonly links: FooterLink[];
}

export interface FooterLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface SocialLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: string; // For lucide-react icon names
}

export interface FooterConfig {
  readonly sections: FooterSection[];
  readonly socialLinks: SocialLink[];
  readonly legal: {
    readonly copyrightText: string;
    readonly brandName: string;
  };
}

// Configuration Management - Default footer structure
// All text values are translation keys that will be resolved by react-intl
export const FOOTER_CONFIG: FooterConfig = {
  sections: [
    {
      title: 'common.footer.sections.transparency.title',
      links: [
        { id: 'privacy', label: 'common.footer.sections.transparency.links.privacy', href: '/legal/privacy' },
        { id: 'security', label: 'common.footer.sections.transparency.links.security', href: '/security/benefits' },
        { id: 'terms', label: 'common.footer.sections.transparency.links.terms', href: '/legal/terms' },
      ]
    },
    {
      title: 'common.footer.sections.explore.title',
      links: [
        { id: 'about', label: 'common.footer.sections.explore.links.about', href: '/about' },
        { id: 'documentation', label: 'common.footer.sections.explore.links.documentation', href: '/docs' },
        { id: 'careers', label: 'common.footer.sections.explore.links.careers', href: '/careers' },
        { id: 'investors', label: 'common.footer.sections.explore.links.investors', href: '/investors' },
      ]
    },
    {
      title: 'common.footer.sections.help.title',
      links: [
        { id: 'faq', label: 'common.footer.sections.help.links.faq', href: '/help/faq' },
      ]
    },
    {
      title: 'common.footer.sections.legal.title',
      links: [
        { id: 'cookies', label: 'common.footer.sections.legal.links.cookies', href: '/legal/cookies' },
      ]
    }
  ],
  socialLinks: [
    {
      id: 'instagram',
      label: 'common.footer.social.instagram',
      href: 'https://www.instagram.com/diboasfi/',
      icon: 'Instagram'
    },
    {
      id: 'twitter',
      label: 'common.footer.social.twitter',
      href: 'https://x.com/diBoaSFi',
      icon: 'Twitter'
    },
    {
      id: 'youtube',
      label: 'common.footer.social.youtube',
      href: 'https://www.youtube.com/@diBoaSFi',
      icon: 'Youtube'
    },
    {
      id: 'linkedin',
      label: 'common.footer.social.linkedin',
      href: 'https://www.linkedin.com/company/diboasfi/',
      icon: 'Linkedin'
    }
  ],
  legal: {
    copyrightText: 'common.footer.copyright',
    brandName: 'common.footer.brandName'
  }
} as const;