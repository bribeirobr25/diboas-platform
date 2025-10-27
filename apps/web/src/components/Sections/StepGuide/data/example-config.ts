/**
 * StepGuide Example Configuration
 *
 * Domain-Driven Design: Sample configuration for step-by-step guide
 * Service Agnostic Abstraction: Declarative configuration for guide content
 * Code Reusability: Template for creating StepGuide configurations
 *
 * USAGE:
 * ```tsx
 * import { StepGuideSection } from '@/components/Sections/StepGuide';
 * import { stepGuideConfig } from '@/components/Sections/StepGuide/data/example-config';
 *
 * export function MyPage() {
 *   return <StepGuideSection config={stepGuideConfig} />;
 * }
 * ```
 */

import type { StepGuideConfig } from '../types';

/**
 * Example StepGuide Configuration
 *
 * Step-by-step guide with numbered instructions.
 * Displays a title and numbered steps in a white rounded background container.
 */
export const stepGuideConfig: StepGuideConfig = {
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
    ariaLabel: 'Step-by-step guide to getting started with diBoaS'
  },

  /** Analytics configuration */
  analytics: {
    sectionId: 'step-guide-default',
    category: 'onboarding'
  }
};
