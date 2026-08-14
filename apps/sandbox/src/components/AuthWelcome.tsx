'use client';

import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import styles from './AuthWelcome.module.css';

type Method = 'google' | 'email' | 'wallet';

const METHODS: { id: Method; icon: string; labelId: string }[] = [
  { id: 'google', icon: 'chrome', labelId: 'authWelcome.google' },
  { id: 'email', icon: 'mail', labelId: 'authWelcome.email' },
  { id: 'wallet', icon: 'wallet', labelId: 'authWelcome.wallet' },
];

/**
 * AuthWelcome — the public front door (slice A2; mockup 01; W-17c: R1 entry =
 * public Welcome + login/create-account, replacing the MVP-0 gate at go-live).
 * The three ruled R1 methods (Google · email · wallet — W-1/PL-1c), equal
 * weight, no "recommended".
 *
 * SEAM (no creds yet): the buttons call `onMethod`; the real sign-in (Auth.js
 * OAuth redirect / OTP send / wallet challenge) is wired at the end via the
 * existing IAuthProvider factory — the button boundary changes nothing when it
 * lands. Default handler is a no-op so the screen is honest UI, not a fake
 * success. Copy applies the audit learnings: no "risk-free"; terms/privacy are
 * a NOTICE (links, reviewable anytime), never agreement-by-continuing — the
 * actual consent is captured on the W-3 consent screen (A3).
 */
export function AuthWelcome({ onMethod }: { onMethod?: (m: Method) => void }) {
  return (
    <section className={styles.wrap} aria-labelledby="authwelcome-title">
      <header className={styles.top}>
        <ModeChip />
        <p className={styles.wordmark}>
          <LucideIcon name="palmtree" size={22} />
          <FormattedMessage id="common.appName" />
        </p>
        <p className={styles.tagline}>
          <FormattedMessage id="authWelcome.tagline" />
        </p>
      </header>

      {/* Hero band — calm brand-gradient placeholder; the final coastal
          illustration (mockup 01) is a design asset dropped in here at handoff. */}
      <div className={styles.hero} aria-hidden />

      <h1 id="authwelcome-title" className={styles.title}>
        <FormattedMessage id="authWelcome.title" />
      </h1>
      <p className={styles.body}>
        <FormattedMessage id="authWelcome.body" />
      </p>

      <div className={styles.methods}>
        {METHODS.map((m) => (
          <Button
            key={m.id}
            variant="secondary"
            fullWidth
            className={styles.method}
            onClick={() => onMethod?.(m.id)}
          >
            <LucideIcon name={m.icon} size={18} />
            <span className={styles.methodLabel}>
              <FormattedMessage id={m.labelId} />
            </span>
            <LucideIcon name="chevron-right" size={16} />
          </Button>
        ))}
      </div>

      <p className={styles.legal}>
        <FormattedMessage
          id="authWelcome.legal"
          values={{
            terms: (chunks) => (
              <a href="/legal/terms" className={styles.legalLink}>
                {chunks}
              </a>
            ),
            privacy: (chunks) => (
              <a href="/legal/privacy" className={styles.legalLink}>
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </section>
  );
}
