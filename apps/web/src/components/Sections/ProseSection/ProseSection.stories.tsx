/**
 * ProseSection Storybook Stories
 *
 * Demonstrates the prose content section with image positioning and style options.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProseSection } from './ProseSection';
import type { ProseSectionConfig } from '@/config/proseSection';

const meta: Meta<typeof ProseSection> = {
  title: 'Sections/ProseSection',
  component: ProseSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ProseSection

Rich text content section with optional image, transition hook,
emphasis lines, and configurable layout (header style, image position, padding).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProseSection>;

const DEFAULT_CONFIG: ProseSectionConfig = {
  content: {
    header: 'Why We Built diBoaS',
    transitionHook: "The financial system wasn't built for you. We're changing that.",
    paragraphs: [
      'People save, but the system rarely explains what that money could do next. Fees appear when money moves, and better paths come wrapped in jargon.',
      'diBoaS is a non-custodial side pocket for your goals: assign money to a purpose, see the path, cost, and risk before it moves, and keep control the whole time.',
    ],
    emphasisLine: 'Clear paths, named risk, money that stays yours.',
  },
  style: {
    backgroundColor: '#ffffff',
    headerStyle: 'centered',
    verticalPadding: 'standard',
  },
  seo: {
    ariaLabel: 'About diBoaS',
  },
  analytics: {
    sectionId: 'prose_about',
    category: 'content',
  },
} as const;

/**
 * Default — centered header
 */
export const Default: Story = {
  args: {
    config: DEFAULT_CONFIG,
  },
};

/**
 * With image (right position)
 */
export const WithImageRight: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      image: {
        src: '/images/platform-preview.webp',
        alt: 'Platform preview',
        position: 'right',
        aspectRatio: 'landscape',
      },
    },
  },
};

/**
 * With image (left position)
 */
export const WithImageLeft: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      image: {
        src: '/images/platform-preview.webp',
        alt: 'Platform preview',
        position: 'left',
        aspectRatio: 'portrait',
      },
    },
  },
};

/**
 * Inline header style
 */
export const InlineHeader: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      style: {
        ...DEFAULT_CONFIG.style,
        headerStyle: 'inline',
      },
    },
  },
};

/**
 * With signature line
 */
export const WithSignature: Story = {
  args: {
    config: {
      ...DEFAULT_CONFIG,
      content: {
        ...DEFAULT_CONFIG.content,
        signatureLine: '— The diBoaS Team',
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
