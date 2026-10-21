'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { FrameCaption } from './FrameCaption';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { Wordmark } from './Wordmark';
import { grantPlayMoney } from '@/lib/ledgerClient';
import { useLedger } from '@/hooks/useLedger';
import { useLedgerReady } from '@/hooks/useLedgerReady';
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
 * ledger (`grantPlayMoney`, one-grant guarded), then routes to the app home,
 * which now reads an initialized ledger. Only the persistence/auth backing of
 * the grant remains deferred (DEFERRED_BACKEND_LEDGER CL-B1).
 */
export function ClaimCeremony({ locale }: { locale: SandboxLocale }) {
  const router = useRouter();
  const amount = <FormattedNumber value={PLAY_MONEY_GRANT.b2c} />;
  /* `5.542` — a ledger that is already claimed must never be promised the grant
     again (a Back press or a direct `/claim` link reached this screen and offered
     "You're about to receive 10,000 practice credits" for a tap that does nothing,
     `journey.ts:39`). `/claim` sits OUTSIDE `(app)`, so `AppShell`'s
     `LedgerReadyGate` does not cover it: this screen waits for hydration itself.
     Until the ledger is ready, and while an initialized ledger is redirected
     Home, the PROMISE (eyebrow, amount, info card, button) is not rendered; the
     hero stays, so nothing flashes and nothing false is said.
     LIMIT, stated: the ready flag also opens after a FAILED hydrate
     (`core.ts:126-130`), leaving an uninitialized in-memory ledger, so the
     ceremony then shows as it does today. That false empty is the P8
     unavailable-storage case (plan §8.9.2), deliberately not handled here. */
  const ready = useLedgerReady();
  const { initialized } = useLedger();
  const showPromise = ready && !initialized;

  useEffect(() => {
    if (ready && initialized) router.replace(`/${locale}`);
  }, [ready, initialized, locale, router]);

  function claim() {
    grantPlayMoney(PLAY_MONEY_GRANT.b2c, LOCALE_CURRENCY[locale], 'b2c');
    // `replace`, not `push` (5.542): the grant flips `initialized`, so the guard
    // below also replaces this entry with Home; with `push` the two navigations
    // raced and history kept a /claim entry only some of the time. Replacing
    // makes it deterministic — after claiming, Back never returns to the
    // ceremony in this session — and the guard still covers any later /claim load.
    router.replace(`/${locale}`);
  }

  return (
    <section
      className={styles.wrap}
      /* Points at the heading only while the heading exists: while the promise is
         withheld (hydrating, or redirecting a claimed ledger) there is no
         #claim-title, and a dangling aria-labelledby names nothing. */
      aria-labelledby={showPromise ? 'claim-title' : undefined}
    >
      <FrameCaption />
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

      {showPromise ? (
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
      ) : null}
    </section>
  );
}
