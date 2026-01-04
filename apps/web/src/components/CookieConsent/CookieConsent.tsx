'use client';

/**
 * Cookie Consent Banner
 * GDPR Compliance: Implements cookie consent for analytics and tracking
 *
 * Features:
 * - Stores consent via HttpOnly cookie API (secure, XSS-protected)
 * - Falls back to localStorage for SSR hydration
 * - Provides accept/decline options
 * - Accessible with keyboard navigation
 * - Customizable styling using design tokens
 * - Internationalized with react-intl
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import { useLocale } from '@/components/Providers';
import styles from './CookieConsent.module.css';

const CONSENT_KEY = 'diboas-cookie-consent';
const CONSENT_VERSION = '1.0';

/**
 * Sync consent to HttpOnly cookie via API
 * This provides XSS protection as the cookie cannot be read by JavaScript
 */
async function syncConsentToApi(analytics: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics }),
    });
    return response.ok;
  } catch (error) {
    console.warn('[CookieConsent] Failed to sync consent to API:', error);
    return false;
  }
}

/**
 * Check consent from HttpOnly cookie API
 */
async function checkConsentFromApi(): Promise<{ analytics: boolean; version: string } | null> {
  try {
    const response = await fetch('/api/consent');
    if (!response.ok) return null;

    const data = await response.json();
    return data.consent || null;
  } catch {
    return null;
  }
}

export interface CookieConsentValue {
  analytics: boolean;
  version: string;
  timestamp: number;
}

export function CookieConsent() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function checkConsent() {
      // First check localStorage for immediate hydration
      const stored = localStorage.getItem(CONSENT_KEY);

      if (!stored) {
        // No localStorage, check HttpOnly cookie via API
        const apiConsent = await checkConsentFromApi();

        if (apiConsent) {
          // Sync API consent to localStorage for future hydration
          const localConsent: CookieConsentValue = {
            analytics: apiConsent.analytics,
            version: apiConsent.version,
            timestamp: Date.now(),
          };
          localStorage.setItem(CONSENT_KEY, JSON.stringify(localConsent));
          return; // Consent exists, don't show banner
        }

        // No consent anywhere - show banner
        setTimeout(() => {
          setShowBanner(true);
          setTimeout(() => setIsVisible(true), 100);
        }, 1500);
      } else {
        // Validate stored consent version
        try {
          const consent = JSON.parse(stored) as CookieConsentValue;
          if (consent.version !== CONSENT_VERSION) {
            // Version mismatch - request new consent
            setShowBanner(true);
            setTimeout(() => setIsVisible(true), 100);
          }
        } catch {
          // Invalid stored data - request new consent
          setShowBanner(true);
          setTimeout(() => setIsVisible(true), 100);
        }
      }
    }

    checkConsent();
  }, []);

  const handleAccept = async () => {
    const consent: CookieConsentValue = {
      analytics: true,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    };

    // Store in localStorage for immediate use
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Sync to HttpOnly cookie via API (async, don't block UI)
    syncConsentToApi(true);

    // Dispatch event for WebVitalsTracker to start tracking
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: consent
    }));

    closeBanner();
  };

  const handleDecline = async () => {
    const consent: CookieConsentValue = {
      analytics: false,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    };

    // Store in localStorage for immediate use
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Sync to HttpOnly cookie via API (async, don't block UI)
    syncConsentToApi(false);

    // Dispatch event for WebVitalsTracker to stop tracking
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: consent
    }));

    closeBanner();
  };

  const closeBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300); // Wait for animation
  };

  if (!showBanner) return null;

  return (
    <div
      className={`${styles.banner} ${isVisible ? styles.visible : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label={intl.formatMessage({ id: 'common.cookieConsent.ariaLabel' })}
      aria-describedby="cookie-consent-description"
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <p id="cookie-consent-description" className={styles.text}>
            {intl.formatMessage({ id: 'common.cookieConsent.message' })}
            {' '}
            <Link
              href={`/${locale}/legal/cookies`}
              className={styles.link}
            >
              {intl.formatMessage({ id: 'common.cookieConsent.cookiePolicy' })}
            </Link>
            {' · '}
            <Link
              href={`/${locale}/legal/privacy`}
              className={styles.link}
            >
              {intl.formatMessage({ id: 'common.cookieConsent.privacyPolicy' })}
            </Link>
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDecline}
            className={`${styles.button} ${styles.buttonDecline}`}
            aria-label={intl.formatMessage({ id: 'common.cookieConsent.declineAriaLabel' })}
          >
            {intl.formatMessage({ id: 'common.cookieConsent.decline' })}
          </button>
          <button
            onClick={handleAccept}
            className={`${styles.button} ${styles.buttonAccept}`}
            aria-label={intl.formatMessage({ id: 'common.cookieConsent.acceptAriaLabel' })}
          >
            {intl.formatMessage({ id: 'common.cookieConsent.accept' })}
          </button>
        </div>
      </div>
    </div>
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
