/**
 * The D-s simulated-event catalogue — config-as-data, VERSIONED (RD-9).
 * Life events only, never market events (H-3.4). Sizing is config relative to
 * the user's own flow (the weekly credit), never a hardcoded amount; the
 * attested constants in `growthConstants` are the single source. A resolved
 * event's platform record pins the catalogue version it resolved under, so
 * history replays honestly across future catalogue changes (the money legs
 * carry concrete amounts and are catalogue-independent by construction).
 *
 * R1 ships ONE event: the unexpected expense (challenge week 3, 14.8). The
 * P1 library adds the rest (goal-cost increase, extra income, expense
 * reduction, guided emergency-fund usage) under this same shape.
 */
import { SIM_EVENT_DEFAULT_MULTIPLE, SIM_EVENT_SIZING } from '@/lib/growthConstants';

export const SIMULATED_EVENT_CATALOGUE_VERSION = 1;

export type SimulatedEventType = 'unexpected_expense';

export interface SimulatedEventDefinition {
  type: SimulatedEventType;
  wave: 'R1';
  direction: 'expense' | 'income';
  /** Relative-to-flow sizing (RD-9): multiples of the weekly credit. */
  sizing: {
    basis: 'weeklyCredit';
    minMultiple: number;
    maxMultiple: number;
    /** The deterministic R1 magnitude (mid-band, P2BD-12). */
    defaultMultiple: number;
  };
  /**
   * i18n copy-key stems for the option rows (resolved by G11's surface).
   * Postpone is NOT an option — it is the lifecycle's standing affordance
   * (postponed-forever, no nag, no expiry).
   */
  optionKeys: string[];
}

export const SIMULATED_EVENT_CATALOGUE: {
  version: number;
  events: SimulatedEventDefinition[];
} = {
  version: SIMULATED_EVENT_CATALOGUE_VERSION,
  events: [
    {
      type: 'unexpected_expense',
      wave: 'R1',
      direction: 'expense',
      sizing: {
        basis: 'weeklyCredit',
        minMultiple: SIM_EVENT_SIZING.minWeeklyMultiple,
        maxMultiple: SIM_EVENT_SIZING.maxWeeklyMultiple,
        defaultMultiple: SIM_EVENT_DEFAULT_MULTIPLE,
      },
      // 14.8: 2–4 options incl. use-the-emergency-goal — never judged.
      optionKeys: ['coverFromAvailable', 'useReserve'],
    },
  ],
};
