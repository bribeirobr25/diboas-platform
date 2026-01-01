/**
 * UTM Parameter Utilities
 *
 * Centralized UTM tracking for viral sharing
 * Following DRY principle - all UTM logic in one place
 */

import type { SharePlatform, CardType } from './types';

/**
 * UTM source types
 */
export type UtmSource = 'dream_mode' | 'waitlist' | 'referral' | 'calculator';

/**
 * UTM medium types
 */
export type UtmMedium = 'social' | 'share' | 'card' | 'email';

/**
 * UTM parameters interface
 */
export interface UtmParams {
  readonly utm_source: UtmSource;
  readonly utm_medium: UtmMedium;
  readonly utm_campaign: string;
  readonly utm_content?: string;
  readonly utm_term?: string;
}

/**
 * UTM configuration by card type
 */
export const UTM_CONFIGS: Record<CardType, Omit<UtmParams, 'utm_content'>> = {
  dream: {
    utm_source: 'dream_mode',
    utm_medium: 'share',
    utm_campaign: 'while_i_slept',
  },
  waitlist: {
    utm_source: 'waitlist',
    utm_medium: 'share',
    utm_campaign: 'early_access',
  },
  referral: {
    utm_source: 'referral',
    utm_medium: 'share',
    utm_campaign: 'friend_invite',
  },
  milestone: {
    utm_source: 'waitlist',
    utm_medium: 'share',
    utm_campaign: 'milestone_share',
  },
} as const;

/**
 * Platform-specific UTM content values
 */
export const UTM_CONTENT_BY_PLATFORM: Record<SharePlatform, string> = {
  twitter: 'twitter',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  telegram: 'telegram',
  download: 'download',
  copy: 'link_copy',
} as const;

/**
 * Build URL with UTM parameters
 */
export function buildUtmUrl(
  baseUrl: string,
  cardType: CardType,
  platform?: SharePlatform,
  additionalParams?: Partial<UtmParams>
): string {
  const config = UTM_CONFIGS[cardType];
  const params = new URLSearchParams();

  // Add base UTM params
  params.set('utm_source', config.utm_source);
  params.set('utm_medium', config.utm_medium);
  params.set('utm_campaign', config.utm_campaign);

  // Add platform-specific content
  if (platform) {
    params.set('utm_content', UTM_CONTENT_BY_PLATFORM[platform]);
  }

  // Add any additional params
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
  }

  // Build final URL
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * Get share URL with UTM tracking
 */
export function getShareUrl(
  cardType: CardType = 'dream',
  platform?: SharePlatform,
  referralCode?: string
): string {
  const baseUrl = 'https://diboas.com';

  let url = buildUtmUrl(baseUrl, cardType, platform);

  // Add referral code if provided
  if (referralCode) {
    url += `&ref=${encodeURIComponent(referralCode)}`;
  }

  return url;
}

/**
 * Extract UTM params from URL for analytics
 */
export function extractUtmParams(url: string): Partial<UtmParams> {
  try {
    const urlObj = new URL(url);
    const params: Partial<UtmParams> = {};

    const utmKeys: (keyof UtmParams)[] = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
    ];

    utmKeys.forEach((key) => {
      const value = urlObj.searchParams.get(key);
      if (value) {
        // Type assertion needed due to readonly constraint
        (params as Record<string, string>)[key] = value;
      }
    });

    return params;
  } catch {
    return {};
  }
}
