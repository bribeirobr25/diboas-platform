'use client';

/**
 * Email Preferences Page
 *
 * Users arrive here from the unsubscribe link in email footers.
 * Reads id (emailHash) and token from URL (via `t` param or legacy id+token),
 * lets them unsubscribe or stay subscribed.
 *
 * After unsubscribe: shows message, auto-redirects to home after 3 seconds.
 * Re-subscribe is handled via the waitlist signup form (resets email_opted_out).
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { decodeUnsubToken } from '@/lib/email/unsubscribeToken';
import styles from './EmailPreferences.module.css';

type PageState = 'idle' | 'processing' | 'unsubscribed' | 'invalid' | 'error';

export default function EmailPreferencesPage() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const intl = useTranslation();

  // Decode params: try `t` param first (new), then legacy `id`+`token`
  const tParam = searchParams.get('t');
  const decoded = tParam ? decodeUnsubToken(tParam) : null;
  const id = decoded?.id ?? searchParams.get('id');
  const token = decoded?.token ?? searchParams.get('token');

  const [state, setState] = useState<PageState>(id && token ? 'idle' : 'invalid');

  const t = (key: string) => intl.formatMessage({ id: `common.emailPreferences.${key}` });

  const handleUnsubscribe = async () => {
    if (!id || !token) return;
    setState('processing');

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, action: 'unsubscribe' }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState('unsubscribed');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  const handleStaySubscribed = () => {
    analyticsService.track({
      name: 'email_stay_subscribed_clicked',
      parameters: { locale },
    });
    window.location.href = `/${locale}/?utm_source=email&utm_medium=transactional&utm_campaign=unsubscribe_page&utm_content=stay_subscribed`;
  };

  // Auto-redirect to home 3 seconds after unsubscribe
  useEffect(() => {
    if (state !== 'unsubscribed') return;
    const timer = setTimeout(() => {
      analyticsService.track({
        name: 'email_unsubscribed_redirect',
        parameters: { locale },
      });
      window.location.href = `/${locale}/?utm_source=email&utm_medium=transactional&utm_campaign=unsubscribe_page&utm_content=unsubscribed_redirect`;
    }, 3000);
    return () => clearTimeout(timer);
  }, [state, locale]);

  return (
    <div className={styles.container}>
      {state === 'idle' ? (
        <>
          <h1 className={styles.title}>{t('heading')}</h1>
          <p className={styles.bodyText}>{t('description')}</p>
          <button onClick={handleUnsubscribe} className={styles.primaryButton}>
            {t('unsubscribeButton')}
          </button>
          <button onClick={handleStaySubscribed} className={styles.secondaryButton}>
            {t('staySubscribedButton')}
          </button>
        </>
      ) : null}

      {state === 'processing' ? <p className={styles.statusText}>{t('processing')}</p> : null}

      {state === 'unsubscribed' ? (
        <>
          <h1 className={styles.titleSuccess}>{t('successUnsubscribed')}</h1>
          <p className={styles.statusText}>{t('positionPreserved')}</p>
          <p className={styles.redirectText}>{t('redirectingHome')}</p>
        </>
      ) : null}

      {state === 'invalid' ? <h1 className={styles.titleError}>{t('invalidLink')}</h1> : null}

      {state === 'error' ? <h1 className={styles.titleError}>{t('error')}</h1> : null}
    </div>
  );
}
