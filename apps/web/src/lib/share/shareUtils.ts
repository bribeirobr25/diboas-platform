/**
 * Share Utilities
 *
 * Helper functions for sharing functionality
 */

import type { SharePlatform, CardLocale } from './types';
import { PLATFORM_CONFIGS, CAMPAIGN_HASHTAGS } from './constants';

/**
 * Check if Web Share API is available
 */
export function isWebShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Check if Web Share API supports files
 */
export function isWebShareFilesAvailable(): boolean {
  return (
    isWebShareAvailable() &&
    typeof navigator !== 'undefined' &&
    'canShare' in navigator
  );
}

/**
 * Generate hashtags string for sharing
 */
export function getHashtags(locale: CardLocale, asString = true): string | string[] {
  const tags = CAMPAIGN_HASHTAGS.localized[locale] || CAMPAIGN_HASHTAGS.localized.en;
  if (asString) {
    return tags.map((tag) => `#${tag}`).join(' ');
  }
  return [...tags]; // Convert readonly to mutable array
}

/**
 * Truncate text to fit platform character limits
 * Preserves hashtags and URLs by accounting for their length
 */
export function truncateForPlatform(
  text: string,
  platform: SharePlatform,
  urlLength: number = 23 // Twitter counts all URLs as 23 chars
): string {
  const config = PLATFORM_CONFIGS[platform];
  const maxLength = config?.maxTextLength;

  if (!maxLength || text.length <= maxLength) {
    return text;
  }

  // Reserve space for URL (if sharing) and ellipsis
  const reservedLength = urlLength + 4; // URL + " ..."
  const availableLength = maxLength - reservedLength;

  if (availableLength <= 0) {
    return `${text.slice(0, maxLength - 3)}...`;
  }

  // Find a good break point (word boundary)
  let truncated = text.slice(0, availableLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > availableLength * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${truncated}...`;
}

/**
 * Open a share URL in a popup window
 */
export function openShareWindow(
  url: string,
  options: { width?: number; height?: number; popup?: boolean } = {}
): void {
  const { width = 600, height = 400, popup = true } = options;

  if (popup) {
    window.open(url, '_blank', `width=${width},height=${height}`);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Download a file from a data URL
 */
export function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
