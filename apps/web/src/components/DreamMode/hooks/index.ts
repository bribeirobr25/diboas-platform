/**
 * Dream Mode Hooks - Public API
 *
 * Code Reusability & DRY: Centralized hooks for Dream Mode functionality
 */

export { useRegionalDisclaimer } from './useRegionalDisclaimer';
export type { RegionalDisclaimerResult } from './useRegionalDisclaimer';

export { useDreamModeTranslation } from './useDreamModeTranslation';
export type {
  DreamModeNamespace,
  TranslateFunction,
  DreamModeTranslationResult,
} from './useDreamModeTranslation';
