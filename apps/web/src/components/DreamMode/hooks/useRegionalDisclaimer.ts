'use client';

/**
 * useRegionalDisclaimer Hook
 *
 * Returns regional-specific disclaimer content for CLO compliance
 * Detects user region and returns appropriate i18n keys
 */

import { useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import {
  getDisclaimerRegion,
  requiresEnhancedDisclaimer,
  type DisclaimerRegion,
} from '@/lib/dream-mode';

export interface RegionalDisclaimerResult {
  /** Detected region */
  region: DisclaimerRegion;
  /** Primary disclaimer text (translated) */
  disclaimerText: string;
  /** Enhanced disclaimer text for US/Brazil (translated, or null) */
  enhancedDisclaimer: string | null;
  /** Card disclaimer text (for shareable cards) */
  cardDisclaimer: string;
  /** Whether enhanced disclaimer is required */
  hasEnhancedDisclaimer: boolean;
  /** Disclaimer type string for analytics */
  disclaimerType: string;
}

/**
 * Hook to get regional-specific disclaimers
 *
 * @returns Regional disclaimer content
 */
export function useRegionalDisclaimer(): RegionalDisclaimerResult {
  const intl = useTranslation();

  const result = useMemo(() => {
    const region = getDisclaimerRegion();
    const hasEnhancedDisclaimer = requiresEnhancedDisclaimer(region);

    // Get primary disclaimer text
    const disclaimerText = intl.formatMessage({ id: 'dreamMode.disclaimer.body' });

    // Get enhanced disclaimer for US/Brazil
    let enhancedDisclaimer: string | null = null;
    if (hasEnhancedDisclaimer) {
      const enhancedKey =
        region === 'US'
          ? 'dreamMode.disclaimer.enhanced.us'
          : 'dreamMode.disclaimer.enhanced.brazil';

      try {
        enhancedDisclaimer = intl.formatMessage({ id: enhancedKey });
      } catch {
        // Key might not exist in all locales
        enhancedDisclaimer = null;
      }
    }

    // Get card disclaimer
    const cardDisclaimer = intl.formatMessage({ id: 'dreamMode.disclaimer.card' });

    return {
      region,
      disclaimerText,
      enhancedDisclaimer,
      cardDisclaimer,
      hasEnhancedDisclaimer,
      disclaimerType: region,
    };
  }, [intl]);

  return result;
}

export default useRegionalDisclaimer;
