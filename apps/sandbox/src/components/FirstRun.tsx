'use client';

import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { LOCALE_CURRENCY, PLAY_MONEY_GRANT, type SandboxLocale } from '@/i18n/config';
import { grantAndSplit } from '@/lib/ledgerClient';
import { useFormatters } from '@/hooks/useFormatters';
import { useProfile } from '@/hooks/useProfile';
import { SalaryStep } from './SalaryStep';
import { MirrorStrip } from './MirrorStrip';
import { Welcome } from './Welcome';
import styles from './FirstRun.module.css';

/**
 * The play grant arrives entirely as **Working money** — the side-pocket money
 * that comes to diBoaS (D-M1). Floor/Cushion are illustrative (the mirror),
 * never a split of the play money; "give every part a job" now happens at goal
 * creation, not here.
 */
const ALL_WORKING = { floorPercent: 0, cushionPercent: 0, workingPercent: 100 };

/**
 * First run: step 1 is the (optional) salary anchor; step 2 shows the
 * illustrative mirror (from salary, if given) and hands the user their Working
 * play money to put to work.
 */
export function FirstRun({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const currency = LOCALE_CURRENCY[locale];
  const amount = PLAY_MONEY_GRANT.b2c;
  const { money } = useFormatters(currency);
  const profile = useProfile();

  // Lazy init skips the welcome + salary steps once income has been captured (a
  // reload mid-flow lands straight on the working hand-off). A user who SKIPPED
  // salary has no stored income, so a pre-grant reload restarts the intro —
  // acceptable, since nothing was committed yet.
  const [salaryDone, setSalaryDone] = useState(() => profile.netMonthlyIncome != null);
  const [welcomeSeen, setWelcomeSeen] = useState(() => profile.netMonthlyIncome != null);

  // Focus the working-step heading on mount (onboarding a11y, M2). Declared
  // before the early returns to keep hook order stable.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (salaryDone) headingRef.current?.focus();
  }, [salaryDone]);

  if (!salaryDone) {
    if (!welcomeSeen) return <Welcome onStart={() => setWelcomeSeen(true)} />;
    return <SalaryStep locale={locale} onDone={() => setSalaryDone(true)} />;
  }

  function start() {
    grantAndSplit(amount, currency, 'b2c', ALL_WORKING);
  }

  return (
    <section className={styles.wrap} aria-labelledby="firstrun-title">
      <h1 id="firstrun-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        <FormattedMessage id="firstRun.title" />
      </h1>
      <p className={styles.body}>
        <FormattedMessage id="firstRun.body" />
      </p>

      <MirrorStrip locale={locale} />

      <div className={styles.workingIntro}>
        <p className={styles.amountLine}>
          <FormattedMessage id="firstRun.workingAmount" values={{ amount: money(amount) }} />
        </p>
        <p className={styles.body}>
          <FormattedMessage id="firstRun.workingBody" />
        </p>
      </div>

      <button
        type="button"
        className={styles.cta}
        onClick={start}
        aria-label={intl.formatMessage({ id: 'firstRun.cta' })}
      >
        <FormattedMessage id="firstRun.cta" />
      </button>
    </section>
  );
}
