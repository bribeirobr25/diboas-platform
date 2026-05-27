/**
 * FlexBetween Storybook Stories
 *
 * Demonstrates the flex layout utility with alignment options.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { FlexBetween } from './FlexBetween';

const meta: Meta<typeof FlexBetween> = {
  title: 'UI/FlexBetween',
  component: FlexBetween,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Cross-axis alignment',
    },
    as: {
      control: 'select',
      options: ['div', 'header', 'nav', 'section'],
      description: 'Semantic HTML element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FlexBetween>;

const BOX_STYLE = {
  background: 'var(--color-primary-100, #dbeafe)',
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
};

/**
 * Default — center aligned
 */
export const Default: Story = {
  args: {
    align: 'center',
    children: (
      <>
        <span style={BOX_STYLE}>Left</span>
        <span style={BOX_STYLE}>Right</span>
      </>
    ),
  },
};

/**
 * Start aligned
 */
export const AlignStart: Story = {
  args: {
    align: 'start',
    children: (
      <>
        <span style={{ ...BOX_STYLE, height: '60px' }}>Tall</span>
        <span style={BOX_STYLE}>Short</span>
      </>
    ),
  },
};

/**
 * As nav element
 */
export const AsNav: Story = {
  args: {
    as: 'nav',
    children: (
      <>
        <span style={BOX_STYLE}>Logo</span>
        <span style={BOX_STYLE}>Menu</span>
      </>
    ),
  },
};

/**
 * All alignments comparison
 */
export const AllAlignments: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
        <div key={align}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#666' }}>
            align=&quot;{align}&quot;
          </p>
          <FlexBetween
            align={align}
            style={{ border: '1px dashed #ccc', padding: '0.5rem', minHeight: '60px' }}
          >
            <span style={{ ...BOX_STYLE, height: align === 'stretch' ? 'auto' : '40px' }}>
              Left
            </span>
            <span style={{ ...BOX_STYLE, height: '20px' }}>Right</span>
          </FlexBetween>
        </div>
      ))}
    </div>
  ),
};
