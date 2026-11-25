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
 *
 * W-D1 (F1, G4; spec §3.6): beside unsubscribe, removing the signup's note (which button or
 * campaign link brought the person) through `/api/waitlist/note-removal`. Removal has its own
 * states (removed, nothing to remove, error with its own retry, which never posts unsubscribe)
 * and does not redirect. The "Cookie settings" control sits at the foot (D6, F2).
 */

import { useState, useEffect } from 'react';
import { useUrlSecrets } from '@/hooks/useUrlSecrets';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { decodeUnsubToken } from '@/lib/email/unsubscribeToken';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { CookieSettingsButton } from '@/components/CookieConsent/CookieSettingsButton';
import styles from './EmailPreferences.module.css';

type PageState = 'idle' | 'processing' | 'unsubscribed' | 'invalid' | 'error';
type NoteState = 'ready' | 'removing' | 'removed' | 'nothing' | 'error';

export default function EmailPreferencesPage() {
  const { locale } = useLocale();
  const intl = useTranslation();

  // Decode params: try `t` param first (new), then legacy `id`+`token`. Read once; the token
  // then leaves the address bar (5.864).
  const { id, token } = useUrlSecrets((params) => {
    const tParam = params.get('t');
    const decoded = tParam ? decodeUnsubToken(tParam) : null;
    return { id: decoded?.id ?? params.get('id'), token: decoded?.token ?? params.get('token') };
  });

  const [state, setState] = useState<PageState>(id && token ? 'idle' : 'invalid');
  const [noteState, setNoteState] = useState<NoteState>('ready');

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

  // Removes only the note; a failure offers a retry of the removal, never an unsubscribe.
  const handleRemoveNote = async () => {
    if (!id || !token || noteState === 'removing') return;
    setNoteState('removing');
    try {
      const response = await fetchWithRetry('/api/waitlist/note-removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token }),
      });
      const data = await response.json();
      if (response.ok && data.success) setNoteState(data.removed === true ? 'removed' : 'nothing');
      else setNoteState('error');
    } catch {
      setNoteState('error');
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
          {noteState === 'removed' || noteState === 'nothing' ? (
            <p className={styles.statusText} role="status">
              {t(noteState === 'removed' ? 'noteRemoved' : 'noNote')}
            </p>
          ) : (
            <>
              {noteState === 'error' ? (
                <p className={styles.statusText} role="alert">
                  {t('noteRemovalError')}
                </p>
              ) : null}
              <button
                onClick={handleRemoveNote}
                className={styles.secondaryButton}
                disabled={noteState === 'removing'}
                aria-busy={noteState === 'removing'}
              >
                {t(noteState === 'error' ? 'tryAgainButton' : 'removeNoteButton')}
              </button>
            </>
          )}
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

      {state === 'invalid' ? (
        <>
          <h1 className={styles.titleError}>{t('invalidLink')}</h1>
          <a href={`/${locale}/`} className={styles.secondaryButton}>
            {t('backHome')}
          </a>
        </>
      ) : null}

      {state === 'error' ? (
        <>
          <h1 className={styles.titleError}>{t('error')}</h1>
          <button onClick={handleUnsubscribe} className={styles.primaryButton}>
            {t('tryAgainButton')}
          </button>
          <a href={`/${locale}/`} className={styles.secondaryButton}>
            {t('backHome')}
          </a>
        </>
      ) : null}

      <p className={styles.cookieSettings}>
        <CookieSettingsButton className={styles.cookieSettingsButton} />
      </p>
    </div>
  );
}
