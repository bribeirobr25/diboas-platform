import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { gateGrantToken, SANDBOX_GATE_COOKIE } from '@/lib/gate';
import { SimulatedAuthProvider } from '../SimulatedAuthProvider';
import { getAuthProvider, __resetAuthProvider } from '../factory';

const PW = 'test-sandbox-password';
let priorPw: string | undefined;

beforeEach(() => {
  priorPw = process.env.SANDBOX_ACCESS_PASSWORD;
  process.env.SANDBOX_ACCESS_PASSWORD = PW;
  __resetAuthProvider();
});
afterEach(() => {
  if (priorPw === undefined) delete process.env.SANDBOX_ACCESS_PASSWORD;
  else process.env.SANDBOX_ACCESS_PASSWORD = priorPw;
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

  it('should establishSession() a grant that verifySession() then accepts (seam round-trip)', () => {
    const p = new SimulatedAuthProvider();
    const grant = p.establishSession('email');
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

describe('getAuthProvider factory', () => {
  it('should return a SimulatedAuthProvider at MVP-0 (no Auth.js env)', () => {
    expect(getAuthProvider()).toBeInstanceOf(SimulatedAuthProvider);
  });
  it('should memoise a single instance', () => {
    expect(getAuthProvider()).toBe(getAuthProvider());
  });
});
