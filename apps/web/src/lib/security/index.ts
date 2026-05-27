/**
 * Security Module
 *
 * Exports all security utilities for the application.
 */

// Encryption
export {
  encrypt,
  decrypt,
  hmacHash,
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
  pingRedis,
  RateLimitPresets,
  type RateLimitResult,
  type IRateLimiter,
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
export { validateOrigin, csrfProtection } from './csrf';

// Idempotency
export { getIdempotentResponse, cacheIdempotentResponse } from './idempotency';

// Database-backed idempotency store
export {
  dbGetIdempotentResponse,
  dbCacheIdempotentResponse,
  dbCleanupIdempotencyCache,
} from './DatabaseIdempotencyStore';

// HTML Sanitization
export { sanitizeHtml, type SanitizeHtmlOptions } from './htmlSanitizer';

// URL Validation
export { isValidUrl, sanitizeUrl } from './urlValidator';
