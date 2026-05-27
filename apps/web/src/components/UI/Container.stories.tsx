/**
 * Container Storybook Stories
 *
 * Demonstrates all container size variants and padding options.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Container } from './Container';

const meta: Meta<typeof Container> = {
  title: 'UI/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Container max-width variant',
    },
    noPadding: {
      control: 'boolean',
      description: 'Remove horizontal padding',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

const PLACEHOLDER = (
  <div
    style={{
      background: 'var(--color-primary-100, #dbeafe)',
      padding: '2rem',
      borderRadius: '0.5rem',
    }}
  >
    <p style={{ margin: 0 }}>Container content area</p>
  </div>
);

/**
 * Default (lg)
 */
export const Default: Story = {
  args: {
    size: 'lg',
    children: PLACEHOLDER,
  },
};

/**
 * Small container
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: PLACEHOLDER,
  },
};

/**
 * Full width
 */
export const Full: Story = {
  args: {
    size: 'full',
    children: PLACEHOLDER,
  },
};

/**
 * No padding
 */
export const NoPadding: Story = {
  args: {
    size: 'lg',
    noPadding: true,
    children: PLACEHOLDER,
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
      {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
        <div key={size}>
          <p
            style={{ padding: '0 1rem', margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#666' }}
          >
            size=&quot;{size}&quot;
          </p>
          <Container size={size}>
            <div
              style={{
                background: 'var(--color-primary-100, #dbeafe)',
                padding: '1rem',
                borderRadius: '0.5rem',
              }}
            >
              {size}
            </div>
          </Container>
        </div>
      ))}
    </div>
  ),
};
