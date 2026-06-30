/**
 * Investor Room Gate (shared-password access control)
 *
 * The investor room is gated by a single shared password (Bar decision
 * 2026-06-30): `INVESTOR_ROOM_PASSWORD` (server-only env). A correct password
 * grants a signed, httpOnly cookie; the room layout verifies it on every load.
 *
 * Security properties:
 * - Constant-time password compare (no timing oracle).
 * - The cookie holds a signed grant token (HMAC of the current password, keyed
 *   by the server HMAC key), never the password itself — unforgeable without
 *   the HMAC key, and it rotates automatically when the password changes.
 * - Fail-closed: if no password is configured, access is denied.
 */

import crypto from 'crypto';
import { hmacHash } from './encryption';
import { STORAGE_PREFIX, IS_PRODUCTION } from '@/config/env';

/** HttpOnly cookie name for the room grant token. */
export const INVESTOR_GATE_COOKIE = `${STORAGE_PREFIX}-investor-room`;

/** Cookie lifetime: 7 days, then the investor re-enters the password. */
const INVESTOR_GATE_MAX_AGE = 60 * 60 * 24 * 7;

function getRoomPassword(): string | null {
  const pw = process.env.INVESTOR_ROOM_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** Whether a room password is configured at all (else the gate fails closed). */
export function isInvestorGateConfigured(): boolean {
  return getRoomPassword() !== null;
}

/**
 * The signed grant token written to the cookie on a successful password entry.
 * Tied to the current password (rotates with it) and the server HMAC key
 * (unforgeable). Returns null if the gate is not configured.
 */
export function investorGrantToken(): string | null {
  const pw = getRoomPassword();
  if (!pw) return null;
  return hmacHash(`investor-room:${pw}`);
}

/** Constant-time string compare (length-safe). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Constant-time check of a submitted password against the configured secret. */
export function checkInvestorPassword(input: string): boolean {
  const pw = getRoomPassword();
  if (!pw || !input) return false;
  return timingSafeEqualStr(input, pw);
}

/** Verify a cookie value grants room access. Fail-closed on missing config. */
export function verifyInvestorGate(cookieValue: string | undefined | null): boolean {
  const token = investorGrantToken();
  if (!token || !cookieValue) return false;
  return timingSafeEqualStr(cookieValue, token);
}

/** Cookie options for setting the grant token on a response. */
export function investorGateCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    maxAge: INVESTOR_GATE_MAX_AGE,
    path: '/',
  };
}
