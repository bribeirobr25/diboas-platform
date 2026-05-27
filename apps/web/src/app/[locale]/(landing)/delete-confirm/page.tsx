'use client';

/**
 * GDPR Deletion Confirmation Page
 *
 * Users arrive here from the deletion confirmation email.
 * Reads the token from the URL and lets them confirm deletion.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import styles from './DeleteConfirm.module.css';

type DeletionState = 'idle' | 'confirming' | 'success' | 'expired' | 'error';

export default function DeleteConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const intl = useTranslation();
  const [state, setState] = useState<DeletionState>(token ? 'idle' : 'error');

  const t = (key: string) => {
    return intl.formatMessage({ id: `waitlist.deletion.${key}` });
  };

  const handleConfirm = async () => {
    if (!token) return;
    setState('confirming');

    try {
      const response = await fetch('/api/waitlist/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState('success');
      } else if (response.status === 400) {
        setState('expired');
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
          <h1 className={styles.title}>{t('confirmTitle')}</h1>
          <p className={styles.bodyText}>{t('confirmBody')}</p>
          <button onClick={handleConfirm} className={styles.confirmButton}>
            {t('confirmButton')}
          </button>
        </>
      ) : null}

      {state === 'confirming' ? <p className={styles.statusText}>{t('confirming')}</p> : null}

      {state === 'success' ? (
        <>
          <h1 className={styles.titleSuccess}>{t('success')}</h1>
          <p className={styles.statusText}>{t('successBody')}</p>
        </>
      ) : null}

      {state === 'expired' ? (
        <>
          <h1 className={styles.titleExpired}>{t('expired')}</h1>
          <p className={styles.statusText}>{t('expiredBody')}</p>
        </>
      ) : null}

      {state === 'error' ? (
        <>
          <h1 className={styles.titleError}>{t('error')}</h1>
          <p className={styles.statusText}>{t('errorBody')}</p>
        </>
      ) : null}
    </div>
  );
}
