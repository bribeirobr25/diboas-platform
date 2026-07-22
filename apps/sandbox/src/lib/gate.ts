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

import crypto from 'crypto';

export const SANDBOX_GATE_COOKIE = 'diboas-sandbox-gate';

/** Cookie lifetime: 7 days, then the founder re-enters the password. */
const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getPassword(): string | null {
  const pw = process.env.SANDBOX_ACCESS_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
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
  const allowInsecure = process.env.SANDBOX_GATE_ALLOW_INSECURE === 'true';
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !allowInsecure,
    sameSite: 'lax' as const,
    maxAge: GATE_MAX_AGE_SECONDS,
    path: '/',
  };
}
