/**
 * UTM Parameter Utilities
 *
 * Centralized UTM tracking for viral sharing
 * Following DRY principle - all UTM logic in one place
 */

import type { SharePlatform, CardType } from './types';
import { APP_URL } from '@/config/env';

/**
 * UTM source types
 */
export type UtmSource = 'waitlist' | 'referral' | 'learn';

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
  // P-4 (talk-page polish, 2026-07-16): Real Talk quiz share.
  learn: {
    utm_source: 'learn',
    utm_medium: 'share',
    utm_campaign: 'real_talk',
  },
} as const;

/**
 * Platform-specific UTM content values
 */
export const UTM_CONTENT_BY_PLATFORM: Record<SharePlatform, string> = {
  twitter: 'twitter',
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
  telegram: 'telegram',
  copy: 'link_copy',
  facebook: 'facebook',
  instagram: 'instagram',
  substack: 'substack',
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
  cardType: CardType,
  platform?: SharePlatform,
  referralCode?: string,
  locale?: string,
  /** Optional page path (e.g. `/learn/compound-interest`) so non-homepage
   *  surfaces can share their own URL with the same UTM machinery (P-4). */
  path: string = ''
): string {
  // Include locale to avoid root redirect (which could lose params)
  // and to land the recipient on the sharer's locale version
  const localePath = locale ? `/${locale}` : '';
  const baseUrl = `${APP_URL}${localePath}${path}`;

  let url = buildUtmUrl(baseUrl, cardType, platform);

  if (referralCode) {
    url += `&ref=${encodeURIComponent(referralCode)}`;
  }

  return url;
}
