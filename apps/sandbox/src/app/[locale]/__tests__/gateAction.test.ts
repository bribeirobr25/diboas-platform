import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { expectedLogs } from '@/test/expectedLogs';

/**
 * `enterSandbox` — the gate's server action, against the REAL `lib/gate` (register 5.70: a
 * security utility, so every refusal branch is owed a test that shows it writes nothing).
 *
 * The contract, from the action's own docstring and `lib/gate`: verify the shared password
 * (constant-time), set the signed grant cookie on success and enter; FAIL CLOSED when the gate
 * is unconfigured. A refusal therefore returns an error state, sets NO cookie and redirects
 * nowhere. The locale in the redirect comes only from the supported list, never from the form.
 *
 * Only the Next.js request seams are replaced: `redirect` throws as Next's does (with its
 * target recorded), and the cookie jar records what was written.
 */
const h = vi.hoisted(() => ({
  set: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
  /** Overrides `gateGrantToken` for the one case the real gate cannot produce. */
  tokenOverride: undefined as (() => string | null) | undefined,
}));

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { to });
  },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (name: string, value: string, options: Record<string, unknown>) =>
      h.set.push({ name, value, options }),
  }),
}));
vi.mock('@/lib/gate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gate')>();
  return {
    ...actual,
    gateGrantToken: () => (h.tokenOverride ? h.tokenOverride() : actual.gateGrantToken()),
  };
});

// The unconfigured gate LOGS its operator signal by design (R-14); asserted, not silenced.
expectedLogs({
  strict: true,
  warn: ['SANDBOX_ACCESS_PASSWORD is not set'],
  requiredIn: /when the gate is unconfigured/,
});

const PW = 'test-sandbox-password';
const KEYS = ['SANDBOX_ACCESS_PASSWORD', 'SANDBOX_PUBLIC_ACCESS', 'VERCEL_ENV'];
const prior: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    prior[k] = process.env[k];
    delete process.env[k];
  }
  process.env.SANDBOX_ACCESS_PASSWORD = PW;
  h.set.length = 0;
  h.tokenOverride = undefined;
});
afterEach(() => {
  for (const k of KEYS) {
    if (prior[k] === undefined) delete process.env[k];
    else process.env[k] = prior[k];
  }
});

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

/** Runs the action: `{ state }` when it returned, `{ to }` when it redirected. */
async function submit(fields: Record<string, string>): Promise<{ state?: unknown; to?: string }> {
  const { enterSandbox } = await import('../gate/actions');
  try {
    return { state: await enterSandbox({ error: null }, form(fields)) };
  } catch (e) {
    const to = (e as { to?: string }).to;
    if (to === undefined) throw e;
    return { to };
  }
}

describe('enterSandbox · the gate fails closed', () => {
  it('should refuse even the right password, set no cookie and redirect nowhere when the gate is unconfigured', async () => {
    delete process.env.SANDBOX_ACCESS_PASSWORD;
    expect(await submit({ password: PW, locale: 'de', next: 'consent' })).toEqual({
      state: { error: 'unconfigured' },
    });
    expect(h.set).toEqual([]);
  });

  it('should treat a form with no password field as a wrong password, writing nothing', async () => {
    expect(await submit({ locale: 'de' })).toEqual({ state: { error: 'wrong' } });
    expect(h.set).toEqual([]);
  });

  it('should refuse a wrong password, writing nothing', async () => {
    expect(await submit({ password: `${PW} `, locale: 'de' })).toEqual({
      state: { error: 'wrong' },
    });
    expect(h.set).toEqual([]);
  });
});

describe('enterSandbox · admission', () => {
  it('should set the signed grant cookie and enter the chosen locale when the password is right', async () => {
    expect(await submit({ password: PW, locale: 'pt-BR' })).toEqual({ to: '/pt-BR' });
    const expected = createHmac('sha256', PW).update('diboas-sandbox-grant-v1').digest('hex');
    expect(h.set).toHaveLength(1);
    expect(h.set[0]).toMatchObject({
      name: 'diboas-sandbox-gate',
      value: expected,
      options: { httpOnly: true, sameSite: 'lax', path: '/' },
    });
  });

  it('should enter the default locale when the form carries no locale', async () => {
    expect(await submit({ password: PW })).toEqual({ to: '/en' });
    expect(h.set).toHaveLength(1);
  });

  it.each(['fr', '../evil', 'https://evil.example', ''])(
    'should never put an unsupported locale (%j) into the redirect when the password is right',
    async (locale) => {
      expect(await submit({ password: PW, locale, next: 'claim' })).toEqual({
        to: '/en/claim',
      });
    }
  );

  it('should enter without writing a cookie when no grant token can be minted', async () => {
    // The real gate cannot reach this after a successful compare (both read the same
    // variable); it is the action's own guard against writing an empty grant cookie.
    h.tokenOverride = () => null;
    expect(await submit({ password: PW, locale: 'es' })).toEqual({ to: '/es' });
    expect(h.set).toEqual([]);
  });
});
