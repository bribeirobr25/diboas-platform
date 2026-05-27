/**
 * FAQAccordion Storybook Stories
 *
 * Domain-Driven Design: Stories organized by business scenarios
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { FAQAccordion } from './FAQAccordionFactory';
import { FAQ_ACCORDION_CONFIGS, DEFAULT_FAQ_ITEMS } from '@/config/faqAccordion';

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
    config: FAQ_ACCORDION_CONFIGS.default,
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
      ...FAQ_ACCORDION_CONFIGS.default,
      settings: {
        ...FAQ_ACCORDION_CONFIGS.default.settings,
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
      ...FAQ_ACCORDION_CONFIGS.default,
      settings: {
        ...FAQ_ACCORDION_CONFIGS.default.settings,
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
      ...FAQ_ACCORDION_CONFIGS.default,
      content: {
        ...FAQ_ACCORDION_CONFIGS.default.content,
        title: 'Business FAQ',
        items: DEFAULT_FAQ_ITEMS.slice(0, 3),
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
    config: FAQ_ACCORDION_CONFIGS.default,
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
    config: FAQ_ACCORDION_CONFIGS.default,
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
