'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './HandleClaim.module.css';

const VALID = /^[a-z0-9.]+$/;

/**
 * @handle claim (R2; mockup 35; W-20). Choose a public handle: client-side
 * format validation (letters/numbers/dots), an availability hint, a public-page
 * preview, and the permanence/privacy rules. The real uniqueness check + the
 * non-transferable, rate-limited, one-per-account claim run on the handle
 * namespace + account model (deferred, D-2 / DEFERRED_BACKEND_LEDGER); here
 * availability is optimistic on a valid format and Claim advances to Profile.
 *
 * Lives inside the (app) auth group (founder 2026-08-16): gated like every other
 * in-app screen, with the shared AppChrome top bar + tab bar (which carries the
 * R-4 play-money chip) — so this screen renders no header of its own.
 */
export function HandleClaim({ locale }: { locale: string }) {
  const intl = useIntl();
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const normalized = handle.trim().toLowerCase();
  const valid = normalized.length >= 3 && VALID.test(normalized);

  return (
    <section className={styles.wrap} aria-labelledby="handle-title">
      <h1 id="handle-title" className={styles.title}>
        @handle
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage id="handle.subtitle" />
      </p>

      <label className={styles.label} htmlFor="handle-input">
        <FormattedMessage id="handle.yourHandle" />
      </label>
      <div className={styles.inputWrap} data-valid={valid}>
        <span className={styles.at}>@</span>
        <input
          id="handle-input"
          className={styles.input}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={intl.formatMessage({ id: 'handle.placeholder' })}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {valid ? (
          <span className={styles.check}>
            <LucideIcon name="check" size={16} />
          </span>
        ) : null}
      </div>
      {valid ? (
        <p className={styles.available}>
          <FormattedMessage id="handle.available" values={{ handle: `@${normalized}` }} />
        </p>
      ) : null}

      {valid ? (
        <div className={styles.previewBlock}>
          <p className={styles.previewLabel}>
            <FormattedMessage id="handle.preview" />
          </p>
          <div className={styles.previewCard}>
            <span className={styles.previewAvatar}>
              <LucideIcon name="palmtree" size={22} />
            </span>
            <span className={styles.previewBody}>
              <span className={styles.previewName}>@{normalized}</span>
              <span className={styles.previewSub}>
                <FormattedMessage id="handle.previewSub" />
              </span>
            </span>
            <LucideIcon name="chevron-right" size={18} />
          </div>
        </div>
      ) : null}

      <ul className={styles.rules}>
        <li className={styles.rule}>
          <LucideIcon name="shield-check" size={20} />
          <FormattedMessage id="handle.ruleFormat" />
        </li>
        <li className={styles.rule}>
          <LucideIcon name="lock" size={20} />
          <FormattedMessage id="handle.rulePermanent" />
        </li>
        <li className={styles.rule}>
          <LucideIcon name="eye-off" size={20} />
          <FormattedMessage id="handle.rulePrivate" />
        </li>
      </ul>

      <Button
        variant="primary"
        fullWidth
        disabled={!valid}
        onClick={() => router.push(`/${locale}/profile`)}
      >
        <FormattedMessage id="handle.claim" />
      </Button>
    </section>
  );
}
