import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * B15 (founder 2026-10-22, register 5.522) — "Gate consent and claim": when the app is gated,
 * `/welcome` stays public and `/consent` and `/claim` sit behind the gate; a visitor goes to the
 * gate and comes back to the page after. While production is public nothing changes. Tested with
 * the gate ON (no session) and OFF (public: every visitor holds a grant), through the real pages,
 * the real consent action and the real gate action.
 */
const h = vi.hoisted(() => ({ session: false, password: 'right' }));

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { to });
  },
  useParams: () => ({ locale: 'en' }),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
}));
vi.mock('@/lib/auth/factory', () => ({
  getAuthProvider: () => ({ sessionCookieName: 's', verifySession: () => h.session }),
}));
vi.mock('@/lib/gate', () => ({
  SANDBOX_GATE_COOKIE: 'g',
  isPublicAccess: () => false,
  isGateConfigured: () => true,
  checkGatePassword: (p: string) => p === h.password,
  gateGrantToken: () => 'token',
  gateCookieOptions: () => ({}),
}));
vi.mock('@/components/Consent', () => ({ Consent: () => null }));
vi.mock('@/components/ClaimCeremony', () => ({ ClaimCeremony: () => null }));
vi.mock('../gate/GateForm', () => ({ GateForm: () => null }));

async function redirectedTo(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    return (e as { to?: string }).to ?? null;
  }
}
const params = (locale: string) => Promise.resolve({ locale });

beforeEach(() => {
  h.session = false;
});
afterEach(() => vi.clearAllMocks());

describe('B15 · consent and claim are behind the gate when the app is gated', () => {
  it.each([
    ['consent', '../consent/page'],
    ['claim', '../claim/page'],
  ] as const)(
    'should send an unadmitted visitor from /%s to the gate, and back after',
    async (name, mod) => {
      const { default: Page } = await import(mod);
      expect(await redirectedTo(() => Page({ params: params('de') }))).toBe(
        `/de/gate?next=${name}`
      );
      // An unknown locale segment never reaches the redirect (P8).
      expect(await redirectedTo(() => Page({ params: params('evil.example') }))).toBe(
        `/en/gate?next=${name}`
      );
    }
  );

  it.each([
    ['consent', '../consent/page'],
    ['claim', '../claim/page'],
  ] as const)(
    'should render /%s for an admitted visitor — and for everyone while public',
    async (_name, mod) => {
      h.session = true; // public mode: verifySession admits every visitor
      const { default: Page } = await import(mod);
      expect(await redirectedTo(() => Page({ params: params('de') }))).toBeNull();
    }
  );

  it('should refuse the consent action to an unadmitted visitor (F22: never trusting the page)', async () => {
    const { submitConsent } = await import('../consent/actions');
    expect(await redirectedTo(() => submitConsent('pt-BR'))).toBe('/pt-BR/gate?next=consent');
    h.session = true;
    expect(await redirectedTo(() => submitConsent('pt-BR'))).toBe('/pt-BR/claim');
  });
});

describe('B15 · the gate returns to an allow-listed onboarding page only', () => {
  const form = (fields: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    return f;
  };

  it('should return to the page that sent the visitor, once admitted', async () => {
    const { enterSandbox } = await import('../gate/actions');
    for (const next of ['consent', 'claim'])
      expect(
        await redirectedTo(() =>
          enterSandbox({ error: null }, form({ password: 'right', locale: 'de', next }))
        )
      ).toBe(`/de/${next}`);
  });

  it('should never redirect to a target outside the list (no open redirect)', async () => {
    const { enterSandbox } = await import('../gate/actions');
    for (const next of ['https://evil.example', '//evil.example', '/de/settings', 'welcome', ''])
      expect(
        await redirectedTo(() =>
          enterSandbox({ error: null }, form({ password: 'right', locale: 'de', next }))
        ),
        next
      ).toBe('/de');
  });

  it('should hand the form only an allow-listed return target', async () => {
    const { default: GatePage } = await import('../gate/page');
    const props = async (next: string) =>
      (
        (await GatePage({
          params: params('en'),
          searchParams: Promise.resolve({ next }),
        })) as { props: unknown }
      ).props;
    expect(await props('claim')).toEqual({ next: 'claim' });
    expect(await props('//evil')).toEqual({ next: undefined });
  });
});
