/**
 * Regression guard for the investor-room RSC gate bypass (found 2026-07-06):
 * the room layout's `granted ? children : <Access/>` conditional does NOT stop
 * the page from rendering — pages render in parallel with layouts, so gated
 * document content shipped in the flight payload of the password screen.
 *
 * These tests assert both room pages return null (contribute NOTHING to the
 * payload) when the gate cookie is absent or invalid, and render content when
 * the grant is valid.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const cookieValue = vi.hoisted(() => ({ current: undefined as string | undefined }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieValue.current === undefined ? undefined : { name, value: cookieValue.current },
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/security/investorGate', () => ({
  INVESTOR_GATE_COOKIE: 'diboas-investor-room',
  verifyInvestorGate: (value: string | undefined | null) => value === 'valid-grant-token',
}));

import InvestorRoomPage from '../page';
import InvestorDocPage from '../[doc]/page';

const roomParams = Promise.resolve({ locale: 'en' });
const docParams = Promise.resolve({ locale: 'en', doc: 'fees-summary' });

describe('investor-room page gate (RSC payload leak regression)', () => {
  beforeEach(() => {
    cookieValue.current = undefined;
  });

  it('should return null from the room landing page when no gate cookie is present', async () => {
    expect(await InvestorRoomPage({ params: roomParams })).toBeNull();
  });

  it('should return null from the room landing page when the gate cookie is invalid', async () => {
    cookieValue.current = 'forged-or-stale-token';
    expect(await InvestorRoomPage({ params: roomParams })).toBeNull();
  });

  it('should return null from the doc page when no gate cookie is present', async () => {
    expect(await InvestorDocPage({ params: docParams })).toBeNull();
  });

  it('should return null from the doc page when the gate cookie is invalid', async () => {
    cookieValue.current = 'forged-or-stale-token';
    expect(await InvestorDocPage({ params: docParams })).toBeNull();
  });

  it('should render room content when the grant token is valid', async () => {
    cookieValue.current = 'valid-grant-token';
    expect(await InvestorRoomPage({ params: roomParams })).not.toBeNull();
  });

  it('should render the document when the grant token is valid', async () => {
    cookieValue.current = 'valid-grant-token';
    expect(await InvestorDocPage({ params: docParams })).not.toBeNull();
  });
});
