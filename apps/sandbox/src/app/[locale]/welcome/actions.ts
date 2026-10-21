'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthProvider } from '@/lib/auth/factory';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Onboarding sign-in (A2). Goes through the IAuthProvider SEAM (Principle 3) —
 * establishSession() is the write half. MVP-0's SimulatedAuthProvider wraps the
 * gate grant; Stage-1's AuthjsProvider does the real OAuth/OTP/wallet handshake.
 * This action does NOT import lib/gate — so when MVP-0/gate is removed, the call
 * site is unchanged. A wired flow (session + navigate), not a no-op preview.
 */
export async function startOnboarding(method: string, localeRaw: string): Promise<void> {
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  const provider = getAuthProvider();
  const cookieStore = await cookies();
  const current = cookieStore.get(provider.sessionCookieName)?.value ?? null;
  /* ⛑ P1 (register 5.480): the same admission check runs BEFORE any cookie is set. A visitor
     the provider does not admit gets no cookie and is sent to the gate. A provider that is
     public but has nothing to grant (no password configured) still admits — that is the live
     public app, and onboarding must keep working there. */
  if (!provider.verifySession(current)) redirect(`/${locale}/gate`);
  const grant = provider.establishSession(method, current);
  if (grant) cookieStore.set(grant.cookieName, grant.cookieValue, grant.cookieOptions);
  redirect(`/${locale}/consent`);
}
