import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';

/** One step of the practice value line: the simulated day and the total then. */
export interface ValuePoint {
  simDay: number;
  value: number;
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
  const perPosition = new Map<string, Decimal>();
  const points: ValuePoint[] = [];
  let simDay = 0;

  const push = () => {
    const total = [...perPosition.values()].reduce((acc, v) => acc.plus(v), new Decimal(0));
    const last = points[points.length - 1];
    if (last && last.simDay === simDay) last.value = total.toNumber();
    else points.push({ simDay, value: total.toNumber() });
  };

  for (const e of state.events) {
    switch (e.type) {
      case 'StrategyEntered':
        perPosition.set(e.positionId, new Decimal(e.amount));
        simDay = e.simDay;
        push();
        break;
      case 'AccrualApplied': {
        const current = perPosition.get(e.positionId);
        if (!current) break;
        perPosition.set(e.positionId, current.plus(e.earnings));
        simDay = e.toSimDay;
        push();
        break;
      }
      case 'RecurringContributionApplied': {
        const current = perPosition.get(e.positionId);
        if (!current) break;
        perPosition.set(e.positionId, current.plus(e.amount));
        simDay = e.onSimDay;
        push();
        break;
      }
      case 'StrategyExited':
        perPosition.delete(e.positionId);
        simDay = e.simDay;
        push();
        break;
      default:
        break;
    }
  }
  return points;
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
