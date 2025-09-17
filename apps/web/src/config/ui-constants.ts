/**
 * UI Constants Configuration
 * Configuration Management: Centralized UI-related constants
 * Code Reusability: Single source of truth for UI magic numbers and timeouts
 * Semantic Naming: Clear, descriptive constant names
 */

/**
 * Essential UI Layout constants - only what's actually used
 */
export const UI_LAYOUT_CONSTANTS = {
  // Base CSS classes - used in root layout
  BODY_BASE_CLASS: process.env.NEXT_PUBLIC_BODY_BASE_CLASS || 'main-body-antialiased',
  
  // HTML attributes - used for i18n
  DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  
  // Metadata template - used for consistent titles
  TITLE_TEMPLATE: process.env.NEXT_PUBLIC_TITLE_TEMPLATE || '%s'
} as const;

/**
 * Animation and transition timeouts
 */
export const UI_ANIMATION_CONSTANTS = {
  // Mobile navigation animation
  MOBILE_NAV_CLOSE_DELAY: 50, // ms - delay before closing mobile navigation
  
  // Modal and overlay transitions
  MODAL_FADE_IN: 150, // ms
  MODAL_FADE_OUT: 100, // ms
  
  // Dropdown animations
  DROPDOWN_OPEN_DELAY: 100, // ms
  DROPDOWN_CLOSE_DELAY: 200, // ms
  
  // Toast notifications
  TOAST_DISPLAY_DURATION: 5000, // ms
  TOAST_FADE_DURATION: 300, // ms
  
  // Form feedback
  FORM_SUBMIT_FEEDBACK_DELAY: 1000, // ms
  
  // Scroll behavior
  SMOOTH_SCROLL_DURATION: 300, // ms
  SCROLL_TO_TOP_THRESHOLD: 100, // px
} as const;

/**
 * Retry and error handling constants
 */
export const UI_ERROR_CONSTANTS = {
  // Error boundary retry
  ERROR_BOUNDARY_MAX_RETRIES: 3,
  ERROR_BOUNDARY_RETRY_DELAY: 1000, // ms - base delay
  ERROR_BOUNDARY_MAX_DELAY: 10000, // ms - max delay with exponential backoff
  
  // Form validation
  VALIDATION_DEBOUNCE_DELAY: 300, // ms
  
  // Network timeouts
  DEFAULT_FETCH_TIMEOUT: 10000, // ms
  CRITICAL_FETCH_TIMEOUT: 30000, // ms
} as const;

/**
 * UI Text Constants - These should eventually move to i18n
 * Temporary centralization until full i18n implementation
 */
export const UI_TEXT_CONSTANTS = {
  // Error messages
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NAVIGATION_ERROR: 'Navigation temporarily unavailable',
  LOADING_ERROR: 'Failed to load content',
  
  // Button labels
  TRY_AGAIN: 'Try Again',
  RETRY: 'Retry',
  BACK_TO_SAFETY: 'Back to safety',
  CLOSE: 'Close',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  
  // Loading states
  LOADING: 'Loading...',
  PLEASE_WAIT: 'Please wait...',
  PROCESSING: 'Processing...',
  
  // Accessibility labels
  TOGGLE_MENU: 'Toggle menu',
  CLOSE_MENU: 'Close menu',
  CHANGE_LANGUAGE: 'Change language',
  RETRY_LOADING: 'Retry loading',
  NAVIGATE_BACK: 'Navigate back',
  
  // Status messages
  SUCCESS: 'Success!',
  WARNING: 'Warning',
  INFO: 'Information',
  
  // Navigation
  BACK: 'Back',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  
  // Form messages
  FIELD_REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
} as const;

/**
 * Console logging messages
 */
export const LOG_MESSAGES = {
  // Analytics
  ANALYTICS_EVENT_TRACKED: 'Analytics event tracked:',
  ANALYTICS_FLUSH: 'Flushing analytics events:',
  ANALYTICS_FLUSH_ERROR: 'Failed to flush analytics events:',
  ANALYTICS_MAX_RETRIES: 'Analytics: Max retries reached for event:',
  ANALYTICS_ERROR: 'Analytics Error:',
  ANALYTICS_TRACKING_FAILED: 'Analytics tracking failed:',
  
  // Web Vitals
  WEB_VITALS_LOAD_ERROR: 'Failed to load web-vitals library:',
  
  // Monitoring
  CRITICAL_ERROR_TRACKED: 'Critical error tracked:',
  SECURITY_EVENT_TRACKED: 'Security event tracked:',
  MONITORING_FLUSH_ERROR: 'Failed to flush monitoring events:',
  
  // Content
  INVALID_CONTENT_STRUCTURE: 'Invalid content structure for page:',
  CONTENT_LOAD_ERROR: 'Failed to load page content:',
  SECTION_CONTENT_LOAD_ERROR: 'Failed to load section content:',
  CONTENT_UPDATE_REQUEST: 'Content update requested:',
  
  // Security
  BLOCKED_SUSPICIOUS_REQUEST: 'Blocked suspicious request:',
  BLOCKED_LARGE_PARAMETER: 'Blocked request with large parameter:',
  
  // Navigation
  NAVIGATION_ERROR_CAUGHT: 'Navigation Error Boundary caught error:',
  NAVIGATION_ERROR_HANDLER_FAILED: 'Navigation error handler failed:',
  NAVIGATION_MAX_RETRY: 'Navigation: Maximum retry attempts reached',
  
  // Environment
  ENV_VAR_INVALID: 'Invalid value for environment variable',
  ENV_VAR_MISSING: 'Required environment variable is not set',
  ENV_WARNING: 'Environment configuration warning:',
} as const;

/**
 * Helper function to format retry message
 */
export function formatRetryMessage(current: number, max: number): string {
  return `Retry (${current}/${max})`;
}

/**
 * Helper function to format error ID in development
 */
export function formatErrorId(errorId: string, showFull: boolean = false): string {
  return showFull ? errorId : `ID: ${errorId.slice(0, 8)}`;
}

// Export all constants for convenience
export const UI_CONSTANTS = {
  LAYOUT: UI_LAYOUT_CONSTANTS,
  ANIMATION: UI_ANIMATION_CONSTANTS,
  ERROR: UI_ERROR_CONSTANTS,
  TEXT: UI_TEXT_CONSTANTS,
  LOG: LOG_MESSAGES,
} as const;

// Type exports
export type UILayoutConstants = typeof UI_LAYOUT_CONSTANTS;
export type UIAnimationConstants = typeof UI_ANIMATION_CONSTANTS;
export type UIErrorConstants = typeof UI_ERROR_CONSTANTS;
export type UITextConstants = typeof UI_TEXT_CONSTANTS;
export type LogMessages = typeof LOG_MESSAGES;