/**
 * AppFeaturesCarousel Storybook Stories
 * 
 * Domain-Driven Design: Stories organized by app features variants and use cases
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 * Performance & SEO Optimization: Interactive card carousel with image optimization
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AppFeaturesCarousel } from './AppFeaturesCarouselFactory';
import { APP_FEATURES_CAROUSEL_CONFIGS, PAGE_APP_FEATURES_CONFIGS } from '@/config/appFeaturesCarousel';
import type { AppFeaturesCarouselVariantConfig, AppFeatureCard } from '@/config/appFeaturesCarousel';

const meta: Meta<typeof AppFeaturesCarousel> = {
  title: 'Sections/AppFeaturesCarousel',
  component: AppFeaturesCarousel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# AppFeaturesCarousel Component Factory

The AppFeaturesCarousel uses the Component Factory Pattern to provide rotating feature cards in different layout variants.

## Key Features

- **Auto-Rotating Cards**: Automatic card progression with pause on hover
- **Layout Variants**: Carousel, grid, and masonry layouts
- **Design Tokens**: Exclusively uses design system tokens
- **Touch Support**: Swipe navigation on touch devices
- **Performance Monitoring**: Integrated render time tracking
- **Accessibility**: WCAG AA compliant with ARIA support
- **Image Optimization**: Next.js Image with responsive loading

## Variants

### Default (Carousel)
Auto-rotating carousel layout with smooth transitions.


## Interactive Features

- **Auto-rotation**: Configurable intervals with pause on hover
- **Touch Navigation**: Swipe support on touch devices
- **Card Interactions**: Individual card hover and focus states
- **CTA Integration**: Direct links to feature pages

## Architecture

- Factory pattern for variant selection
- Card-based content structure
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
      options: Object.keys(APP_FEATURES_CAROUSEL_CONFIGS),
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
type Story = StoryObj<typeof AppFeaturesCarousel>;

// Helper function to create stories
const createCarouselStory = (
  variant: keyof typeof APP_FEATURES_CAROUSEL_CONFIGS,
  overrides: Partial<AppFeaturesCarouselVariantConfig> = {}
): Story => ({
  args: {
    variant,
    config: {
      ...APP_FEATURES_CAROUSEL_CONFIGS[variant],
      ...overrides,
    },
  },
});

/**
 * Default Carousel Variant
 * 
 * Auto-rotating carousel with smooth card transitions.
 */
export const Default: Story = createCarouselStory('default');



/**
 * Custom Feature Set
 * 
 * Carousel with custom banking-focused features.
 */
export const BankingFeatures: Story = createCarouselStory('default', {
  sectionTitle: 'Smart Banking Made Simple',
  cards: [
    {
      id: 'account-insights',
      content: {
        title: 'Smart Account Insights',
        description: 'Get AI-powered insights about your spending patterns and financial habits.',
        ctaText: 'View Insights',
        ctaHref: '#insights',
        ctaTarget: '_self',
        chipLabel: 'AI Insights',
      },
      assets: {
        image: '/assets/socials/real/life_vision.avif',
      },
      seo: {
        imageAlt: 'AI-powered financial insights dashboard',
      },
    },
    {
      id: 'instant-transfers',
      content: {
        title: 'Lightning Fast Transfers',
        description: 'Send and receive money instantly with our advanced payment infrastructure.',
        ctaText: 'Try Transfer',
        ctaHref: '#transfer',
        ctaTarget: '_self',
        chipLabel: 'Instant',
      },
      assets: {
        image: '/assets/socials/real/life_chill_man.avif',
      },
      seo: {
        imageAlt: 'Person making instant money transfers',
      },
    },
    {
      id: 'investment-tools',
      content: {
        title: 'Investment Made Easy',
        description: 'Access professional investment tools with guided strategies and portfolio management.',
        ctaText: 'Start Investing',
        ctaHref: '#invest',
        ctaTarget: '_self',
        chipLabel: 'Invest',
      },
      assets: {
        image: '/assets/socials/real/life_walking.avif',
      },
      seo: {
        imageAlt: 'Investment portfolio management interface',
      },
    },
    {
      id: 'security-features',
      content: {
        title: 'Bank-Level Security',
        description: 'Your money and data are protected with military-grade encryption and security.',
        ctaText: 'Learn Security',
        ctaHref: '#security',
        ctaTarget: '_self',
        chipLabel: 'Secure',
      },
      assets: {
        image: '/assets/socials/real/life_travel.avif',
      },
      seo: {
        imageAlt: 'Advanced security features protecting financial data',
      },
    },
  ],
});


/**
 * No Auto-Rotation
 * 
 * Carousel with auto-rotation disabled for manual control.
 */
export const ManualControl: Story = createCarouselStory('default', {
  settings: {
    ...APP_FEATURES_CAROUSEL_CONFIGS.default.settings,
    autoRotateMs: 0,
  },
});

/**
 * Fast Auto-Rotation
 * 
 * Carousel with fast auto-rotation for quick previews.
 */
export const FastRotation: Story = createCarouselStory('default', {
  settings: {
    ...APP_FEATURES_CAROUSEL_CONFIGS.default.settings,
    autoRotateMs: 2000,
    transitionDuration: 200,
  },
});

/**
 * Slow Auto-Rotation
 * 
 * Carousel with slow auto-rotation for detailed viewing.
 */
export const SlowRotation: Story = createCarouselStory('default', {
  settings: {
    ...APP_FEATURES_CAROUSEL_CONFIGS.default.settings,
    autoRotateMs: 8000,
    transitionDuration: 600,
  },
});

/**
 * Single Feature Card
 * 
 * Carousel with only one feature to test edge cases.
 */
export const SingleCard: Story = createCarouselStory('default', {
  sectionTitle: 'Our Main Feature',
  cards: [
    {
      id: 'main-feature',
      content: {
        title: 'Complete Financial Platform',
        description: 'Everything you need for modern financial management in one powerful app.',
        ctaText: 'Get Started',
        ctaHref: '#start',
        ctaTarget: '_self',
        chipLabel: 'Complete',
      },
      assets: {
        image: '/assets/socials/real/life_vision.avif',
      },
      seo: {
        imageAlt: 'Complete financial platform overview',
      },
    },
  ],
  settings: {
    ...APP_FEATURES_CAROUSEL_CONFIGS.default.settings,
    autoRotateMs: 0,
  },
});

/**
 * Mobile Optimized
 * 
 * Story demonstrating mobile-first responsive design.
 */
export const MobileOptimized: Story = {
  ...createCarouselStory('default'),
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
        story: 'Carousel layout optimized for tablet screen sizes.',
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
      ...APP_FEATURES_CAROUSEL_CONFIGS.default,
      analytics: {
        trackingPrefix: 'app_features_storybook',
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
      {Object.entries(APP_FEATURES_CAROUSEL_CONFIGS).map(([variant, config]) => (
        <div key={variant}>
          <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem', textTransform: 'capitalize' }}>
            {variant} Variant
          </h3>
          <AppFeaturesCarousel 
            variant={variant as keyof typeof APP_FEATURES_CAROUSEL_CONFIGS} 
            config={{
              ...config,
              settings: {
                ...config.settings,
                autoRotateMs: 0, // Disable auto-rotation for comparison
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
        story: 'Comparison view of all available carousel variants with auto-rotation disabled.',
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
- Auto-rotation with pause on hover
- Touch/swipe navigation on mobile devices
- Individual card hover states
- CTA button interactions
- Test accessibility features

Try changing the variant, theme, and viewport to see responsive behavior.
        `,
      },
    },
  },
};