'use client';

/**
 * Cookie Consent Banner
 * GDPR Compliance: Implements cookie consent for analytics and tracking
 *
 * Features:
 * - Stores consent in localStorage
 * - Provides accept/decline options
 * - Accessible with keyboard navigation
 * - Customizable styling using design tokens
 */

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.css';

const CONSENT_KEY = 'diboas-cookie-consent';
const CONSENT_VERSION = '1.0';

export interface CookieConsentValue {
  analytics: boolean;
  version: string;
  timestamp: number;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const stored = localStorage.getItem(CONSENT_KEY);

    if (!stored) {
      // Delay showing banner for better UX
      setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 100); // Trigger slide-up animation
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
  }, []);

  const handleAccept = () => {
    const consent: CookieConsentValue = {
      analytics: true,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Dispatch event for WebVitalsTracker to start tracking
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: consent
    }));

    closeBanner();
  };

  const handleDecline = () => {
    const consent: CookieConsentValue = {
      analytics: false,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

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
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-description"
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <p id="cookie-consent-description" className={styles.text}>
            We use cookies to improve your experience and analyze site usage.
            By clicking "Accept", you consent to our use of analytics cookies.
            <a
              href="/legal/cookies/"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cookie Policy
            </a>
            {' · '}
            <a
              href="/legal/privacy/"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDecline}
            className={`${styles.button} ${styles.buttonDecline}`}
            aria-label="Decline cookies"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className={`${styles.button} ${styles.buttonAccept}`}
            aria-label="Accept cookies"
          >
            Accept
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
