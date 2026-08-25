'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { FrameCaption } from './FrameCaption';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { Toggle } from './Toggle';
import { Wordmark } from './Wordmark';
import { submitConsent } from '@/app/[locale]/consent/actions';
import { legalUrl } from '@/i18n/config';
import styles from './Consent.module.css';

type OptIn = 'financialProfile' | 'analytics' | 'marketing';

const OPTIONS: { id: OptIn; icon: string }[] = [
  { id: 'financialProfile', icon: 'user' },
  { id: 'analytics', icon: 'bar-chart' },
  { id: 'marketing', icon: 'megaphone' },
];

/**
 * Consent — the W-3 surface (A3; mockup 09). ONE blocking "Accept & continue"
 * (Terms + Privacy + 18+, contract basis) in its own card, ABOVE three optional
 * opt-in toggles, all OFF by default, optionality stated ONCE in the section
 * intro (founder 2026-08-25, 5.143: "just say things once" — it was rendered
 * five times: a chip, the intro, and a per-row hint ×3). CLO R-5 / Planet49 —
 * separate granular consent; bundled consent declined — is unchanged: the
 * toggles stay separate, unticked, non-blocking. The explicit consent act (unlike the Welcome's reviewable notice).
 * Internal page, so it keeps the "Sandbox · play money" chip.
 *
 * WIRED (not a preview): Accept calls the submitConsent server action, which
 * advances the flow (-> claim). The opt-ins are collected here; the
 * server-authoritative write is DEFERRED + registered (DEFERRED_BACKEND_LEDGER
 * C-B1/C-B2) — no ruled consent seam/schema yet, so none is invented inline.
 */
export function Consent({ locale }: { locale: string }) {
  const [optIns, setOptIns] = useState<Record<OptIn, boolean>>({
    financialProfile: false,
    analytics: false,
    marketing: false,
  });
  const set = (id: OptIn) => (next: boolean) => setOptIns((prev) => ({ ...prev, [id]: next }));

  const linkChunks = {
    terms: (chunks: React.ReactNode) => (
      <a
        key="terms"
        href={legalUrl(locale, 'terms')}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {chunks}
      </a>
    ),
    privacy: (chunks: React.ReactNode) => (
      <a
        key="privacy"
        href={legalUrl(locale, 'privacy')}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {chunks}
      </a>
    ),
  };

  return (
    <section className={styles.wrap} aria-labelledby="consent-title">
      <FrameCaption />
      <header className={styles.top}>
        <ModeChip />
        <Wordmark className={styles.wordmark} />
        <h1 id="consent-title" className={styles.title}>
          <FormattedMessage id="consent.title" />
        </h1>
        <p className={styles.intro}>
          <FormattedMessage id="consent.intro" />
        </p>
      </header>

      {/* The required, blocking accept (the contract gate). */}
      <Card className={styles.required}>
        <div className={styles.requiredHead}>
          <span className={styles.requiredIcon}>
            <LucideIcon name="shield-check" size={22} />
          </span>
          <div>
            <h2 className={styles.requiredTitle}>
              <FormattedMessage id="consent.requiredTitle" />
            </h2>
            <p className={styles.requiredBody}>
              <FormattedMessage id="consent.requiredBody" values={linkChunks} />
            </p>
          </div>
        </div>
        <Button variant="primary" fullWidth onClick={() => submitConsent(locale)}>
          <LucideIcon name="lock" size={18} />
          <span className={styles.acceptLabel}>
            <FormattedMessage id="consent.accept" />
          </span>
        </Button>
      </Card>

      {/* The optional, non-blocking opt-ins. */}
      <div className={styles.optional}>
        <h2 className={styles.optionalTitle}>
          <FormattedMessage id="consent.optionalTitle" />
        </h2>
        <p className={styles.optionalIntro}>
          <FormattedMessage id="consent.optionalIntro" />
        </p>

        <ul className={styles.optList}>
          {OPTIONS.map((o) => (
            <li key={o.id} className={styles.optRow}>
              <span className={styles.optIcon}>
                <LucideIcon name={o.icon} size={20} />
              </span>
              <div className={styles.optText}>
                <p id={`opt-${o.id}`} className={styles.optTitle}>
                  <FormattedMessage id={`consent.${o.id}Title`} />
                </p>
                <p className={styles.optBody}>
                  <FormattedMessage id={`consent.${o.id}Body`} />
                </p>
              </div>
              <Toggle checked={optIns[o.id]} onChange={set(o.id)} labelledBy={`opt-${o.id}`} />
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.footer}>
        <LucideIcon name="lock" size={16} />
        <span>
          <FormattedMessage id="consent.footer" />
        </span>
      </p>
    </section>
  );
}
