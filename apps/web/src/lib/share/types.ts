/**
 * Share Library - Types
 *
 * Types for viral sharing, card generation, and platform integrations
 */

/**
 * Supported share platforms
 */
export type SharePlatform =
  | 'instagram'
  | 'twitter'
  | 'whatsapp'
  | 'facebook'
  | 'linkedin'
  | 'telegram'
  | 'download'
  | 'copy';

/**
 * Card types for different sharing scenarios
 */
export type CardType = 'dream' | 'waitlist' | 'referral' | 'milestone';

/**
 * Timeframe options for dream cards
 */
export type DreamTimeframe = '1week' | '1month' | '1year' | '5years';

/**
 * Supported locales for cards
 */
export type CardLocale = 'en' | 'de' | 'pt-BR' | 'es';

/**
 * Base card configuration
 */
export interface CardConfig {
  /** Card dimensions */
  readonly width: number;
  readonly height: number;
  /** Background color or gradient */
  readonly background: string;
  /** Primary text color */
  readonly textColor: string;
  /** Accent color for highlights */
  readonly accentColor: string;
  /** Locale for text */
  readonly locale: CardLocale;
}

/**
 * Dream card specific data
 */
export interface DreamCardData {
  /** User's name (optional) */
  readonly name?: string;
  /** Initial investment amount */
  readonly initialAmount: number;
  /** Monthly contribution */
  readonly monthlyContribution: number;
  /** Projected growth amount (DeFi) */
  readonly growthAmount: number;
  /** Bank balance for comparison (optional - enables bank gap display) */
  readonly bankBalance?: number;
  /** Selected timeframe */
  readonly timeframe: DreamTimeframe;
  /** Currency code */
  readonly currency: string;
  /** Locale for formatting */
  readonly locale: CardLocale;
}

/**
 * Waitlist position card data
 */
export interface WaitlistCardData {
  /** User's position on waitlist */
  readonly position: number;
  /** User's referral code */
  readonly referralCode: string;
  /** Number of referrals */
  readonly referralCount: number;
  /** Locale for formatting */
  readonly locale: CardLocale;
}

/**
 * Referral success card data
 */
export interface ReferralCardData {
  /** Spots moved up */
  readonly spotsMoved: number;
  /** New position */
  readonly newPosition: number;
  /** Total referrals */
  readonly totalReferrals: number;
  /** Locale for formatting */
  readonly locale: CardLocale;
}

/**
 * Milestone card data
 */
export interface MilestoneCardData {
  /** Milestone type */
  readonly milestoneType: 'position' | 'referrals' | 'dream';
  /** Milestone value */
  readonly value: number;
  /** Milestone message */
  readonly message: string;
  /** Locale for formatting */
  readonly locale: CardLocale;
}

/**
 * Union type for all card data types
 */
export type CardData =
  | { type: 'dream'; data: DreamCardData }
  | { type: 'waitlist'; data: WaitlistCardData }
  | { type: 'referral'; data: ReferralCardData }
  | { type: 'milestone'; data: MilestoneCardData };

/**
 * Rendered card result
 */
export interface RenderedCard {
  /** Base64 encoded image data */
  readonly dataUrl: string;
  /** Image blob for download/upload */
  readonly blob: Blob;
  /** Card dimensions */
  readonly width: number;
  readonly height: number;
  /** Card type */
  readonly type: CardType;
}

/**
 * Share content for a platform
 */
export interface ShareContent {
  /** Text message to share */
  readonly text: string;
  /** URL to include */
  readonly url?: string;
  /** Hashtags (without #) */
  readonly hashtags?: string[];
  /** Card image (if applicable) */
  readonly image?: RenderedCard;
}

/**
 * Share result
 */
export interface ShareResult {
  /** Whether share was successful */
  readonly success: boolean;
  /** Platform that was used */
  readonly platform: SharePlatform;
  /** Error message if failed */
  readonly error?: string;
  /** Whether user cancelled */
  readonly cancelled?: boolean;
}

/**
 * Share tracking data
 */
export interface ShareTrackingData {
  /** Platform used */
  readonly platform: SharePlatform;
  /** Card type shared */
  readonly cardType?: CardType;
  /** User's referral code */
  readonly referralCode?: string;
  /** Locale */
  readonly locale: CardLocale;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  /** Platform name */
  readonly name: SharePlatform;
  /** Whether platform supports images */
  readonly supportsImage: boolean;
  /** Whether platform supports Web Share API */
  readonly supportsWebShare: boolean;
  /** URL template for sharing */
  readonly urlTemplate?: string;
  /** Maximum text length */
  readonly maxTextLength?: number;
  /** Recommended image dimensions */
  readonly imageDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Disclaimer text by region
 */
export interface RegionalDisclaimer {
  readonly default: string;
  readonly brazil: string;
  readonly germany: string;
  readonly spain: string;
}
