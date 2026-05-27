/**
 * SectionContainer Storybook Stories
 *
 * Demonstrates the utility container component with width and padding variants.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SectionContainer } from './index';

const meta: Meta<typeof SectionContainer> = {
  title: 'Sections/SectionContainer',
  component: SectionContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['standard', 'wide', 'narrow'],
      description: 'Container width variant',
    },
    padding: {
      control: 'select',
      options: ['standard', 'hero-nav', 'none'],
      description: 'Padding variant',
    },
    as: {
      control: 'select',
      options: ['section', 'div', 'article', 'main'],
      description: 'Semantic HTML element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionContainer>;

const CONTENT = (
  <div
    style={{
      background: 'var(--color-primary-100, #dbeafe)',
      padding: '2rem',
      borderRadius: '0.5rem',
    }}
  >
    <p style={{ margin: 0 }}>Section content area</p>
  </div>
);

/**
 * Standard width
 */
export const Standard: Story = {
  args: {
    variant: 'standard',
    padding: 'standard',
    children: CONTENT,
    ariaLabel: 'Example section',
  },
};

/**
 * Wide variant
 */
export const Wide: Story = {
  args: {
    variant: 'wide',
    padding: 'standard',
    children: CONTENT,
  },
};

/**
 * Narrow variant
 */
export const Narrow: Story = {
  args: {
    variant: 'narrow',
    padding: 'standard',
    children: CONTENT,
  },
};

/**
 * No padding
 */
export const NoPadding: Story = {
  args: {
    variant: 'standard',
    padding: 'none',
    children: CONTENT,
  },
};

/**
 * With background color
 */
export const WithBackground: Story = {
  args: {
    variant: 'standard',
    backgroundColor: '#f1f5f9',
    children: CONTENT,
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['narrow', 'standard', 'wide'] as const).map((variant) => (
        <SectionContainer
          key={variant}
          variant={variant}
          padding="standard"
          ariaLabel={`${variant} section`}
        >
          <div
            style={{
              background: 'var(--color-primary-100, #dbeafe)',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
            }}
          >
            variant=&quot;{variant}&quot;
          </div>
        </SectionContainer>
      ))}
    </div>
  ),
};
