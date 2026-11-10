import { Consent } from '@/components/Consent';
import { isSandboxLocale } from '@/i18n/config';
import { requireAdmission } from '@/lib/auth/admission';

/** Decided per request (it reads the gate cookie), declared rather than inherited (`5.401`). */
export const dynamic = 'force-dynamic';

/**
 * The consent surface (A3; W-3). Accept advances the flow via the submitConsent
 * action (-> claim); the server-authoritative consent write is deferred +
 * registered (DEFERRED_BACKEND_LEDGER C-B1/C-B2). Wired, not a preview.
 */
export default async function ConsentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeRaw } = await params;
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  // B15 (5.522): behind the gate when the app is gated; no effect while it is public.
  await requireAdmission(locale, 'consent');
  // The page's main landmark (WCAG 1.3.1 / 2.4.1; lane audit 2026-10-21, R2): only the gated
  // shell rendered <main>, so these public pages had none. Unstyled, so layout is unchanged.
  return (
    <main id="main">
      <Consent locale={locale} />
    </main>
  );
}
