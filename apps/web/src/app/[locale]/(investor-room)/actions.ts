'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  checkInvestorPassword,
  investorGrantToken,
  INVESTOR_GATE_COOKIE,
  investorGateCookieOptions,
} from '@/lib/security/investorGate';
import { isValidLocale } from '@diboas/i18n/server';

export interface AccessState {
  error: boolean;
}

/**
 * Server action: verify the shared room password and, on success, set the
 * signed grant cookie and redirect into the room. Constant-time compare lives
 * in `checkInvestorPassword`. On failure returns an error state (no redirect).
 */
export async function grantInvestorAccess(
  _prev: AccessState,
  formData: FormData
): Promise<AccessState> {
  const password = String(formData.get('password') ?? '');
  const localeRaw = String(formData.get('locale') ?? 'en');
  const locale = isValidLocale(localeRaw) ? localeRaw : 'en';

  if (!checkInvestorPassword(password)) {
    return { error: true };
  }

  const token = investorGrantToken();
  if (token) {
    const cookieStore = await cookies();
    cookieStore.set(INVESTOR_GATE_COOKIE, token, investorGateCookieOptions());
  }

  redirect(`/${locale}/investor-room`);
}
