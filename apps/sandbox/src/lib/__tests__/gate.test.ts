import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SANDBOX_GATE_COOKIE,
  checkGatePassword,
  gateCookieOptions,
  gateGrantToken,
  isGateConfigured,
  verifyGateCookie,
} from '../gate';

/**
 * `gate.ts` is a security utility (CLAUDE.md: 100% coverage for those) and had
 * no test file of its own. `SimulatedAuthProvider`'s suite covers the grant
 * round-trip through the seam, but two things were never asserted anywhere:
 *
 * 1. **`gateCookieOptions().secure`** — the property `5.228` is entirely about.
 *    The registry proves `can('insecureGateCookie')` refuses a deployment; it
 *    does NOT prove the cookie ends up `secure`, because the value the browser
 *    actually receives is a COMPOSITION: `NODE_ENV === 'production' &&
 *    !allowInsecure`. That composition is the line protecting the session, and
 *    an unasserted guard is a guard nobody has seen work (R-13's rule).
 * 2. **`checkGatePassword`** — the constant-time compare at the door.
 *
 * Every expectation below is derived from `gateCookieOptions`'s own docstring
 * ("secure in production and on localhost … the ONLY environment where a secure
 * cookie is dropped is plain-http access over a LAN IP … NEVER set it in a
 * deployed env"), not from running the code (coding-standards rule 4).
 */

const KEYS = ['NODE_ENV', 'VERCEL_ENV', 'SANDBOX_GATE_ALLOW_INSECURE', 'SANDBOX_ACCESS_PASSWORD'];
const prior: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) prior[k] = process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (prior[k] === undefined) delete process.env[k];
    else process.env[k] = prior[k];
  }
});

/** Set only what a case needs; everything else is explicitly absent. */
function env(values: Record<string, string | undefined>) {
  for (const k of KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(values)) if (v !== undefined) process.env[k] = v;
}

describe('the gate cookie is secure wherever a secure cookie can work (5.228)', () => {
  it('should send a SECURE cookie on a production deployment even with the insecure flag set', () => {
    env({ NODE_ENV: 'production', VERCEL_ENV: 'production', SANDBOX_GATE_ALLOW_INSECURE: 'true' });
    expect(gateCookieOptions().secure).toBe(true);
  });

  it('should send a SECURE cookie on a PREVIEW deployment even with the insecure flag set', () => {
    // The 1b self-audit finding. A preview is a deployed environment — HTTPS,
    // holding a real session cookie — and the docstring's "NEVER set it in a
    // deployed env" covers it. The first cut of the registry refused the flag
    // in production only, so this case would have shipped a non-secure cookie.
    env({ NODE_ENV: 'production', VERCEL_ENV: 'preview', SANDBOX_GATE_ALLOW_INSECURE: 'true' });
    expect(gateCookieOptions().secure).toBe(true);
  });

  it('should DROP secure for a local production build with the flag, so the LAN protocol works', () => {
    // The one case the flag exists for: `next start -H 0.0.0.0` reached from the
    // Docker MCP browser over a plain-http LAN IP (the container cannot resolve
    // localhost). Verified live over 192.168.x.x during this audit.
    env({ NODE_ENV: 'production', SANDBOX_GATE_ALLOW_INSECURE: 'true' });
    expect(gateCookieOptions().secure).toBe(false);
  });

  it('should keep secure for a local production build when the flag is NOT set', () => {
    // Nothing is inferred: the relaxation is an explicit opt-in, like every
    // other capability.
    env({ NODE_ENV: 'production' });
    expect(gateCookieOptions().secure).toBe(true);
  });

  it('should not require secure in development, where localhost is already a secure context', () => {
    env({ NODE_ENV: 'development' });
    expect(gateCookieOptions().secure).toBe(false);
  });

  it('should always be httpOnly, lax and path-wide, whatever the environment', () => {
    // httpOnly is what keeps the grant token out of reach of any script; it is
    // never conditional on anything.
    for (const e of [
      { NODE_ENV: 'production', VERCEL_ENV: 'production' },
      { NODE_ENV: 'production', SANDBOX_GATE_ALLOW_INSECURE: 'true' },
      { NODE_ENV: 'development' },
    ]) {
      env(e);
      const options = gateCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(60 * 60 * 24 * 7); // 7 days, per the docstring
    }
  });

  it('should name the cookie stably, because a rename silently signs everyone out', () => {
    expect(SANDBOX_GATE_COOKIE).toBe('diboas-sandbox-gate');
  });
});

describe('the password check at the door', () => {
  it('should accept only the exact configured password', () => {
    env({ SANDBOX_ACCESS_PASSWORD: 'correct-horse' });
    expect(checkGatePassword('correct-horse')).toBe(true);
    expect(checkGatePassword('correct-hors')).toBe(false); // shorter: length branch
    expect(checkGatePassword('correct-horsE')).toBe(false); // same length, differs
    expect(checkGatePassword('')).toBe(false);
  });

  it('should FAIL CLOSED when no password is configured, for every input', () => {
    // The fail-closed rule in the file header: a missing password must never
    // read as "no gate", which is how a misconfiguration would open the app.
    env({});
    expect(isGateConfigured()).toBe(false);
    expect(checkGatePassword('anything')).toBe(false);
    expect(checkGatePassword('')).toBe(false);
    expect(gateGrantToken()).toBeNull();
    expect(verifyGateCookie('anything')).toBe(false);
  });

  it('should treat an empty-string password as NOT configured', () => {
    env({ SANDBOX_ACCESS_PASSWORD: '' });
    expect(isGateConfigured()).toBe(false);
    expect(checkGatePassword('')).toBe(false);
  });

  it('should rotate the grant token when the password changes, invalidating old cookies', () => {
    // The reason the cookie holds an HMAC rather than the password: changing the
    // password must sign everyone out without a deploy or a cookie sweep.
    env({ SANDBOX_ACCESS_PASSWORD: 'first-password' });
    const first = gateGrantToken();
    expect(first).toMatch(/^[0-9a-f]{64}$/); // HMAC-SHA256 hex, not the password
    expect(first).not.toContain('first-password');
    expect(verifyGateCookie(first)).toBe(true);

    env({ SANDBOX_ACCESS_PASSWORD: 'second-password' });
    expect(gateGrantToken()).not.toBe(first);
    expect(verifyGateCookie(first)).toBe(false);
  });
});
