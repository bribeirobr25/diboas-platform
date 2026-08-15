'use server';

import { redirect } from 'next/navigation';
import { isSandboxLocale } from '@/i18n/config';

/**
 * Consent submit (A3 / W-3). Frontend-first: this advances the real flow
 * (-> claim). The user's opt-in choices are collected client-side; the
 * server-authoritative write to the `consents` record is DEFERRED and
 * registered — `docs/sandbox-app/DEFERRED_BACKEND_LEDGER.md` C-B1/C-B2: there is
 * no ruled `IConsentStore` seam or `consents` schema yet, so we do NOT invent
 * one inline. When the backend pass lands, this action gains the opt-in payload
 * and persists it before redirecting; the call site stays unchanged.
 */
export async function submitConsent(localeRaw: string): Promise<void> {
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  redirect(`/${locale}/claim`);
}
