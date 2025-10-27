/**
 * BenefitsCards Configuration
 *
 * Domain-Driven Design: Benefits display domain configuration
 * Service Agnostic Abstraction: Decoupled benefit content from presentation
 * Configuration Management: Centralized benefit cards content and settings
 * No Hardcoded Values: All values configurable through interfaces
 */

import type { BenefitsCardsConfig } from '@/components/Sections/BenefitsCards/types';

/**
 * Default BenefitsCards Configuration
 *
 * Layout:
 * - Desktop: 3 cards in top row, 2 cards in bottom row (centered)
 * - Tablet/Mobile: Single column, stacked vertically
 */
export const DEFAULT_BENEFITS_CARDS_CONFIG: BenefitsCardsConfig = {
  /** Section configuration */
  section: {
    title: 'Why Choose Diboas',
    description: 'Experience the benefits of modern financial management with our comprehensive platform.',
    backgroundColor: 'light-purple'
  },

  /** Benefit cards array (5 cards) */
  cards: [
    {
      id: 'money-flow',
      icon: '/assets/icons/money-flow.avif',
      iconAlt: 'Money flow icon representing seamless transaction management',
      title: 'Seamless Money Flow',
      description: 'Track and manage your transactions effortlessly with real-time updates and intelligent categorization.'
    },
    {
      id: 'investing',
      icon: '/assets/icons/investing.avif',
      iconAlt: 'Investing icon representing smart investment opportunities',
      title: 'Smart Investing',
      description: 'Grow your wealth with data-driven investment recommendations and portfolio management tools.'
    },
    {
      id: 'money-circle',
      icon: '/assets/icons/money-circle.avif',
      iconAlt: 'Money circle icon representing circular economy and financial sustainability',
      title: 'Financial Sustainability',
      description: 'Build a sustainable financial future with tools designed for long-term financial health and stability.'
    },
    {
      id: 'learn',
      icon: '/assets/icons/learn.avif',
      iconAlt: 'Learn icon representing financial education and knowledge',
      title: 'Financial Education',
      description: 'Access comprehensive resources and personalized insights to improve your financial literacy.'
    },
    {
      id: 'rewards-medal',
      icon: '/assets/icons/rewards-medal.avif',
      iconAlt: 'Rewards medal icon representing benefits and achievements',
      title: 'Exclusive Rewards',
      description: 'Earn rewards and unlock exclusive benefits as you achieve your financial goals and milestones.'
    }
  ],

  /** SEO and accessibility metadata */
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Benefits of using Diboas financial platform'
  },

  /** Analytics configuration */
  analytics: {
    sectionId: 'benefits-cards-home',
    category: 'benefits'
  }
} as const;
