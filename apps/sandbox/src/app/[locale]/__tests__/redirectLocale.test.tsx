import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * REQUIREMENT (P8 input validation; 2026-10-18 lane audit): the two server redirects that
 * build a path from the `[locale]` segment — the gate's public-access redirect and the app
 * layout's auth redirect — interpolate only an allow-listed locale (`isSandboxLocale`, the
 * same check the gate's server actions already use). An unknown segment falls back to `en`.
 */
const h = vi.hoisted(() => ({ publicAccess: true, session: false }));

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { to });
  },
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/gate', () => ({ isPublicAccess: () => h.publicAccess }));
vi.mock('@/lib/auth/factory', () => ({
  getAuthProvider: () => ({ sessionCookieName: 's', verifySession: () => h.session }),
}));
vi.mock('../gate/GateForm', () => ({ GateForm: () => null }));
vi.mock('@/components/shell/AppShellRoute', () => ({ AppShellRoute: () => null }));

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
  h.publicAccess = true;
  h.session = false;
});
afterEach(() => vi.clearAllMocks());

describe('locale allow-list before a redirect', () => {
  it('should redirect the gate to the SAME supported locale', async () => {
    const { default: GatePage } = await import('../gate/page');
    expect(await redirectedTo(() => GatePage({ params: params('de') }))).toBe('/de/welcome');
  });

  it('should never interpolate an unknown gate segment (falls back to en)', async () => {
    const { default: GatePage } = await import('../gate/page');
    for (const bad of ['evil.example', '..', 'xx', '%2F%2Fevil']) {
      expect(await redirectedTo(() => GatePage({ params: params(bad) }))).toBe('/en/welcome');
    }
  });

  it('should send an unauthenticated visitor to the gate of a supported locale', async () => {
    const { default: AppLayout } = await import('../(app)/layout');
    expect(await redirectedTo(() => AppLayout({ children: null, params: params('pt-BR') }))).toBe(
      '/pt-BR/gate'
    );
    expect(
      await redirectedTo(() => AppLayout({ children: null, params: params('evil.example') }))
    ).toBe('/en/gate');
  });
});
