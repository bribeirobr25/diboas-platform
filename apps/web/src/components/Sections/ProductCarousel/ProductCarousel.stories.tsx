/**
 * ProductCarousel Storybook Stories
 * 
 * Domain-Driven Design: Stories organized by carousel variants and use cases
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 * Performance & SEO Optimization: Auto-play carousel with image optimization
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProductCarouselFactory } from './ProductCarouselFactory';
import { PRODUCT_CAROUSEL_CONFIGS } from '@/config/productCarousel';
import type { ProductCarouselVariantConfig, ProductCarouselSlide } from '@/config/productCarousel';

const meta: Meta<typeof ProductCarouselFactory> = {
  title: 'Sections/ProductCarousel',
  component: ProductCarouselFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ProductCarousel Component Factory

The ProductCarousel uses the Component Factory Pattern to provide auto-playing carousel variants for showcasing products and features.

## Key Features

- **Auto-Play Carousel**: Automatic slide progression with pause on hover
- **Variant System**: Multiple layouts through factory pattern
- **Design Tokens**: Exclusively uses design system tokens
- **Touch & Keyboard Support**: Full interaction support across devices
- **Performance Monitoring**: Integrated render time tracking
- **Accessibility**: WCAG AA compliant with ARIA support
- **Image Optimization**: Next.js Image with responsive loading

## Variants

### Default
Standard carousel with balanced spacing and standard transitions.

### Compact
Smaller layout with faster transitions for space-constrained areas.

### Full Width
Expanded layout with slower transitions for hero-style presentations.

## Interaction Features

- **Auto-play**: Configurable intervals with pause on hover
- **Touch Navigation**: Swipe support on touch devices
- **Keyboard Navigation**: Arrow key support
- **Play/Pause Controls**: User control over auto-play
- **Dot Navigation**: Direct slide selection

## Architecture

- Factory pattern for variant selection
- Performance-optimized rendering
- Analytics integration
- Error boundaries and fallbacks
        `,
      },
    },
    backgrounds: {
      default: 'light',
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: Object.keys(PRODUCT_CAROUSEL_CONFIGS),
      description: 'Carousel variant to display',
    },
    config: {
      control: 'object',
      description: 'Configuration object for the carousel content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    enableAnalytics: {
      control: 'boolean',
      description: 'Enable analytics tracking',
      defaultValue: false,
    },
    priority: {
      control: 'boolean',
      description: 'Load images with high priority',
      defaultValue: false,
    },
  },
  args: {
    variant: 'default',
    enableAnalytics: false,
    priority: false,
  },
};

export default meta;
type Story = StoryObj<typeof ProductCarouselFactory>;

// Helper function to create stories
const createCarouselStory = (
  variant: keyof typeof PRODUCT_CAROUSEL_CONFIGS,
  overrides: Partial<ProductCarouselVariantConfig> = {}
): Story => ({
  args: {
    variant,
    config: {
      ...PRODUCT_CAROUSEL_CONFIGS[variant],
      ...overrides,
    },
  },
});

/**
 * Default Carousel Variant
 * 
 * Standard auto-playing carousel with balanced layout.
 */
export const Default: Story = createCarouselStory('default');

/**
 * Compact Carousel Variant
 * 
 * Smaller layout with faster transitions.
 */
export const Compact: Story = createCarouselStory('compact');

/**
 * Full Width Carousel Variant
 * 
 * Expanded layout with slower transitions for maximum impact.
 */
export const FullWidth: Story = createCarouselStory('fullWidth');

/**
 * Custom Content Example
 * 
 * Carousel with custom slides and content.
 */
export const CustomContent: Story = createCarouselStory('default', {
  content: {
    heading: 'Financial Freedom Awaits',
    slides: [
      {
        id: 'banking',
        title: 'Smart Banking',
        subtitle: 'Modern banking with intelligent insights',
        image: '/assets/socials/real/banking-half.avif',
        imageAlt: 'Modern banking interface',
        ctaText: 'Explore Banking',
        ctaHref: '#banking',
      },
      {
        id: 'investing',
        title: 'Investment Tools',
        subtitle: 'Professional-grade portfolio management',
        image: '/assets/socials/real/investing-with-icon.avif',
        imageAlt: 'Investment portfolio dashboard',
        ctaText: 'Start Investing',
        ctaHref: '#investing',
      },
      {
        id: 'defi',
        title: 'DeFi Strategies',
        subtitle: 'Decentralized finance made simple',
        image: '/assets/socials/real/crypto-half.avif',
        imageAlt: 'DeFi strategy interface',
        ctaText: 'Discover DeFi',
        ctaHref: '#defi',
      },
    ],
  },
});

/**
 * Business Focused Carousel
 * 
 * Carousel optimized for business features.
 */
export const BusinessFocused: Story = createCarouselStory('fullWidth', {
  content: {
    heading: 'Enterprise Solutions',
    slides: [
      {
        id: 'business-banking',
        title: 'Business Banking',
        subtitle: 'Streamlined business financial operations',
        image: '/assets/socials/real/business-half.avif',
        imageAlt: 'Business banking dashboard',
        ctaText: 'Learn More',
        ctaHref: '#business-banking',
      },
      {
        id: 'treasury',
        title: 'Treasury Management',
        subtitle: 'Optimize your business cash flow',
        image: '/assets/socials/real/operations-half.avif',
        imageAlt: 'Treasury management interface',
        ctaText: 'Explore Treasury',
        ctaHref: '#treasury',
      },
      {
        id: 'payments',
        title: 'Payment Solutions',
        subtitle: 'Accept and send payments globally',
        image: '/assets/socials/real/payment-with-icon.avif',
        imageAlt: 'Global payment solutions',
        ctaText: 'View Payments',
        ctaHref: '#payments',
      },
    ],
  },
  analytics: {
    trackingPrefix: 'carousel_business',
    enabled: true,
  },
});

/**
 * Learning Focused Carousel
 * 
 * Carousel for educational content.
 */
export const LearningFocused: Story = createCarouselStory('compact', {
  content: {
    heading: 'Learn & Grow',
    slides: [
      {
        id: 'courses',
        title: 'Financial Courses',
        subtitle: 'Expert-led financial education',
        image: '/assets/socials/real/learn-with-icon.avif',
        imageAlt: 'Online financial courses',
        ctaText: 'Start Learning',
        ctaHref: '#courses',
      },
      {
        id: 'guides',
        title: 'Investment Guides',
        subtitle: 'Step-by-step investment strategies',
        image: '/assets/socials/real/study-with-icon.avif',
        imageAlt: 'Investment strategy guides',
        ctaText: 'Read Guides',
        ctaHref: '#guides',
      },
      {
        id: 'certifications',
        title: 'Certifications',
        subtitle: 'Earn recognized financial certifications',
        image: '/assets/socials/real/studying-with-icon.avif',
        imageAlt: 'Financial certification programs',
        ctaText: 'Get Certified',
        ctaHref: '#certifications',
      },
    ],
  },
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.compact.settings,
    autoPlayInterval: 4000,
    enablePlayPause: false,
  },
});

/**
 * No Auto-Play Carousel
 * 
 * Manual carousel without auto-play for user control.
 */
export const ManualControl: Story = createCarouselStory('default', {
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.default.settings,
    autoPlay: false,
    enablePlayPause: false,
  },
});

/**
 * Fast Auto-Play
 * 
 * Carousel with fast auto-play intervals.
 */
export const FastAutoPlay: Story = createCarouselStory('default', {
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.default.settings,
    autoPlayInterval: 1500,
    transitionDuration: 300,
  },
});

/**
 * Slow Auto-Play
 * 
 * Carousel with slow auto-play intervals.
 */
export const SlowAutoPlay: Story = createCarouselStory('default', {
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.default.settings,
    autoPlayInterval: 6000,
    transitionDuration: 1200,
  },
});

/**
 * No Interactions
 * 
 * Simplified carousel with minimal interactions.
 */
export const MinimalInteractions: Story = createCarouselStory('compact', {
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.compact.settings,
    enableKeyboard: false,
    enableTouch: false,
    enableDots: false,
    enablePlayPause: false,
    pauseOnHover: false,
  },
});

/**
 * Mobile Optimized
 * 
 * Story demonstrating mobile-first responsive design.
 */
export const MobileOptimized: Story = {
  ...createCarouselStory('compact'),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Touch-optimized carousel for mobile devices with swipe navigation.',
      },
    },
  },
};

/**
 * Tablet Layout
 * 
 * Story demonstrating tablet responsive breakpoints.
 */
export const TabletLayout: Story = {
  ...createCarouselStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Optimized layout for tablet screen sizes.',
      },
    },
  },
};

/**
 * Dark Theme
 * 
 * Carousel with dark theme applied.
 */
export const DarkTheme: Story = {
  ...createCarouselStory('default'),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Carousel component with dark theme styling applied.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: '#1f2937' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * High Contrast Theme
 * 
 * Carousel with high contrast accessibility theme.
 */
export const HighContrast: Story = {
  ...createCarouselStory('default'),
  parameters: {
    docs: {
      description: {
        story: 'High contrast theme for improved accessibility compliance.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="high-contrast" style={{ minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Single Slide
 * 
 * Carousel with only one slide to test edge cases.
 */
export const SingleSlide: Story = createCarouselStory('default', {
  content: {
    heading: 'Complete Financial Control',
    slides: [
      {
        id: 'single',
        title: 'All-in-One Platform',
        subtitle: 'Everything you need for financial success',
        image: '/assets/socials/real/couple.avif',
        imageAlt: 'Complete financial platform overview',
        ctaText: 'Get Started',
        ctaHref: '#start',
      },
    ],
  },
  settings: {
    ...PRODUCT_CAROUSEL_CONFIGS.default.settings,
    autoPlay: false,
    enableDots: false,
  },
});

/**
 * Performance Monitoring Enabled
 * 
 * Story with performance monitoring and analytics enabled.
 */
export const WithPerformanceMonitoring: Story = {
  ...createCarouselStory('default'),
  args: {
    variant: 'default',
    enableAnalytics: true,
    config: {
      ...PRODUCT_CAROUSEL_CONFIGS.default,
      analytics: {
        trackingPrefix: 'carousel_storybook',
        enabled: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Carousel with performance monitoring and analytics tracking. Check browser console for metrics.',
      },
    },
  },
};

/**
 * All Variants Comparison
 * 
 * Side-by-side comparison of all carousel variants.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {Object.entries(PRODUCT_CAROUSEL_CONFIGS).map(([variant, config]) => (
        <div key={variant}>
          <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem', textTransform: 'capitalize' }}>
            {variant} Variant
          </h3>
          <ProductCarouselFactory 
            variant={variant as keyof typeof PRODUCT_CAROUSEL_CONFIGS} 
            config={{
              ...config,
              settings: {
                ...config.settings,
                autoPlay: false, // Disable auto-play for comparison
              },
            }} 
            enableAnalytics={false} 
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison view of all available carousel variants with auto-play disabled.',
      },
    },
  },
};

/**
 * Interactive Playground
 * 
 * Fully interactive carousel for testing all features.
 */
export const InteractivePlayground: Story = {
  ...createCarouselStory('default'),
  parameters: {
    docs: {
      description: {
        story: `
Interactive playground for testing carousel features:
- Auto-play with pause on hover
- Use arrow keys for keyboard navigation
- Touch/swipe on mobile devices
- Click dots for direct navigation
- Click play/pause button for control
- Test accessibility features

Try changing the variant, theme, and viewport to see responsive behavior.
        `,
      },
    },
  },
};