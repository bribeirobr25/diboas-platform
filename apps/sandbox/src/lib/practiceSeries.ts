import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';

/** One step of the practice value line: the simulated day and the total then. */
export interface ValuePoint {
  simDay: number;
  value: number;
}

/**
 * The value line split into the terms that produced it (`5.199`).
 *
 * ## Why this exists
 *
 * The screen used to render `end − start` as "Change +X (+Y%)" directly above
 * the words *"It excludes future contributions and weekly credits."* Both
 * cannot be true: the line folds `RecurringContributionApplied.amount` in, so a
 * 200/month plan over a year put 2,400 of the user's own deposits into a 2,520
 * "change" — **95% of the headline was the user's own money**, and the
 * percentage was not a return at all.
 *
 * So the terms are derived from the same walk that builds the line, and they
 * SUM to the change by construction rather than by arithmetic luck — the
 * `monthReport.ts` pattern, for the same reason: a screen may only claim to
 * explain a figure if its parts provably add up to it.
 *
 *   end − start = market + contributed + entered − exited
 *
 * `market` is the only term that is *what the market did*. `contributed` and
 * `entered`/`exited` are the user's own acts, and UX-63 exists so those are
 * never presented as growth.
 */
export interface PracticeDecomposition {
  /** The value line itself, stepped at every event that moved money. */
  points: ValuePoint[];
  /** First point of the line, or 0 when there is no history. */
  start: number;
  /** Last point of the line, or 0 when there is no history. */
  end: number;
  /** Accruals only — what the market actually did. May be negative. */
  market: number;
  /** The user's recurring deposits into open positions. Never negative. */
  contributed: number;
  /** Principal that entered a strategy after the line began. */
  entered: number;
  /** Principal removed by exits after the line began. */
  exited: number;
  /**
   * Whether `market + contributed + entered − exited` equals `end − start`
   * to the cent. False means the walk saw something these terms do not model,
   * and **the screen must not present the split as an explanation** — the same
   * fail-closed contract `monthReport.identityHolds` carries.
   */
  identityHolds: boolean;
}

/**
 * The value of money AT WORK across the whole practice ledger, stepped at every
 * event that actually moved it (§4.8 G8).
 *
 * Deliberately excludes goal cash and Available: the time machine answers "what
 * did the market do to the money I had working", so counting idle cash would
 * flatten the very movement the screen exists to show. It also means the line
 * is not a balance chart — the copy says so ("excludes your future
 * contributions and weekly credits"), and this is the function that makes that
 * statement true rather than decorative.
 *
 * Derived from the event log on every call — never stored, so it cannot drift
 * from the ledger it describes.
 */
export function practiceValueSeries(state: LedgerState): ValuePoint[] {
  return decomposePracticeValue(state).points;
}

/**
 * The value line AND its terms, from one walk of the log (`5.199`).
 *
 * Derived on every call — never stored, so it cannot drift from the ledger it
 * describes. `practiceValueSeries` is kept as the thin line-only accessor its
 * existing callers use.
 */
export function decomposePracticeValue(state: LedgerState): PracticeDecomposition {
  const perPosition = new Map<string, Decimal>();
  const points: ValuePoint[] = [];
  let simDay = 0;
  /* The terms, accumulated in the same pass that builds the line so the two
     can never describe different logs. `entered` counts only principal that
     arrives AFTER the line has a first point — the opening position IS the
     start value, not a change to it. */
  let market = new Decimal(0);
  let contributed = new Decimal(0);
  let entered = new Decimal(0);
  let exited = new Decimal(0);

  const push = () => {
    const total = [...perPosition.values()].reduce((acc, v) => acc.plus(v), new Decimal(0));
    const last = points[points.length - 1];
    if (last && last.simDay === simDay) last.value = total.toNumber();
    else points.push({ simDay, value: total.toNumber() });
  };

  for (const e of state.events) {
    switch (e.type) {
      case 'StrategyEntered':
        if (points.length > 0) entered = entered.plus(e.amount);
        perPosition.set(e.positionId, new Decimal(e.amount));
        simDay = e.simDay;
        push();
        break;
      case 'AccrualApplied': {
        const current = perPosition.get(e.positionId);
        if (!current) break;
        market = market.plus(e.earnings);
        perPosition.set(e.positionId, current.plus(e.earnings));
        simDay = e.toSimDay;
        push();
        break;
      }
      case 'RecurringContributionApplied': {
        const current = perPosition.get(e.positionId);
        if (!current) break;
        contributed = contributed.plus(e.amount);
        perPosition.set(e.positionId, current.plus(e.amount));
        simDay = e.onSimDay;
        push();
        break;
      }
      case 'StrategyExited': {
        const held = perPosition.get(e.positionId);
        if (held) exited = exited.plus(held);
        perPosition.delete(e.positionId);
        simDay = e.simDay;
        push();
        break;
      }
      default:
        break;
    }
  }
  const start = points[0]?.value ?? 0;
  const end = points[points.length - 1]?.value ?? 0;
  /* Check the identity before anyone renders the split. Cent tolerance, not
     exact equality: the terms are Decimal but the line is stored as numbers. */
  const explained = market.plus(contributed).plus(entered).minus(exited);
  const identityHolds = explained.minus(new Decimal(end).minus(start)).abs().lte(0.01);

  return {
    points,
    start,
    end,
    market: market.toNumber(),
    contributed: contributed.toNumber(),
    entered: entered.toNumber(),
    exited: exited.toNumber(),
    identityHolds,
  };
}

/** How the stretch went — the input to the honest "how it changed" sentence. */
export type ValueTrend = 'grew' | 'fell' | 'flat';

/**
 * Classify a stretch. `flat` is a real answer, not a rounding artefact: below
 * a tenth of a percent, claiming either direction would overstate what the
 * market did.
 */
export function classifyTrend(start: number, end: number): ValueTrend {
  if (start <= 0) return 'flat';
  const change = (end - start) / start;
  if (Math.abs(change) < 0.001) return 'flat';
  return change > 0 ? 'grew' : 'fell';
}
