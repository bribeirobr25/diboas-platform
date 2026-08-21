'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import type { GoalState } from '@diboas/banking';
import { useFormatters } from '@/hooks/useFormatters';
import type { ExpenseImpact } from '@/lib/simulatedEvents';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './SimulatedEventScreen.module.css';

/** The mark for each option — the option's own meaning, not decoration. */
const OPTION_ICON = {
  coverFromAvailable: 'wallet',
  useReserve: 'shield',
  split: 'git-branch',
} as const;

/**
 * One option's impact card in the G11 preview (§4.11).
 *
 * Extracted from `SimulatedEventScreen` at the seam the CTO board named for
 * exactly this shape — *"split at the seams Stage D names as it is built, not
 * after"*. The host had ~150 lines living inside a single `.map`, and this is
 * a real boundary: one impact in, one card out, owning the screen's only local
 * interaction (the split field).
 *
 * The honesty properties live HERE so they travel with the card:
 * - every option renders through the SAME component, so none can quietly
 *   acquire extra visual weight and mark a "right answer" (D-s: the reserve
 *   path is never judged);
 * - while `pending`, no projected "after" is shown — before → before would
 *   read as a projection of "nothing changes" when nothing has been *chosen*;
 * - the split field opens empty, and the disabled CTA says why.
 */
export function ExpenseImpactCard({
  impact,
  goal,
  currency,
  currencySymbol,
  expenseAmount,
  splitValue,
  onSplitChange,
  onChoose,
}: {
  impact: ExpenseImpact;
  goal: GoalState | undefined;
  currency: 'USD' | 'BRL' | 'EUR';
  /** The LEDGER's symbol, never the locale's (the §4.7 defect). */
  currencySymbol: string;
  /** The whole expense — the split states its remainder against this. */
  expenseAmount: number;
  /** The raw typed string, so a half-entered value survives a re-render. */
  splitValue: string;
  onSplitChange: (goalId: string, raw: string) => void;
  onChoose: (impact: ExpenseImpact) => void;
}) {
  const intl = useIntl();
  /* Locale-formatted zero — "0,00" in pt-BR, not the hardcoded "0.00" that
     contradicted every other figure on the card. */
  const zeroPlaceholder = intl.formatNumber(0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const { money } = useFormatters(currency);

  const optionLabel = intl.formatMessage(
    { id: `simEvent.option.${impact.option}` },
    { goal: goal?.name ?? '' }
  );
  /**
   * What Available pays once the reserve has taken its share — derived from
   * the impact the domain already computed, never re-arithmetic'd from the
   * typed input, so the card cannot disagree with the figures above it.
   */
  const restFromAvailable =
    impact.goalCashBefore != null && impact.goalCashAfter != null
      ? expenseAmount - (impact.goalCashBefore - impact.goalCashAfter)
      : expenseAmount;

  return (
    <li className={styles.impact}>
      <div className={styles.impactHead}>
        <span className={styles.optionIcon}>
          <LucideIcon name={OPTION_ICON[impact.option]} size={20} />
        </span>
        <span className={styles.optionName}>{optionLabel}</span>
        {/* Labelled as a projection, always (Q3: never a promise). */}
        <span className={styles.projectionTag}>
          <FormattedMessage id="simEvent.projection" />
        </span>
      </div>

      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt>
            <FormattedMessage id="simEvent.available" />
          </dt>
          <dd>
            <span className={impact.pending ? styles.after : styles.before}>
              {money(impact.availableBefore.toFixed(2))}
            </span>
            {/* No arrow, no "after", until there IS one. */}
            {impact.pending ? null : (
              <>
                <LucideIcon name="arrow-right" size={14} />
                <span className={styles.after}>{money(impact.availableAfter.toFixed(2))}</span>
              </>
            )}
          </dd>
        </div>
        {impact.goalCashBefore != null && impact.goalCashAfter != null ? (
          <div className={styles.figure}>
            <dt>{goal?.name}</dt>
            <dd>
              <span className={impact.pending ? styles.after : styles.before}>
                {money(impact.goalCashBefore.toFixed(2))}
              </span>
              {impact.pending ? null : (
                <>
                  <LucideIcon name="arrow-right" size={14} />
                  <span className={styles.after}>{money(impact.goalCashAfter.toFixed(2))}</span>
                </>
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      {impact.option === 'split' && impact.bounds && impact.goalId ? (
        /* The user's own division (P2BD-17). A typed field, not a slider:
           UX-16 puts sliders on casual bounded inputs and precise money on a
           keypad. diBoaS states the BOUNDS — which are arithmetic — and
           nothing else: no default, no midpoint, no "suggested" mark, because
           any number here would be advice about someone's reserve. */
        <div className={styles.splitField}>
          <label className={styles.splitLabel} htmlFor={`split-${impact.goalId}`}>
            <FormattedMessage id="simEvent.splitLabel" values={{ goal: goal?.name ?? '' }} />
          </label>
          <div className={styles.amountInput}>
            <span className={styles.amountPrefix} aria-hidden>
              {currencySymbol}
            </span>
            <input
              id={`split-${impact.goalId}`}
              className={styles.amountField}
              type="number"
              inputMode="decimal"
              min={impact.bounds.min}
              max={impact.bounds.max}
              step="0.01"
              value={splitValue}
              onChange={(e) => onSplitChange(impact.goalId!, e.target.value)}
              placeholder={zeroPlaceholder}
              aria-describedby={`split-range-${impact.goalId}`}
            />
          </div>
          {/* The range is stated up front, not discovered by being rejected —
              and the rest-from-Available is spelled out so the split is never
              a number without a meaning. */}
          <p id={`split-range-${impact.goalId}`} className={styles.splitRange}>
            <FormattedMessage
              id="simEvent.splitRange"
              values={{
                min: money(impact.bounds.min.toFixed(2)),
                max: money(impact.bounds.max.toFixed(2)),
              }}
            />
          </p>
          {impact.pending ? null : (
            <p className={styles.splitRest}>
              <FormattedMessage
                id="simEvent.splitRest"
                values={{ rest: money(restFromAvailable.toFixed(2)) }}
              />
            </p>
          )}
        </div>
      ) : null}

      {impact.option === 'useReserve' ? (
        /* Neutral, never consoling and never warning: it is what a reserve is
           for. No amber, no "are you sure". */
        <p className={styles.didItsJob}>
          <FormattedMessage id="simEvent.reserveDidItsJob" />
        </p>
      ) : null}

      <Button
        variant="secondary"
        fullWidth
        disabled={Boolean(impact.pending)}
        onClick={() => onChoose(impact)}
        aria-label={intl.formatMessage({ id: 'simEvent.chooseLabel' }, { option: optionLabel })}
      >
        <FormattedMessage id="simEvent.choose" />
      </Button>
      {/* A disabled control always says why (the §4.6/§4.7/§4.9 precedent) —
          here the range line above is the answer, so this only names the
          missing step. */}
      {impact.pending ? (
        <p className={styles.splitHint}>
          <FormattedMessage id="simEvent.splitHint" />
        </p>
      ) : null}
    </li>
  );
}
