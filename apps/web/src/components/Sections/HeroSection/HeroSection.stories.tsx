/**
 * HeroSection Storybook Stories
 * 
 * Domain-Driven Design: Stories organized by business scenarios
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 * Performance & SEO Optimization: Lazy loading and image optimization showcased
 */

import type { Meta, StoryObj } from '@storybook/react';
import { HeroSectionFactory } from './HeroSectionFactory';
import { HERO_CONFIGS } from '@/config/hero';
import type { HeroVariantConfig } from '@/config/hero';

const meta: Meta<typeof HeroSectionFactory> = {
  title: 'Sections/HeroSection',
  component: HeroSectionFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# HeroSection Component Factory

The HeroSection uses the Component Factory Pattern to provide multiple variants for different use cases.

## Key Features

- **Variant System**: Multiple layouts through factory pattern
- **Design Tokens**: Exclusively uses design system tokens
- **Performance Monitoring**: Integrated render time tracking
- **Theme Support**: Automatic dark/light mode adaptation
- **Accessibility**: WCAG AA compliant with screen reader support
- **Image Optimization**: Next.js Image with lazy loading

## Variants

### Default
Classic hero layout with visual elements and content side-by-side.

### Full Background
Hero with full background image and centered content overlay.

## Architecture

- Factory pattern for variant selection
- Service agnostic abstractions
- Domain-driven configuration
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
      options: Object.keys(HERO_CONFIGS),
      description: 'Hero variant to display',
    },
    config: {
      control: 'object',
      description: 'Configuration object for the hero content',
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
  },
  args: {
    variant: 'default',
    enableAnalytics: false,
    priority: true,
  },
};

export default meta;
type Story = StoryObj<typeof HeroSectionFactory>;

// Base story template
const createHeroStory = (
  variant: keyof typeof HERO_CONFIGS,
  overrides: Partial<HeroVariantConfig> = {}
): Story => ({
  args: {
    variant,
    config: {
      ...HERO_CONFIGS[variant],
      ...overrides,
    },
  },
});

/**
 * Default Hero Variant
 * 
 * Classic layout with visual elements and content positioning.
 */
export const Default: Story = createHeroStory('default');

/**
 * Full Background Hero Variant
 * 
 * Hero with full background image and centered content overlay.
 */
export const FullBackground: Story = createHeroStory('fullBackground');

/**
 * Custom Content Example
 * 
 * Demonstrates customizable content configuration.
 */
export const CustomContent: Story = createHeroStory('default', {
  content: {
    title: 'Welcome to the Future of Finance',
    description: 'Experience seamless banking, investing, and DeFi management in one powerful platform. Join thousands of users who trust diBoaS.',
    ctaText: 'Start Your Journey',
    ctaHref: '#custom-cta',
    ctaTarget: '_self',
  },
});

/**
 * Minimal Content
 * 
 * Hero with minimal content for focused messaging.
 */
export const MinimalContent: Story = createHeroStory('default', {
  content: {
    title: 'Simple. Secure. Smart.',
    ctaText: 'Learn More',
    ctaHref: '#learn',
    ctaTarget: '_self',
  },
});

/**
 * Business Focused
 * 
 * Hero variant focused on business use cases.
 */
export const BusinessFocused: Story = createHeroStory('default', {
  content: {
    title: 'Enterprise Financial Solutions',
    description: 'Streamline your business banking, treasury management, and financial operations with our comprehensive platform.',
    ctaText: 'Schedule Demo',
    ctaHref: '#demo',
    ctaTarget: '_self',
  },
  analytics: {
    trackingPrefix: 'hero_business',
    enabled: true,
  },
});

/**
 * Developer Focused
 * 
 * Hero variant for developer documentation.
 */
export const DeveloperFocused: Story = createHeroStory('fullBackground', {
  content: {
    title: 'Build with diBoaS APIs',
    description: 'Integrate banking, payment, and DeFi functionality into your applications with our comprehensive API suite.',
    ctaText: 'View Documentation',
    ctaHref: '#docs',
    ctaTarget: '_self',
  },
  analytics: {
    trackingPrefix: 'hero_developer',
    enabled: true,
  },
});

/**
 * Mobile Optimized
 * 
 * Story demonstrating mobile-first responsive design.
 */
export const MobileOptimized: Story = {
  ...createHeroStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Optimized layout and typography for mobile devices.',
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
  ...createHeroStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Balanced layout for tablet screen sizes.',
      },
    },
  },
};

/**
 * Dark Theme
 * 
 * Hero with dark theme applied.
 */
export const DarkTheme: Story = {
  ...createHeroStory('default'),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Hero component with dark theme styling applied.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-800, #1f2937)' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * High Contrast Theme
 * 
 * Hero with high contrast accessibility theme.
 */
export const HighContrast: Story = {
  ...createHeroStory('default'),
  parameters: {
    docs: {
      description: {
        story: 'High contrast theme for improved accessibility.',
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
  ...createHeroStory('default'),
  args: {
    variant: 'default',
    enableAnalytics: true,
    config: {
      ...HERO_CONFIGS.default,
      analytics: {
        trackingPrefix: 'hero_storybook',
        enabled: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Hero with performance monitoring and analytics tracking enabled. Check browser console for metrics.',
      },
    },
  },
};

/**
 * Error State Simulation
 * 
 * Story demonstrating error boundary behavior.
 */
export const ErrorState: Story = createHeroStory('default', {
  // @ts-ignore - Intentionally invalid config for error testing
  content: null,
});

/**
 * Loading State
 * 
 * Story showing loading behavior with slow image loading.
 */
export const LoadingState: Story = {
  ...createHeroStory('default'),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates loading states while images are being fetched.',
      },
    },
  },
};

/**
 * All Variants Comparison
 * 
 * Side-by-side comparison of all hero variants.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem' }}>Default Variant</h3>
        <HeroSectionFactory variant="default" config={HERO_CONFIGS.default} enableAnalytics={false} />
      </div>
      <div>
        <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem' }}>Full Background Variant</h3>
        <HeroSectionFactory variant="fullBackground" config={HERO_CONFIGS.fullBackground} enableAnalytics={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison view of all available hero variants.',
      },
    },
  },
};