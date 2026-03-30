/**
 * LucideIcon Storybook Stories
 *
 * Demonstrates the standardized icon system and pre-configured navigation icons.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  LucideIcon,
  Menu,
  MenuIcon,
  CloseIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  NavigationToggle,
} from './LucideIcon';

const meta: Meta<typeof LucideIcon> = {
  title: 'UI/LucideIcon',
  component: LucideIcon,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Icon size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LucideIcon>;

/**
 * Default — Menu icon, medium size
 */
export const Default: Story = {
  args: {
    icon: Menu,
    size: 'md',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ textAlign: 'center' }}>
          <MenuIcon size={size} />
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>{size}</p>
        </div>
      ))}
    </div>
  ),
};

/**
 * Pre-configured navigation icons
 */
export const NavigationIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <MenuIcon />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>Menu</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <CloseIcon />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>Close</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ChevronLeftIcon />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>ChevronLeft</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <ChevronRightIcon />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>ChevronRight</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <SparklesIcon />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666' }}>Sparkles</p>
      </div>
    </div>
  ),
};

/**
 * Navigation toggle — closed state
 */
export const ToggleClosed: Story = {
  render: () => <NavigationToggle isOpen={false} />,
};

/**
 * Navigation toggle — open state
 */
export const ToggleOpen: Story = {
  render: () => <NavigationToggle isOpen={true} />,
};
