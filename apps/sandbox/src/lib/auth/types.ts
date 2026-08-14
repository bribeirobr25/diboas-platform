/**
 * The sandbox "who may enter" seam (Principle 3 — service-agnostic).
 *
 * ONE interface, two implementations selected by a factory (never a mode flag):
 *  - MVP-0  `SimulatedAuthProvider` — wraps the shared-password gate (`lib/gate`).
 *  - Stage-1 `AuthjsProvider` — real accounts via Auth.js v5 (4 methods, Neon).
 *
 * The enforcement point (`(app)/layout.tsx` + each data-producing route, F22)
 * depends ONLY on this interface, so the gate → Auth.js swap changes nothing at
 * the call sites. Keep this file free of provider/vendor imports.
 */

/** The authenticated subject. MVP-0: a constant gate-session marker (the gate
 *  is a single shared identity). Stage-1: the account id (+ profile later). */
export interface Identity {
  readonly subject: string;
}

/** The session cookie a provider issues on sign-in — vendor-free so the seam
 *  stays import-clean; the caller (a server action) performs the cookie I/O. */
export interface SessionGrant {
  readonly cookieName: string;
  readonly cookieValue: string;
  readonly cookieOptions: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    maxAge?: number;
    path?: string;
  };
}

export interface IAuthProvider {
  /** Fail-closed check: is this provider configured to grant access at all? */
  isConfigured(): boolean;
  /** The cookie the layout reads for the session/grant token. */
  readonly sessionCookieName: string;
  /** Verify a request's session/grant cookie → an Identity, or null (deny). */
  verifySession(cookieValue: string | undefined | null): Identity | null;
  /**
   * Establish a session on sign-in (the WRITE half of the seam). Returns the
   * cookie to set, or null if the provider cannot grant (fail-closed). MVP-0
   * wraps the gate grant; Stage-1 (Auth.js) does the real OAuth/OTP/wallet
   * handshake before returning the session cookie — the call site is unchanged.
   */
  establishSession(method?: string): SessionGrant | null;
}
