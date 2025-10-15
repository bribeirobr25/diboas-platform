/**
 * OneFeature Storybook Stories
 * 
 * Domain-Driven Design: Stories organized by feature showcase variants and use cases
 * Service Agnostic Abstraction: Demonstrates component factory pattern
 * Code Reusability: Shared story configurations across variants
 * Flexible Features: Generic feature presentation for any domain
 */

import type { Meta, StoryObj } from '@storybook/react';
import { OneFeatureFactory } from './OneFeatureFactory';
import { ONE_FEATURE_CONFIGS } from '@/config/oneFeature';
import type { OneFeatureVariantConfig, FeatureItem } from '@/config/oneFeature';

const meta: Meta<typeof OneFeatureFactory> = {
  title: 'Sections/OneFeature',
  component: OneFeatureFactory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# SecurityOneFeature Component Factory

The SecurityOneFeature uses the Component Factory Pattern to provide security-focused feature presentation variants.

## Key Features

- **Security Focus**: Dedicated component for security features and tools
- **Variant System**: Multiple layouts through factory pattern
- **Design Tokens**: Exclusively uses design system tokens
- **Accessibility**: WCAG AA compliant with proper ARIA support
- **Performance Monitoring**: Integrated render time tracking
- **Animation Support**: Staggered animations for feature cards
- **Image Optimization**: Next.js Image with security asset loading

## Variants

### Default
Standard layout with all security features displayed.

### Compact
Condensed layout showing essential security features only.

### Expanded
Extended layout with additional security tools and features.

## Security Features

- **Fraud Reporting**: Direct access to fraud reporting tools
- **Support Channels**: Multiple security support options
- **Protection Center**: Centralized security management
- **Audit Reports**: Security audit and compliance information

## Architecture

- Factory pattern for variant selection
- Security-first design principles
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
      options: Object.keys(SECURITY_ONE_FEATURE_CONFIGS),
      description: 'Security variant to display',
    },
    config: {
      control: 'object',
      description: 'Configuration object for the security content',
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
type Story = StoryObj<typeof SecurityOneFeatureFactory>;

// Helper function to create stories
const createSecurityStory = (
  variant: keyof typeof SECURITY_ONE_FEATURE_CONFIGS,
  overrides: Partial<SecurityOneFeatureVariantConfig> = {}
): Story => ({
  args: {
    variant,
    config: {
      ...SECURITY_ONE_FEATURE_CONFIGS[variant],
      ...overrides,
    },
  },
});

/**
 * Default Security Variant
 * 
 * Standard layout with all security features.
 */
export const Default: Story = createSecurityStory('default');

/**
 * Compact Security Variant
 * 
 * Condensed layout with essential security features.
 */
export const Compact: Story = createSecurityStory('compact');

/**
 * Expanded Security Variant
 * 
 * Extended layout with additional security tools.
 */
export const Expanded: Story = createSecurityStory('expanded');

/**
 * English Security Features
 * 
 * Security section with English content for international users.
 */
export const EnglishContent: Story = createSecurityStory('default', {
  content: {
    title: 'Your Security Comes First',
    subtitle: 'Discover our tools and dedicated channels for protecting your account',
    features: [
      {
        id: 'fraud-report',
        title: 'Report Fraud',
        isPrimary: true,
        href: '/security/fraud-report',
        target: '_self',
      },
      {
        id: 'security-center',
        title: 'Security Center',
        href: '/security/center',
        target: '_self',
      },
      {
        id: 'support-channels',
        title: 'Support Channels',
        href: '/security/support',
        target: '_self',
      },
      {
        id: 'protection-tools',
        title: 'Protection Tools',
        href: '/security/tools',
        target: '_self',
      },
    ],
    cta: {
      text: 'Learn About Security',
      href: '/security',
      target: '_self',
    },
  },
});

/**
 * Business Security Features
 * 
 * Security section focused on business security needs.
 */
export const BusinessSecurity: Story = createSecurityStory('expanded', {
  content: {
    title: 'Enterprise Security Solutions',
    subtitle: 'Comprehensive security tools designed for business protection and compliance',
    features: [
      {
        id: 'compliance-audit',
        title: 'Compliance Audit',
        isPrimary: true,
        href: '/business/security/compliance',
        target: '_self',
      },
      {
        id: 'fraud-monitoring',
        title: 'Fraud Monitoring',
        href: '/business/security/monitoring',
        target: '_self',
      },
      {
        id: 'access-controls',
        title: 'Access Controls',
        href: '/business/security/access',
        target: '_self',
      },
      {
        id: 'security-reports',
        title: 'Security Reports',
        href: '/business/security/reports',
        target: '_self',
      },
      {
        id: 'incident-response',
        title: 'Incident Response',
        href: '/business/security/incidents',
        target: '_self',
      },
      {
        id: 'data-protection',
        title: 'Data Protection',
        href: '/business/security/data',
        target: '_self',
      },
    ],
    cta: {
      text: 'Explore Business Security',
      href: '/business/security',
      target: '_self',
    },
  },
  assets: {
    heroImage: '/assets/socials/drawing/security-banner.avif',
    heroImageAlt: 'Enterprise security solutions illustration',
  },
  analytics: {
    trackingPrefix: 'security_business',
    enabled: true,
  },
});

/**
 * Personal Security Features
 * 
 * Security section focused on personal account protection.
 */
export const PersonalSecurity: Story = createSecurityStory('default', {
  content: {
    title: 'Protect Your Personal Account',
    subtitle: 'Essential security tools for individual account protection and peace of mind',
    features: [
      {
        id: 'account-alerts',
        title: 'Account Alerts',
        isPrimary: true,
        href: '/security/alerts',
        target: '_self',
      },
      {
        id: 'two-factor-auth',
        title: 'Two-Factor Authentication',
        href: '/security/2fa',
        target: '_self',
      },
      {
        id: 'device-management',
        title: 'Device Management',
        href: '/security/devices',
        target: '_self',
      },
      {
        id: 'privacy-settings',
        title: 'Privacy Settings',
        href: '/security/privacy',
        target: '_self',
      },
    ],
    cta: {
      text: 'Secure Your Account',
      href: '/security/personal',
      target: '_self',
    },
  },
});

/**
 * Minimal Security Features
 * 
 * Essential security features only.
 */
export const MinimalSecurity: Story = createSecurityStory('compact', {
  content: {
    title: 'Essential Security',
    subtitle: 'Core security features for account protection',
    features: [
      {
        id: 'report-issue',
        title: 'Report Security Issue',
        isPrimary: true,
        href: '/security/report',
        target: '_self',
      },
      {
        id: 'help-center',
        title: 'Security Help',
        href: '/security/help',
        target: '_self',
      },
    ],
    cta: {
      text: 'Get Help',
      href: '/security/support',
      target: '_self',
    },
  },
  settings: {
    ...SECURITY_ONE_FEATURE_CONFIGS.compact.settings,
    enableAnimations: false,
  },
});

/**
 * No Animations
 * 
 * Security section with animations disabled for accessibility.
 */
export const NoAnimations: Story = createSecurityStory('default', {
  settings: {
    ...SECURITY_ONE_FEATURE_CONFIGS.default.settings,
    enableAnimations: false,
  },
});

/**
 * Fast Animations
 * 
 * Security section with fast animations for quick presentation.
 */
export const FastAnimations: Story = createSecurityStory('default', {
  settings: {
    ...SECURITY_ONE_FEATURE_CONFIGS.default.settings,
    animationDelay: 50,
  },
});

/**
 * Slow Animations
 * 
 * Security section with slow animations for detailed presentation.
 */
export const SlowAnimations: Story = createSecurityStory('expanded', {
  settings: {
    ...SECURITY_ONE_FEATURE_CONFIGS.expanded.settings,
    animationDelay: 300,
  },
});

/**
 * External Links
 * 
 * Security section with external security resources.
 */
export const ExternalResources: Story = createSecurityStory('default', {
  content: {
    title: 'Security Resources & Partners',
    subtitle: 'External security resources and trusted partner organizations',
    features: [
      {
        id: 'security-blog',
        title: 'Security Blog',
        href: 'https://blog.diboas.com/security',
        target: '_blank',
      },
      {
        id: 'security-whitepaper',
        title: 'Security Whitepaper',
        isPrimary: true,
        href: 'https://docs.diboas.com/security',
        target: '_blank',
      },
      {
        id: 'partner-certifications',
        title: 'Security Certifications',
        href: 'https://compliance.diboas.com',
        target: '_blank',
      },
      {
        id: 'bug-bounty',
        title: 'Bug Bounty Program',
        href: 'https://security.diboas.com/bounty',
        target: '_blank',
      },
    ],
    cta: {
      text: 'View All Resources',
      href: 'https://security.diboas.com',
      target: '_blank',
    },
  },
});

/**
 * Mobile Optimized
 * 
 * Story demonstrating mobile-first responsive design.
 */
export const MobileOptimized: Story = {
  ...createSecurityStory('compact'),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Compact layout optimized for mobile devices with touch-friendly interactions.',
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
  ...createSecurityStory('default'),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Standard layout optimized for tablet screen sizes.',
      },
    },
  },
};

/**
 * Dark Theme
 * 
 * Security section with dark theme applied.
 */
export const DarkTheme: Story = {
  ...createSecurityStory('default'),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Security component with dark theme styling applied.',
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
 * Security section with high contrast accessibility theme.
 */
export const HighContrast: Story = {
  ...createSecurityStory('default'),
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
  ...createSecurityStory('default'),
  args: {
    variant: 'default',
    enableAnalytics: true,
    config: {
      ...SECURITY_ONE_FEATURE_CONFIGS.default,
      analytics: {
        trackingPrefix: 'security_storybook',
        enabled: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Security section with performance monitoring and analytics tracking. Check browser console for metrics.',
      },
    },
  },
};

/**
 * All Variants Comparison
 * 
 * Side-by-side comparison of all security variants.
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {Object.entries(SECURITY_ONE_FEATURE_CONFIGS).map(([variant, config]) => (
        <div key={variant}>
          <h3 style={{ margin: '0 0 1rem 0', padding: '0 1rem', textTransform: 'capitalize' }}>
            {variant} Variant
          </h3>
          <SecurityOneFeatureFactory 
            variant={variant as keyof typeof SECURITY_ONE_FEATURE_CONFIGS} 
            config={{
              ...config,
              settings: {
                ...config.settings,
                enableAnimations: false, // Disable animations for comparison
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
        story: 'Comparison view of all available security variants with animations disabled.',
      },
    },
  },
};

/**
 * Interactive Playground
 * 
 * Fully interactive security section for testing all features.
 */
export const InteractivePlayground: Story = {
  ...createSecurityStory('default'),
  parameters: {
    docs: {
      description: {
        story: `
Interactive playground for testing security features:
- Staggered animations on component load
- Individual feature card hover states
- CTA button interactions
- Keyboard navigation support
- Test accessibility features

Try changing the variant, theme, and viewport to see responsive behavior.
        `,
      },
    },
  },
};