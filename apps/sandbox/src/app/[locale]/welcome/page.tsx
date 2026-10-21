import { AuthWelcome } from '@/components/AuthWelcome';
import { isSandboxLocale } from '@/i18n/config';

/**
 * The public front door (A2; W-17c). Ungated (outside `(app)`) — the real R1
 * entry that replaces the MVP-0 password gate at go-live. The method buttons
 * are wired to the startOnboarding action (session + navigate into the flow).
 */
export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // The page's main landmark (WCAG 1.3.1 / 2.4.1; lane audit 2026-10-21, R2): only the gated
  // shell rendered <main>, so these public pages had none. Unstyled, so layout is unchanged.
  return (
    <main id="main">
      <AuthWelcome locale={isSandboxLocale(locale) ? locale : 'en'} />
    </main>
  );
}
