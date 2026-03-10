/**
 * CarouselDots Storybook Stories
 *
 * Demonstrates all visual states of the dot-based carousel navigation.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CarouselDots } from './CarouselDots';

const meta: Meta<typeof CarouselDots> = {
  title: 'UI/CarouselDots',
  component: CarouselDots,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    totalSlides: {
      control: { type: 'range', min: 2, max: 10, step: 1 },
      description: 'Total number of slides',
    },
    currentIndex: {
      control: { type: 'range', min: 0, max: 9, step: 1 },
      description: 'Currently active slide index',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Dot size variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether navigation is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CarouselDots>;

/**
 * Default — 5 slides, first active
 */
export const Default: Story = {
  args: {
    totalSlides: 5,
    currentIndex: 0,
    onDotClick: () => {},
  },
};

/**
 * Middle slide active
 */
export const MiddleActive: Story = {
  args: {
    totalSlides: 5,
    currentIndex: 2,
    onDotClick: () => {},
  },
};

/**
 * Small size
 */
export const SizeSmall: Story = {
  args: {
    totalSlides: 5,
    currentIndex: 0,
    size: 'sm',
    onDotClick: () => {},
  },
};

/**
 * Large size
 */
export const SizeLarge: Story = {
  args: {
    totalSlides: 5,
    currentIndex: 0,
    size: 'lg',
    onDotClick: () => {},
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    totalSlides: 5,
    currentIndex: 1,
    disabled: true,
    onDotClick: () => {},
  },
};

/**
 * Many slides (10)
 */
export const ManySlides: Story = {
  args: {
    totalSlides: 10,
    currentIndex: 4,
    onDotClick: () => {},
  },
};

/**
 * Single slide — should render nothing
 */
export const SingleSlide: Story = {
  args: {
    totalSlides: 1,
    currentIndex: 0,
    onDotClick: () => {},
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Small</p>
        <CarouselDots totalSlides={5} currentIndex={2} size="sm" onDotClick={() => {}} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Medium (default)</p>
        <CarouselDots totalSlides={5} currentIndex={2} size="md" onDotClick={() => {}} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Large</p>
        <CarouselDots totalSlides={5} currentIndex={2} size="lg" onDotClick={() => {}} />
      </div>
    </div>
  ),
};
