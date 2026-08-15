'use server';

import { redirect } from 'next/navigation';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Claim grant (A3.2 / W-5a). Frontend-first: the tap advances the real flow
 * into the app home. The actual `PlayMoneyGranted` emit (grantAndSplit, with the
 * one-grant idempotency guard) is DEFERRED and registered —
 * `docs/sandbox-app/DEFERRED_BACKEND_LEDGER.md` CL-B1: the ledger write model +
 * one-grant guard belong to the ledger/backend pass, not invented inline. When
 * it lands, this action emits the grant before redirecting; the call site stays.
 */
export async function claimGrant(localeRaw: string): Promise<void> {
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  redirect(`/${locale}`);
}
