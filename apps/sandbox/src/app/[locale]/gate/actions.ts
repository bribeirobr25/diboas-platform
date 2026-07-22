'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SANDBOX_GATE_COOKIE,
  checkGatePassword,
  gateCookieOptions,
  gateGrantToken,
  isGateConfigured,
} from '@/lib/gate';
import { isSandboxLocale } from '@/i18n/config';

export interface GateState {
  error: 'wrong' | 'unconfigured' | null;
}

/**
 * Server action: verify the shared sandbox password; on success set the
 * signed grant cookie and enter. Constant-time compare in lib/gate. Fail-closed
 * when unconfigured (the investor-room pattern).
 */
export async function enterSandbox(_prev: GateState, formData: FormData): Promise<GateState> {
  if (!isGateConfigured()) return { error: 'unconfigured' };

  const password = String(formData.get('password') ?? '');
  const localeRaw = String(formData.get('locale') ?? 'en');
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';

  if (!checkGatePassword(password)) {
    return { error: 'wrong' };
  }

  const token = gateGrantToken();
  if (token) {
    const cookieStore = await cookies();
    cookieStore.set(SANDBOX_GATE_COOKIE, token, gateCookieOptions());
  }
  redirect(`/${locale}`);
}
