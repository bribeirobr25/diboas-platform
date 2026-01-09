/**
 * Platform Handlers
 *
 * Platform-specific sharing logic for each social platform
 */

import type {
  SharePlatform,
  ShareContent,
  ShareResult,
  CardType,
  CardLocale,
} from './types';

import { PLATFORM_CONFIGS } from './constants';
import { getShareUrl } from './utm';
import {
  truncateForPlatform,
  getHashtags,
  openShareWindow,
  copyTextToClipboard,
  downloadFromDataUrl,
} from './shareUtils';

/**
 * Build share URL for a platform with UTM tracking
 */
export function buildShareUrl(
  platform: SharePlatform,
  content: ShareContent,
  cardType: CardType = 'dream',
  referralCode?: string
): string | null {
  const config = PLATFORM_CONFIGS[platform];
  if (!config?.urlTemplate) return null;

  // Get URL with UTM parameters
  const shareUrl = content.url || getShareUrl(cardType, platform, referralCode);

  // Truncate text for platform limits
  const truncatedText = truncateForPlatform(content.text, platform);

  let url = config.urlTemplate;

  // Encode and replace placeholders
  url = url.replace('{text}', encodeURIComponent(truncatedText));
  url = url.replace('{url}', encodeURIComponent(shareUrl));

  // Add hashtags for Twitter
  if (platform === 'twitter' && content.hashtags?.length) {
    url += `&hashtags=${encodeURIComponent(content.hashtags.join(','))}`;
  }

  return url;
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(
  content: ShareContent,
  locale: CardLocale,
  cardType: CardType,
  referralCode?: string
): ShareResult {
  const url = buildShareUrl(
    'twitter',
    {
      ...content,
      hashtags: content.hashtags || (getHashtags(locale, false) as string[]),
    },
    cardType,
    referralCode
  );

  if (url) {
    openShareWindow(url, { width: 600, height: 400 });
    return { success: true, platform: 'twitter' };
  }

  return {
    success: false,
    platform: 'twitter',
    error: 'Failed to build share URL',
  };
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(
  content: ShareContent,
  cardType: CardType,
  referralCode?: string
): ShareResult {
  // Get URL with UTM parameters
  const shareUrl = content.url || getShareUrl(cardType, 'whatsapp', referralCode);

  // Truncate text for WhatsApp limits
  const truncatedText = truncateForPlatform(content.text, 'whatsapp');

  // Combine text and URL for WhatsApp
  const fullText = `${truncatedText}\n\n${shareUrl}`;

  const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  openShareWindow(url, { popup: false });

  return { success: true, platform: 'whatsapp' };
}

/**
 * Share to Facebook
 */
export function shareToFacebook(
  content: ShareContent,
  cardType: CardType,
  referralCode?: string
): ShareResult {
  const url = buildShareUrl('facebook', content, cardType, referralCode);

  if (url) {
    openShareWindow(url, { width: 600, height: 400 });
    return { success: true, platform: 'facebook' };
  }

  return {
    success: false,
    platform: 'facebook',
    error: 'Failed to build share URL',
  };
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(
  content: ShareContent,
  cardType: CardType,
  referralCode?: string
): ShareResult {
  const url = buildShareUrl('linkedin', content, cardType, referralCode);

  if (url) {
    openShareWindow(url, { width: 600, height: 400 });
    return { success: true, platform: 'linkedin' };
  }

  return {
    success: false,
    platform: 'linkedin',
    error: 'Failed to build share URL',
  };
}

/**
 * Share to Telegram
 */
export function shareToTelegram(
  content: ShareContent,
  cardType: CardType,
  referralCode?: string
): ShareResult {
  const url = buildShareUrl('telegram', content, cardType, referralCode);

  if (url) {
    openShareWindow(url, { popup: false });
    return { success: true, platform: 'telegram' };
  }

  return {
    success: false,
    platform: 'telegram',
    error: 'Failed to build share URL',
  };
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: ShareContent): Promise<ShareResult> {
  const textToCopy = content.url || content.text;
  const success = await copyTextToClipboard(textToCopy);

  if (success) {
    return { success: true, platform: 'copy' };
  }

  return {
    success: false,
    platform: 'copy',
    error: 'Failed to copy to clipboard',
  };
}

/**
 * Download image
 */
export function downloadImage(
  dataUrl: string,
  cardType: CardType,
  filename?: string
): ShareResult {
  try {
    const name = filename || `diboas-${cardType}-${Date.now()}.png`;
    downloadFromDataUrl(dataUrl, name);

    return { success: true, platform: 'download' };
  } catch (error) {
    return {
      success: false,
      platform: 'download',
      error: (error as Error).message,
    };
  }
}
