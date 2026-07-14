/**
 * FAQAccordion Storybook Stories
 *
 * Domain-Driven Design: Stories organized by business scenarios
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { FAQAccordion } from './FAQAccordionFactory';
import {
  DEFAULT_FAQ_ACCORDION_SETTINGS,
  type FAQAccordionVariantConfig,
} from '@/config/faqAccordion';
import { getFAQForSurface } from '@/config/faqRegistry';

// Story-local demo config sourced from the canonical FAQ registry (the landing
// surface's 5 items). Storybook has no i18n provider, so the accordion renders the
// translation keys literally — the same behaviour as before consolidation.
const DEMO_FAQ_CONFIG: FAQAccordionVariantConfig = {
  variant: 'default',
  content: {
    title: 'faq.title',
    description: '',
    ctaText: '',
    ctaHref: '',
    items: getFAQForSurface('landing'),
  },
  settings: DEFAULT_FAQ_ACCORDION_SETTINGS,
  seo: { ariaLabel: 'faq', region: 'faq' },
  analytics: { trackingPrefix: 'faq_accordion', enabled: true },
};

const meta: Meta<typeof FAQAccordion> = {
  title: 'Sections/FAQAccordion',
  component: FAQAccordion,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FAQAccordion Component Factory

Accessible accordion for frequently asked questions. Uses the Component Factory Pattern
with translation-key-driven content for full i18n support.

## Features
- **WCAG AA Keyboard Navigation**: Arrow keys, Home/End, Enter/Space
- **Auto-close**: Optionally closes other items when one opens
- **Animated**: Smooth expand/collapse with configurable duration
- **i18n**: Content driven by translation keys
        `,
      },
    },
  },
  argTypes: {
    config: {
      control: 'object',
      description: 'FAQ accordion configuration object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FAQAccordion>;

/**
 * Default FAQ Accordion
 *
 * Standard configuration with all default FAQ items.
 */
export const Default: Story = {
  args: {
    config: DEMO_FAQ_CONFIG,
  },
};

/**
 * With Auto-Close Disabled
 *
 * Multiple items can be expanded simultaneously.
 */
export const MultipleOpen: Story = {
  args: {
    config: {
      ...DEMO_FAQ_CONFIG,
      settings: {
        ...DEMO_FAQ_CONFIG.settings,
        autoClose: false,
      },
    },
  },
};

/**
 * Without Animations
 *
 * Instant expand/collapse for reduced motion preference testing.
 */
export const NoAnimations: Story = {
  args: {
    config: {
      ...DEMO_FAQ_CONFIG,
      settings: {
        ...DEMO_FAQ_CONFIG.settings,
        enableAnimations: false,
      },
    },
  },
};

/**
 * Custom FAQ Items
 *
 * Demonstrates providing custom question/answer pairs.
 */
export const CustomItems: Story = {
  args: {
    config: {
      ...DEMO_FAQ_CONFIG,
      content: {
        ...DEMO_FAQ_CONFIG.content,
        title: 'Business FAQ',
        items: getFAQForSurface('business'),
      },
    },
  },
};

/**
 * Mobile Optimized
 *
 * FAQ accordion at mobile viewport width.
 */
export const MobileOptimized: Story = {
  args: {
    config: DEMO_FAQ_CONFIG,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark Theme
 *
 * FAQ accordion with dark theme applied.
 */
export const DarkTheme: Story = {
  args: {
    config: DEMO_FAQ_CONFIG,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}
      >
        <Story />
      </div>
    ),
  ],
};
