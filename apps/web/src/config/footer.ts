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
export const FOOTER_CONFIG: FooterConfig = {
  sections: [
    {
      title: 'Transparency',
      links: [
        { id: 'privacy', label: 'Privacy', href: '/legal/privacy' },
        { id: 'security', label: 'Security', href: '/security/benefits' },
        { id: 'terms', label: 'Terms', href: '/legal/terms' },
      ]
    },
    {
      title: 'Explore',
      links: [
        { id: 'about', label: 'About', href: '/about' },
        { id: 'documentation', label: 'Documentation', href: '/docs' },
        { id: 'careers', label: 'Careers', href: '/careers' },
        { id: 'investors', label: 'Investors', href: '/investors' },
      ]
    },
    {
      title: 'Help',
      links: [
        { id: 'faq', label: 'FAQ', href: '/help/faq' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { id: 'cookies', label: 'Cookies', href: '/legal/cookies' },
      ]
    }
  ],
  socialLinks: [
    {
      id: 'instagram',
      label: 'Instagram',
      href: 'https://www.instagram.com/diboasfi/',
      icon: 'Instagram'
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      href: 'https://x.com/diBoaSFi',
      icon: 'Twitter'
    },
    {
      id: 'youtube',
      label: 'YouTube',
      href: 'https://www.youtube.com/@diBoaSFi',
      icon: 'Youtube'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/diboasfi/',
      icon: 'Linkedin'
    }
  ],
  legal: {
    copyrightText: '© 2024 diBoaS. All rights reserved.',
    brandName: 'diBoaS'
  }
} as const;