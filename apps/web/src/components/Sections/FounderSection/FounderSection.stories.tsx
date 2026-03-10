/**
 * FounderSection Storybook Stories
 *
 * Demonstrates the founder/about section with image and bio.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { FounderSection } from './FounderSection';
import type { FounderSectionConfig } from '@/config/founderSection';

const meta: Meta<typeof FounderSection> = {
  title: 'Sections/FounderSection',
  component: FounderSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FounderSection

Displays founder bio with image, paragraphs, optional email link and social links.
Uses translation-key-driven content via \`useConfigTranslation\`.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FounderSection>;

const DEFAULT_CONFIG: FounderSectionConfig = {
  content: {
    header: 'Meet the Founder',
    paragraphs: [
      'diBoaS was born from a simple frustration: why do financial apps charge so much for basic services?',
      'After years in fintech, our founder set out to build the platform they always wanted — transparent, fair, and accessible to everyone.',
    ],
    emailText: 'founder@diboas.com',
    emailHref: 'mailto:founder@diboas.com',
    socialLinks: [
      { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
      { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
    ],
  },
  image: {
    src: '/images/founder.webp',
    alt: 'Founder portrait',
  },
  style: {
    backgroundColor: '#fafafa',
  },
  seo: {
    ariaLabel: 'About the founder',
  },
  analytics: {
    sectionId: 'founder',
    category: 'about',
  },
} as const;

/**
 * Default
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
};

/**
 * Without image
 */
export const WithoutImage: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      image: undefined,
    },
  },
};

/**
 * Without social links
 */
export const WithoutSocials: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        ...DEFAULT_CONFIG.content,
        socialLinks: undefined,
        emailText: undefined,
        emailHref: undefined,
      },
    },
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
