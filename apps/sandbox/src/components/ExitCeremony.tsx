'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import { EXIT_FEE_FLOOR, FEE_RATES } from '@diboas/banking';
import type { StopPreview } from '@/lib/ledgerClient';
import { useFormatters } from '@/hooks/useFormatters';
import { useTakeoverFocus } from '@/hooks/useTakeoverFocus';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './ExitCeremony.module.css';

/**
 * The exit ceremony (G7, §4.7; mockup 19) — a FULL-SCREEN review, never a
 * bottom sheet: this is the fee-truth surface, and it is the last thing the
 * user reads before money moves.
 *
 * Gross → itemized fees → Net → where it lands. Board §3.3: the goal-level
 * stop is a COMPOSITION of position exits, so when it covers more than one
 * position the per-position lines render too — the $0.25 exit floor applies
 * PER position and each exit pays its own network fee, so a single summed
 * number would understate the real cost. That understatement is precisely
 * what this screen exists to prevent (FC-15).
 *
 * DRIFT — build follows code: mockup 19 says the money lands in "your
 * Available balance". It does not: the engine returns an exit to the GOAL's
 * cash, and releasing goal cash to Available is a separate, explicit act
 * (D-e). The copy states where it really lands.
 *
 * R-2: no shame if the net comes back under what went in — the numbers are
 * stated plainly, with no warning colour and no commentary.
 */
export function ExitCeremony({
  preview,
  goalName,
  goalIcon,
  currency,
  busy = false,
  onConfirm,
  onCancel,
}: {
  preview: StopPreview;
  goalName: string;
  /** The goal's OWN icon — every other goal-bearing surface shows it, so a
   *  generic one here would read as a different goal at the riskiest moment. */
  goalIcon: string;
  currency: 'USD' | 'BRL' | 'EUR';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const intl = useIntl();
  const { money } = useFormatters(currency);
  const titleRef = useTakeoverFocus<HTMLHeadingElement>();
  const multi = preview.lines.length > 1;

  return (
    <section className={styles.wrap} aria-labelledby="exit-title">
      <button type="button" className={styles.back} onClick={onCancel}>
        <LucideIcon name="arrow-left" size={16} />
        <FormattedMessage id="common.back" />
      </button>

      <h1 id="exit-title" ref={titleRef} tabIndex={-1} className={styles.title}>
        <FormattedMessage id="exitCeremony.title" />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage
          id={multi ? 'exitCeremony.subtitleGoal' : 'exitCeremony.subtitlePosition'}
        />
      </p>

      <div className={styles.goalRow}>
        <span className={styles.goalIcon}>
          <LucideIcon name={goalIcon} size={20} />
        </span>
        <span className={styles.goalBody}>
          <span className={styles.goalName}>{goalName}</span>
          <span className={styles.goalLabel}>
            <FormattedMessage
              id={multi ? 'exitCeremony.positionsCount' : 'exitCeremony.onePosition'}
              values={{ count: preview.lines.length }}
            />
          </span>
        </span>
      </div>

      {/* The ink card: the manifest gravity surface (the same visual weight the
          entry manifest uses — money moving always looks the same here). */}
      <div className={styles.card}>
        <div className={styles.grossRow}>
          <span>
            <FormattedMessage id="exitCeremony.gross" />
          </span>
          <span className={styles.grossValue}>{money(preview.gross)}</span>
        </div>

        <p className={styles.feesLabel}>
          <FormattedMessage id="exitCeremony.feesLabel" />
        </p>

        <div className={styles.feeRow}>
          <span className={styles.feeName}>
            <FormattedMessage
              id="exitCeremony.diboasFee"
              values={{
                rate: intl.formatNumber(FEE_RATES.exit.toNumber(), {
                  style: 'percent',
                  maximumFractionDigits: 2,
                }),
              }}
            />
            <span className={styles.feeSub}>
              <FormattedMessage
                id="exitCeremony.minimumSub"
                values={{ min: money(EXIT_FEE_FLOOR[currency].toNumber()) }}
              />
            </span>
          </span>
          <span className={styles.feeValue}>−{money(preview.exitFee)}</span>
        </div>

        <div className={styles.feeRow}>
          <span className={styles.feeName}>
            <FormattedMessage id="exitCeremony.networkCost" />
            {/* Gas is a fixture in the sandbox — the label says so rather than
                implying a quoted on-chain price. */}
            <span className={styles.feeSub}>
              <FormattedMessage id="exitCeremony.estimated" />
            </span>
          </span>
          <span className={styles.feeValue}>−{money(preview.networkFee)}</span>
        </div>

        {/* Board §3.3: with more than one position the composition is shown,
            because N floors and N network fees are real costs the summed rows
            would hide. */}
        {multi ? (
          <ul className={styles.lines}>
            {preview.lines.map((line) => (
              <li key={line.positionId} className={styles.line}>
                <span className={styles.lineName}>
                  <FormattedMessage id={`catalog.strategies.${line.strategyId}.name`} />
                </span>
                <span className={styles.lineValue}>
                  <FormattedMessage
                    id="exitCeremony.lineBreakdown"
                    values={{
                      gross: money(line.gross),
                      fee: money(line.exitFee),
                      network: money(line.networkFee),
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.netRow}>
          <span>
            <FormattedMessage id="exitCeremony.net" />
          </span>
          <span className={styles.netValue}>{money(preview.net)}</span>
        </div>

        <div className={styles.landsRow}>
          <span className={styles.landsIcon}>
            <LucideIcon name="wallet" size={18} />
          </span>
          <span>
            <span className={styles.landsTitle}>
              <FormattedMessage id="exitCeremony.whereItLands" />
            </span>
            <span className={styles.landsBody}>
              <FormattedMessage
                id="exitCeremony.landsBody"
                values={{ amount: money(preview.net), goal: goalName }}
              />
            </span>
          </span>
        </div>
      </div>

      {/* Veto row 13 (no emphasis on the option that earns diBoaS more): the
          exit fee IS diBoaS revenue, so the primary fill here has to be
          justified by something other than that. It is — the user already
          chose to stop, and the primary confirms THEIR stated intent, the same
          way the pause sheet's primary confirms pausing (which earns nothing).
          What the emphasis must never do is shame the alternative or make it
          harder to reach: "Keep it working" is a full-width button of the same
          size and one tap, directly below, worded as a plain fact (row 24). */}
      <div className={styles.actions}>
        <Button variant="primary" fullWidth disabled={busy} onClick={onConfirm}>
          <FormattedMessage id={multi ? 'exitCeremony.stopGoal' : 'exitCeremony.stopPosition'} />
        </Button>
        <Button variant="secondary" fullWidth disabled={busy} onClick={onCancel}>
          <FormattedMessage id="exitCeremony.cancel" />
        </Button>
      </div>
    </section>
  );
}
