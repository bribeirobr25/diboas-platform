'use client';

import { useRouter } from 'next/navigation';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { Wordmark } from './Wordmark';
import { grantPlayMoney } from '@/lib/ledgerClient';
import { LOCALE_CURRENCY, PLAY_MONEY_GRANT, type SandboxLocale } from '@/i18n/config';
import styles from './ClaimCeremony.module.css';

/**
 * ClaimCeremony — the W-5a claim (A3.2; mockup 10). A brief, calm play-money
 * moment: the chip + wordmark over the coastal hero, a gift ceremony, "You're
 * about to receive 10,000 practice credits", the C-P0 no-real-value info card
 * (legal clarity BEFORE receipt), and "Get your first 10,000" — the user's tap
 * IS the claim. Significant, like receiving keys, never a jackpot (no confetti).
 * At real launch this step becomes Add Money (money arrives because the user
 * acted). The amount shows as a plain locale-formatted number labelled "practice
 * credits" (the mockup frames it as credits, not a currency).
 *
 * WIRED (client): the tap emits the real `PlayMoneyGranted` via the built play
 * ledger (`grantAndSplit`, one-grant guarded), then routes to the app home,
 * which now reads an initialized ledger. Only the persistence/auth backing of
 * the grant remains deferred (DEFERRED_BACKEND_LEDGER CL-B1).
 */
export function ClaimCeremony({ locale }: { locale: SandboxLocale }) {
  const router = useRouter();
  const amount = <FormattedNumber value={PLAY_MONEY_GRANT.b2c} />;

  function claim() {
    grantPlayMoney(PLAY_MONEY_GRANT.b2c, LOCALE_CURRENCY[locale], 'b2c');
    router.push(`/${locale}`);
  }

  return (
    <section className={styles.wrap} aria-labelledby="claim-title">
      <header className={styles.hero}>
        <div className={styles.heroImg} aria-hidden />
        <div className={styles.heroFade} aria-hidden />
        <div className={styles.heroTop}>
          <ModeChip />
        </div>
        <div className={styles.brand}>
          <Wordmark className={styles.wordmark} size="3rem" />
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.ceremony}>
          <span className={styles.giftIcon}>
            <LucideIcon name="gift" size={26} />
          </span>
          <p className={styles.eyebrow}>
            <FormattedMessage id="claim.eyebrow" />
          </p>
          <h1 id="claim-title" className={styles.heading}>
            <FormattedMessage id="claim.heading" />
          </h1>
          <p className={styles.amount}>{amount}</p>
          <p className={styles.amountLabel}>
            <FormattedMessage id="claim.amountLabel" />
          </p>
        </div>

        <Card className={styles.info}>
          <span className={styles.infoIcon}>
            <LucideIcon name="info" size={20} />
          </span>
          <div>
            <p className={styles.infoTitle}>
              <FormattedMessage id="claim.infoTitle" />
            </p>
            <p className={styles.infoBody}>
              <FormattedMessage id="claim.infoBody" />
            </p>
          </div>
        </Card>

        <Button variant="primary" fullWidth onClick={claim}>
          <LucideIcon name="key" size={18} />
          <span className={styles.ctaLabel}>
            <FormattedMessage id="claim.cta" values={{ amount }} />
          </span>
        </Button>

        <p className={styles.footer}>
          <LucideIcon name="lock" size={14} />
          <FormattedMessage id="claim.footer" />
        </p>
      </div>
    </section>
  );
}
