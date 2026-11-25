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
import { COOKIE_CONFIG } from '@/config/env';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { LucideIcon, Check } from '@/components/UI/LucideIcon';
import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import { useLocale } from '@/components/Providers';
import {
  syncConsentToApi,
  checkConsentFromApiOnce,
  saveConsentToStorage,
  createConsentValue,
  isStoredChoiceValid,
  restoreConsentValue,
  dispatchConsentEvent,
  getStoredConsent,
  getConsentFromShadowCookie,
  isConsentVersionCurrent,
  resolveBannerChoice,
  OPEN_COOKIE_SETTINGS_EVENT,
  type CookieConsentValue,
  type OpenCookieSettingsDetail,
} from './consentUtils';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
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
  // The first-visit timers, shared with the reopen path so "Cookie settings" cancels them.
  const firstVisitTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bannerRef = useRef<HTMLDivElement>(null);
  // Reopened from a "Cookie settings" control (W-D1, spec §3.8): the choice in force at that
  // moment, and the control focus returns to.
  const [reopened, setReopened] = useState(false);
  const [storedAtReopen, setStoredAtReopen] = useState<CookieConsentValue | null>(null);
  const returnToRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      returnToRef.current =
        (event as CustomEvent<OpenCookieSettingsDetail>).detail?.returnTo ?? null;
      clearTimeout(closeBannerTimerRef.current);
      // A reopen replaces the first-visit banner: its pending timers never fire after the choice.
      firstVisitTimersRef.current.forEach(clearTimeout);
      firstVisitTimersRef.current = [];
      setStoredAtReopen(getStoredConsent());
      setReopened(true);
      setShowBanner(true);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    let mounted = true;
    const timers = firstVisitTimersRef.current;

    /** An older accept is asked again; an older decline stands (W-D1, spec §3.9). */
    const askAgainUnlessValid = (consent: CookieConsentValue) => {
      if (isStoredChoiceValid(consent) || !mounted) return;
      setShowBanner(true);
      timers.push(
        setTimeout(() => {
          if (mounted) setIsVisible(true);
        }, 100)
      );
    };

    async function checkConsent() {
      // 1. Check localStorage (fastest, synchronous)
      const stored = getStoredConsent();
      if (stored) {
        askAgainUnlessValid(stored);
        return;
      }

      // 2. Check shadow cookie (synchronous, no API call — P9 Performance). The choice is copied
      //    back with the version it was given under, never re-stamped (CONSENT-RESTORE-1).
      const shadowConsent = getConsentFromShadowCookie();
      if (shadowConsent) {
        const localConsent = restoreConsentValue(shadowConsent);
        saveConsentToStorage(localConsent);
        askAgainUnlessValid(localConsent);
        return;
      }

      // 3. Fallback: Check API (migration period — users without shadow cookie)
      const apiConsent = await checkConsentFromApiOnce();
      // A choice made while the request was open (the reopened banner) is never overwritten.
      if (!mounted || getStoredConsent()) return;

      if (apiConsent) {
        const localConsent = restoreConsentValue(apiConsent);
        saveConsentToStorage(localConsent);
        askAgainUnlessValid(localConsent);
        return;
      }

      // 4. No consent found — show banner after delay
      timers.push(
        setTimeout(() => {
          if (!mounted || getStoredConsent()) return;
          setShowBanner(true);
          timers.push(
            setTimeout(() => {
              if (mounted) setIsVisible(true);
            }, 100)
          );
        }, 1500)
      );
    }

    checkConsent();

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
      clearTimeout(closeBannerTimerRef.current);
    };
  }, []);

  const choice = resolveBannerChoice(
    reopened ? storedAtReopen : null,
    COOKIE_CONFIG.consentVersion
  );

  const handleAccept = async () => {
    // Pressing the current current-version choice again only closes (nothing saved or sent).
    if (reopened && choice.pressOnlyCloses('accept')) {
      closeBanner();
      return;
    }
    const consent = createConsentValue(true);
    saveConsentToStorage(consent);

    // Emit consent given event (local fallback - API also emits on success)
    applicationEventBus.emit(ApplicationEventType.CONSENT_GIVEN, {
      domain: 'consent',
      source: 'consent',
      // Date.now() runs in the handler, at the press, never during render.
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
    if (reopened && choice.pressOnlyCloses('decline')) {
      closeBanner();
      return;
    }
    const consent = createConsentValue(false);
    saveConsentToStorage(consent);

    // Emit consent withdrawn event (local fallback - API also emits on success)
    applicationEventBus.emit(ApplicationEventType.CONSENT_WITHDRAWN, {
      domain: 'consent',
      source: 'consent',
      // Date.now() runs in the handler, at the press, never during render.
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

  function closeBanner() {
    setIsVisible(false);
    clearTimeout(closeBannerTimerRef.current);
    closeBannerTimerRef.current = setTimeout(() => {
      setShowBanner(false);
      setReopened(false);
    }, 300);
  }

  // Only the reopened banner traps focus: it starts on the dialog itself and returns to the control
  // that opened it (from its event; else the first "Cookie settings" control still on the page).
  // Escape closes it unchanged. The first-visit banner has no trap.
  useFocusTrap(bannerRef, reopened && isVisible, {
    focusContainer: true,
    onEscape: closeBanner,
    returnFocusTo: () => {
      const opener = returnToRef.current;
      if (opener?.isConnected) return opener;
      return document.querySelector<HTMLElement>('[data-cookie-settings]');
    },
  });

  if (!showBanner) return null;

  const currentMark = (button: 'accept' | 'decline') =>
    reopened && choice.current === button
      ? {
          'aria-current': 'true' as const,
          icon: <LucideIcon icon={Check} size="sm" className={styles.currentIcon} />,
        }
      : { 'aria-current': undefined, icon: null };
  const declineMark = currentMark('decline');
  const acceptMark = currentMark('accept');

  return (
    <div
      ref={bannerRef}
      className={`${styles.banner} ${isVisible ? styles.visible : ''} ${reopened ? styles.reopened : ''}`}
      role="dialog"
      aria-modal={reopened ? 'true' : undefined}
      // The first-visit banner announces itself; the reopened one is focused, so it is not
      // announced twice (W-D1).
      aria-live={reopened ? undefined : 'polite'}
      tabIndex={reopened ? -1 : undefined}
      aria-label={intl.formatMessage({ id: 'common.cookieConsent.ariaLabel' })}
      aria-describedby={descriptionId}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <p id={descriptionId} className={styles.text}>
            {intl.formatMessage({ id: 'common.cookieConsent.message' })}{' '}
            <Link href={`/${locale}/legal/cookies`} className={styles.link}>
              {intl.formatMessage({ id: 'common.cookieConsent.cookiePolicy' })}
            </Link>
            {' · '}
            <Link href={`/${locale}/legal/privacy`} className={styles.link}>
              {intl.formatMessage({ id: 'common.cookieConsent.privacyPolicy' })}
            </Link>
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDecline}
            className={`${styles.button} ${styles.buttonDecline}`}
            aria-label={intl.formatMessage({ id: 'common.cookieConsent.declineAriaLabel' })}
            aria-current={declineMark['aria-current']}
          >
            {declineMark.icon}
            {intl.formatMessage({ id: 'common.cookieConsent.decline' })}
          </button>
          <button
            onClick={handleAccept}
            className={`${styles.button} ${styles.buttonAccept}`}
            aria-label={intl.formatMessage({ id: 'common.cookieConsent.acceptAriaLabel' })}
            aria-current={acceptMark['aria-current']}
          >
            {acceptMark.icon}
            {intl.formatMessage({ id: 'common.cookieConsent.accept' })}
          </button>
        </div>
      </div>
    </div>
  );
}
