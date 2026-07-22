'use client';

import { useActionState } from 'react';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { enterSandbox, type GateState } from './actions';
import styles from './GateForm.module.css';

const INITIAL: GateState = { error: null };

export function GateForm() {
  const intl = useIntl();
  const params = useParams<{ locale: string }>();
  const [state, formAction, pending] = useActionState(enterSandbox, INITIAL);

  return (
    <main className={styles.wrap}>
      <form action={formAction} className={styles.card}>
        <p className={styles.badge}>
          <FormattedMessage id="common.playBadge" />
        </p>
        <h1 className={styles.title}>
          <FormattedMessage id="gate.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="gate.subtitle" />
        </p>
        <input type="hidden" name="locale" value={params.locale} />
        <label className={styles.label} htmlFor="gate-password">
          <FormattedMessage id="gate.passwordLabel" />
        </label>
        <input
          id="gate-password"
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
        {state.error === 'wrong' ? (
          <p className={styles.error} role="alert">
            <FormattedMessage id="gate.error" />
          </p>
        ) : null}
        {state.error === 'unconfigured' ? (
          <p className={styles.error} role="alert">
            <FormattedMessage id="gate.notConfigured" />
          </p>
        ) : null}
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending
            ? intl.formatMessage({ id: 'common.loading' })
            : intl.formatMessage({ id: 'gate.enter' })}
        </button>
        <p className={styles.disclaimer}>
          <FormattedMessage id="common.playDisclaimer" />
        </p>
      </form>
    </main>
  );
}
