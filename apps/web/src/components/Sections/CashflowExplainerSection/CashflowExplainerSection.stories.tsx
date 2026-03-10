/**
 * CashflowExplainerSection Storybook Stories
 *
 * Demonstrates the cashflow investing explainer with "Save it" + "Grow it" layout.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CashflowExplainerSection } from './CashflowExplainerSection';
import type { CashflowExplainerSectionConfig } from '@/config/cashflowExplainerSection';

const meta: Meta<typeof CashflowExplainerSection> = {
  title: 'Sections/CashflowExplainerSection',
  component: CashflowExplainerSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# CashflowExplainerSection

Two-part explainer layout: "Save it" + "Grow it" with micro-example,
honest limitation text, brand promise, and CTA. Used on B2B landing page.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CashflowExplainerSection>;

const DEFAULT_CONFIG: CashflowExplainerSectionConfig = {
  content: {
    header: 'Your cashflow, working harder.',
    subheader: 'Two simple steps. One powerful outcome.',
    partA: {
      title: 'Save it',
      body: 'Your incoming payments are automatically converted to stablecoins — digital dollars that hold their value.',
    },
    partB: {
      title: 'Grow it',
      body: 'Idle funds are deployed into vetted DeFi strategies, earning yield while you focus on your business.',
    },
    microExample: 'Example: $50,000 idle for 6 months → ~$2,400 earned at 8% APY.',
    limitation: 'Yields fluctuate. Past performance does not guarantee future results.',
    brandPromise: 'We earn when you earn. If your money sits idle, we make nothing.',
    cta: 'See how it works',
    ctaHref: '#how-it-works',
    microDisclosure: 'Yields are variable and subject to market conditions.',
  },
  seo: {
    ariaLabel: 'Cashflow investing explanation',
  },
  analytics: {
    sectionId: 'cashflow-explainer',
    category: 'education',
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
 * Without subheader
 */
export const WithoutSubheader: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        ...DEFAULT_CONFIG.content,
        subheader: undefined,
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
