import { SANDBOX_GATE_COOKIE, isGateConfigured, verifyGateCookie } from '@/lib/gate';
import type { IAuthProvider, Identity } from './types';

/**
 * MVP-0 auth provider — the shared-password gate behind the seam. It IS the
 * "SimulatedAuthProvider" the gate docstring names: it wraps `lib/gate`'s
 * fail-closed HMAC-grant-cookie check and presents it as an `IAuthProvider`, so
 * the Stage-1 `AuthjsProvider` can replace it without touching the call sites.
 *
 * The gate is a single shared identity (not per-user), so a valid grant maps to
 * one constant subject. Real per-user identities arrive with Auth.js.
 */
const GATE_SUBJECT = 'sandbox-gate';

export class SimulatedAuthProvider implements IAuthProvider {
  readonly sessionCookieName = SANDBOX_GATE_COOKIE;

  isConfigured(): boolean {
    return isGateConfigured();
  }

  verifySession(cookieValue: string | undefined | null): Identity | null {
    return verifyGateCookie(cookieValue) ? { subject: GATE_SUBJECT } : null;
  }
}
