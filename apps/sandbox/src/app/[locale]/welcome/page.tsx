import { AuthWelcome } from '@/components/AuthWelcome';
import { isSandboxLocale } from '@/i18n/config';

/**
 * The public front door (A2; W-17c). Ungated (outside `(app)`) — the real R1
 * entry that replaces the MVP-0 password gate at go-live. The method buttons
 * are wired to the startOnboarding action (session + navigate into the flow).
 */
export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AuthWelcome locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
