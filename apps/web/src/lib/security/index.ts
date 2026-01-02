/**
 * Security Module
 *
 * Exports all security utilities for the application.
 */

// Encryption
export {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  isEncryptionEnabled,
  generateEncryptionKey,
} from './encryption';

// Rate Limiting
export {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  isRedisEnabled,
  RateLimitPresets,
  type RateLimitResult,
} from './rateLimiter';

// Authentication
export {
  validateApiKey,
  requireAuth,
  createUnauthorizedResponse,
  createForbiddenResponse,
  generateDeletionToken,
  hashToken,
  verifyToken,
  type AuthResult,
} from './authentication';

// Cookies
export {
  setConsentCookie,
  getConsentFromRequest,
  getConsentFromCookies,
  hasAnalyticsConsent,
  clearConsentCookie,
  CookieConfig,
  type ConsentValue,
} from './cookies';

// CSRF Protection
export {
  validateOrigin,
  csrfProtection,
} from './csrf';
