'use client';

import { useActionState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { LucideIcon, Lock } from '@/components/UI/LucideIcon';
import { grantInvestorAccess, type AccessState } from './actions';
import styles from './InvestorRoomAccess.module.css';

const INITIAL: AccessState = { error: false };

/**
 * Shared-password prompt for the investor room. Posts to the `grantInvestorAccess`
 * server action; on success the action sets the grant cookie and redirects.
 */
export function InvestorRoomAccess({ locale, configured }: { locale: string; configured: boolean }) {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `investor.access.${key}` });
  const [state, formAction, pending] = useActionState(grantInvestorAccess, INITIAL);

  return (
    <section className={styles.wrapper} aria-labelledby="investor-access-heading">
      <div className={styles.card}>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h1 id="investor-access-heading" className={styles.heading}>
          {t('headline')}
        </h1>
        {configured ? (
          <>
            <p className={styles.body}>{t('body')}</p>
            <form action={formAction} className={styles.form}>
              <input type="hidden" name="locale" value={locale} />
              <label htmlFor="investor-password" className={styles.label}>
                {t('passwordLabel')}
              </label>
              <input
                id="investor-password"
                name="password"
                type="password"
                autoComplete="off"
                required
                className={styles.input}
                aria-invalid={state.error}
                aria-describedby={state.error ? 'investor-access-error' : undefined}
              />
              {state.error ? (
                <p id="investor-access-error" role="alert" className={styles.error}>
                  {t('error')}
                </p>
              ) : null}
              <button type="submit" className={styles.submit} disabled={pending}>
                <LucideIcon icon={Lock} size="sm" />
                <span>{t('submit')}</span>
              </button>
            </form>
          </>
        ) : (
          <p className={styles.body}>{t('notConfigured')}</p>
        )}
      </div>
    </section>
  );
}
