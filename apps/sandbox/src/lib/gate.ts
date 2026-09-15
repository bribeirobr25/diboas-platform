/**
 * Sandbox access gate (MVP-0) — the investor-room pattern, verbatim in spirit
 * (`apps/web/src/lib/security/investorGate.ts` lineage):
 *
 * - Single shared password: `SANDBOX_ACCESS_PASSWORD` (server-only env).
 * - Constant-time compare (no timing oracle).
 * - The cookie holds a derived grant token (HMAC-SHA256 keyed by the password
 *   itself), never the password — it rotates when the password changes.
 * - Fail-closed: no configured password ⇒ no access, ever.
 *
 * This IS the SimulatedAuthProvider of MVP-0: real accounts (Auth.js, all four
 * methods) replace it at Stage 1 behind the same "who may enter" seam.
 */

import { can } from '@/lib/capabilities';
import { Logger } from '@/lib/monitoring/Logger';
import crypto from 'crypto';

export const SANDBOX_GATE_COOKIE = 'diboas-sandbox-gate';

/** Cookie lifetime: 7 days, then the founder re-enters the password. */
const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getPassword(): string | null {
  const pw = process.env.SANDBOX_ACCESS_PASSWORD;
  if (!pw || pw.length === 0) {
    /**
     * ⚑ The operator's ONLY signal, restored (`5.350` copy pass, 2026-09-15).
     *
     * `gate.notConfigured` used to name the variable to the USER — it read "Set
     * SANDBOX_ACCESS_PASSWORD and restart", which leaked an internal to whoever
     * hit the door. Legal's final wording is correctly silent about internals,
     * and that silence would otherwise have deleted the only place this
     * misconfiguration was ever reported: there is no other logging on this
     * path, and the contract above is fail-closed, so a deploy with the
     * variable unset serves a bare refusal with nothing explaining why.
     *
     * Routed through the house `Logger` seam rather than a bare `console`:
     * seven runtime modules already use it, and the only bare `console` in
     * the app is the React error boundary. Server-side only, so nothing
     * reaches the browser. This restores a pre-existing signal; it adds no
     * new behaviour.
     */
    Logger.warn('sandbox gate: SANDBOX_ACCESS_PASSWORD is not set, so the gate is fail-closed');
    return null;
  }
  return pw;
}

/**
 * Open the app to the public, skipping the shared-password gate.
 *
 * EXPLICIT opt-in (`SANDBOX_PUBLIC_ACCESS=true`), never inferred from a missing
 * password — the fail-closed rule above still holds, because a misconfiguration
 * that silently opened the app would be exactly the accident that rule exists
 * to prevent. Founder decision 2026-08-22: ship the practice app publicly at
 * `app.diboas.com` before real authentication exists, accepting that the ledger
 * is device-local until Auth.js lands.
 *
 * What this does NOT relax: the CN/RU/KP geofence (edge middleware, unchanged),
 * `noindex`, and the R-4 play-money labelling. Flip the flag off and the gate
 * returns with no other change.
 */
export function isPublicAccess(): boolean {
  return can('publicAccess');
}

export function isGateConfigured(): boolean {
  return getPassword() !== null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** The grant token: HMAC of a fixed message keyed by the current password. */
export function gateGrantToken(): string | null {
  const pw = getPassword();
  if (!pw) return null;
  return crypto.createHmac('sha256', pw).update('diboas-sandbox-grant-v1').digest('hex');
}

export function checkGatePassword(input: string): boolean {
  const pw = getPassword();
  if (!pw || !input) return false;
  return timingSafeEqualStr(input, pw);
}

export function verifyGateCookie(cookieValue: string | undefined | null): boolean {
  const token = gateGrantToken();
  if (!token || !cookieValue) return false;
  return timingSafeEqualStr(cookieValue, token);
}

/**
 * The cookie is `secure` in production (Vercel HTTPS) and on localhost (a
 * browser-trusted secure context, so it works over http://localhost too).
 * The ONLY environment where a secure cookie is dropped is plain-http access
 * over a LAN IP — which is exactly what the Docker MCP visual-testing protocol
 * uses (the container can't reach localhost). `SANDBOX_GATE_ALLOW_INSECURE=true`
 * relaxes it for that testing case only. NEVER set it in a deployed env.
 */
export function gateCookieOptions() {
  /* `5.228` — through the registry, which REFUSES this flag on every Vercel
     deployment, preview included. The docstring above always said "NEVER set it
     in a deployed env"; until 1b nothing enforced it, so the promise rested on
     configuration discipline. */
  const allowInsecure = can('insecureGateCookie');
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !allowInsecure,
    sameSite: 'lax' as const,
    maxAge: GATE_MAX_AGE_SECONDS,
    path: '/',
  };
}
