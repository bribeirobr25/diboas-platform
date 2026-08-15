import { Consent } from '@/components/Consent';

/**
 * The consent surface (A3; W-3). Accept advances the flow via the submitConsent
 * action (-> claim); the server-authoritative consent write is deferred +
 * registered (DEFERRED_BACKEND_LEDGER C-B1/C-B2). Wired, not a preview.
 */
export default async function ConsentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Consent locale={locale} />;
}
