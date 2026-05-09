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

import { useState, useEffect, useId, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import { useLocale } from '@/components/Providers';
import {
  syncConsentToApi,
  checkConsentFromApiOnce,
  saveConsentToStorage,
  createConsentValue,
  dispatchConsentEvent,
  getStoredConsent,
  getConsentFromShadowCookie,
  isConsentVersionCurrent,
} from './consentUtils';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import styles from './CookieConsent.module.css';

// Re-export utilities for external use
export { hasAnalyticsConsent, getConsent, type CookieConsentValue } from './consentUtils';

export function CookieConsent() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const descriptionId = useId();
  const [showBanner, setShowBanner] = useState(() => {
    // Synchronous check: if consent already given with current version, skip banner entirely (prevents CLS)
    const stored = getStoredConsent();
    if (stored && isConsentVersionCurrent(stored)) {
      return false;
    }
    return false;
  });
  const [isVisible, setIsVisible] = useState(false);
  const closeBannerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let mounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function checkConsent() {
      // 1. Check localStorage (fastest, synchronous)
      const stored = getStoredConsent();
      if (stored) {
        if (!isConsentVersionCurrent(stored)) {
          if (!mounted) return;
          setShowBanner(true);
          timers.push(setTimeout(() => { if (mounted) setIsVisible(true); }, 100));
        }
        return;
      }

      // 2. Check shadow cookie (synchronous, no API call — P9 Performance)
      const shadowConsent = getConsentFromShadowCookie();
      if (shadowConsent) {
        const localConsent = createConsentValue(shadowConsent.analytics);
        saveConsentToStorage(localConsent);
        return;
      }

      // 3. Fallback: Check API (migration period — users without shadow cookie)
      const apiConsent = await checkConsentFromApiOnce();
      if (!mounted) return;

      if (apiConsent) {
        const localConsent = createConsentValue(apiConsent.analytics);
        saveConsentToStorage(localConsent);
        return;
      }

      // 4. No consent found — show banner after delay
      timers.push(setTimeout(() => {
        if (!mounted) return;
        setShowBanner(true);
        timers.push(setTimeout(() => { if (mounted) setIsVisible(true); }, 100));
      }, 1500));
    }

    checkConsent();

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
      clearTimeout(closeBannerTimerRef.current);
    };
  }, []);

  const handleAccept = async () => {
    const consent = createConsentValue(true);
    saveConsentToStorage(consent);

    // Emit consent given event (local fallback - API also emits on success)
    applicationEventBus.emit(ApplicationEventType.CONSENT_GIVEN, {
      domain: 'consent',
      source: 'consent',
      // Date.now() runs in handleAccept (an event handler), not during render.
      // React Compiler flags it conservatively because the handler is recreated
      // on every render; the call itself is deferred until user interaction.
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
      consentType: 'analytics',
      newState: true,
      metadata: {
        method: 'banner_accept',
        version: consent.version,
      },
    });

    syncConsentToApi(true);
    dispatchConsentEvent(consent);
    closeBanner();
  };

  const handleDecline = async () => {
    const consent = createConsentValue(false);
    saveConsentToStorage(consent);

    // Emit consent withdrawn event (local fallback - API also emits on success)
    applicationEventBus.emit(ApplicationEventType.CONSENT_WITHDRAWN, {
      domain: 'consent',
      source: 'consent',
      // Date.now() runs in handleDecline (event handler), not during render.
      // Same pattern as handleAccept above.
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
      consentType: 'analytics',
      newState: false,
      metadata: {
        method: 'banner_decline',
        version: consent.version,
      },
    });

    syncConsentToApi(false);
    dispatchConsentEvent(consent);
    closeBanner();
  };

  const closeBanner = () => {
    setIsVisible(false);
    clearTimeout(closeBannerTimerRef.current);
    closeBannerTimerRef.current = setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      className={`${styles.banner} ${isVisible ? styles.visible : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label={intl.formatMessage({ id: 'common.cookieConsent.ariaLabel' })}
      aria-describedby={descriptionId}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <p id={descriptionId} className={styles.text}>
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
