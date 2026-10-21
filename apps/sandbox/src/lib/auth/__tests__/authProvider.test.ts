import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { gateGrantToken, SANDBOX_GATE_COOKIE } from '@/lib/gate';
import { SimulatedAuthProvider } from '../SimulatedAuthProvider';
import { getAuthProvider, __resetAuthProvider } from '../factory';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
expectedLogs({
  strict: true,
  warn: ['SANDBOX_ACCESS_PASSWORD is not set'],
  requiredIn: /should FAIL CLOSED when no gate password/,
});

const PW = 'test-sandbox-password';
let priorPw: string | undefined;
let priorPublic: string | undefined;

beforeEach(() => {
  priorPw = process.env.SANDBOX_ACCESS_PASSWORD;
  priorPublic = process.env.SANDBOX_PUBLIC_ACCESS;
  process.env.SANDBOX_ACCESS_PASSWORD = PW;
  delete process.env.SANDBOX_PUBLIC_ACCESS; // gated is the DEFAULT
  __resetAuthProvider();
});
afterEach(() => {
  if (priorPw === undefined) delete process.env.SANDBOX_ACCESS_PASSWORD;
  else process.env.SANDBOX_ACCESS_PASSWORD = priorPw;
  if (priorPublic === undefined) delete process.env.SANDBOX_PUBLIC_ACCESS;
  else process.env.SANDBOX_PUBLIC_ACCESS = priorPublic;
});

describe('SimulatedAuthProvider — wraps the shared-password gate (MVP-0 seam)', () => {
  it('should expose the gate cookie name as the session cookie', () => {
    expect(new SimulatedAuthProvider().sessionCookieName).toBe(SANDBOX_GATE_COOKIE);
  });

  it('should be configured when a gate password is set', () => {
    expect(new SimulatedAuthProvider().isConfigured()).toBe(true);
  });

  it('should return an Identity for a valid grant cookie', () => {
    const grant = gateGrantToken()!;
    const id = new SimulatedAuthProvider().verifySession(grant);
    expect(id).not.toBeNull();
    expect(id!.subject).toBe('sandbox-gate');
  });

  it('should deny (null) an invalid, empty, or missing cookie', () => {
    const p = new SimulatedAuthProvider();
    expect(p.verifySession('not-the-grant')).toBeNull();
    expect(p.verifySession('')).toBeNull();
    expect(p.verifySession(undefined)).toBeNull();
    expect(p.verifySession(null)).toBeNull();
  });

  /**
   * ⛑ RESTATED (P1, register 5.480 · coding-standards rule 5). This test used to call
   * `establishSession('email')` in GATED mode with no gate grant and expect a session — it
   * pinned the bypass. The requirement is a round-trip for a visitor who has PASSED the gate.
   */
  it('should establishSession() a grant that verifySession() then accepts, for a visitor who passed the gate', () => {
    const p = new SimulatedAuthProvider();
    const grant = p.establishSession('email', gateGrantToken());
    expect(grant).not.toBeNull();
    expect(grant!.cookieName).toBe(SANDBOX_GATE_COOKIE);
    expect(grant!.cookieOptions.httpOnly).toBe(true);
    // the issued session must be a valid, verifiable session
    expect(p.verifySession(grant!.cookieValue)).not.toBeNull();
  });

  it('should FAIL CLOSED when no gate password is configured', () => {
    delete process.env.SANDBOX_ACCESS_PASSWORD;
    const p = new SimulatedAuthProvider();
    expect(p.isConfigured()).toBe(false);
    // even a formerly-valid-looking token is denied when unconfigured
    expect(p.verifySession('anything')).toBeNull();
    // and no session can be established (fail-closed on the write half too)
    expect(p.establishSession('google')).toBeNull();
  });
});

describe('P1 · no session for a request the provider would not admit (register 5.480)', () => {
  it('should REFUSE a session in gated mode when the request carries no gate grant', () => {
    const p = new SimulatedAuthProvider();
    expect(p.establishSession('email')).toBeNull();
    expect(p.establishSession('email', null)).toBeNull();
    expect(p.establishSession('email', 'not-the-grant')).toBeNull();
  });

  it('should GRANT a session in public mode without a gate grant', () => {
    process.env.SANDBOX_PUBLIC_ACCESS = 'true';
    expect(new SimulatedAuthProvider().establishSession('email')).not.toBeNull();
  });
});

describe('SANDBOX_PUBLIC_ACCESS — the founder-ruled public opening (2026-08-22)', () => {
  it('should admit a visitor with NO cookie when public access is on', () => {
    process.env.SANDBOX_PUBLIC_ACCESS = 'true';
    const p = new SimulatedAuthProvider();
    expect(p.verifySession(undefined)).not.toBeNull();
    expect(p.verifySession(undefined)!.subject).toBe('sandbox-gate');
    expect(p.isConfigured()).toBe(true);
  });

  it('should open even with NO password configured (that is the point)', () => {
    delete process.env.SANDBOX_ACCESS_PASSWORD;
    process.env.SANDBOX_PUBLIC_ACCESS = 'true';
    const p = new SimulatedAuthProvider();
    expect(p.isConfigured()).toBe(true);
    expect(p.verifySession(null)).not.toBeNull();
  });

  // The load-bearing half: the flag must be the ONLY thing that opens the app.
  // Anything else — absent, empty, or a near-miss value — keeps it shut, so a
  // typo or a truthy-looking string can never silently expose it.
  it.each(['', 'false', 'TRUE', 'True', '1', 'yes', ' true'])(
    'should stay CLOSED when the flag is %o',
    (value) => {
      process.env.SANDBOX_PUBLIC_ACCESS = value;
      const p = new SimulatedAuthProvider();
      expect(p.verifySession(undefined)).toBeNull();
      expect(p.verifySession('not-the-grant')).toBeNull();
    }
  );

  it('should keep the gate working normally when the flag is unset', () => {
    const p = new SimulatedAuthProvider();
    expect(p.verifySession(undefined)).toBeNull();
    expect(p.verifySession(gateGrantToken()!)).not.toBeNull();
  });
});

describe('getAuthProvider factory', () => {
  it('should return a SimulatedAuthProvider at MVP-0 (no Auth.js env)', () => {
    expect(getAuthProvider()).toBeInstanceOf(SimulatedAuthProvider);
  });
  it('should memoise a single instance', () => {
    expect(getAuthProvider()).toBe(getAuthProvider());
  });
});
