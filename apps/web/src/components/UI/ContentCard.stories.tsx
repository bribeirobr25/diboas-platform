/**
 * ContentCard Storybook Stories
 *
 * Demonstrates all visual variants and content configurations.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ContentCard } from './ContentCard';

const meta: Meta<typeof ContentCard> = {
  title: 'UI/ContentCard',
  component: ContentCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'muted', 'highlight', 'accent'],
      description: 'Card visual variant',
    },
    title: {
      control: 'text',
      description: 'Card title',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContentCard>;

/**
 * Default variant
 */
export const Default: Story = {
  args: {
    title: 'Getting Started',
    children: 'Create your account in minutes and start managing your finances with diBoaS.',
    variant: 'default',
  },
};

/**
 * Muted variant
 */
export const Muted: Story = {
  args: {
    title: 'Note',
    children: 'Past performance does not guarantee future results.',
    variant: 'muted',
  },
};

/**
 * Highlight variant
 */
export const Highlight: Story = {
  args: {
    title: 'Featured',
    children: 'Our Safe Harbor strategy has maintained a 0% loss rate across 44 months of data.',
    variant: 'highlight',
  },
};

/**
 * Accent variant
 */
export const Accent: Story = {
  args: {
    title: 'New Feature',
    children: 'DeFi strategies are now available. Start earning yields on your idle cash today.',
    variant: 'accent',
  },
};

/**
 * Without title
 */
export const NoTitle: Story = {
  args: {
    children: 'A simple content card without a title heading.',
    variant: 'default',
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      {(['default', 'muted', 'highlight', 'accent'] as const).map((variant) => (
        <ContentCard key={variant} title={`${variant} variant`} variant={variant}>
          Example content for the {variant} card variant.
        </ContentCard>
      ))}
    </div>
  ),
};
