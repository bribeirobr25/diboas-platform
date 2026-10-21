import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * P1 · the private-access bypass (register `5.480`). In gated mode, `startOnboarding`
 * used to set a session cookie for ANY visitor — `/welcome` sits outside the gated
 * group — so the gate could be skipped entirely. Acceptance (a)–(d) of the closure
 * plan's P1 row; (e) is the sabotage recorded in the plan.
 */

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}));
/* `redirect` throws in Next; the test records where it pointed and stops there. */
class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`);
  }
}
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));

import { SANDBOX_GATE_COOKIE } from '@/lib/gate';
import { __resetAuthProvider, getAuthProvider } from '@/lib/auth/factory';
import { enterSandbox } from '../../gate/actions';
import { startOnboarding } from '../actions';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
/* Strict, and now required NOWHERE (lane audit 2026-10-21, L9): case (a) runs in public
   mode, where the password is never used, so the "fail-closed" warning it used to require
   was a false operator signal. Strict mode now FAILS any test here that logs it. */
expectedLogs({
  strict: true,
  warn: ['SANDBOX_ACCESS_PASSWORD is not set'],
});

const PW = 'test-sandbox-password';
let priorPw: string | undefined;
let priorPublic: string | undefined;

async function redirectOf(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    if (e instanceof Redirected) return e.to;
    throw e;
  }
}

beforeEach(() => {
  priorPw = process.env.SANDBOX_ACCESS_PASSWORD;
  priorPublic = process.env.SANDBOX_PUBLIC_ACCESS;
  process.env.SANDBOX_ACCESS_PASSWORD = PW;
  delete process.env.SANDBOX_PUBLIC_ACCESS; // gated is the default
  jar.clear();
  __resetAuthProvider();
});
afterEach(() => {
  if (priorPw === undefined) delete process.env.SANDBOX_ACCESS_PASSWORD;
  else process.env.SANDBOX_ACCESS_PASSWORD = priorPw;
  if (priorPublic === undefined) delete process.env.SANDBOX_PUBLIC_ACCESS;
  else process.env.SANDBOX_PUBLIC_ACCESS = priorPublic;
});

function gateForm(password: string): FormData {
  const f = new FormData();
  f.set('password', password);
  f.set('locale', 'de');
  return f;
}

describe('P1 · onboarding cannot skip the private gate', () => {
  it('(a) should grant and continue when public access is ON', async () => {
    process.env.SANDBOX_PUBLIC_ACCESS = 'true';
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/consent');
    expect(jar.has(SANDBOX_GATE_COOKIE)).toBe(true);
  });

  it('(a) should still continue when public access is ON and nothing can be granted (no password)', async () => {
    process.env.SANDBOX_PUBLIC_ACCESS = 'true';
    delete process.env.SANDBOX_ACCESS_PASSWORD;
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/consent');
    expect(jar.has(SANDBOX_GATE_COOKIE)).toBe(false);
  });

  it('(b) should set NO cookie and send to the gate when public access is OFF and no gate grant is held', async () => {
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/gate');
    expect(jar.has(SANDBOX_GATE_COOKIE), 'a session cookie was set without the gate').toBe(false);
  });

  it('(c) should continue once the visitor has passed the gate with the right password', async () => {
    expect(await redirectOf(() => enterSandbox({ error: null }, gateForm(PW)))).toBe('/de');
    const grant = jar.get(SANDBOX_GATE_COOKIE);
    expect(grant).toBeDefined();
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/consent');
    /* …and the interior's own check admits the cookie the visitor now holds. */
    expect(getAuthProvider().verifySession(jar.get(SANDBOX_GATE_COOKIE))).not.toBeNull();
  });

  it('(d) should refuse a wrong password and leave onboarding closed', async () => {
    expect(await enterSandbox({ error: null }, gateForm('wrong'))).toEqual({ error: 'wrong' });
    expect(jar.has(SANDBOX_GATE_COOKIE)).toBe(false);
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/gate');
  });

  it('(b) should not accept a forged cookie as a gate grant', async () => {
    jar.set(SANDBOX_GATE_COOKIE, 'forged-value');
    expect(await redirectOf(() => startOnboarding('email', 'de'))).toBe('/de/gate');
    expect(jar.get(SANDBOX_GATE_COOKIE)).toBe('forged-value'); // untouched, not upgraded
  });
});
