import type { IAuthProvider } from './types';
import { SimulatedAuthProvider } from './SimulatedAuthProvider';

/**
 * Auth-provider factory (Principle 3 — no mode flag). Selects the provider by
 * environment presence, the `hasDatabaseUrl()` pattern:
 *
 *   - Stage-1: when Auth.js is configured (AUTH_SECRET + DATABASE_URL present),
 *     return `AuthjsProvider` — real accounts, 4 methods.  [added in Phase 2]
 *   - MVP-0 (default): the shared-password `SimulatedAuthProvider`.
 *
 * A single instance is memoised per process.
 */
let instance: IAuthProvider | null = null;

export function getAuthProvider(): IAuthProvider {
  if (instance) return instance;
  // Phase 2 will branch here on env: if AuthjsProvider.isEnabled() → that;
  // else the simulated gate. Until Auth.js lands, always the gate.
  instance = new SimulatedAuthProvider();
  return instance;
}

/** Test-only: reset the memoised provider. */
export function __resetAuthProvider(): void {
  instance = null;
}
