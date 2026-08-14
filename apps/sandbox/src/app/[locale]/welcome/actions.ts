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
  const grant = getAuthProvider().establishSession(method);
  if (grant) {
    const cookieStore = await cookies();
    cookieStore.set(grant.cookieName, grant.cookieValue, grant.cookieOptions);
  }
  redirect(`/${locale}/consent`);
}
