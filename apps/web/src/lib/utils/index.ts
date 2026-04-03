/**
 * Utils Module - Public API
 */

// Financial math
export { futureValue, apyToMonthlyRate } from './financialMath';

// Fetch with retry
export { fetchWithRetry } from './fetchWithRetry';

// Sanitization
export { sanitizeText, sanitizeEmail, sanitizeUserName } from './sanitize';

// Race condition prevention (re-export from modular directory)
export * from './RaceConditionPrevention';

// Circuit breaker
export { CircuitBreaker, CircuitBreakerState, CircuitBreakerError } from './CircuitBreaker';
export type { CircuitBreakerOptions } from './CircuitBreaker';

// Marketing page builder
export { buildMarketingMetadata, prepareMarketingPage } from './marketingPageBuilder';
export type {
  MarketingPageConfig,
  MarketingPageData,
  BreadcrumbEntry,
  ServiceDataConfig,
} from './marketingPageBuilder';
