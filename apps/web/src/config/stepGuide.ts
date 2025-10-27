/**
 * StepGuide Configuration
 *
 * Domain-Driven Design: Step-by-step guide domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized StepGuide content and settings
 * No Hardcoded Values: All values configurable through interfaces
 */

import type { StepGuideConfig } from '@/components/Sections/StepGuide/types';

/**
 * Default StepGuide Configuration
 *
 * Step-by-step guide for getting started with diBoaS platform.
 * Displays numbered instructions in a white rounded background container.
 */
export const DEFAULT_STEP_GUIDE_CONFIG: StepGuideConfig = {
  /** Content configuration */
  content: {
    title: 'Getting Started with diBoaS',
    steps: [
      {
        id: 'step-1',
        number: '01',
        text: 'Open your Account'
      },
      {
        id: 'step-2',
        number: '02',
        text: 'Click on Banking'
      },
      {
        id: 'step-3',
        number: '03',
        text: 'Verify your identity'
      },
      {
        id: 'step-4',
        number: '04',
        text: 'Complete your profile information'
      },
      {
        id: 'step-5',
        number: '05',
        text: 'Start managing your finances'
      }
    ]
  },

  /** SEO and accessibility metadata */
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'Step-by-step guide to getting started with diBoaS platform'
  },

  /** Analytics configuration */
  analytics: {
    sectionId: 'step-guide-home',
    category: 'onboarding'
  }
} as const;
