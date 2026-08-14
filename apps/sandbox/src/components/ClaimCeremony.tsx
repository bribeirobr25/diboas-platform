'use client';

import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { useFormatters } from '@/hooks/useFormatters';
import { LOCALE_CURRENCY, PLAY_MONEY_GRANT, type SandboxLocale } from '@/i18n/config';
import styles from './ClaimCeremony.module.css';

/**
 * ClaimCeremony — the W-5a claim (slice A3.2; mockup 10). A brief play-money
 * INFORMATION moment (no value, never converts — the C-P0 line in compliance
 * voice) with "Get your first 10,000"; the user's tap is the claim. Calm and
 * significant, like receiving keys — never a jackpot (no confetti). The info
 * precedes receipt (legal clarity), and at real launch this step BECOMES Add
 * Money (money arrives because the user acted).
 *
 * SEAM: `onClaim` fires on the tap; the real emit (`PlayMoneyGranted` via
 * grantAndSplit, one-grant idempotency guard) is the wiring — here a callback
 * so the ceremony is honest UI. Uses the real grant constant + money formatter.
 */
export function ClaimCeremony({
  locale,
  onClaim,
}: {
  locale: SandboxLocale;
  onClaim?: () => void;
}) {
  const currency = LOCALE_CURRENCY[locale];
  const { money } = useFormatters(currency);
  const amount = PLAY_MONEY_GRANT.b2c;

  return (
    <section className={styles.wrap} aria-labelledby="claim-title">
      <ModeChip />

      <Card tone="tint" className={styles.info}>
        <span className={styles.infoIcon}>
          <LucideIcon name="gift" size={20} />
        </span>
        <h1 id="claim-title" className={styles.eyebrow}>
          <FormattedMessage id="claim.eyebrow" />
        </h1>
        <p className={styles.body}>
          <FormattedMessage id="claim.body" />
        </p>
      </Card>

      <div className={styles.amountBlock}>
        <span className={styles.amount}>{money(amount)}</span>
        <span className={styles.amountLabel}>
          <FormattedMessage id="claim.amountLabel" />
        </span>
      </div>

      <Button variant="primary" fullWidth onClick={() => onClaim?.()}>
        <FormattedMessage id="claim.cta" values={{ amount: money(amount) }} />
      </Button>

      <p className={styles.reassure}>
        <LucideIcon name="shield" size={14} />
        <FormattedMessage id="claim.reassure" />
      </p>
    </section>
  );
}
