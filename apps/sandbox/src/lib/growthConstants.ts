/**
 * Phase-2 Grow-engine tunables — the SINGLE SOURCE for the weekly-credit,
 * rules-engine, and simulated-event constants. Every §2.2/§2.3/§2.4 consumer
 * derives from here (config-single-source — never a literal in engine code).
 *
 * Provenance, honesty notes, and the split-fn contract:
 * `docs/sandbox-app/PHASE2_CONSTANTS_ATTESTATION.md`
 * (drift-guarded by `growthConstants.test.ts` — change the doc + the test
 * together, never one alone).
 *
 * Step-0 scaffold: defined now so the foundation increments import rather than
 * hardcode. The floor-then-remainder split FUNCTION is a documented contract in
 * the attestation, implemented + property-tested in §2.2 (D-r), not here.
 */
import { PLAY_MONEY_GRANT } from '@/i18n/config';

/** Weekly practice credit as a share of the first-run grant (WG-1). */
export const WEEKLY_CREDIT_RATE = 0.1;

/** Uncollected-credit ceiling: accrual caps at this multiple of the grant (bidirectional, board §2b). */
export const CREDIT_CEILING_MULTIPLE = 2;

/** Uncollected weeks stop accruing past this many days — the 2-week collection cap. */
export const COLLECTION_CAP_DAYS = 14;

/** Rule overlap policy: two rules may not both claim the same incoming money (D-r). */
export const RULE_OVERLAP_POLICY = 'forbid' as const;

/** Simulated-event money sizing, as a multiple range of the weekly credit (D-s). */
export const SIM_EVENT_SIZING = { minWeeklyMultiple: 1, maxWeeklyMultiple: 2 } as const;

type Mode = keyof typeof PLAY_MONEY_GRANT;

/** Weekly credit amount for a mode = grant × rate (derived, never a literal). */
export function weeklyCreditAmount(mode: Mode): number {
  return PLAY_MONEY_GRANT[mode] * WEEKLY_CREDIT_RATE;
}

/** Ceiling amount for a mode = grant × ceiling multiple. */
export function creditCeilingAmount(mode: Mode): number {
  return PLAY_MONEY_GRANT[mode] * CREDIT_CEILING_MULTIPLE;
}
