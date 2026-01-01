/**
 * Share Manager
 *
 * Handles platform-specific sharing logic with:
 * - Web Share API support
 * - Fallback URL sharing
 * - Image download functionality
 * - Analytics tracking
 */

import type {
  SharePlatform,
  ShareContent,
  ShareResult,
  ShareTrackingData,
  RenderedCard,
  CardLocale,
  CardType,
} from './types';

import { PLATFORM_CONFIGS, SHARE_EVENTS, CAMPAIGN_HASHTAGS } from './constants';
import { getShareUrl } from './utm';

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
    return text.slice(0, maxLength - 3) + '...';
  }

  // Find a good break point (word boundary)
  let truncated = text.slice(0, availableLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > availableLength * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated + '...';
}

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
 * Share Manager class
 */
export class ShareManager {
  private trackingCallback?: (data: ShareTrackingData) => void;
  private locale: CardLocale;
  private cardType: CardType;
  private referralCode?: string;

  constructor(
    locale: CardLocale = 'en',
    trackingCallback?: (data: ShareTrackingData) => void,
    cardType: CardType = 'dream',
    referralCode?: string
  ) {
    this.locale = locale;
    this.trackingCallback = trackingCallback;
    this.cardType = cardType;
    this.referralCode = referralCode;
  }

  /**
   * Set card type for UTM tracking
   */
  setCardType(cardType: CardType): void {
    this.cardType = cardType;
  }

  /**
   * Set referral code for tracking
   */
  setReferralCode(referralCode: string): void {
    this.referralCode = referralCode;
  }

  /**
   * Track a share event
   */
  private track(data: Omit<ShareTrackingData, 'timestamp'>): void {
    if (this.trackingCallback) {
      this.trackingCallback({
        ...data,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Share using Web Share API
   */
  async shareWithWebAPI(content: ShareContent): Promise<ShareResult> {
    if (!isWebShareAvailable()) {
      return {
        success: false,
        platform: 'copy',
        error: 'Web Share API not available',
      };
    }

    try {
      const shareData: ShareData = {
        text: content.text,
        url: content.url,
      };

      // Add file if supported
      if (content.image && isWebShareFilesAvailable()) {
        const file = new File([content.image.blob], 'diboas-share.png', {
          type: 'image/png',
        });

        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);

      this.track({
        platform: 'copy', // Generic for Web Share API
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'copy',
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          platform: 'copy',
          cancelled: true,
        };
      }

      return {
        success: false,
        platform: 'copy',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Share to Twitter/X
   */
  shareToTwitter(content: ShareContent): ShareResult {
    const url = buildShareUrl(
      'twitter',
      {
        ...content,
        hashtags: content.hashtags || (getHashtags(this.locale, false) as string[]),
      },
      this.cardType,
      this.referralCode
    );

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');

      this.track({
        platform: 'twitter',
        cardType: this.cardType,
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'twitter',
      };
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
  shareToWhatsApp(content: ShareContent): ShareResult {
    // Get URL with UTM parameters
    const shareUrl = content.url || getShareUrl(this.cardType, 'whatsapp', this.referralCode);

    // Truncate text for WhatsApp limits
    const truncatedText = truncateForPlatform(content.text, 'whatsapp');

    // Combine text and URL for WhatsApp
    const fullText = `${truncatedText}\n\n${shareUrl}`;

    const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');

    this.track({
      platform: 'whatsapp',
      cardType: this.cardType,
      locale: this.locale,
    });

    return {
      success: true,
      platform: 'whatsapp',
    };
  }

  /**
   * Share to Facebook
   */
  shareToFacebook(content: ShareContent): ShareResult {
    const url = buildShareUrl('facebook', content, this.cardType, this.referralCode);

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');

      this.track({
        platform: 'facebook',
        cardType: this.cardType,
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'facebook',
      };
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
  shareToLinkedIn(content: ShareContent): ShareResult {
    const url = buildShareUrl('linkedin', content, this.cardType, this.referralCode);

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');

      this.track({
        platform: 'linkedin',
        cardType: this.cardType,
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'linkedin',
      };
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
  shareToTelegram(content: ShareContent): ShareResult {
    const url = buildShareUrl('telegram', content, this.cardType, this.referralCode);

    if (url) {
      window.open(url, '_blank');

      this.track({
        platform: 'telegram',
        cardType: this.cardType,
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'telegram',
      };
    }

    return {
      success: false,
      platform: 'telegram',
      error: 'Failed to build share URL',
    };
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(content: ShareContent): Promise<ShareResult> {
    try {
      const textToCopy = content.url || content.text;
      await navigator.clipboard.writeText(textToCopy);

      this.track({
        platform: 'copy',
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'copy',
      };
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content.url || content.text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        this.track({
          platform: 'copy',
          locale: this.locale,
        });

        return {
          success: true,
          platform: 'copy',
        };
      } catch (fallbackError) {
        return {
          success: false,
          platform: 'copy',
          error: 'Failed to copy to clipboard',
        };
      }
    }
  }

  /**
   * Download image
   */
  async downloadImage(card: RenderedCard, filename?: string): Promise<ShareResult> {
    try {
      const name = filename || `diboas-${card.type}-${Date.now()}.png`;

      // Create download link
      const link = document.createElement('a');
      link.href = card.dataUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.track({
        platform: 'download',
        cardType: card.type,
        locale: this.locale,
      });

      return {
        success: true,
        platform: 'download',
      };
    } catch (error) {
      return {
        success: false,
        platform: 'download',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Share to a specific platform
   */
  async share(
    platform: SharePlatform,
    content: ShareContent
  ): Promise<ShareResult> {
    switch (platform) {
      case 'twitter':
        return this.shareToTwitter(content);
      case 'whatsapp':
        return this.shareToWhatsApp(content);
      case 'facebook':
        return this.shareToFacebook(content);
      case 'linkedin':
        return this.shareToLinkedIn(content);
      case 'telegram':
        return this.shareToTelegram(content);
      case 'copy':
        return this.copyToClipboard(content);
      case 'download':
        if (content.image) {
          return this.downloadImage(content.image);
        }
        return {
          success: false,
          platform: 'download',
          error: 'No image provided for download',
        };
      case 'instagram':
        // Instagram requires native share or download
        if (content.image) {
          return this.downloadImage(content.image, 'diboas-instagram.png');
        }
        return this.shareWithWebAPI(content);
      default:
        return {
          success: false,
          platform,
          error: `Unknown platform: ${platform}`,
        };
    }
  }

  /**
   * Set locale
   */
  setLocale(locale: CardLocale): void {
    this.locale = locale;
  }

  /**
   * Set tracking callback
   */
  setTrackingCallback(callback: (data: ShareTrackingData) => void): void {
    this.trackingCallback = callback;
  }
}

/**
 * Create a share manager with analytics tracking
 */
export function createShareManager(
  locale: CardLocale,
  analyticsTrack?: (event: string, params: Record<string, unknown>) => void
): ShareManager {
  const trackingCallback = analyticsTrack
    ? (data: ShareTrackingData) => {
        analyticsTrack(SHARE_EVENTS.SHARE_COMPLETED, {
          platform: data.platform,
          cardType: data.cardType,
          locale: data.locale,
          timestamp: data.timestamp,
        });
      }
    : undefined;

  return new ShareManager(locale, trackingCallback);
}

/**
 * Default share manager instance
 */
export const shareManager = new ShareManager();
