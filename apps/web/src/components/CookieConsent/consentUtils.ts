/**
 * Cookie Consent Utilities
 *
 * Helper functions for managing cookie consent
 */

import { COOKIE_CONFIG } from '@/config/env';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

const CONSENT_KEY = COOKIE_CONFIG.consentLocalStorageKey;
const CONSENT_VERSION = COOKIE_CONFIG.consentVersion;

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
    const response = await fetch('/api/consent', {
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
 * Check consent from HttpOnly cookie API
 */
export async function checkConsentFromApi(): Promise<{ analytics: boolean; version: string } | null> {
  try {
    const response = await fetch('/api/consent');
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
 * Dispatch consent changed event
 */
export function dispatchConsentEvent(consent: CookieConsentValue): void {
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
    detail: consent
  }));
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
