/**
 * Section Error Boundary - Constants
 *
 * Configuration values for error handling
 */

import type { SectionErrorTranslations } from './types';

/**
 * Maximum number of retry attempts
 */
export const MAX_RETRY_COUNT = 3;

/**
 * Base delay for exponential backoff (ms)
 */
export const RETRY_DELAY_BASE = 1000;

/**
 * Default translations for error messages
 */
export const DEFAULT_SECTION_TRANSLATIONS: SectionErrorTranslations = {
  title: 'Something went wrong',
  message: "We're sorry, but this section couldn't load properly.",
  canRetry: 'You can try reloading it below.',
  tryAgain: 'Try Again',
  reloadPage: 'Reload Page',
  devDetails: 'Error Details (Development Only)',
  persistHelp: 'If this problem persists, please try refreshing the page or contact support.',
};
