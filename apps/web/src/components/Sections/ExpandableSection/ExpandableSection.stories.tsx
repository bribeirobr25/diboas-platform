/**
 * ExpandableSection Storybook Stories
 *
 * Demonstrates the collapsible content section with accessible toggle.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ExpandableSection } from './ExpandableSection';
import type { ExpandableSectionConfig } from '@/config/expandableSection';

const meta: Meta<typeof ExpandableSection> = {
  title: 'Sections/ExpandableSection',
  component: ExpandableSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ExpandableSection

A collapsible content section with an accessible toggle button.
Uses \`useId()\` for unique aria-controls/aria-labelledby linkage.
Supports translation-key-driven content via \`useConfigTranslation\`.
        `,
      },
    },
  },
  argTypes: {
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExpandableSection>;

const DEFAULT_CONFIG: ExpandableSectionConfig = {
  content: {
    toggleLabel: 'How does diBoaS keep my money safe?',
    paragraphs: [
      'Your assets are held in audited, over-collateralized DeFi protocols. Every dollar deposited is backed by more than a dollar in collateral.',
      'We use institutional-grade security: multi-sig wallets, hardware security modules, and 24/7 monitoring.',
    ],
    linkText: 'Learn more about our security',
    linkHref: '/en/security',
  },
  seo: {
    ariaLabel: 'Security details',
  },
  analytics: {
    trackingPrefix: 'expandable_security',
    enabled: false,
  },
};

/**
 * Default — collapsed
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
};

/**
 * With custom background
 */
export const WithBackground: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      style: {
        backgroundColor: '#f8fafc',
      },
    },
  },
};

/**
 * With custom children instead of config paragraphs
 */
export const WithChildren: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        ...DEFAULT_CONFIG.content,
        paragraphs: undefined,
      },
    },
    children: (
      <div style={{ padding: '1rem' }}>
        <h4>Custom Content</h4>
        <p>This section uses custom children instead of configuration-driven paragraphs.</p>
        <ul>
          <li>Multi-sig wallet security</li>
          <li>Over-collateralized lending</li>
          <li>24/7 monitoring</li>
        </ul>
      </div>
    ),
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
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark Theme
 */
export const DarkTheme: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};
