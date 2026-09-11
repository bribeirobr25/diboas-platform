'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { FrameCaption } from './FrameCaption';
import { LucideIcon } from './LucideIcon';
import { Toggle } from './Toggle';
import { Wordmark } from './Wordmark';
import {
  buildRecords,
  canContinue,
  practiceLegalHref,
  READINESS_DEFAULTS,
  saveLegalChoices,
  type ReadinessChoices,
} from '@/lib/legal/readiness';
import styles from './LegalReadiness.module.css';

/**
 * Legal readiness — Product EN-03A ("Before you start") with Legal's REQUIRED
 * PATCH applied (LC-PUI-02 §3 · LC-TD-02 §4): four SEPARATE concepts, nothing
 * pre-selected, nothing bundled —
 *
 *   REQUIRED     Terms of Use        checkbox  LEGAL-TERMS
 *   INFORMATION  Privacy Notice      link row  LEGAL-PRIVACY (information, not consent)
 *   REQUIRED     18+ declaration     checkbox  LEGAL-AGE (its own control)
 *   OPTIONAL     Product analytics   switch    LEGAL-ANALYTICS (off; never gates)
 *
 * Copy: the four control strings are Legal's exact text ×4 locales; the chrome
 * is the Product visual's English (route gated per locale until localized).
 * Continue needs both required declarations; the evidence record (§4.3) is
 * written device-locally (D-01) and the flow advances to the claim (EN-03B).
 *
 * INTERNAL BUILD ONLY (I-0b): reachable behind `PRACTICE_ACCOUNTS_ENABLED`;
 * the public anonymous flow keeps its existing doorway (F-1).
 */
export function LegalReadiness({ locale }: { locale: string }) {
  const router = useRouter();
  const [choices, setChoices] = useState<ReadinessChoices>(READINESS_DEFAULTS);
  const set = (k: keyof ReadinessChoices) => (next: boolean) =>
    setChoices((prev) => ({ ...prev, [k]: next }));
  const ids = { terms: useId(), age: useId(), analytics: useId() };
  const ready = canContinue(choices);

  const onContinue = () => {
    if (!ready) return;
    // No evidence record, no account step — the behaviour an unguarded throw
    // used to produce by accident, now stated on purpose (see saveLegalChoices).
    if (!saveLegalChoices(buildRecords(choices, locale))) return;
    router.push(`/${locale}/claim`);
  };

  return (
    <section className={styles.wrap} aria-labelledby="readiness-title">
      <FrameCaption />
      <header className={styles.top}>
        <Wordmark className={styles.wordmark} />
        <p className={styles.step}>
          <FormattedMessage id="legalReadiness.step" />
        </p>
        <h1 id="readiness-title" className={styles.title}>
          <FormattedMessage id="legalReadiness.title" />
        </h1>
        <p className={styles.intro}>
          <FormattedMessage id="legalReadiness.subtitle" />
        </p>
      </header>

      {/* LEGAL-TERMS — required, unchecked, its own control. */}
      <Card className={styles.card}>
        <span className={styles.badgeRequired}>
          <FormattedMessage id="legalReadiness.requiredBadge" />
        </span>
        <a
          className={styles.heading}
          href={practiceLegalHref(locale, 'terms')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FormattedMessage id="legalReadiness.termsHeading" />
          <LucideIcon name="chevron-right" size={18} />
        </a>
        <label className={styles.check} htmlFor={ids.terms}>
          <input
            id={ids.terms}
            type="checkbox"
            className={styles.checkbox}
            checked={choices.terms}
            onChange={(e) => set('terms')(e.target.checked)}
          />
          <span>
            <FormattedMessage id="legalReadiness.terms" />
          </span>
        </label>
      </Card>

      {/* LEGAL-PRIVACY — information, not consent: a link, never a control. */}
      <Card className={styles.card}>
        <span className={styles.badgeInfo}>
          <FormattedMessage id="legalReadiness.informationBadge" />
        </span>
        <a
          className={styles.infoRow}
          href={practiceLegalHref(locale, 'privacy')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <FormattedMessage id="legalReadiness.privacy" />
          </span>
          <LucideIcon name="chevron-right" size={18} />
        </a>
      </Card>

      {/* LEGAL-AGE — required, unchecked, separate from Terms (LC-PUI-02 patch). */}
      <Card className={styles.card}>
        <span className={styles.badgeRequired}>
          <FormattedMessage id="legalReadiness.requiredBadge" />
        </span>
        <label className={styles.check} htmlFor={ids.age}>
          <input
            id={ids.age}
            type="checkbox"
            className={styles.checkbox}
            checked={choices.age}
            onChange={(e) => set('age')(e.target.checked)}
          />
          <span>
            <FormattedMessage id="legalReadiness.age" />
          </span>
        </label>
      </Card>

      {/* LEGAL-ANALYTICS — optional, off, never required to continue. */}
      <Card className={styles.card}>
        <span className={styles.badgeOptional}>
          <FormattedMessage id="legalReadiness.optionalBadge" />
        </span>
        <div className={styles.switchRow}>
          <p id={ids.analytics} className={styles.switchLabel}>
            <FormattedMessage id="legalReadiness.analytics" />
          </p>
          <Toggle
            checked={choices.analytics}
            onChange={set('analytics')}
            labelledBy={ids.analytics}
          />
        </div>
        <p className={styles.optionalNote}>
          <FormattedMessage id="legalReadiness.optionalNote" />
        </p>
      </Card>

      <Button variant="primary" fullWidth disabled={!ready} onClick={onContinue}>
        <FormattedMessage id="legalReadiness.continue" />
      </Button>
    </section>
  );
}
