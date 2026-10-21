import { Consent } from '@/components/Consent';

/**
 * The consent surface (A3; W-3). Accept advances the flow via the submitConsent
 * action (-> claim); the server-authoritative consent write is deferred +
 * registered (DEFERRED_BACKEND_LEDGER C-B1/C-B2). Wired, not a preview.
 */
export default async function ConsentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // The page's main landmark (WCAG 1.3.1 / 2.4.1; lane audit 2026-10-21, R2): only the gated
  // shell rendered <main>, so these public pages had none. Unstyled, so layout is unchanged.
  return (
    <main id="main">
      <Consent locale={locale} />
    </main>
  );
}
