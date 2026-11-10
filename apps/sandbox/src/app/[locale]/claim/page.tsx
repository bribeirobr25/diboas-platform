import { ClaimCeremony } from '@/components/ClaimCeremony';
import { isSandboxLocale } from '@/i18n/config';
import { requireAdmission } from '@/lib/auth/admission';

/** Decided per request (it reads the gate cookie), declared rather than inherited (`5.401`). */
export const dynamic = 'force-dynamic';

/**
 * The claim ceremony (A3.2; W-5a). The tap emits the real PlayMoneyGranted via
 * the play ledger and routes into the app home (now an initialized ledger); only
 * the grant's persistence/auth backing is deferred (DEFERRED_BACKEND_LEDGER
 * CL-B1). Wired, not a preview.
 */
export default async function ClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeRaw } = await params;
  const locale = isSandboxLocale(localeRaw) ? localeRaw : 'en';
  // B15 (5.522): behind the gate when the app is gated; no effect while it is public.
  await requireAdmission(locale, 'claim');
  // The page's main landmark (WCAG 1.3.1 / 2.4.1; lane audit 2026-10-21, R2): only the gated
  // shell rendered <main>, so these public pages had none. Unstyled, so layout is unchanged.
  return (
    <main id="main">
      <ClaimCeremony locale={locale} />
    </main>
  );
}
