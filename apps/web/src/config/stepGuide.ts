/**
 * StepGuide Configuration
 *
 * Domain-Driven Design: Step-by-step guide domain configuration
 * Service Agnostic Abstraction: Decoupled content from presentation
 * Configuration Management: Centralized StepGuide content and settings
 * No Hardcoded Values: All values configurable through interfaces
 *
 * Note: Title and step texts are translation keys that will be resolved at runtime
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
    title: 'marketing.stepGuide.title',
    steps: [
      {
        id: 'step-1',
        number: '01',
        text: 'marketing.stepGuide.steps.step1'
      },
      {
        id: 'step-2',
        number: '02',
        text: 'marketing.stepGuide.steps.step2'
      },
      {
        id: 'step-3',
        number: '03',
        text: 'marketing.stepGuide.steps.step3'
      },
      {
        id: 'step-4',
        number: '04',
        text: 'marketing.stepGuide.steps.step4'
      },
      {
        id: 'step-5',
        number: '05',
        text: 'marketing.stepGuide.steps.step5'
      },
      {
        id: 'step-6',
        number: '06',
        text: 'marketing.stepGuide.steps.step6'
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
