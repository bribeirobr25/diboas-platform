/**
 * Share Utilities
 *
 * Platform-specific sharing functions for referral links
 */

export type SharePlatform = 'twitter' | 'whatsapp' | 'facebook' | 'linkedin' | 'copy';

interface ShareConfig {
  referralUrl: string;
  shareText: string;
  twitterText: string;
  linkedInText: string;
  onLinkedInCopy: () => void;
}

/**
 * Opens a share URL in a new window
 */
function openShareWindow(url: string): void {
  window.open(url, '_blank');
}

/**
 * Get the share URL for Twitter
 */
export function getTwitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Get the share URL for WhatsApp
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Get the share URL for Facebook
 */
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Get the share URL for LinkedIn
 */
export function getLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Handle sharing to a specific platform
 */
export function shareToplatform(
  platform: SharePlatform,
  config: ShareConfig
): void {
  const { referralUrl, shareText, twitterText, linkedInText, onLinkedInCopy } = config;

  switch (platform) {
    case 'twitter':
      openShareWindow(getTwitterShareUrl(twitterText, referralUrl));
      break;
    case 'whatsapp':
      openShareWindow(getWhatsAppShareUrl(shareText));
      break;
    case 'facebook':
      openShareWindow(getFacebookShareUrl(referralUrl));
      break;
    case 'linkedin':
      // LinkedIn doesn't support pre-filled text, so copy it first
      navigator.clipboard.writeText(linkedInText).then(() => {
        onLinkedInCopy();
        openShareWindow(getLinkedInShareUrl(referralUrl));
      });
      break;
  }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(
  text: string,
  fallbackInputId?: string
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: select the input
    if (fallbackInputId) {
      const input = document.getElementById(fallbackInputId) as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        return true;
      }
    }
    return false;
  }
}
