/**
 * MinimalFooter Storybook Stories
 *
 * Demonstrates the minimal footer for landing pages with locale-conditional disclosures.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { MinimalFooter } from './MinimalFooter';

const meta: Meta<typeof MinimalFooter> = {
  title: 'Layout/MinimalFooter',
  component: MinimalFooter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# MinimalFooter

Landing page footer with tagline, product nav links, locale-conditional
regulatory disclosures, legal links, language switcher, and social icons.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MinimalFooter>;

const SAMPLE_NAV_LINKS = [
  { id: 'story', labelKey: 'landing-b2c.footer.nav.story', href: '#our-story' },
  { id: 'scenarios', labelKey: 'landing-b2c.footer.nav.scenarios', href: '#scenarios' },
  { id: 'how', labelKey: 'landing-b2c.footer.nav.howItWorks', href: '#how-it-works' },
  { id: 'fees', labelKey: 'landing-b2c.footer.nav.fees', href: '#fees' },
  { id: 'faq', labelKey: 'landing-b2c.footer.nav.faq', href: '#faq' },
] as const;

const SAMPLE_DISCLOSURES = {
  general: 'landing-b2c.footer.disclosures.general',
  crypto: 'landing-b2c.footer.disclosures.crypto',
  stories: 'landing-b2c.footer.disclosures.stories',
  ai: 'landing-b2c.footer.disclosures.ai',
  closing: 'landing-b2c.footer.disclosures.closing',
  mica: 'landing-b2c.footer.disclosures.mica',
  cvm: 'landing-b2c.footer.disclosures.cvm',
  bcb: 'landing-b2c.footer.disclosures.bcb',
  us: 'landing-b2c.footer.disclosures.us',
};

/**
 * Default — B2C footer with all options
 */
export const Default: Story = {
  args: {
    taglineKey: 'landing-b2c.footer.tagline',
    navLinks: SAMPLE_NAV_LINKS,
    disclosureKeys: SAMPLE_DISCLOSURES,
  },
};

/**
 * Minimal — tagline only
 */
export const MinimalVariant: Story = {
  args: {
    taglineKey: 'landing-b2c.footer.tagline',
  },
};

/**
 * With nav links, no disclosures
 */
export const WithNavLinks: Story = {
  args: {
    taglineKey: 'landing-b2c.footer.tagline',
    navLinks: SAMPLE_NAV_LINKS,
  },
};

/**
 * B2B variant
 */
export const B2BVariant: Story = {
  args: {
    taglineKey: 'landing-b2b.footer.tagline',
    copyrightKey: 'landing-b2b.footer.copyright',
    navLinks: [
      { id: 'two-worlds', labelKey: 'landing-b2b.footer.nav.twoWorlds', href: '#two-worlds' },
      { id: 'how', labelKey: 'landing-b2b.footer.nav.howItWorks', href: '#how-it-works' },
      { id: 'fees', labelKey: 'landing-b2b.footer.nav.fees', href: '#fees' },
      { id: 'faq', labelKey: 'landing-b2b.footer.nav.faq', href: '#faq' },
    ],
  },
};

/**
 * Mobile Optimized
 */
export const MobileOptimized: Story = {
  args: {
    taglineKey: 'landing-b2c.footer.tagline',
    navLinks: SAMPLE_NAV_LINKS,
    disclosureKeys: SAMPLE_DISCLOSURES,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
