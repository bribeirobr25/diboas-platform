/**
 * Waitlist Share Utilities
 *
 * Thin wrapper around lib/share/platformUrls.ts for waitlist-specific sharing.
 * Handles per-platform share config (Twitter mention, LinkedIn clipboard).
 */

import type { SharePlatform } from '@/lib/share/types';
import {
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getLinkedInShareUrl,
  getFacebookShareUrl,
  openShareWindow,
  copyToClipboard,
} from '@/lib/share/platformUrls';

export type { SharePlatform };

interface ShareConfig {
  referralUrl: string;
  shareText: string;
  onLinkedInCopy: () => void;
  onClipboardCopy?: () => void;
}

/**
 * Handle sharing to a specific platform.
 * Twitter appends @diboasfi mention automatically.
 */
export function shareToPlatform(platform: SharePlatform, config: ShareConfig): void {
  const { referralUrl, shareText, onLinkedInCopy, onClipboardCopy } = config;

  switch (platform) {
    case 'twitter': {
      const twitterText = `${shareText} @diboasfi`;
      openShareWindow(getTwitterShareUrl(twitterText, referralUrl));
      break;
    }
    case 'whatsapp':
      openShareWindow(getWhatsAppShareUrl(shareText, referralUrl));
      break;
    case 'linkedin':
      copyToClipboard(`${shareText} ${referralUrl}`).then(() => {
        onLinkedInCopy();
        openShareWindow(getLinkedInShareUrl(referralUrl));
      });
      break;
    case 'facebook':
      openShareWindow(getFacebookShareUrl(shareText, referralUrl));
      break;
    case 'instagram':
    case 'substack':
      copyToClipboard(`${shareText} ${referralUrl}`).then(() => {
        onClipboardCopy?.();
      });
      break;
  }
}

export { copyToClipboard };
