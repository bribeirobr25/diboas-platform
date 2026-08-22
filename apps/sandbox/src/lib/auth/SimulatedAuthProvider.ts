import {
  SANDBOX_GATE_COOKIE,
  gateCookieOptions,
  gateGrantToken,
  isGateConfigured,
  isPublicAccess,
  verifyGateCookie,
} from '@/lib/gate';
import type { IAuthProvider, Identity, SessionGrant } from './types';

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
    return isPublicAccess() || isGateConfigured();
  }

  /**
   * In public mode everyone is the same anonymous visitor — which is honest
   * about what exists today: there are no accounts, and the ledger is
   * device-local. The check lives HERE rather than at the call sites so the
   * "who may enter" seam stays single; Auth.js replaces this whole class.
   */
  verifySession(cookieValue: string | undefined | null): Identity | null {
    if (isPublicAccess()) return { subject: GATE_SUBJECT };
    return verifyGateCookie(cookieValue) ? { subject: GATE_SUBJECT } : null;
  }

  /**
   * MVP-0 session establishment: the gate grant (a single shared identity), so
   * `method` is ignored here. The gate coupling lives INSIDE this provider —
   * the AuthjsProvider that replaces it (and lets MVP-0/gate be deleted) does
   * the real per-method handshake without changing the call site.
   */
  establishSession(_method?: string): SessionGrant | null {
    const cookieValue = gateGrantToken();
    if (!cookieValue) return null; // fail-closed when unconfigured
    return {
      cookieName: SANDBOX_GATE_COOKIE,
      cookieValue,
      cookieOptions: gateCookieOptions(),
    };
  }
}
