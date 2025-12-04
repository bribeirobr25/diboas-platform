/**
 * FeatureShowcase Storybook Stories
 * 
 * Domain-Driven Design: Stories organized by business scenarios and variants
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 * Performance & SEO Optimization: Interactive carousel with image optimization
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FeatureShowcaseFactory } from './FeatureShowcaseFactory';
import { FEATURE_SHOWCASE_CONFIGS, PAGE_FEATURE_SHOWCASE_CONFIGS } from '@/config/featureShowcase';
import type { FeatureShowcaseVariantConfig, FeatureShowcaseSlide } from '@/config/featureShowcase';

const meta: Meta<typeof FeatureShowcaseFactory> = {
  title: 'Sections/FeatureShowcase',
  component: FeatureShowcaseFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FeatureShowcase Component Factory

The FeatureShowcase uses the Component Factory Pattern to provide interactive content showcase variants.

## Key Features

- **Interactive Carousel**: Touch, keyboard, and mouse navigation
- **Variant System**: Multiple layouts through factory pattern
- **Design Tokens**: Exclusively uses design system tokens
- **Performance Monitoring**: Integrated render time tracking
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Accessibility**: WCAG AA compliant with ARIA support
- **Image Optimization**: Next.js Image with responsive loading

## Variants

### Default
Standard showcase with navigation controls and image positioning.

### Benefits
Optimized layout for benefits presentation with enhanced styling.

### Minimal
Simplified layout without navigation controls.

### Fullscreen
Expanded layout for maximum visual impact.

## Architecture

- Factory pattern for variant selection
- Touch gesture support
- Keyboard navigation (arrow keys)
- Image preloading and error handling
- Analytics integration
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
      options: Object.keys(FEATURE_SHOWCASE_CONFIGS),
      description: 'Showcase variant to display',
    },
    config: {
      control: 'object',
      description: 'Configuration object for the showcase content',
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
      defaultValue: true,
    },
    backgroundColor: {
      control: 'color',
      description: 'Custom background color',
    },
  },
  args: {
    variant: 'default',
    enableAnalytics: false,
    priority: true,
  },
};

export default meta;
type Story = StoryObj<typeof FeatureShowcaseFactory>;

// Helper function to create stories
const createShowcaseStory = (
  variant: keyof typeof FEATURE_SHOWCASE_CONFIGS,
  overrides: Partial<FeatureShowcaseVariantConfig> = {}
): Story => ({
  args: {
    variant,
    config: {
      ...FEATURE_SHOWCASE_CONFIGS[variant],
      ...overrides,
    },
  },
});

/**
 * Default Showcase Variant
 * 
 * Standard interactive showcase with navigation controls.
 */
export const Default: Story = createShowcaseStory('default');

/**
 * Benefits Showcase Variant
 * 
 * Optimized layout for benefits and features presentation.
 */
export const Benefits: Story = createShowcaseStory('benefits');

/**
 * Minimal Showcase Variant
 * 
 * Simplified layout without navigation controls.
 */
export const Minimal: Story = createShowcaseStory('minimal');

/**
 * Fullscreen Showcase Variant
 * 
 * Expanded layout for maximum visual impact.
 */
export const Fullscreen: Story = createShowcaseStory('fullscreen');

/**
 * Custom Single Slide
 * 
 * Showcase with custom single slide content.
 */
export const SingleSlide: Story = createShowcaseStory('default', {
  slides: [
    {
      id: 'custom-slide',
      content: {
        title: 'Complete Financial Control',
        description: 'Take control of your financial future with our comprehensive platform. Monitor, invest, and grow your wealth all in one place.',
        ctaText: 'Take Control',
        ctaHref: '#control',
        ctaTarget: '_self',
      },
      assets: {
        primaryImage: '/assets/socials/drawing/phone-dashboard.avif',
        secondaryImage: '/assets/socials/drawing/phone-transaction-history.avif',
      },
      seo: {
        imageAlt: {
          primary: 'Financial control dashboard interface',
          secondary: 'Investment tracking and analytics',
        },
      },
      showSecondaryImage: true,
    },
  ],
  settings: {
    ...FEATURE_SHOWCASE_CONFIGS.default.settings,
    showNavigation: false,
    showDots: false,
  },
});

/**
 * Business Focused Content
 * 
 * Showcase configured for business use cases.
 */
export const BusinessFocused: Story = {
  args: {
    variant: 'fullscreen',
    config: PAGE_FEATURE_SHOWCASE_CONFIGS.BUSINESS,
    enableAnalytics: false,
  },
};

/**
 * Learning Focused Content
 * 
 * Showcase configured for educational content.
 */
export const LearningFocused: Story = {
  args: {
    variant: 'minimal',
    config: PAGE_FEATURE_SHOWCASE_CONFIGS.LEARN,
    enableAnalytics: false,
  },
};

/**
 * Multiple Slides Navigation
 * 
 * Showcase with multiple slides and full navigation.
 */
export const MultipleSlides: Story = createShowcaseStory('default', {
  slides: [
    {
      id: 'banking',
      content: {
        title: 'Smart Banking Solutions',
        description: 'Modern banking features with intelligent insights and automated financial management.',
        ctaText: 'Explore Banking',
        ctaHref: '#banking',
        ctaTarget: '_self',
      },
      assets: {
        primaryImage: '/assets/socials/drawing/phone-account.avif',
        secondaryImage: '/assets/socials/drawing/phone-send.avif',
      },
      seo: {
        imageAlt: {
          primary: 'Smart banking interface showing account overview',
          secondary: 'Banking analytics and insights dashboard',
        },
      },
      showSecondaryImage: true,
    },
    {
      id: 'investing',
      content: {
        title: 'Investment Portfolio Management',
        description: 'Professional-grade investment tools with real-time market data and portfolio analytics.',
        ctaText: 'Start Investing',
        ctaHref: '#investing',
        ctaTarget: '_self',
      },
      assets: {
        primaryImage: '/assets/socials/drawing/phone-invest-overview.avif',
        secondaryImage: '/assets/socials/drawing/phone-invest-stock.avif',
      },
      seo: {
        imageAlt: {
          primary: 'Investment portfolio dashboard with charts',
          secondary: 'Real-time market data and analytics',
        },
      },
      showSecondaryImage: true,
    },
    {
      id: 'defi',
      content: {
        title: 'DeFi Strategy Tools',
        description: 'Access decentralized finance opportunities with guided strategies and risk management.',
        ctaText: 'Discover DeFi',
        ctaHref: '#defi',
        ctaTarget: '_self',
      },
      assets: {
        primaryImage: '/assets/socials/drawing/phone-hero-crypto.avif',
        secondaryImage: '/assets/socials/drawing/phone-invest-crypto-portfolio.avif',
      },
      seo: {
        imageAlt: {
          primary: 'DeFi strategy interface with yield farming options',
          secondary: 'Decentralized finance portfolio management',
        },
      },
      showSecondaryImage: true,
    },
  ],
  settings: {
    ...FEATURE_SHOWCASE_CONFIGS.default.settings,
    showNavigation: true,
    showDots: true,
  },
});

/**
 * Mobile Optimized
 * 
 * Story demonstrating mobile-first responsive design.
 */
export const MobileOptimized: Story = {
  ...createShowcaseStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Touch-optimized layout for mobile devices with swipe navigation.',
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
  ...createShowcaseStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Optimized layout for tablet screen sizes with balanced content.',
      },
    },
  },
};

/**
 * Dark Theme
 * 
 * Showcase with dark theme applied.
 */
export const DarkTheme: Story = {
  ...createShowcaseStory('default'),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Showcase component with dark theme styling applied.',
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
 * Showcase with high contrast accessibility theme.
 */
export const HighContrast: Story = {
  ...createShowcaseStory('default'),
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
 * Custom Background Color
 * 
 * Showcase with custom background color applied.
 */
export const CustomBackground: Story = {
  ...createShowcaseStory('default'),
  args: {
    ...createShowcaseStory('default').args,
    backgroundColor: '#f0f9ff',
  },
  parameters: {
    docs: {
      description: {
        story: 'Showcase with custom background color for brand customization.',
      },
    },
  },
};

/**
 * Performance Monitoring Enabled
 * 
 * Story with performance monitoring and analytics enabled.
 */
export const WithPerformanceMonitoring: Story = {
  ...createShowcaseStory('default'),
  args: {
    variant: 'default',
    enableAnalytics: true,
    config: {
      ...FEATURE_SHOWCASE_CONFIGS.default,
      analytics: {
        trackingPrefix: 'showcase_storybook',
        enabled: true,
        eventSuffixes: {
          navigation: '_nav',
          ctaClick: '_cta',
        },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Showcase with performance monitoring and analytics tracking. Check browser console for metrics.',
      },
    },
  },
};

/**
 * Fast Transitions
 * 
 * Showcase with fast transition animations.
 */
export const FastTransitions: Story = createShowcaseStory('default', {
  settings: {
    ...FEATURE_SHOWCASE_CONFIGS.default.settings,
    transitionDuration: 100,
  },
});

/**
 * Slow Transitions
 * 
 * Showcase with slow transition animations.
 */
export const SlowTransitions: Story = createShowcaseStory('default', {
  settings: {
    ...FEATURE_SHOWCASE_CONFIGS.default.settings,
    transitionDuration: 800,
  },
});

/**
 * No Secondary Images
 * 
 * Showcase with only primary images displayed.
 */
export const NoSecondaryImages: Story = createShowcaseStory('default', {
  slides: FEATURE_SHOWCASE_CONFIGS.default.slides.map(slide => ({
    ...slide,
    showSecondaryImage: false,
  })),
});

/**
 * All Variants Comparison
 * 
 * Side-by-side comparison of all showcase variants.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {Object.entries(FEATURE_SHOWCASE_CONFIGS).map(([variant, config]) => (
        <div key={variant}>
          <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem', textTransform: 'capitalize' }}>
            {variant} Variant
          </h3>
          <FeatureShowcaseFactory 
            variant={variant as keyof typeof FEATURE_SHOWCASE_CONFIGS} 
            config={config} 
            enableAnalytics={false} 
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison view of all available showcase variants.',
      },
    },
  },
};

/**
 * Interactive Playground
 * 
 * Fully interactive showcase for testing all features.
 */
export const InteractivePlayground: Story = {
  ...createShowcaseStory('default'),
  parameters: {
    docs: {
      description: {
        story: `
Interactive playground for testing showcase features:
- Use arrow keys for keyboard navigation
- Touch/swipe on mobile devices
- Click navigation buttons
- Test accessibility features

Try changing the variant, theme, and viewport to see responsive behavior.
        `,
      },
    },
  },
};