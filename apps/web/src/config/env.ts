/**
 * Environment Configuration
 *
 * Centralized environment variable access with proper defaults.
 * All hardcoded values that should be configurable are defined here.
 *
 * Usage:
 * ```ts
 * import { ENV } from '@/config/env';
 * console.log(ENV.APP_URL);
 * ```
 */

// =============================================================================
// STARTUP VALIDATION
// =============================================================================

/**
 * Validate that critical security environment variables are set in production.
 * Logs a critical warning at startup. Skipped during `next build` (NEXT_PHASE).
 */
function validateProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;
  // Skip during build phase — secrets are only needed at runtime
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const required = [
    'ENCRYPTION_KEY',
    'DATABASE_URL',
    'INTERNAL_API_KEY',
  ] as const;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`
    );
  }
}

validateProductionSecrets();

// =============================================================================
// APPLICATION
// =============================================================================

/**
 * Base application URL
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://diboas.com';

/**
 * Base domain (without protocol)
 */
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'diboas.com';

/**
 * Is production environment
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Is development environment
 */
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Business sub-application URL
 */
export const BUSINESS_URL = process.env.NEXT_PUBLIC_BUSINESS_URL || (IS_PRODUCTION ? 'https://business.diboas.com' : 'http://localhost:3002');

/**
 * Learn sub-application URL
 */
export const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || (IS_PRODUCTION ? 'https://learn.diboas.com' : 'http://localhost:3003');

/**
 * Monitoring endpoint URL
 */
export const MONITORING_ENDPOINT = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT || '';

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * Additional allowed origins for CSRF validation (comma-separated)
 * Example: "https://staging.diboas.com,https://preview.diboas.com"
 */
export const CSRF_ADDITIONAL_ORIGINS = process.env.CSRF_ADDITIONAL_ORIGINS || '';

/**
 * Get all allowed CSRF origins
 */
export function getCsrfAllowedOrigins(): string[] {
  const baseOrigins = [
    APP_URL,
    `https://${APP_DOMAIN}`,
    `https://www.${APP_DOMAIN}`,
  ];

  // Add additional origins from environment
  const additionalOrigins = CSRF_ADDITIONAL_ORIGINS
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  // Add development origins
  const devOrigins = IS_DEVELOPMENT
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
      ]
    : [];

  return [...new Set([...baseOrigins, ...additionalOrigins, ...devOrigins])];
}

// =============================================================================
// COOKIE & STORAGE CONFIGURATION
// =============================================================================

/**
 * Prefix for all storage keys (localStorage, cookies)
 */
export const STORAGE_PREFIX = process.env.NEXT_PUBLIC_STORAGE_PREFIX || 'diboas';

/**
 * Cookie consent configuration
 */
export const COOKIE_CONFIG = {
  /** Consent cookie name */
  consentCookieName: process.env.COOKIE_CONSENT_NAME || `${STORAGE_PREFIX}-consent`,
  /** Consent version (bump to re-request consent) */
  consentVersion: process.env.COOKIE_CONSENT_VERSION || '1.0',
  /** Consent localStorage key (for SSR hydration) */
  consentLocalStorageKey: process.env.COOKIE_CONSENT_LS_KEY || `${STORAGE_PREFIX}-cookie-consent`,
  /** Cookie max age in seconds (default: 1 year) */
  maxAge: parseInt(process.env.COOKIE_MAX_AGE || '31536000', 10),
} as const;

/**
 * Waitlist storage keys
 */
export const WAITLIST_STORAGE_KEYS = {
  /** Main waitlist data key */
  main: process.env.WAITLIST_STORAGE_KEY || `${STORAGE_PREFIX}_waiting_list`,
  /** Email storage key */
  email: `${STORAGE_PREFIX}_waitlist_email`,
  /** Position storage key */
  position: `${STORAGE_PREFIX}_waitlist_position`,
  /** Referral code storage key */
  referralCode: `${STORAGE_PREFIX}_waitlist_referral_code`,
  /** Referral count storage key */
  referralCount: `${STORAGE_PREFIX}_waitlist_referral_count`,
} as const;

/**
 * Referral cookie configuration
 */
export const REFERRAL_COOKIE_CONFIG = {
  /** Cookie name for referral tracking */
  name: process.env.REFERRAL_COOKIE_NAME || `${STORAGE_PREFIX}_ref`,
  /** Cookie expiry in days */
  expiryDays: parseInt(process.env.REFERRAL_COOKIE_EXPIRY_DAYS || '30', 10),
  /** Referral code prefix */
  codePrefix: process.env.REFERRAL_CODE_PREFIX || 'REF',
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Redis key prefix */
  prefix: process.env.RATE_LIMIT_PREFIX || `${STORAGE_PREFIX}-ratelimit`,

  /** Strict preset: for sensitive endpoints like signup */
  strict: {
    limit: parseInt(process.env.RATE_LIMIT_STRICT_LIMIT || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS || '60000', 10),
  },

  /** Standard preset: for general API endpoints */
  standard: {
    limit: parseInt(process.env.RATE_LIMIT_STANDARD_LIMIT || '30', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_STANDARD_WINDOW_MS || '60000', 10),
  },

  /** Lenient preset: for read-only endpoints */
  lenient: {
    limit: parseInt(process.env.RATE_LIMIT_LENIENT_LIMIT || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_LENIENT_WINDOW_MS || '60000', 10),
  },
} as const;

// =============================================================================
// EXTERNAL SERVICES
// =============================================================================

/**
 * Cal.com configuration
 */
export const CAL_CONFIG = {
  /** Cal.com embed script URL */
  embedScript: process.env.NEXT_PUBLIC_CAL_EMBED_SCRIPT || 'https://app.cal.com/embed/embed.js',
  /** Cal.com origin for initialization */
  origin: process.env.NEXT_PUBLIC_CAL_ORIGIN || 'https://app.cal.com',
  /** Default calendar link */
  defaultLink: process.env.NEXT_PUBLIC_CAL_LINK || '',
  /** B2B treasury conversation link */
  treasuryLink: process.env.NEXT_PUBLIC_CAL_TREASURY_LINK || 'diboas/treasury-conversation',
} as const;

/**
 * Email service configuration (Resend)
 */
export const EMAIL_CONFIG = {
  /** Resend API key */
  apiKey: process.env.RESEND_API_KEY || '',
  /** Verified sender address */
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'diBoaS <noreply@diboas.com>',
  /** Reply-to address */
  replyTo: process.env.EMAIL_REPLY_TO || 'support@diboas.com',
} as const;

/**
 * Database configuration
 */
export const DATABASE_CONFIG = {
  /** Neon PostgreSQL connection string */
  url: process.env.DATABASE_URL || '',
} as const;

/**
 * PostHog configuration
 */
export const POSTHOG_CONFIG = {
  /** API key */
  apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  /** Host URL */
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
} as const;

// =============================================================================
// CONSOLIDATED EXPORT
// =============================================================================

/**
 * Consolidated environment configuration object
 */
export const ENV = {
  // Application
  APP_URL,
  APP_DOMAIN,
  BUSINESS_URL,
  LEARN_URL,
  MONITORING_ENDPOINT,
  IS_PRODUCTION,
  IS_DEVELOPMENT,

  // CSRF
  CSRF_ADDITIONAL_ORIGINS,
  getCsrfAllowedOrigins,

  // Cookies & Storage
  STORAGE_PREFIX,
  COOKIE_CONFIG,
  WAITLIST_STORAGE_KEYS,
  REFERRAL_COOKIE_CONFIG,

  // Rate Limiting
  RATE_LIMIT_CONFIG,

  // External Services
  CAL_CONFIG,
  EMAIL_CONFIG,
  DATABASE_CONFIG,
  POSTHOG_CONFIG,
} as const;

export default ENV;
