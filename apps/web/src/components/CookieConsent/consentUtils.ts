/**
 * Cookie Consent Utilities
 *
 * Helper functions for managing cookie consent
 */

import { COOKIE_CONFIG } from '@/config/env';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import { Logger } from '@/lib/monitoring/Logger';

const CONSENT_KEY = COOKIE_CONFIG.consentLocalStorageKey;
const CONSENT_VERSION = COOKIE_CONFIG.consentVersion;
const CONSENT_COOKIE_NAME = COOKIE_CONFIG.consentCookieName;

export interface CookieConsentValue {
  analytics: boolean;
  version: string;
  timestamp: number;
}

/**
 * Sync consent to HttpOnly cookie via API
 * This provides XSS protection as the cookie cannot be read by JavaScript
 */
export async function syncConsentToApi(analytics: boolean): Promise<boolean> {
  try {
    const response = await fetchWithRetry('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics }),
    });
    return response.ok;
  } catch (error) {
    // Emit error event for monitoring (API handles success events)
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'consent',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error('Consent sync failed'),
      severity: 'medium',
      context: {
        operation: 'consent_sync',
        analytics,
      },
    });
    return false;
  }
}

/**
 * Read consent from the non-HttpOnly shadow cookie.
 * P9 Performance: synchronous read, no API call needed.
 * Returns null if shadow cookie doesn't exist (migration: user set consent before shadow cookie was added).
 */
export function getConsentFromShadowCookie(): { analytics: boolean; version: string } | null {
  if (typeof document === 'undefined') return null;
  const name = `${CONSENT_COOKIE_NAME}_js=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name)) {
      try {
        return JSON.parse(decodeURIComponent(trimmed.substring(name.length)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Bot detection pattern — bots don't need consent checks */
const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram|googlebot|bingbot|yandex|baidu|duckduck/i;

/** Module-level cache — prevents duplicate API calls during same page session (P11 Concurrency) */
let _consentCheckPromise: Promise<{ analytics: boolean; version: string } | null> | null = null;

/**
 * Deduplicated wrapper for checkConsentFromApi.
 * P11 Concurrency: prevents duplicate calls on React Strict Mode double-mount.
 */
export function checkConsentFromApiOnce(): Promise<{ analytics: boolean; version: string } | null> {
  if (!_consentCheckPromise) {
    _consentCheckPromise = checkConsentFromApi();
  }
  return _consentCheckPromise;
}

/**
 * Check consent from HttpOnly cookie API
 */
export async function checkConsentFromApi(): Promise<{ analytics: boolean; version: string } | null> {
  // Skip API call for bots — they don't need consent checks
  if (typeof navigator !== 'undefined' && BOT_PATTERN.test(navigator.userAgent)) {
    return null;
  }

  try {
    const response = await fetchWithRetry('/api/consent');
    if (!response.ok) return null;

    const data = await response.json();
    return data.consent || null;
  } catch (error) {
    // Emit error event for monitoring (low severity - read-only check)
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'consent',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error('Consent check failed'),
      severity: 'low',
      context: {
        operation: 'consent_check',
      },
    });
    return null;
  }
}

/**
 * Save consent to localStorage
 */
export function saveConsentToStorage(consent: CookieConsentValue): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

/**
 * Create consent value object
 */
export function createConsentValue(analytics: boolean): CookieConsentValue {
  return {
    analytics,
    version: CONSENT_VERSION,
    timestamp: Date.now()
  };
}

/**
 * Dispatch consent changed DOM event.
 *
 * This fires a DOM CustomEvent solely for the GA4 inline script in
 * layout.tsx, which runs before React hydrates and cannot use the
 * ApplicationEventBus. React consumers should subscribe to
 * CONSENT_GIVEN / CONSENT_WITHDRAWN via applicationEventBus instead.
 */
export function dispatchConsentEvent(consent: CookieConsentValue): void {
  if (typeof window === 'undefined') return;

  // DOM fallback for GA4 inline script (pre-hydration)
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
    detail: consent
  }));

  // Emit on ApplicationEventBus for React consumers
  applicationEventBus.emit(
    consent.analytics
      ? ApplicationEventType.CONSENT_GIVEN
      : ApplicationEventType.CONSENT_WITHDRAWN,
    {
      source: 'consent',
      timestamp: Date.now(),
      consentType: 'analytics',
      newState: consent.analytics,
      metadata: { trigger: 'cookie_consent_banner' },
    }
  );
}

/**
 * Helper function to check if analytics consent is given
 * Used by WebVitalsTracker and other analytics components
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;

    const consent = JSON.parse(stored) as CookieConsentValue;
    return consent.analytics && consent.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

/**
 * Helper function to get consent value
 */
export function getConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as CookieConsentValue;
  } catch {
    return null;
  }
}

/**
 * Get stored consent from localStorage
 */
export function getStoredConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsentValue;
  } catch {
    return null;
  }
}

/**
 * Check if consent version is current
 */
export function isConsentVersionCurrent(consent: CookieConsentValue): boolean {
  return consent.version === CONSENT_VERSION;
}

/**
 * Register consent withdrawal handler to clear analytics logs.
 * Should be called once at app bootstrap.
 */
export function registerConsentWithdrawalHandler(): () => void {
  return applicationEventBus.on(
    ApplicationEventType.CONSENT_WITHDRAWN,
    () => {
      Logger.clearLogs();
    }
  );
}
