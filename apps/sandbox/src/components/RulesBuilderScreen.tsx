'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Decimal from 'decimal.js';
import { FormattedMessage, useIntl } from 'react-intl';
import { allocateByRule, isValidRuleSplit } from '@diboas/investing';
import { weeklyCreditAmount } from '@/lib/growthConstants';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { createRule, updateRule } from '@/lib/ledgerClient';
import { getCollectView } from '@/lib/weeklyCycle';
import { Button } from './Button';
import { LucideIcon } from './LucideIcon';
import styles from './RulesBuilderScreen.module.css';

/** The builder offers three destination rows (mockup 20). */
const ROWS = [0, 1, 2] as const;

interface Row {
  goalId: string;
  percent: number;
}

/**
 * G9 — the rules builder (§4.9; mockup 20, spec `batch-3-time-history-rules.md`
 * §3.4). "Your system": where each incoming dollar goes before the user has to
 * think about it.
 *
 * Everything here is built NOT to steer (anti-slop Part 3):
 * - every row starts at **0% with no destination chosen** — a pre-filled split
 *   is a default that earns someone else's outcome (veto rows 13 and 17), so
 *   the builder opens empty and the user does the deciding;
 * - the remainder is **auto-computed and always visible** as "stays in
 *   Available", never silently absorbed — the engine leaves it there by
 *   construction (`allocateByRule` floor-then-remainder), and this surface just
 *   states it;
 * - the live preview runs on the user's REAL waiting credits, so the number
 *   they are deciding about is their own, not an illustration.
 *
 * DEFERRED, on a binding condition: the "one cautious example" card. Ruling
 * 5.84 permits a diBoaS-proposed example ONLY with (1) attested constants,
 * (2) conservative-leads, (3) the "a starting example — yours to change"
 * label, (4) fully ignorable and never revenue-linked. Condition (1) is not
 * met — no attestation entry exists for a split, and the mockup's percentages
 * are not a source (batch-3: "judge layout/mood not text, real constants
 * only"). Suggested allocations are Class-B product judgment per the
 * Money-Jobs taxonomy, so they are the founder's to ratify, not mine to
 * invent. The card lands with its attestation; the rest of G9 does not wait.
 */
export function RulesBuilderScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const router = useRouter();
  const state = useLedger();
  const { money } = useFormatters(state.currency);

  /**
   * One active rule per account (W-19a), so this screen both CREATES and EDITS.
   * The engine is explicit that "creating anew = editing; the UI goes through
   * `updateRule`" — `createRule` returns null when a rule already exists. Before
   * this, the CTA stayed enabled in that case, created nothing, and navigated
   * away as though it had worked: a fake control on a money surface.
   *
   * The ledger is hydrated before this screen mounts (`LedgerReadyGate`), so a
   * lazy initial read is accurate. Seeding from the user's OWN saved system is
   * not a pre-filled default (veto row 13) — it is showing them what they
   * already chose; the no-suggestion rule governs what diBoaS proposes.
   */
  const existing = state.rules.find((r) => r.status !== 'deleted') ?? null;
  const [rows, setRows] = useState<Row[]>(() => {
    const seeded = (existing?.split ?? []).slice(0, ROWS.length);
    return ROWS.map((i) => seeded[i] ?? { goalId: '', percent: 0 });
  });
  const [busy, setBusy] = useState(false);

  const openGoals = state.goals.filter((g) => g.status === 'active');
  const split = rows.filter((r) => r.goalId !== '' && r.percent > 0);
  const allocatedPercent = split.reduce((sum, r) => sum + r.percent, 0);
  const remainderPercent = Math.max(0, 100 - allocatedPercent);
  const canCreate = isValidRuleSplit(split) && !busy;

  /**
   * The preview's base: what is actually waiting to be collected. Zero is a
   * real answer — the preview then shows zeroes rather than an invented
   * illustration figure, because the label promises "your real waiting
   * credits" and must not quietly become a demo.
   */
  const waitingWeeks = getCollectView(state, new Date().toISOString()).weeks.length;
  const waiting = new Decimal(weeklyCreditAmount(state.mode)).mul(waitingWeeks);
  const allocation = allocateByRule(waiting.toNumber(), split);
  const distributed = waiting.minus(allocation.remainderToAvailable);

  function setRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  /** Steppers move in whole points and never past what is left unallocated. */
  function step(index: number, delta: number) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const othersTotal = prev.reduce((s, o, j) => (j === i ? s : s + o.percent), 0);
        const next = Math.min(Math.max(r.percent + delta, 0), 100 - othersTotal);
        return { ...r, percent: next };
      })
    );
  }

  function save() {
    if (!canCreate) return;
    setBusy(true);
    if (existing) updateRule(existing.ruleId, split, existing.ruleVersion);
    else createRule(split);
    setBusy(false);
    router.push(`/${locale}`);
  }

  return (
    <section className={styles.wrap} aria-labelledby="rules-title">
      <h1 id="rules-title" className={styles.title}>
        <FormattedMessage id="rules.title" />
      </h1>
      <p className={styles.subtitle}>
        <FormattedMessage id="rules.subtitle" />
      </p>

      {openGoals.length === 0 ? (
        /* Row 19: never a dead end — a builder with nothing to build toward
           states why and points at the one action that changes it. */
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            <FormattedMessage id="rules.noGoalsTitle" />
          </p>
          <p className={styles.emptyBody}>
            <FormattedMessage id="rules.noGoalsBody" />
          </p>
          <Button variant="primary" fullWidth onClick={() => router.push(`/${locale}/goals/new`)}>
            <FormattedMessage id="rules.createGoal" />
          </Button>
        </div>
      ) : (
        <>
          <h2 className={styles.sectionLabel}>
            <FormattedMessage id="rules.sendTo" />
          </h2>

          <ul className={styles.rows}>
            {ROWS.map((i) => {
              const row = rows[i];
              const othersTotal = rows.reduce((s, o, j) => (j === i ? s : s + o.percent), 0);
              const selectId = `rules-dest-${i}`;
              return (
                <li key={i} className={styles.row}>
                  <span className={styles.rowNum} aria-hidden>
                    {i + 1}
                  </span>
                  <label className={styles.srOnly} htmlFor={selectId}>
                    {intl.formatMessage({ id: 'rules.destinationLabel' }, { n: i + 1 })}
                  </label>
                  <select
                    id={selectId}
                    className={styles.select}
                    value={row.goalId}
                    onChange={(e) => setRow(i, { goalId: e.target.value })}
                  >
                    <option value="">
                      {intl.formatMessage({ id: 'rules.chooseDestination' })}
                    </option>
                    {openGoals
                      .filter(
                        (g) => g.goalId === row.goalId || !rows.some((r) => r.goalId === g.goalId)
                      )
                      .map((g) => (
                        <option key={g.goalId} value={g.goalId}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => step(i, -1)}
                      disabled={row.percent <= 0}
                      aria-label={intl.formatMessage({ id: 'rules.decrease' }, { n: i + 1 })}
                    >
                      <LucideIcon name="minus" size={16} />
                    </button>
                    <span className={styles.percent} aria-live="polite">
                      {intl.formatNumber(row.percent / 100, { style: 'percent' })}
                    </span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => step(i, 1)}
                      disabled={row.percent >= 100 - othersTotal}
                      aria-label={intl.formatMessage({ id: 'rules.increase' }, { n: i + 1 })}
                    >
                      <LucideIcon name="plus" size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* The remainder is a fact of the engine, shown rather than hidden. */}
          <div className={styles.remainder}>
            <span className={styles.remainderBody}>
              <span className={styles.remainderTitle}>
                <FormattedMessage id="rules.staysInAvailable" />
              </span>
              <span className={styles.remainderNote}>
                <FormattedMessage id="rules.staysNote" />
              </span>
            </span>
            <span className={styles.remainderValue}>
              {intl.formatNumber(remainderPercent / 100, { style: 'percent' })}
            </span>
          </div>

          <div className={styles.preview}>
            <p className={styles.previewHead}>
              <LucideIcon name="eye" size={16} />
              <FormattedMessage id="rules.livePreview" />
              <span className={styles.previewBasis}>
                <FormattedMessage id="rules.previewBasis" />
              </span>
            </p>
            <dl className={styles.previewRows}>
              <div className={styles.previewRow}>
                <dt>
                  <FormattedMessage id="rules.waitingCredits" />
                </dt>
                <dd>{money(waiting.toFixed(2))}</dd>
              </div>
              <div className={styles.previewRow}>
                <dt>
                  <FormattedMessage id="rules.willBeDistributed" />
                </dt>
                <dd>{money(distributed.toFixed(2))}</dd>
              </div>
              <div className={styles.previewRow}>
                <dt>
                  <FormattedMessage id="rules.staysInAvailable" />
                </dt>
                <dd className={styles.previewRemainder}>
                  {money(new Decimal(allocation.remainderToAvailable).toFixed(2))}
                </dd>
              </div>
            </dl>
            {waitingWeeks === 0 ? (
              <p className={styles.previewNote}>
                <FormattedMessage id="rules.noWaitingCredits" />
              </p>
            ) : (
              <p className={styles.previewNote}>
                <FormattedMessage id="rules.previewNote" />
              </p>
            )}
          </div>

          <Button variant="primary" fullWidth disabled={!canCreate} onClick={save}>
            <FormattedMessage id={existing ? 'rules.update' : 'rules.create'} />
          </Button>
          {!canCreate && !busy ? (
            /* A disabled control always says why (the §4.6/§4.7 precedent). */
            <p className={styles.hint}>
              <FormattedMessage id="rules.createHint" />
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
