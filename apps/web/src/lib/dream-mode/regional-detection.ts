/**
 * Dream Mode - Regional Detection
 *
 * CLO-required region detection for appropriate disclaimers
 * Detects user region to apply correct legal disclaimers
 */

import type { DisclaimerRegion } from './types';

/**
 * US state codes for detection
 */
const US_STATE_CODES = [
  'en-US',
  'en-us',
];

/**
 * Brazil locale codes
 */
const BRAZIL_LOCALE_CODES = [
  'pt-BR',
  'pt-br',
];

/**
 * Get the user's disclaimer region based on:
 * 1. URL parameter override (for testing)
 * 2. Browser language
 * 3. Default to EU
 *
 * @returns DisclaimerRegion - 'EU' | 'US' | 'BRAZIL'
 */
export function getDisclaimerRegion(): DisclaimerRegion {
  // Only run on client side
  if (typeof window === 'undefined') {
    return 'EU';
  }

  // 1. Check URL parameter for testing override
  const urlParams = new URLSearchParams(window.location.search);
  const regionParam = urlParams.get('region')?.toUpperCase();

  if (regionParam && ['EU', 'US', 'BRAZIL'].includes(regionParam)) {
    return regionParam as DisclaimerRegion;
  }

  // 2. Check browser language
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';

  // Check for Brazil
  if (BRAZIL_LOCALE_CODES.some((code) => browserLang.toLowerCase().startsWith(code.toLowerCase()))) {
    return 'BRAZIL';
  }

  // Check for US
  if (US_STATE_CODES.some((code) => browserLang.toLowerCase() === code.toLowerCase())) {
    return 'US';
  }

  // 3. Default to EU
  return 'EU';
}

/**
 * Check if the current region requires enhanced disclaimers
 *
 * @param region - The detected region
 * @returns boolean - true if enhanced disclaimers are required
 */
export function requiresEnhancedDisclaimer(region: DisclaimerRegion): boolean {
  return region === 'US' || region === 'BRAZIL';
}

/**
 * Get the appropriate disclaimer i18n key suffix for a region
 *
 * @param region - The detected region
 * @returns string - The i18n key suffix
 */
export function getDisclaimerKeySuffix(region: DisclaimerRegion): string {
  switch (region) {
    case 'US':
      return 'us';
    case 'BRAZIL':
      return 'brazil';
    case 'EU':
    default:
      return 'eu';
  }
}

/**
 * Get region display name for analytics/logging
 *
 * @param region - The detected region
 * @returns string - Human-readable region name
 */
export function getRegionDisplayName(region: DisclaimerRegion): string {
  const names: Record<DisclaimerRegion, string> = {
    EU: 'European Union',
    US: 'United States',
    BRAZIL: 'Brazil',
  };
  return names[region];
}
