'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { Toggle } from './Toggle';
import styles from './Consent.module.css';

type OptIn = 'financialProfile' | 'analytics' | 'marketing';

const OPTIONS: { id: OptIn; icon: string }[] = [
  { id: 'financialProfile', icon: 'sprout' },
  { id: 'analytics', icon: 'trending-up' },
  { id: 'marketing', icon: 'gift' },
];

/**
 * Consent — the W-3 surface (slice A3; mockup 09). ONE blocking "Accept &
 * continue" (Terms + Privacy + 18+, contract basis) ABOVE three optional
 * opt-in toggles, all OFF by default, each labelled "Optional. Everything works
 * either way." (CLO R-5 / Planet49 — separate granular consent; bundled consent
 * declined). This is the explicit consent act (unlike the Welcome, which is a
 * reviewable notice).
 *
 * SEAM (no creds yet): `onAccept` receives the opt-in map; the real write to
 * the server-authoritative consent record (D1/G11 schema) is wired at the end.
 * Default handler is a no-op. Toggles are controlled here (the control); the
 * record is server-side truth.
 */
export function Consent({ onAccept }: { onAccept?: (optIns: Record<OptIn, boolean>) => void }) {
  const [optIns, setOptIns] = useState<Record<OptIn, boolean>>({
    financialProfile: false,
    analytics: false,
    marketing: false,
  });
  const set = (id: OptIn) => (next: boolean) => setOptIns((prev) => ({ ...prev, [id]: next }));

  const linkChunks = {
    terms: (chunks: React.ReactNode) => (
      <a href="/legal/terms" className={styles.link}>
        {chunks}
      </a>
    ),
    privacy: (chunks: React.ReactNode) => (
      <a href="/legal/privacy" className={styles.link}>
        {chunks}
      </a>
    ),
  };

  return (
    <section className={styles.wrap} aria-labelledby="consent-title">
      <header className={styles.top}>
        <ModeChip />
        <p className={styles.wordmark}>
          <LucideIcon name="palmtree" size={20} />
          <FormattedMessage id="common.appName" />
        </p>
        <h1 id="consent-title" className={styles.title}>
          <FormattedMessage id="consent.title" />
        </h1>
        <p className={styles.intro}>
          <FormattedMessage id="consent.intro" />
        </p>
      </header>

      {/* The required, blocking accept (the contract gate). */}
      <Card>
        <div className={styles.requiredHead}>
          <span className={styles.requiredIcon}>
            <LucideIcon name="shield-check" size={20} />
          </span>
          <h2 className={styles.requiredTitle}>
            <FormattedMessage id="consent.requiredTitle" />
          </h2>
        </div>
        <p className={styles.requiredBody}>
          <FormattedMessage id="consent.requiredBody" values={linkChunks} />
        </p>
        <Button variant="primary" fullWidth onClick={() => onAccept?.(optIns)}>
          <LucideIcon name="shield" size={18} />
          <span className={styles.acceptLabel}>
            <FormattedMessage id="consent.accept" />
          </span>
        </Button>
      </Card>

      {/* The optional, non-blocking opt-ins. */}
      <div className={styles.optional}>
        <h2 className={styles.optionalTitle}>
          <FormattedMessage id="consent.optionalTitle" />{' '}
          <span className={styles.optionalAll}>
            (<FormattedMessage id="consent.optionalAll" />)
          </span>
        </h2>
        <p className={styles.optionalIntro}>
          <FormattedMessage id="consent.optionalIntro" />
        </p>

        <ul className={styles.optList}>
          {OPTIONS.map((o) => (
            <li key={o.id} className={styles.optRow}>
              <span className={styles.optIcon}>
                <LucideIcon name={o.icon} size={18} />
              </span>
              <div className={styles.optText}>
                <p id={`opt-${o.id}`} className={styles.optTitle}>
                  <FormattedMessage id={`consent.${o.id}Title`} />
                </p>
                <p className={styles.optBody}>
                  <FormattedMessage id={`consent.${o.id}Body`} />
                </p>
                <p className={styles.optHint}>
                  <FormattedMessage id="consent.optionalHint" />
                </p>
              </div>
              <Toggle checked={optIns[o.id]} onChange={set(o.id)} labelledBy={`opt-${o.id}`} />
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.footer}>
        <LucideIcon name="shield" size={14} />
        <FormattedMessage id="consent.footer" />
      </p>
    </section>
  );
}
