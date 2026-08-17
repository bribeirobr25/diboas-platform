import { ClaimCeremony } from '@/components/ClaimCeremony';
import { isSandboxLocale } from '@/i18n/config';

/**
 * The claim ceremony (A3.2; W-5a). The tap emits the real PlayMoneyGranted via
 * the play ledger and routes into the app home (now an initialized ledger); only
 * the grant's persistence/auth backing is deferred (DEFERRED_BACKEND_LEDGER
 * CL-B1). Wired, not a preview.
 */
export default async function ClaimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ClaimCeremony locale={isSandboxLocale(locale) ? locale : 'en'} />;
}
