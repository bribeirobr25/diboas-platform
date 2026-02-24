/**
 * Configuration - Public API
 *
 * Selective barrel exports for commonly used configs.
 * Import specific config files directly for page-specific configs.
 */

// Core configuration
export { ENV, APP_URL, IS_PRODUCTION, IS_DEVELOPMENT } from './env';
export { ROUTES } from './routes';
export { BRAND_CONFIG } from './brand';

// Formatting
export {
  formatCurrency,
  formatLocaleCurrency,
  formatLargeNumber,
  formatDisplayDate,
  getCurrencyForLocale,
  getIntlLocale,
  CURRENCY_CONFIG,
  DATE_FORMATS,
  NUMBER_FORMATS,
} from './formats';

// Navigation
export { navigationConfig } from './navigation';

// Monitoring
export { MONITORING_CONFIG } from './monitoring';

// Performance
export { WEB_VITALS_THRESHOLDS } from './performance-thresholds';

// Security
export { buildCSP, getAdditionalSecurityHeaders } from './security';
export type { CSPDirective, SecurityHeaders } from './security';
