'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SANDBOX_GATE_COOKIE, gateCookieOptions, gateGrantToken } from '@/lib/gate';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Onboarding sign-in seam (A2). SEAM: real sign-in (Auth.js OAuth redirect /
 * email-OTP / wallet challenge) wires HERE at the end — the call site does not
 * change. Until then the SimulatedAuthProvider establishes a session (the same
 * HMAC grant the gate uses) so the REAL onboarding flow (consent -> claim ->
 * home) is reachable and navigable — this is a wired flow, not a no-op preview.
 */
export async function startOnboarding(method: string, localeRaw: string): Promise<void> {
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  const token = gateGrantToken();
  if (token) {
    const cookieStore = await cookies();
    cookieStore.set(SANDBOX_GATE_COOKIE, token, gateCookieOptions());
  }
  redirect(`/${locale}/consent`);
}
