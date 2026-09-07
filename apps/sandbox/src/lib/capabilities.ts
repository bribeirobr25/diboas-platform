/**
 * Capability flags — the "what may exist here" seam (implementation plan r2,
 * I-0b / I-1 precursor; founder decision F-4, 2026-09-07).
 *
 * Every flag is an EXPLICIT opt-in read server-side with a strict `=== 'true'`
 * (the `SANDBOX_PUBLIC_ACCESS` rule: `TRUE`, `1`, `' true'` all keep it shut —
 * table-tested in `__tests__/capabilities.test.ts`). Nothing is inferred from a
 * missing value. Two flags carry DIFFERENT production semantics, on purpose:
 *
 * - `PRACTICE_ACCOUNTS_ENABLED` — persistent Practice accounts and the Legal
 *   readiness architecture that precedes them. Production OFF **until an
 *   explicit later Legal / Founder public-release clearance** (LC-TD-02 §9.3).
 *   The code supports that activation; nothing here implies it is authorized
 *   now. There is deliberately NO permanent production refusal.
 * - `REAL_PARITY_INTERNAL` (I-8) — production OFF / NOT AUTHORIZED under
 *   current authority: a production deployment REFUSES the flag.
 *
 * The capability registry proper (I-1) replaces direct env reads with
 * `can(capability)`; these helpers are the seam it will sit behind.
 */

/** A plain env map — tests pass literals; production passes `process.env`. */
export type Env = Readonly<Record<string, string | undefined>>;

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

/** A production deployment, as Vercel defines it. Local `next start` is not one. */
export function isProductionDeployment(env: Env = process.env): boolean {
  return env.VERCEL_ENV === 'production';
}

/** Persistent-account architecture (incl. the Legal readiness screen) may render. */
export function isPracticeAccountsEnabled(env: Env = process.env): boolean {
  return isTrue(env.PRACTICE_ACCOUNTS_ENABLED);
}

/**
 * Real Money parity through pre-authorization (I-8). Production refuses it
 * regardless of the flag — Legal ring: Real public availability = WAIT.
 */
export function isRealParityInternal(env: Env = process.env): boolean {
  return isTrue(env.REAL_PARITY_INTERNAL) && !isProductionDeployment(env);
}
