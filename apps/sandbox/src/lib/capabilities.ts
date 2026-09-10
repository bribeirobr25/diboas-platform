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
 * Four policies, and the differences between them are Legal, not style:
 *
 * - `ALLOWED_IN_PRODUCTION` — the flag means the same everywhere. Only
 *   `publicAccess` holds it, by the founder's 2026-08-22 decision.
 * - `REQUIRES_CLEARANCE` — production activation is *possible but not default*.
 *   The flag alone is enough; the boundary is an authority decision recorded
 *   outside the code (LC-TD-02 §9.3 / F-4). `practiceAccounts` is this.
 * - `REFUSED_IN_PRODUCTION` — production refuses the flag outright, because
 *   there is no authorized production use. `realParityInternal` is this (Real
 *   public availability = WAIT), and a PREVIEW deployment may still carry it:
 *   an internal parity build is what preview is for.
 * - `REFUSED_IN_ANY_DEPLOYMENT` — refused on production AND preview, because
 *   the promise attached to the flag is about *deployments*, not about
 *   production alone. `insecureGateCookie` is this: its own docstring says
 *   "NEVER set it in a deployed env", and a preview deployment is one.
 *
 * ## What is deliberately NOT in the registry
 *
 * `SANDBOX_GEO_ENABLED` and `SANDBOX_GEO_OVERRIDE` (`middleware.ts`) are NOT
 * capabilities and must not be moved here as they stand. `GEO_ENABLED` is an
 * inverted kill-switch (default ON, `!== 'false'`), not an opt-in. And
 * `GEO_OVERRIDE` is guarded by `NODE_ENV !== 'production'`, which is STRICTER
 * than anything below — it also refuses a local `next start` — so registering
 * it under any policy here would RELAX a covenant control (the CN/RU/KP
 * geofence). Bringing them in needs its own pass; register `5.269`.
 *
 * ⚑ **`5.228` proposed adding `&& !isProductionDeployment(env)` to BOTH
 * `SANDBOX_GATE_ALLOW_INSECURE` and `isPracticeAccountsEnabled`. Half of that is
 * wrong.** For `practiceAccounts` a permanent refusal would contradict F-4 /
 * LC-TD-02 §9.3 — *OFF until clearance, not never* — and would break the test
 * that already guards it (`should ALLOW accounts in production when explicitly
 * cleared later`). The genuinely unguarded hatch was the gate cookie, and that
 * one is now `REFUSED_IN_ANY_DEPLOYMENT`. The register row is corrected.
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
 * ANY deployed environment — production or preview. A local `next start` and
 * `next dev` are not deployments, which is what keeps the Docker MCP LAN
 * protocol working.
 *
 * Both this and `isProductionDeployment` read `VERCEL_ENV`, a Vercel *system*
 * environment variable. It is exposed by default, and the project relies on
 * that; if it were ever turned off, both predicates would read `undefined` and
 * report "not a deployment". Stated rather than assumed. `NODE_ENV` is NOT a
 * usable substitute here: a local production build sets it to `production`, so
 * using it would refuse exactly the local case the flag exists for.
 */
export function isDeployment(env: Env = process.env): boolean {
  return env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview';
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

/** What a DEPLOYED environment does with a capability's flag. */
export type DeploymentPolicy =
  | 'ALLOWED_IN_PRODUCTION'
  | 'REQUIRES_CLEARANCE'
  | 'REFUSED_IN_PRODUCTION'
  | 'REFUSED_IN_ANY_DEPLOYMENT';

/** Every capability the app has. Adding one to the union forces a table entry. */
export type Capability =
  'publicAccess' | 'practiceAccounts' | 'realParityInternal' | 'insecureGateCookie';

interface CapabilitySpec {
  /** The environment variable. Read with a strict `=== 'true'`, never inferred. */
  readonly env: string;
  readonly deployment: DeploymentPolicy;
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
    deployment: 'ALLOWED_IN_PRODUCTION',
    because:
      'Founder decision 2026-08-22: ship the practice app publicly at app.diboas.com before real auth exists. The geofence, noindex and the R-4 label are unaffected.',
  },
  practiceAccounts: {
    env: 'PRACTICE_ACCOUNTS_ENABLED',
    deployment: 'REQUIRES_CLEARANCE',
    because:
      'LC-TD-02 §9.3 / F-4: production OFF until an explicit later Legal / Founder public-release clearance — OFF until clearance, NOT never. A permanent refusal here would foreclose an authorized activation.',
  },
  realParityInternal: {
    env: 'REAL_PARITY_INTERNAL',
    deployment: 'REFUSED_IN_PRODUCTION',
    because:
      'Legal: Real public availability = WAIT. There is no authorized production use, so the deployment refuses the flag rather than trusting configuration.',
  },
  insecureGateCookie: {
    env: 'SANDBOX_GATE_ALLOW_INSECURE',
    deployment: 'REFUSED_IN_ANY_DEPLOYMENT',
    because:
      'It drops the `secure` cookie flag so the Docker MCP browser can reach the app over a plain-http LAN IP. Its own docstring says NEVER set it in a deployed env — a PREVIEW is one — so the refusal covers every deployment, not production alone (5.228).',
  },
};

/**
 * The single question every consumer asks. Explicit opt-in plus the
 * capability's production policy — no consumer re-implements either half.
 */
export function can(capability: Capability, env: Env = process.env): boolean {
  const spec = CAPABILITIES[capability];
  if (!isTrue(env[spec.env])) return false;
  // A switch, not a boolean chain: with a declared `boolean` return under
  // `strict`, a policy added to the union without a case here fails to compile.
  switch (spec.deployment) {
    case 'REFUSED_IN_ANY_DEPLOYMENT':
      return !isDeployment(env);
    case 'REFUSED_IN_PRODUCTION':
      return !isProductionDeployment(env);
    case 'REQUIRES_CLEARANCE':
    case 'ALLOWED_IN_PRODUCTION':
      return true;
  }
}
