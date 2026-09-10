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
 * ## The registry (I-1 sub-phase 1b)
 *
 * `can(capability)` is now that registry: ONE place that names every capability,
 * its env variable, and its **production policy**. Direct `process.env` reads of
 * a capability flag are the thing it replaces — a raw read is invisible to the
 * table below, so a new flag could ship with no stated production semantics at
 * all. That is how `SANDBOX_GATE_ALLOW_INSECURE` came to have none.
 *
 * Three policies, and the difference between them is Legal, not style:
 *
 * - `ALLOWED_IN_PRODUCTION` — the flag means the same everywhere. Only
 *   `publicAccess` holds it, by the founder's 2026-08-22 decision.
 * - `REQUIRES_CLEARANCE` — production activation is *possible but not default*.
 *   The flag alone is enough; the boundary is an authority decision recorded
 *   outside the code (LC-TD-02 §9.3 / F-4). `practiceAccounts` is this.
 * - `REFUSED_IN_PRODUCTION` — a production deployment refuses the flag outright,
 *   because there is no lawful production use of it. `realParityInternal` (Real
 *   public availability = WAIT) and `insecureGateCookie` (a LAN-testing escape
 *   hatch) are both this.
 *
 * ⚑ **`5.228` proposed adding `&& !isProductionDeployment(env)` to BOTH
 * `SANDBOX_GATE_ALLOW_INSECURE` and `isPracticeAccountsEnabled`. Half of that is
 * wrong.** For `practiceAccounts` a permanent refusal would contradict F-4 /
 * LC-TD-02 §9.3 — *OFF until clearance, not never* — and would break the test
 * that already guards it (`should ALLOW accounts in production when explicitly
 * cleared later`). The genuinely unguarded hatch was the gate cookie, and that
 * one is now `REFUSED_IN_PRODUCTION`. The register row is corrected.
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

/**
 * Persistent-account architecture (incl. the Legal readiness screen) may render.
 * Kept as a named helper because its call sites read better than `can(...)`;
 * the policy lives in the registry, not here.
 */
export function isPracticeAccountsEnabled(env: Env = process.env): boolean {
  return can('practiceAccounts', env);
}

/**
 * Real Money parity through pre-authorization (I-8). Production refuses it
 * regardless of the flag — Legal ring: Real public availability = WAIT.
 */
export function isRealParityInternal(env: Env = process.env): boolean {
  return can('realParityInternal', env);
}

// ─────────────────────────────────────────────────────────────────────────────
// The registry (1b)
// ─────────────────────────────────────────────────────────────────────────────

/** What a production deployment does with a capability's flag. */
export type ProductionPolicy =
  'ALLOWED_IN_PRODUCTION' | 'REQUIRES_CLEARANCE' | 'REFUSED_IN_PRODUCTION';

/** Every capability the app has. Adding one to the union forces a table entry. */
export type Capability =
  'publicAccess' | 'practiceAccounts' | 'realParityInternal' | 'insecureGateCookie';

interface CapabilitySpec {
  /** The environment variable. Read with a strict `=== 'true'`, never inferred. */
  readonly env: string;
  readonly production: ProductionPolicy;
  /** Why the policy is what it is — the authority, not a restatement of the code. */
  readonly because: string;
}

/**
 * `Record<Capability, …>` on purpose: a new capability that forgets its
 * production policy is a **compile error**, not a silent `ALLOWED`. Same
 * technique as `project()`'s event exhaustiveness and `PROTOCOL_RETURN_MODEL`.
 */
export const CAPABILITIES: Record<Capability, CapabilitySpec> = {
  publicAccess: {
    env: 'SANDBOX_PUBLIC_ACCESS',
    production: 'ALLOWED_IN_PRODUCTION',
    because:
      'Founder decision 2026-08-22: ship the practice app publicly at app.diboas.com before real auth exists. The geofence, noindex and the R-4 label are unaffected.',
  },
  practiceAccounts: {
    env: 'PRACTICE_ACCOUNTS_ENABLED',
    production: 'REQUIRES_CLEARANCE',
    because:
      'LC-TD-02 §9.3 / F-4: production OFF until an explicit later Legal / Founder public-release clearance — OFF until clearance, NOT never. A permanent refusal here would foreclose an authorized activation.',
  },
  realParityInternal: {
    env: 'REAL_PARITY_INTERNAL',
    production: 'REFUSED_IN_PRODUCTION',
    because:
      'Legal: Real public availability = WAIT. There is no authorized production use, so the deployment refuses the flag rather than trusting configuration.',
  },
  insecureGateCookie: {
    env: 'SANDBOX_GATE_ALLOW_INSECURE',
    production: 'REFUSED_IN_PRODUCTION',
    because:
      'It drops the `secure` cookie flag so the Docker MCP browser can reach the app over a plain-http LAN IP. Its own docstring says NEVER set it in a deployed env; until 1b nothing enforced that (5.228).',
  },
};

/**
 * The single question every consumer asks. Explicit opt-in plus the
 * capability's production policy — no consumer re-implements either half.
 */
export function can(capability: Capability, env: Env = process.env): boolean {
  const spec = CAPABILITIES[capability];
  if (!isTrue(env[spec.env])) return false;
  return !(spec.production === 'REFUSED_IN_PRODUCTION' && isProductionDeployment(env));
}
