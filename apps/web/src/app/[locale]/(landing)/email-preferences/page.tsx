'use client';

/**
 * Email Preferences Page
 *
 * Users arrive here from the unsubscribe link in email footers.
 * Reads id (emailHash) and token from URL, lets them unsubscribe or stay subscribed.
 * Follows the same pattern as delete-confirm page.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import styles from './EmailPreferences.module.css';

type PageState = 'idle' | 'processing' | 'unsubscribed' | 'resubscribed' | 'invalid' | 'error';

export default function EmailPreferencesPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const intl = useTranslation();
  const [state, setState] = useState<PageState>(id && token ? 'idle' : 'invalid');

  const t = (key: string) =>
    intl.formatMessage({ id: `common.emailPreferences.${key}` });

  const handleAction = async (action: 'unsubscribe' | 'resubscribe') => {
    if (!id || !token) return;
    setState('processing');

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, action }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(action === 'resubscribe' ? 'resubscribed' : 'unsubscribed');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div className={styles.container}>
      {state === 'idle' ? (
        <>
          <h1 className={styles.title}>{t('heading')}</h1>
          <p className={styles.bodyText}>{t('description')}</p>
          <button
            onClick={() => handleAction('unsubscribe')}
            className={styles.primaryButton}
          >
            {t('unsubscribeButton')}
          </button>
          <button
            onClick={() => history.back()}
            className={styles.secondaryButton}
          >
            {t('staySubscribedButton')}
          </button>
        </>
      ) : null}

      {state === 'processing' ? (
        <p className={styles.statusText}>{t('processing')}</p>
      ) : null}

      {state === 'unsubscribed' ? (
        <>
          <h1 className={styles.titleSuccess}>{t('successUnsubscribed')}</h1>
          <p className={styles.statusText}>{t('positionPreserved')}</p>
          <p className={styles.changedMind}>
            {t('changedMind')}{' '}
            <button
              onClick={() => handleAction('resubscribe')}
              className={styles.linkButton}
            >
              {t('resubscribeButton')}
            </button>
          </p>
        </>
      ) : null}

      {state === 'resubscribed' ? (
        <>
          <h1 className={styles.titleSuccess}>{t('successResubscribed')}</h1>
        </>
      ) : null}

      {state === 'invalid' ? (
        <>
          <h1 className={styles.titleError}>{t('invalidLink')}</h1>
        </>
      ) : null}

      {state === 'error' ? (
        <>
          <h1 className={styles.titleError}>{t('error')}</h1>
        </>
      ) : null}
    </div>
  );
}
