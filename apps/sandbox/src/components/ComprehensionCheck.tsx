'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { LucideIcon } from './LucideIcon';
import styles from './ComprehensionCheck.module.css';

type Answer = 'yes' | 'no';

/**
 * Comprehension micro-check (R7; mockup 29). A light, non-blocking check that the
 * key C-P0 idea landed before moving on: one question ("Can practice credits
 * become real money?"), the honest explainer, Yes/No, then a gentle affirmation
 * or correction and Continue. Never a hard gate ("learn without pressure").
 *
 * The correct answer is "No" — practice credits never convert (C-P0). The mockup
 * copy "risk-free environment" is reworded (kill-list: no "risk-free"/"guaranteed").
 *
 * WIRED as a screen (answer -> feedback -> Home). Its trigger point after a Learn
 * lesson is a Learn-integration seam (deferred, DEFERRED_BACKEND_LEDGER) — R1
 * builds the check itself, not the lesson-completion hook that launches it.
 */
export function ComprehensionCheck({ locale }: { locale: SandboxLocale }) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const home = `/${locale}`;
  const correct = answer === 'no';

  // Answering swaps the Yes/No buttons (which held focus) for the result. Move
  // focus to the result so it is announced and keyboard focus is not dropped to
  // <body> (WCAG 2.4.3 / 4.1.3); the result also carries role="status".
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (answer !== null) resultRef.current?.focus();
  }, [answer]);

  return (
    <section className={styles.wrap} aria-labelledby="comp-title">
      <header className={styles.head}>
        <h1 id="comp-title" className={styles.title}>
          <FormattedMessage id="comprehension.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="comprehension.subtitle" />
        </p>
      </header>

      <div className={styles.card}>
        <div className={styles.qHead}>
          <span className={styles.qBadge} aria-hidden>
            Q
          </span>
          <span className={styles.qLabel}>
            <FormattedMessage id="comprehension.questionLabel" />
          </span>
        </div>
        <h2 className={styles.question}>
          <FormattedMessage id="comprehension.question" />
        </h2>
        <p className={styles.explainer}>
          <FormattedMessage id="comprehension.explainer" />
        </p>

        {answer === null ? (
          <div className={styles.choices}>
            <button type="button" className={styles.choice} onClick={() => setAnswer('yes')}>
              <FormattedMessage id="comprehension.yes" />
            </button>
            <button type="button" className={styles.choice} onClick={() => setAnswer('no')}>
              <FormattedMessage id="comprehension.no" />
            </button>
          </div>
        ) : (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className={styles.result}
            data-correct={correct ? 'true' : undefined}
          >
            <span className={styles.resultIcon}>
              <LucideIcon name={correct ? 'shield-check' : 'info'} size={20} />
            </span>
            <p className={styles.resultText}>
              <FormattedMessage
                id={correct ? 'comprehension.correct' : 'comprehension.incorrect'}
              />
            </p>
          </div>
        )}
      </div>

      <p className={styles.note}>
        <LucideIcon name="info" size={14} />
        <FormattedMessage id="comprehension.note" />
      </p>

      {answer === null ? (
        <Link href={home} className={styles.skip}>
          <FormattedMessage id="comprehension.skip" />
        </Link>
      ) : (
        <Link href={home} className={styles.continue}>
          <FormattedMessage id="comprehension.continue" />
          <LucideIcon name="arrow-right" size={18} />
        </Link>
      )}
    </section>
  );
}
