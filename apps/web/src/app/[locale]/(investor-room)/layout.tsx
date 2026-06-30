import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import {
  isValidLocale,
  loadMessages,
  flattenMessages,
  type SupportedLocale,
} from '@diboas/i18n/server';
import { LocaleProvider, I18nProvider, SetHtmlLang } from '@/components/Providers';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import {
  INVESTOR_GATE_COOKIE,
  verifyInvestorGate,
  isInvestorGateConfigured,
} from '@/lib/security/investorGate';
import { InvestorRoomAccess } from './InvestorRoomAccess';
import styles from './layout.module.css';

interface InvestorRoomLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** The room and every document under it are private — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'pt-BR' }, { locale: 'es' }, { locale: 'de' }];
}

/**
 * Investor Room layout — its OWN route group (outside `(landing)`): it provides
 * the i18n/locale providers but NOT the marketing nav/footer, and it enforces
 * the shared-password gate. The gate wraps ALL nested pages (index + every
 * `[doc]`), so reading the cookie here protects the documents too.
 */
export default async function InvestorRoomLayout({ children, params }: InvestorRoomLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const [investorMessages, commonMessages] = await Promise.all([
    loadMessages(locale, 'investor'),
    loadMessages(locale, 'common'),
  ]);
  const allMessages = {
    ...flattenMessages(commonMessages, 'common'),
    ...flattenMessages(investorMessages, 'investor'),
  };

  // Per-request gate check (cookies() makes this subtree dynamic).
  const cookieStore = await cookies();
  const granted = verifyInvestorGate(cookieStore.get(INVESTOR_GATE_COOKIE)?.value);
  const configured = isInvestorGateConfigured();

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nProvider locale={locale} messages={allMessages}>
        <SetHtmlLang locale={locale} />
        <PageErrorBoundary>
          <div className={styles.shell}>
            <header className={styles.header}>
              <a href={`/${locale}`} className={styles.wordmark}>
                diBoaS
              </a>
              <span className={styles.badge}>Investor Room</span>
            </header>
            <main id="main-content" className={styles.main}>
              {granted ? (
                children
              ) : (
                <InvestorRoomAccess locale={locale} configured={configured} />
              )}
            </main>
          </div>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}
