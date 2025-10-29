/**
 * BenefitsCards Configuration
 *
 * Domain-Driven Design: Benefits display domain configuration
 * Service Agnostic Abstraction: Decoupled benefit content from presentation
 * Configuration Management: Centralized benefit cards content and settings
 * No Hardcoded Values: All values configurable through interfaces
 *
 * Note: Title, description, and card content are translation keys that will be resolved at runtime
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
    title: 'marketing.benefitsCards.title',
    description: 'marketing.benefitsCards.description',
    backgroundColor: 'light-purple'
  },

  /** Benefit cards array (5 cards) */
  cards: [
    {
      id: 'money-flow',
      icon: '/assets/icons/money-flow.avif',
      iconAlt: 'marketing.benefitsCards.cards.moneyFlow.iconAlt',
      title: 'marketing.benefitsCards.cards.moneyFlow.title',
      description: 'marketing.benefitsCards.cards.moneyFlow.description'
    },
    {
      id: 'investing',
      icon: '/assets/icons/investing.avif',
      iconAlt: 'marketing.benefitsCards.cards.investing.iconAlt',
      title: 'marketing.benefitsCards.cards.investing.title',
      description: 'marketing.benefitsCards.cards.investing.description'
    },
    {
      id: 'money-circle',
      icon: '/assets/icons/money-circle.avif',
      iconAlt: 'marketing.benefitsCards.cards.moneyCircle.iconAlt',
      title: 'marketing.benefitsCards.cards.moneyCircle.title',
      description: 'marketing.benefitsCards.cards.moneyCircle.description'
    },
    {
      id: 'learn',
      icon: '/assets/icons/learn.avif',
      iconAlt: 'marketing.benefitsCards.cards.learn.iconAlt',
      title: 'marketing.benefitsCards.cards.learn.title',
      description: 'marketing.benefitsCards.cards.learn.description'
    },
    {
      id: 'rewards-medal',
      icon: '/assets/icons/rewards-medal.avif',
      iconAlt: 'marketing.benefitsCards.cards.rewards.iconAlt',
      title: 'marketing.benefitsCards.cards.rewards.title',
      description: 'marketing.benefitsCards.cards.rewards.description'
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
